"use client";

import { useState, useRef } from "react";
import axios from "axios";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Upload,
    Download,
    FileSpreadsheet,
    X,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronRight,
    ArrowLeft,
    ScrollText,
    Layers
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface ImportCoursesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type Step = "SELECT" | "PREVIEW";

export function ImportCoursesModal({
    isOpen,
    onClose,
    onSuccess,
}: ImportCoursesModalProps) {
    const [step, setStep] = useState<Step>("SELECT");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [errors, setErrors] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = async () => {
        try {
            const response = await axios.get("/api/master/courses/import", {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'course-import-template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Failed to download template");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setSelectedFile(e.target.files[0]);
            handleUpload(e.target.files[0]);
        }
    };

    const handleUpload = async (file: File) => {
        setIsLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("confirm", "false");

        try {
            const res = await axios.post("/api/master/courses/import", formData);
            setPreviewData(res.data.rows);
            setErrors(res.data.errors);
            setStep("PREVIEW");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to process file");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmImport = async () => {
        if (!selectedFile) return;
        setIsLoading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("confirm", "true");

        try {
            const res = await axios.post("/api/master/courses/import", formData);
            toast.success(res.data.message);
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Import failed");
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setStep("SELECT");
        setSelectedFile(null);
        setPreviewData([]);
        setErrors([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <Sheet open={isOpen} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
            <SheetContent className="sm:max-w-xl border-l border-border shadow-2xl p-0 flex flex-col h-full bg-background ring-1 ring-border/50">
                <div className="p-8 border-b border-border bg-muted/40 backdrop-blur-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 bg-primary/10 blur-3xl opacity-20 -mr-8 -mt-8" />
                    
                    <SheetHeader className="relative z-10">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg ring-4 ring-primary/10">
                                <Layers className="h-6 w-6" />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black tracking-tight">Bulk Import Courses</SheetTitle>
                                <SheetDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
                                    Course Management Engine
                                </SheetDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <div className={cn("h-1.5 w-12 rounded-full transition-all duration-300", step === 'SELECT' ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'bg-muted')} />
                            <div className={cn("h-1.5 w-12 rounded-full transition-all duration-300", step === 'PREVIEW' ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'bg-muted')} />
                        </div>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {step === "SELECT" ? (
                        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                            <div className="group relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                                <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-border/50 p-12 bg-card rounded-2xl hover:border-primary/50 transition-all cursor-pointer"
                                     onClick={() => fileInputRef.current?.click()}>
                                    <div className="mb-6 p-4 rounded-full bg-muted/50 text-muted-foreground group-hover:scale-110 group-hover:text-primary transition-all duration-500">
                                        <FileSpreadsheet className="w-12 h-12" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground mb-1">Upload your file</h3>
                                    <p className="text-xs text-muted-foreground mb-6 text-center max-w-sm font-medium">
                                        Upload the Excel file containing course details.
                                        Ensure you follow our predefined structure.
                                    </p>
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".xlsx"
                                    />
                                    <Button
                                        className="rounded-xl h-11 px-8 bg-primary hover:bg-primary/90 gap-2 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        Choose Excel File
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl flex items-start justify-between gap-4">
                                <div className="flex gap-4">
                                    <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0 h-12 w-12 flex items-center justify-center">
                                        <Download className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground">Excel Template</h4>
                                        <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">Download our sample template to ensure your data format matches the system requirements.</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="rounded-xl border-primary/20 bg-background text-primary hover:bg-primary/10 font-black uppercase tracking-widest text-[10px] mt-1 whitespace-nowrap"
                                    onClick={handleDownloadTemplate}
                                >
                                    Download
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex justify-between items-center bg-muted/40 p-4 border border-border rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-2.5 rounded-xl",
                                        errors.length > 0 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                                    )}>
                                        {errors.length > 0 ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <span className="font-black text-foreground block text-lg">{previewData.length} Rows Detected</span>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground italic">
                                            {errors.length > 0 ? `${errors.length} validation issues found` : "Validation successful"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
                                <div className="max-h-[350px] overflow-auto">
                                    <Table className="min-w-full">
                                        <TableHeader className="sticky top-0 z-10 bg-muted/90 backdrop-blur-md">
                                            <TableRow className="border-b border-border/50">
                                                <TableHead className="w-[80px] text-[10px] font-black uppercase tracking-widest">Row</TableHead>
                                                <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Course</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {previewData.map((row) => {
                                                const rowErrors = errors.filter(e => e.row === row.rowNumber);
                                                return (
                                                    <TableRow key={row.rowNumber} className={cn(
                                                        "border-b border-border/30 hover:bg-muted/30 transition-colors",
                                                        rowErrors.length > 0 ? "bg-rose-500/5" : ""
                                                    )}>
                                                        <TableCell className="font-bold text-xs font-mono text-muted-foreground">{row.rowNumber}</TableCell>
                                                        <TableCell>
                                                            {rowErrors.length > 0 ? (
                                                                <span className="text-[9px] font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded uppercase tracking-widest border border-rose-200">Error</span>
                                                            ) : (
                                                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-widest border border-emerald-200">OK</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm text-foreground">{row.name}</span>
                                                                <span className="text-[10px] font-medium text-muted-foreground">{row._display.university} ({row._display.country})</span>
                                                                {rowErrors.length > 0 && (
                                                                    <div className="mt-2 text-rose-500 text-[10px] font-bold italic flex items-center gap-1">
                                                                        <AlertCircle className="h-3 w-3" />
                                                                        {rowErrors.map(e => e.message).join(", ")}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-border bg-muted/40 backdrop-blur-md flex items-center justify-between shrink-0">
                    {step === "PREVIEW" ? (
                        <>
                            <Button variant="ghost" className="rounded-xl gap-2 hover:bg-muted font-black uppercase tracking-widest text-[10px] text-muted-foreground" onClick={reset}>
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </Button>
                            <div className="flex gap-3">
                                <Button variant="ghost" className="rounded-xl px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground" onClick={onClose}>Cancel</Button>
                                <Button
                                    className="rounded-xl h-11 px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2 font-black uppercase tracking-widest text-[10px]"
                                    disabled={isLoading || errors.length > 0}
                                    onClick={handleConfirmImport}
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                                    Confirm Import
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div />
                            <Button variant="outline" className="rounded-xl h-11 px-8 border-border hover:bg-muted font-black uppercase tracking-widest text-[10px]" onClick={onClose}>Cancel</Button>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
