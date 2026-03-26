/**
 * POST /api/leads/bulk-upload
 *
 * Accepts multipart FormData with a single "file" field (.csv or .xlsx).
 * Validates, normalises, and batch-inserts up to 5,000 lead rows.
 * Returns a JSON summary { total, inserted, skipped, failed, errors }.
 *
 * Auth: ADMIN or AGENT only.
 * Max file size: 10 MB.
 * Batch size: 250 rows per prisma.lead.createMany().
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";
import { sendEmail, buildLifecycleEmail } from "@/lib/email";
import {
    parseRow,
    splitCsvLine,
    mapHeaders,
    buildErrorCsv,
    ParsedLeadRow,
} from "@/lib/bulk-lead-parser";
import ExcelJS from "exceljs";

// ── Config ────────────────────────────────────────────────────────────────────
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_ROWS = 5_000;
const BATCH_SIZE = 250;

// ── Helpers ───────────────────────────────────────────────────────────────────
type UploadError = { row: number; reason: string };

async function parseCSV(
    buffer: Buffer
): Promise<{ rows: string[][]; headers: string[] }> {
    const text = buffer.toString("utf-8");
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { rows: [], headers: [] };
    const headers = splitCsvLine(lines[0]);
    const rows = lines.slice(1).map((l) => splitCsvLine(l));
    return { rows, headers };
}

async function parseXLSX(
    buffer: Buffer
): Promise<{ rows: string[][]; headers: string[] }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.worksheets[0];
    if (!sheet) return { rows: [], headers: [] };

    const allRows: string[][] = [];
    sheet.eachRow((row) => {
        const cells = (row.values as any[]).slice(1); // index 0 is empty in exceljs
        allRows.push(cells.map((c) => (c === null || c === undefined ? "" : String(c))));
    });

    if (allRows.length === 0) return { rows: [], headers: [] };
    const headers = allRows[0];
    const rows = allRows.slice(1);
    return { rows, headers };
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = session.user.role as string;
    if (!["ADMIN", "SUPER_ADMIN", "AGENT", "COUNSELOR"].includes(role)) {
        return NextResponse.json({ error: "Forbidden — insufficient permissions for bulk upload" }, { status: 403 });
    }

    // ── Parse multipart ───────────────────────────────────────────────────────
    let formData: FormData;
    try {
        formData = await req.formData();
    } catch {
        return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // ── File size guard ────────────────────────────────────────────────────────
    if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
            { error: `File too large. Max size is ${MAX_FILE_BYTES / 1024 / 1024} MB` },
            { status: 413 }
        );
    }

    const fileName = file.name.toLowerCase();
    const isXLSX = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    const isCSV = fileName.endsWith(".csv");
    if (!isXLSX && !isCSV) {
        return NextResponse.json(
            { error: "Unsupported file type. Upload a .csv or .xlsx file" },
            { status: 415 }
        );
    }

    // ── Read buffer ───────────────────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());

    // ── Parse file ────────────────────────────────────────────────────────────
    let rawRows: string[][];
    let rawHeaders: string[];
    try {
        const parsed = isXLSX ? await parseXLSX(buffer) : await parseCSV(buffer);
        rawRows = parsed.rows;
        rawHeaders = parsed.headers;
    } catch (err: any) {
        console.error("[BulkUpload] Parse error:", err);
        return NextResponse.json({ error: "Failed to parse file: " + err.message }, { status: 422 });
    }

    if (rawHeaders.length === 0) {
        return NextResponse.json({ error: "File is empty or missing headers" }, { status: 422 });
    }

    // ── Row-count guard ───────────────────────────────────────────────────────
    if (rawRows.length > MAX_ROWS) {
        return NextResponse.json(
            { error: `File has ${rawRows.length} rows. Max allowed is ${MAX_ROWS}` },
            { status: 413 }
        );
    }

    // ── Validate + normalise all rows ─────────────────────────────────────────
    const headerMap = mapHeaders(rawHeaders);
    const validRows: ParsedLeadRow[] = [];
    const errors: UploadError[] = [];
    const seenPhones = new Set<string>();

    for (let i = 0; i < rawRows.length; i++) {
        const rowNum = i + 2; // 1-indexed, +1 for header row
        const raw = rawRows[i];

        // Skip completely empty rows
        if (raw.every((c) => !c.trim())) continue;

        const result = parseRow(raw, headerMap, rowNum);
        if (result.error) {
            errors.push({ row: rowNum, reason: result.error.replace(`Row ${rowNum}: `, "") });
            continue;
        }

        const lead = result.data!;

        // In-file dedup by phone
        if (seenPhones.has(lead.phone)) {
            errors.push({ row: rowNum, reason: `Duplicate phone ${lead.phone} within this file` });
            continue;
        }
        seenPhones.add(lead.phone);
        validRows.push(lead);
    }

    // ── Batch insert ──────────────────────────────────────────────────────────
    let insertedCount = 0;
    let skippedCount = 0;

    for (let b = 0; b < validRows.length; b += BATCH_SIZE) {
        const batch = validRows.slice(b, b + BATCH_SIZE);
        try {
            const result = await prisma.lead.createMany({
                data: batch as any,
                skipDuplicates: true, // skips conflicting phone unique rows
            });
            insertedCount += result.count;
            skippedCount += batch.length - result.count;
        } catch (err: any) {
            console.error(`[BulkUpload] Batch ${b}-${b + BATCH_SIZE} failed:`, err);
            // Mark entire batch as failed rows
            for (let r = b; r < b + batch.length; r++) {
                errors.push({ row: r + 2, reason: "Database insert failed: " + err.message });
            }
        }
    }

    const totalRows = rawRows.filter((r) => !r.every((c) => !c.trim())).length;
    const summary = {
        total: totalRows,
        inserted: insertedCount,
        skipped: skippedCount,
        failed: errors.length,
        errors: errors.slice(0, 200), // cap at 200 in response
    };

    // ── Post-insert: AuditLog ─────────────────────────────────────────────────
    AuditLogService.log({
        userId: session.user.id,
        action: "CREATED",
        module: "LEADS",
        entity: "BulkUpload",
        entityId: session.user.id,
        metadata: {
            fileName: file.name,
            totalRows: summary.total,
            insertedCount: summary.inserted,
            skippedCount: summary.skipped,
            failedCount: summary.failed,
        },
    }).catch(console.error);

    // ── Post-insert: In-app Notification ─────────────────────────────────────
    prisma.notification.create({
        data: {
            userId: session.user.id,
            type: "SYSTEM",
            title: "Bulk Lead Upload Completed",
            message: `${summary.inserted} leads uploaded, ${summary.skipped} duplicates skipped, ${summary.failed} failed.`,
        },
    }).catch(console.error);

    // ── Post-insert: Email to uploader ────────────────────────────────────────
    if (session.user.email) {
        const errorCsvAttachment =
            errors.length > 0
                ? `\n\nFailed rows (CSV):\n${buildErrorCsv(errors)}`
                : "";

        sendEmail({
            to: session.user.email,
            subject: "[InterEd CRM] Bulk Lead Upload Report",
            html: buildLifecycleEmail({
                title: "Bulk Lead Upload Report",
                body: `Your bulk lead upload of <strong>${file.name}</strong> has completed.`,
                details: [
                    { label: "Total Rows", value: String(summary.total) },
                    { label: "Inserted", value: String(summary.inserted) },
                    { label: "Duplicates Skipped", value: String(summary.skipped) },
                    { label: "Failed", value: String(summary.failed) },
                ],
                note:
                    errors.length > 0
                        ? `${summary.failed} rows failed. Download the error report from the CRM.`
                        : undefined,
                cta: { label: "View Leads", url: "/admin/leads" },
            }) + (errorCsvAttachment
                ? `<pre style="font-size:11px;background:#f3f4f6;padding:12px;border-radius:6px;margin-top:16px;white-space:pre-wrap">${errorCsvAttachment.slice(0, 3000)}</pre>`
                : ""),
        }).catch(console.error);
    }

    return NextResponse.json(summary, { status: 201 });
}
