"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    X, Search, Download, Eye, ChevronDown, ChevronRight,
    FolderOpen, FileText, Star, Loader2, Users, Filter,
    CheckSquare, Square, Package
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import FilePreviewModal from "./FilePreviewModal";

interface StudentSummary {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    createdAt: string;
    _count: { documents: number };
}

interface StudentDocument {
    id: string;
    fileName: string;
    fileUrl: string;
    documentName: string;
    isMandatory: boolean;
    documentFor: string;
    createdAt: string;
    uploader: { name: string; role: string };
    country: { name: string } | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Admin",
    MANAGER: "Manager",
    COUNSELOR: "Counselor",
    AGENT: "Agent",
    SALES_REP: "Sales Rep",
    SUPPORT_AGENT: "Support Agent",
    EMPLOYEE: "Employee",
};

export default function FileManagerPanel({ isOpen, onClose }: Props) {
    const [search, setSearch] = useState("");
    const [students, setStudents] = useState<StudentSummary[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
    const [documents, setDocuments] = useState<Record<string, StudentDocument[]>>({});
    const [isLoadingDocs, setIsLoadingDocs] = useState<Record<string, boolean>>({});
    const [selectedDocs, setSelectedDocs] = useState<Record<string, Set<string>>>({});
    const [isDownloadingZip, setIsDownloadingZip] = useState<Record<string, boolean>>({});

    const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchStudents = useCallback(async (q: string, p: number) => {
        setIsLoadingStudents(true);
        try {
            const params = new URLSearchParams({ search: q, page: p.toString(), limit: "25" });
            const res = await axios.get(`/api/file-manager/students?${params}`);
            setStudents(res.data.students);
            setTotal(res.data.pagination.total);
            setTotalPages(res.data.pagination.totalPages);
        } catch {
            toast.error("Failed to load students");
        } finally {
            setIsLoadingStudents(false);
        }
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setPage(1);
            fetchStudents(search, 1);
        }, 350);
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
    }, [search, isOpen, fetchStudents]);

    useEffect(() => {
        if (!isOpen) return;
        fetchStudents(search, page);
    }, [page]);

    const fetchDocuments = async (studentId: string) => {
        if (documents[studentId]) return; // cached
        setIsLoadingDocs(prev => ({ ...prev, [studentId]: true }));
        try {
            const res = await axios.get(`/api/file-manager/students/${studentId}/documents`);
            setDocuments(prev => ({ ...prev, [studentId]: res.data }));
        } catch {
            toast.error("Failed to load documents");
        } finally {
            setIsLoadingDocs(prev => ({ ...prev, [studentId]: false }));
        }
    };

    const toggleStudent = (studentId: string) => {
        if (expandedStudentId === studentId) {
            setExpandedStudentId(null);
        } else {
            setExpandedStudentId(studentId);
            fetchDocuments(studentId);
        }
    };

    const toggleDocSelection = (studentId: string, docId: string) => {
        setSelectedDocs(prev => {
            const set = new Set(prev[studentId] || []);
            if (set.has(docId)) set.delete(docId);
            else set.add(docId);
            return { ...prev, [studentId]: set };
        });
    };

    const toggleAllDocs = (studentId: string) => {
        const docs = documents[studentId] || [];
        const selected = selectedDocs[studentId] || new Set();
        if (selected.size === docs.length) {
            setSelectedDocs(prev => ({ ...prev, [studentId]: new Set() }));
        } else {
            setSelectedDocs(prev => ({ ...prev, [studentId]: new Set(docs.map(d => d.id)) }));
        }
    };

    const handleDownloadZip = async (studentId: string, studentName: string) => {
        const docs = documents[studentId] || [];
        const selected = selectedDocs[studentId];
        const filesToDownload = selected && selected.size > 0
            ? docs.filter(d => selected.has(d.id))
            : docs;

        if (!filesToDownload.length) {
            toast.info("No documents to download");
            return;
        }

        setIsDownloadingZip(prev => ({ ...prev, [studentId]: true }));
        try {
            const res = await axios.post(
                `/api/file-manager/download`,
                { files: filesToDownload.map(d => ({ url: d.fileUrl, name: `${d.documentName}_${d.fileName}` })) },
                { responseType: "blob" }
            );
            const url = URL.createObjectURL(new Blob([res.data], { type: "application/zip" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = `${studentName.replace(/\s+/g, "_")}_documents.zip`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error("Download failed");
        } finally {
            setIsDownloadingZip(prev => ({ ...prev, [studentId]: false }));
        }
    };

    const handleSingleDownload = (fileUrl: string, fileName: string, documentName: string) => {
        const params = new URLSearchParams({ file: fileUrl, name: `${documentName}_${fileName}` });
        window.open(`/api/file-manager/download?${params}`, "_blank");
    };

    const formatRole = (role: string) => ROLE_LABELS[role] || role;

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed left-0 top-0 h-screen w-[520px] max-w-[100vw] bg-card border-r border-border shadow-2xl z-[95] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-primary/95 text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <FolderOpen className="h-5 w-5" />
                        <div>
                            <h2 className="text-base font-bold leading-tight">File Manager</h2>
                            <p className="text-[11px] text-white/70">{total} student{total !== 1 ? "s" : ""} with documents</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-4 py-3 border-b border-border/50 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email or phone..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 h-9 bg-background border-border/50 rounded-xl text-sm"
                        />
                    </div>
                </div>

                {/* Student List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoadingStudents ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground/50">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p className="text-xs">Loading students...</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground/50">
                            <Users className="h-10 w-10 opacity-20" />
                            <p className="text-xs italic">No students with documents found</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border/40">
                            {students.map(student => {
                                const isExpanded = expandedStudentId === student.id;
                                const docs = documents[student.id] || [];
                                const isLoadingD = isLoadingDocs[student.id];
                                const selected = selectedDocs[student.id] || new Set();
                                const isZipping = isDownloadingZip[student.id];

                                return (
                                    <li key={student.id}>
                                        {/* Student row */}
                                        <button
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                                            onClick={() => toggleStudent(student.id)}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${isExpanded ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}>
                                                {student.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">{student.name}</p>
                                                <p className="text-[11px] text-muted-foreground truncate">{student.email || student.phone}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-primary/10 text-primary border-0 rounded-md">
                                                    {student._count.documents} doc{student._count.documents !== 1 ? "s" : ""}
                                                </Badge>
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </div>
                                        </button>

                                        {/* Document list (expanded) */}
                                        {isExpanded && (
                                            <div className="bg-muted/20 border-t border-border/30">
                                                {/* Document actions bar */}
                                                <div className="flex items-center justify-between px-4 py-2 border-b border-border/20">
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Checkbox
                                                            checked={docs.length > 0 && selected.size === docs.length}
                                                            onCheckedChange={() => toggleAllDocs(student.id)}
                                                        />
                                                        <span>
                                                            {selected.size > 0 ? `${selected.size} selected` : "Select all"}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="h-7 text-xs px-3 bg-primary/90 hover:bg-primary rounded-lg gap-1.5"
                                                        onClick={() => handleDownloadZip(student.id, student.name)}
                                                        disabled={isZipping}
                                                    >
                                                        {isZipping ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Package className="h-3 w-3" />
                                                        )}
                                                        {selected.size > 0 ? `Download (${selected.size})` : "Download All"}
                                                    </Button>
                                                </div>

                                                {/* Docs */}
                                                {isLoadingD ? (
                                                    <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground/50">
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                        <span className="text-xs">Loading documents...</span>
                                                    </div>
                                                ) : docs.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
                                                        <FileText className="h-6 w-6 mb-1 opacity-30" />
                                                        <span className="text-xs italic">No documents</span>
                                                    </div>
                                                ) : (
                                                    <ul className="divide-y divide-border/20">
                                                        {docs.map(doc => (
                                                            <li key={doc.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors group">
                                                                <Checkbox
                                                                    checked={selected.has(doc.id)}
                                                                    onCheckedChange={() => toggleDocSelection(student.id, doc.id)}
                                                                    className="mt-0.5 shrink-0"
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <span className="text-sm font-semibold truncate">{doc.documentName}</span>
                                                                        {doc.isMandatory && (
                                                                            <Star className="h-3 w-3 text-red-500 shrink-0 fill-red-500" />
                                                                        )}
                                                                        <Badge variant="outline" className="text-[9px] py-0 px-1 rounded border-border/50 bg-muted shrink-0">
                                                                            {doc.documentFor}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{doc.fileName}</p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-[10px] text-muted-foreground/70">
                                                                            {new Date(doc.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                                                                        </span>
                                                                        <span className="text-[10px] text-muted-foreground/50">·</span>
                                                                        <span className="text-[10px] text-muted-foreground/70">
                                                                            {doc.uploader.name} ({formatRole(doc.uploader.role)})
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        title="Preview"
                                                                        className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                                                                        onClick={() => setPreviewFile({ url: doc.fileUrl, name: doc.documentName })}
                                                                    >
                                                                        <Eye className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <button
                                                                        title="Download"
                                                                        className="p-1.5 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
                                                                        onClick={() => handleSingleDownload(doc.fileUrl, doc.fileName, doc.documentName)}
                                                                    >
                                                                        <Download className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 shrink-0 bg-muted/20">
                        <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 rounded-lg text-xs"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >‹</Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 rounded-lg text-xs"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >›</Button>
                        </div>
                    </div>
                )}
            </div>

            {/* File Preview Modal */}
            {previewFile && (
                <FilePreviewModal
                    fileUrl={previewFile.url}
                    fileName={previewFile.name}
                    onClose={() => setPreviewFile(null)}
                />
            )}
        </>
    );
}
