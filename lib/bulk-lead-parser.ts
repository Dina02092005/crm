/**
 * Bulk Lead Upload — Row Parser & Normaliser
 * Used by: app/api/leads/bulk-upload/route.ts
 */

// ── Column alias map (case-insensitive header → internal key) ───────────────
const COLUMN_ALIASES: Record<string, string> = {
    name: "name",
    fullname: "name",
    "full name": "name",
    phone: "phone",
    mobile: "phone",
    mobileno: "phone",
    "mobile no": "phone",
    email: "email",
    "e-mail": "email",
    alternateno: "alternateNo",
    "alternate no": "alternateNo",
    altphone: "alternateNo",
    "alt phone": "alternateNo",
    source: "source",
    leadsource: "source",
    interestedcountry: "interestedCountry",
    "interested country": "interestedCountry",
    country: "interestedCountry",
    interestedcourse: "interestedCourse",
    "interested course": "interestedCourse",
    course: "interestedCourse",
    intake: "intake",
    applylevel: "applyLevel",
    "apply level": "applyLevel",
    level: "applyLevel",
    message: "message",
    notes: "message",
    firstname: "firstName",
    "first name": "firstName",
    lastname: "lastName",
    "last name": "lastName",
    gender: "gender",
    nationality: "nationality",
    highestqualification: "highestQualification",
    "highest qualification": "highestQualification",
    qualification: "highestQualification",
    testname: "testName",
    "test name": "testName",
    testscore: "testScore",
    "test score": "testScore",
    passportno: "passportNo",
    "passport no": "passportNo",
    passport: "passportNo",
    passportissuedate: "passportIssueDate",
    "passport issue date": "passportIssueDate",
    passportexpirydate: "passportExpiryDate",
    "passport expiry date": "passportExpiryDate",
    "passport expiry": "passportExpiryDate",
};

export interface ParsedLeadRow {
    name: string;
    phone: string;
    source: string;
    email?: string | null;
    alternateNo?: string | null;
    interestedCountry?: string | null;
    interestedCourse?: string | null;
    intake?: string | null;
    applyLevel?: string | null;
    message?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    gender?: string | null;
    nationality?: string | null;
    highestQualification?: string | null;
    testName?: string | null;
    testScore?: string | null;
    passportNo?: string | null;
    passportIssueDate?: Date | null;
    passportExpiryDate?: Date | null;
    status: "NEW";
    temperature: "COLD";
}

export interface ParseRowResult {
    data?: ParsedLeadRow;
    error?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Normalise a raw header string to its canonical alias key */
export function normaliseHeader(raw: string): string {
    return raw.trim().toLowerCase().replace(/[_\-]/g, " ");
}

/** Map raw object (with possibly messy headers) to a clean key map */
export function mapHeaders(rawHeaders: string[]): Map<string, number> {
    const map = new Map<string, number>();
    rawHeaders.forEach((h, i) => {
        const key = COLUMN_ALIASES[normaliseHeader(h)];
        if (key && !map.has(key)) map.set(key, i);
    });
    return map;
}

function str(v: any): string {
    if (v === null || v === undefined) return "";
    return String(v).trim();
}

function nullify(v: string): string | null {
    return v === "" ? null : v;
}

function parseDate(v: string): Date | null {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
}

function normalisePhone(raw: string): string {
    // Keep digits and leading +
    const stripped = raw.replace(/[^\d+]/g, "");
    return stripped;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Main row parser ──────────────────────────────────────────────────────────

export function parseRow(
    rawValues: string[],
    headerMap: Map<string, number>,
    rowIndex: number
): ParseRowResult {
    const get = (key: string) => str(rawValues[headerMap.get(key) ?? -1]);

    const rawName = get("name");
    const rawPhone = get("phone");

    if (!rawName) return { error: `Row ${rowIndex}: 'name' is required` };
    if (!rawPhone) return { error: `Row ${rowIndex}: 'phone' is required` };

    const phone = normalisePhone(rawPhone);
    if (phone.replace(/\D/g, "").length < 7) {
        return { error: `Row ${rowIndex}: phone '${rawPhone}' is too short` };
    }

    const rawEmail = nullify(get("email"));
    if (rawEmail && !EMAIL_RE.test(rawEmail)) {
        return { error: `Row ${rowIndex}: email '${rawEmail}' is invalid` };
    }

    // Build the first/last name if absent
    const rawFirst = nullify(get("firstName"));
    const rawLast = nullify(get("lastName"));
    const name = rawName || [rawFirst, rawLast].filter(Boolean).join(" ");

    const data: ParsedLeadRow = {
        name,
        phone,
        source: nullify(get("source")) || "BULK_UPLOAD",
        email: rawEmail,
        alternateNo: nullify(get("alternateNo")),
        interestedCountry: nullify(get("interestedCountry")),
        interestedCourse: nullify(get("interestedCourse")),
        intake: nullify(get("intake")),
        applyLevel: nullify(get("applyLevel")),
        message: nullify(get("message")),
        firstName: rawFirst,
        lastName: rawLast,
        gender: nullify(get("gender")),
        nationality: nullify(get("nationality")),
        highestQualification: nullify(get("highestQualification")),
        testName: nullify(get("testName")),
        testScore: nullify(get("testScore")),
        passportNo: nullify(get("passportNo")),
        passportIssueDate: parseDate(get("passportIssueDate")),
        passportExpiryDate: parseDate(get("passportExpiryDate")),
        status: "NEW",
        temperature: "COLD",
    };

    return { data };
}

/** Split single CSV line respecting quoted commas */
export function splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
            else inQuote = !inQuote;
        } else if (c === "," && !inQuote) {
            result.push(cur.trim());
            cur = "";
        } else {
            cur += c;
        }
    }
    result.push(cur.trim());
    return result;
}

/** Generate a downloadable error CSV blob string */
export function buildErrorCsv(errors: { row: number; reason: string }[]): string {
    const lines = ["Row,Reason"];
    for (const e of errors) {
        lines.push(`${e.row},"${e.reason.replace(/"/g, '""')}"`);
    }
    return lines.join("\n");
}

/** CSV template columns for download */
export const CSV_TEMPLATE_HEADER = [
    "name", "phone", "email", "source",
    "alternateNo", "interestedCountry", "interestedCourse",
    "intake", "applyLevel", "message",
    "firstName", "lastName", "gender", "nationality",
    "highestQualification", "testName", "testScore",
    "passportNo", "passportIssueDate", "passportExpiryDate",
].join(",");
