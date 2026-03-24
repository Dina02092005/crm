"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetDescription,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    Download,
    X,
    LayoutGrid,
    History
} from "lucide-react";
import { toast } from "sonner";
import { CSV_TEMPLATE_HEADER } from "@/lib/bulk-lead-parser";
import { cn } from "@/lib/utils";

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
    const [isOpen, setIsOpen] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        e.target.value = "";

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
        setIsOpen(true);

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
        setIsOpen(false);
    };

    return (
        <>
            <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
            />

            <Button
                variant="outline"
                onClick={() => fileRef.current?.click()}
                className="h-10 rounded-xl px-4 text-[13px] font-bold flex items-center gap-2 border-slate-200 hover:border-primary hover:bg-primary/5 transition-all shadow-sm"
            >
                <Upload className="h-4 w-4 text-primary" />
                Bulk Import
            </Button>

            <Sheet open={isOpen} onOpenChange={(o) => { if (!o && phase !== "uploading") reset(); }}>
                <SheetContent className="sm:max-w-md border-l border-border shadow-2xl p-0 flex flex-col h-full bg-background ring-1 ring-border/50">
                    {/* Dynamic Header based on Phase */}
                    <div className={cn(
                        "p-8 border-b border-border/10 relative overflow-hidden transition-all duration-500",
                        phase === "uploading" ? "bg-blue-600/10" :
                        phase === "done" ? (result?.failed === 0 ? "bg-emerald-600/10" : "bg-amber-600/10") :
                        phase === "error" ? "bg-rose-600/10" : "bg-muted/40"
                    )}>
                        <div className="absolute top-0 right-0 p-12 bg-primary/10 blur-3xl opacity-20 -mr-8 -mt-8" />
                        
                        <SheetHeader className="relative z-10">
                            <div className="flex items-center gap-4 mb-3">
                                <div className={cn(
                                    "p-3 rounded-2xl shadow-lg transition-all duration-500",
                                    phase === "uploading" ? "bg-blue-600 text-white animate-pulse" :
                                    phase === "done" ? (result?.failed === 0 ? "bg-emerald-600 text-white" : "bg-amber-600 text-white") :
                                    phase === "error" ? "bg-rose-600 text-white" : "bg-primary text-white"
                                )}>
                                    {phase === "uploading" ? <Loader2 className="h-6 w-6 animate-spin" /> :
                                     phase === "done" ? <CheckCircle2 className="h-6 w-6" /> :
                                     phase === "error" ? <XCircle className="h-6 w-6" /> :
                                     <FileSpreadsheet className="h-6 w-6" />}
                                </div>
                                <div>
                                    <SheetTitle className="text-2xl font-black tracking-tight text-foreground">
                                        {phase === "uploading" ? "Importing Leads" :
                                         phase === "done" ? "Import Complete" :
                                         phase === "error" ? "Import Failed" : "Bulk Import"}
                                    </SheetTitle>
                                    <SheetDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
                                        {fileName || "Lead processing engine"}
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {phase === "uploading" && (
                            <div className="space-y-6 py-10">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Uploading & Processing</p>
                                        <p className="text-2xl font-black text-primary font-mono">{progress}%</p>
                                    </div>
                                    <div className="h-3 w-full bg-muted/30 rounded-full overflow-hidden border border-border/50">
                                        <div 
                                            className="h-full bg-primary transition-all duration-500 relative"
                                            style={{ width: `${progress}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-3 pt-4">
                                    <div className="p-4 rounded-2xl bg-card border border-border/50 flex items-center gap-4">
                                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                        <p className="text-xs font-medium text-muted-foreground italic">Validating lead records...</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {phase === "done" && result && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Dashboard Style Stats */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-card border border-border/50 p-4 rounded-2xl shadow-sm group hover:border-primary/50 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Rows</p>
                                            <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground/40" />
                                        </div>
                                        <p className="text-3xl font-black text-foreground">{result.total}</p>
                                    </div>
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl shadow-sm group hover:bg-emerald-500/10 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] font-black text-emerald-600/80 uppercase tracking-widest">Inserted</p>
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/40" />
                                        </div>
                                        <p className="text-3xl font-black text-emerald-600">{result.inserted}</p>
                                    </div>
                                    <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl shadow-sm group hover:bg-amber-500/10 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] font-black text-amber-600/80 uppercase tracking-widest">Skipped</p>
                                            <History className="h-3.5 w-3.5 text-amber-500/40" />
                                        </div>
                                        <p className="text-3xl font-black text-amber-600">{result.skipped}</p>
                                    </div>
                                    <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-2xl shadow-sm group hover:bg-rose-500/10 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] font-black text-rose-600/80 uppercase tracking-widest">Failed</p>
                                            <AlertTriangle className="h-3.5 w-3.5 text-rose-500/40" />
                                        </div>
                                        <p className="text-3xl font-black text-rose-600">{result.failed}</p>
                                    </div>
                                </div>

                                {result.failed > 0 && (
                                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-3">
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle className="h-5 w-5 text-rose-500" />
                                            <p className="text-sm font-bold text-rose-700 dark:text-rose-400">Issues Detected</p>
                                        </div>
                                        <p className="text-xs text-rose-700/70 leading-relaxed font-medium">
                                            Some rows could not be imported. Download the error report to see detailed reasons for each failure.
                                        </p>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => downloadErrorCsv(result.errors)}
                                            className="w-full rounded-xl border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 font-bold gap-2 text-[10px] uppercase tracking-widest"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            Download Error Log
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-border bg-muted/40 backdrop-blur-md flex items-center justify-between gap-3">
                        <Button
                            variant="ghost"
                            onClick={reset}
                            className="rounded-xl px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <div className="flex gap-2">
                            {phase === "done" && (
                                <Button
                                    onClick={() => { reset(); fileRef.current?.click(); }}
                                    variant="outline"
                                    className="rounded-xl px-4 text-[10px] font-black uppercase tracking-widest border-slate-200 hover:bg-background"
                                >
                                    Try Another
                                </Button>
                            )}
                            <Button 
                                onClick={reset} 
                                className="rounded-xl px-8 text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                                disabled={phase === "uploading"}
                            >
                                {phase === "done" ? "Finish" : "Close"}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
