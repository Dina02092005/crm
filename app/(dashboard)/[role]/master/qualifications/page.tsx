"use client";

import { useEffect, useState } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil, Search } from "lucide-react";
import { useQualifications } from "@/hooks/use-masters";
import { useDebounce } from "@/hooks/use-debounce";

interface Qualification {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
}

export default function QualificationsPage() {
    const { can } = usePermissions();

    // Filter & Pagination State
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading, refetch } = useQualifications(page, limit, debouncedSearch);

    const qualifications = data?.qualifications || [];
    const pagination = data?.pagination || { total: 0, page: 1, limit: 25, totalPages: 1 };

    // Modal State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingQualification, setEditingQualification] = useState<Qualification | null>(null);
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const url = editingQualification ? `/api/master/qualifications/${editingQualification.id}` : "/api/master/qualifications";
            const method = editingQualification ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (res.ok) {
                toast.success(editingQualification ? "Qualification updated" : "Qualification added");
                setName("");
                setEditingQualification(null);
                setIsSheetOpen(false);
                refetch();
            } else {
                const error = await res.json();
                toast.error(error.message || (editingQualification ? "Failed to update" : "Failed to add"));
            }
        } catch (error) {
            toast.error("Error saving qualification");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (q: Qualification) => {
        setEditingQualification(q);
        setName(q.name);
        setIsSheetOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this qualification?")) return;
        try {
            const res = await fetch(`/api/master/qualifications/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("Deleted successfully");
                refetch();
            } else {
                toast.error("Failed to delete");
            }
        } catch (error) {
            toast.error("Error deleting");
        }
    };

    const handleSheetOpenChange = (open: boolean) => {
        setIsSheetOpen(open);
        if (!open) {
            setEditingQualification(null);
            setName("");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Master Settings: Qualifications</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage academic qualifications available for leads and students.</p>
                </div>
                {can("MASTERS", "CREATE") && (
                    <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
                        <SheetTrigger asChild>
                            <Button className="gap-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-sm px-6 h-11">
                                <Plus className="h-4 w-4" /> Add Qualification
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-md">
                            <SheetHeader className="pb-4">
                                <SheetTitle className="text-xl font-bold">{editingQualification ? "Edit Qualification" : "Add Qualification"}</SheetTitle>
                                <SheetDescription>
                                    {editingQualification ? "Update the name of the qualification." : "Enter the name for the new academic qualification."}
                                </SheetDescription>
                            </SheetHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Qualification Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Bachelor of Science"
                                        required
                                        className="rounded-xl h-11 border-border bg-muted/30 focus:bg-background transition-all"
                                    />
                                </div>
                                <Button type="submit" className="w-full h-11 font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md transition-all active:scale-[0.98]" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingQualification ? "Update Qualification" : "Create Qualification"}
                                </Button>
                            </form>
                        </SheetContent>
                    </Sheet>
                )}
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search qualification..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 rounded-xl border-border/50 bg-card shadow-sm h-11"
                    />
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="border-border/50">
                            <TableHead className="w-[50px] font-bold py-4 px-6 text-[11px] uppercase tracking-widest text-muted-foreground">#</TableHead>
                            <TableHead className="font-bold py-4 text-[11px] uppercase tracking-widest text-muted-foreground">Name</TableHead>
                            <TableHead className="font-bold py-4 text-[11px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
                            <TableHead className="font-bold py-4 text-right px-6 text-[11px] uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <span>Loading qualifications...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : qualifications.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center text-muted-foreground italic">
                                    No qualifications found matching your search.
                                </TableCell>
                            </TableRow>
                        ) : (
                            qualifications.map((q: any, idx: number) => (
                                <TableRow key={q.id} className="border-border/40 hover:bg-primary/[0.02] transition-colors">
                                    <TableCell className="font-medium py-4 px-6 text-xs text-muted-foreground">
                                        {(page - 1) * limit + idx + 1}
                                    </TableCell>
                                    <TableCell className="font-semibold py-4 text-sm">{q.name}</TableCell>
                                    <TableCell className="py-4 text-xs font-medium uppercase tracking-widest">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full ${q.isActive ? "bg-emerald-100 text-emerald-700 font-bold" : "bg-gray-100 text-gray-500 font-medium"}`}>
                                            {q.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right py-4 px-6">
                                        <div className="flex justify-end gap-1">
                                            {can("MASTERS", "EDIT") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(q)}
                                                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {can("MASTERS", "DELETE") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(q.id)}
                                                    className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
                        <p className="text-sm text-muted-foreground font-medium">
                            Showing <span className="text-foreground">{(page - 1) * limit + 1}</span> to <span className="text-foreground">{Math.min(page * limit, pagination.total)}</span> of <span className="text-foreground">{pagination.total}</span> qualifications
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                                className="rounded-xl px-4"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage(page + 1)}
                                className="rounded-xl px-4"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
