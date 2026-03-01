"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    Download,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { CSV_TEMPLATE_HEADER } from "@/lib/bulk-lead-parser";

// ── Types ─────────────────────────────────────────────────────────────────────
interface UploadError { row: number; reason: string }
interface UploadResult {
    total: number;
    inserted: number;
    skipped: number;
    failed: number;
    errors: UploadError[];
}

type Phase = "idle" | "uploading" | "done" | "error";

// ── Template download ─────────────────────────────────────────────────────────
function downloadTemplate() {
    const sampleRow = "John Smith,+919876543210,john.smith@example.com,Website,,India,MBA,,Graduate,,John,Smith,MALE,Indian,Bachelor's,IELTS,6.5,,,";
    const csv = `${CSV_TEMPLATE_HEADER}\n${sampleRow}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bulk_leads_template.csv";
    a.click();
}

// ── Error CSV download ────────────────────────────────────────────────────────
function downloadErrorCsv(errors: UploadError[]) {
    const lines = ["Row,Reason", ...errors.map(e => `${e.row},"${e.reason.replace(/"/g, '""')}"`)];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bulk_upload_errors.csv";
    a.click();
}

// ── Main component ────────────────────────────────────────────────────────────
interface BulkUploadLeadsButtonProps {
    onSuccess?: () => void;
}

export function BulkUploadLeadsButton({ onSuccess }: BulkUploadLeadsButtonProps) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [phase, setPhase] = useState<Phase>("idle");
    const [result, setResult] = useState<UploadResult | null>(null);
    const [fileName, setFileName] = useState("");
    const [progress, setProgress] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input so the same file can be re-selected
        e.target.value = "";

        // Client-side guards
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File is too large. Maximum allowed size is 10 MB.");
            return;
        }
        const name = file.name.toLowerCase();
        if (!name.endsWith(".csv") && !name.endsWith(".xlsx") && !name.endsWith(".xls")) {
            toast.error("Only .csv and .xlsx files are supported.");
            return;
        }

        setFileName(file.name);
        setPhase("uploading");
        setProgress(0);
        setResult(null);
        setDialogOpen(true);

        // Fake progress animation while uploading (XHR would give real progress)
        const timer = setInterval(() => {
            setProgress((p) => (p < 85 ? p + 5 : p));
        }, 400);

        try {
            const fd = new FormData();
            fd.append("file", file);

            const res = await fetch("/api/leads/bulk-upload", {
                method: "POST",
                body: fd,
            });

            clearInterval(timer);
            setProgress(100);

            const json = await res.json();

            if (!res.ok) {
                toast.error(json.error || "Upload failed");
                setPhase("error");
                return;
            }

            setResult(json as UploadResult);
            setPhase("done");
            onSuccess?.();
        } catch (err: any) {
            clearInterval(timer);
            console.error("[BulkUpload] error:", err);
            toast.error("Upload failed: " + err.message);
            setPhase("error");
        }
    };

    const reset = () => {
        setPhase("idle");
        setResult(null);
        setProgress(0);
        setFileName("");
        setDialogOpen(false);
    };

    return (
        <>
            {/* Hidden file input */}
            <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Trigger button */}
            <Button
                variant="outline"
                onClick={() => fileRef.current?.click()}
                className="h-9 rounded-xl px-4 text-[13px] font-semibold flex items-center gap-2 border-dashed border-muted-foreground/40 hover:border-primary hover:text-primary transition-colors"
            >
                <Upload className="h-4 w-4" />
                Bulk Upload
            </Button>

            {/* Template download link */}
            <Button
                variant="ghost"
                size="sm"
                onClick={downloadTemplate}
                className="h-9 rounded-xl px-3 text-[12px] text-muted-foreground hover:text-primary gap-1.5"
                title="Download CSV template"
            >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Template
            </Button>

            {/* Progress / Result dialog */}
            <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o && phase !== "uploading") reset(); }}>
                <DialogContent className="sm:max-w-[480px] p-0 gap-0 rounded-2xl overflow-hidden border-0 shadow-2xl">
                    {/* Header */}
                    <div className={`px-6 pt-6 pb-5 ${phase === "done" && result && result.failed === 0
                            ? "bg-gradient-to-br from-emerald-600 to-teal-500"
                            : phase === "done"
                                ? "bg-gradient-to-br from-amber-500 to-orange-500"
                                : phase === "error"
                                    ? "bg-gradient-to-br from-rose-600 to-red-500"
                                    : "bg-gradient-to-br from-blue-600 to-cyan-500"
                        }`}>
                        <DialogHeader>
                            <DialogTitle className="text-white text-lg font-bold flex items-center gap-2">
                                {phase === "uploading" && <><Loader2 className="h-5 w-5 animate-spin" /> Processing File…</>}
                                {phase === "done" && <><CheckCircle2 className="h-5 w-5" /> Upload Complete</>}
                                {phase === "error" && <><XCircle className="h-5 w-5" /> Upload Failed</>}
                            </DialogTitle>
                            <p className="text-white/70 text-xs mt-1 truncate">{fileName}</p>
                        </DialogHeader>
                    </div>

                    <div className="px-6 py-5 space-y-4">
                        {/* Uploading phase */}
                        {phase === "uploading" && (
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Uploading and processing…</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground text-center">
                                    Validating, deduplicating and inserting records…
                                </p>
                            </div>
                        )}

                        {/* Done phase */}
                        {phase === "done" && result && (
                            <div className="space-y-4">
                                {/* Stats grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: "Total Rows", value: result.total, color: "text-foreground", bg: "bg-muted/50" },
                                        { label: "Inserted", value: result.inserted, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
                                        { label: "Duplicates Skipped", value: result.skipped, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
                                        { label: "Failed", value: result.failed, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30" },
                                    ].map(({ label, value, color, bg }) => (
                                        <div key={label} className={`${bg} rounded-xl px-4 py-3 text-center`}>
                                            <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Warning about failures */}
                                {result.failed > 0 && (
                                    <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="text-xs text-amber-800 dark:text-amber-300">
                                            <p className="font-semibold">{result.failed} rows could not be inserted.</p>
                                            <p className="mt-0.5">Download the error report to review and fix them.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Error sample */}
                                {result.errors.length > 0 && (
                                    <div className="rounded-xl border overflow-hidden">
                                        <div className="bg-muted/50 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                                            Sample Errors
                                        </div>
                                        <div className="divide-y max-h-32 overflow-y-auto">
                                            {result.errors.slice(0, 5).map((e, i) => (
                                                <div key={i} className="flex gap-3 px-3 py-2 text-[11px]">
                                                    <span className="text-muted-foreground shrink-0">Row {e.row}</span>
                                                    <span className="text-rose-600 truncate">{e.reason}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Error phase */}
                        {phase === "error" && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Something went wrong. Please check the file and try again.
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 justify-end pt-1">
                            {phase === "done" && result && result.errors.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadErrorCsv(result.errors)}
                                    className="rounded-xl gap-1.5 text-xs"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Error Report
                                </Button>
                            )}
                            {phase !== "uploading" && (
                                <Button
                                    size="sm"
                                    onClick={() => { reset(); fileRef.current?.click(); }}
                                    variant="outline"
                                    className="rounded-xl gap-1.5 text-xs"
                                >
                                    <Upload className="h-3.5 w-3.5" />
                                    Upload Another
                                </Button>
                            )}
                            {phase !== "uploading" && (
                                <Button size="sm" onClick={reset} className="rounded-xl text-xs">
                                    Done
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
