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
import { Loader2, Plus, Trash2, Pencil, Search, ExternalLink, Globe } from "lucide-react";
import { useWebsites, useBulkDeleteWebsites } from "@/hooks/use-masters";
import { useDebounce } from "@/hooks/use-debounce";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Website {
    id: string;
    name: string;
    url: string | null;
    isActive: boolean;
    createdAt: string;
}

export default function WebsitesPage() {
    const { can } = usePermissions();

    // Filter & Pagination State
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading, refetch } = useWebsites(page, limit, debouncedSearch);

    const websites = data?.websites || [];
    const pagination = data?.pagination || { total: 0, page: 1, limit: 25, totalPages: 1 };

    // Modal State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
    const [formData, setFormData] = useState({ name: "", url: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    // Multi-select state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const bulkDeleteMutation = useBulkDeleteWebsites();
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

    const toggleSelectAll = () => {
        if (selectedIds.size === websites.length && websites.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(websites.map((w: any) => w.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = async () => {
        try {
            await bulkDeleteMutation.mutateAsync(Array.from(selectedIds));
            toast.success("Websites deleted successfully");
            setSelectedIds(new Set());
            setIsBulkDeleteOpen(false);
            refetch();
        } catch (error) {
            toast.error("Failed to delete websites");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const url = editingWebsite ? `/api/websites/${editingWebsite.id}` : "/api/websites";
            const method = editingWebsite ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success(editingWebsite ? "Website updated" : "Website added");
                setFormData({ name: "", url: "" });
                setEditingWebsite(null);
                setIsSheetOpen(false);
                refetch();
            } else {
                const error = await res.json();
                toast.error(error.message || (editingWebsite ? "Failed to update" : "Failed to add"));
            }
        } catch (error) {
            toast.error("Error saving website");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (w: Website) => {
        setEditingWebsite(w);
        setFormData({ name: w.name, url: w.url || "" });
        setIsSheetOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;
        try {
            const res = await fetch(`/api/websites/${id}`, {
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
            setEditingWebsite(null);
            setFormData({ name: "", url: "" });
        }
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50/30 min-h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Website Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage official websites and sources for lead generation.</p>
                </div>
                {can("MASTERS", "CREATE") && (
                    <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
                        <SheetTrigger asChild>
                            <Button className="gap-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-md px-6 h-11">
                                <Plus className="h-4 w-4" /> Add Website
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-md">
                            <SheetHeader className="pb-4">
                                <SheetTitle className="text-xl font-bold">{editingWebsite ? "Edit Website" : "Add Website"}</SheetTitle>
                                <SheetDescription>
                                    Enter the details for the source website.
                                </SheetDescription>
                            </SheetHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Website Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Official Study Portal"
                                        required
                                        className="rounded-xl h-11 border-gray-200 bg-gray-50 focus:bg-white transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="url" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Website URL</Label>
                                    <Input
                                        id="url"
                                        value={formData.url}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                        placeholder="https://example.com"
                                        className="rounded-xl h-11 border-gray-200 bg-gray-50 focus:bg-white transition-all"
                                    />
                                </div>
                                <Button type="submit" className="w-full h-11 font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md transition-all active:scale-[0.98]" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingWebsite ? "Update Website" : "Create Website"}
                                </Button>
                            </form>
                        </SheetContent>
                    </Sheet>
                )}
            </div>

            {/* Multi-select Action Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-primary text-primary-foreground px-6 py-4 rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold uppercase tracking-widest">{selectedIds.size} Websites Selected</span>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => setSelectedIds(new Set())}
                            className="h-9 text-[10px] font-black uppercase tracking-wider bg-white/20 hover:bg-white/30 text-white rounded-xl border-none"
                        >
                            Deselect
                        </Button>
                    </div>
                    {can("MASTERS", "DELETE") && (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => setIsBulkDeleteOpen(true)}
                            className="h-9 text-[10px] font-black uppercase tracking-wider bg-white text-destructive hover:bg-white/90 rounded-xl border-none px-8"
                        >
                            Delete Selected
                        </Button>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Search by name or URL..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 rounded-xl border-gray-200 bg-white shadow-sm h-11"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow className="border-gray-200">
                            <TableHead className="w-[50px] px-6">
                                <Checkbox 
                                    checked={websites.length > 0 && selectedIds.size === websites.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="w-[50px] font-bold py-4 text-[10px] uppercase tracking-widest text-gray-500">#</TableHead>
                            <TableHead className="font-bold py-4 text-[10px] uppercase tracking-widest text-gray-500">Website Info</TableHead>
                            <TableHead className="font-bold py-4 text-[10px] uppercase tracking-widest text-gray-500">Status</TableHead>
                            <TableHead className="font-bold py-4 text-right px-6 text-[10px] uppercase tracking-widest text-gray-500">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center text-gray-400">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <span className="font-medium">Loading websites...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : websites.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center text-gray-400 italic">
                                    No websites found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            websites.map((w: any, idx: number) => (
                                <TableRow key={w.id} className="border-gray-100 hover:bg-gray-50/50 transition-colors">
                                    <TableCell className="px-6">
                                        <Checkbox 
                                            checked={selectedIds.has(w.id)}
                                            onCheckedChange={() => toggleSelect(w.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium py-4 text-xs text-gray-400">
                                        {(page - 1) * limit + idx + 1}
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold text-gray-900 text-sm">{w.name}</span>
                                            {w.url && (
                                                <a
                                                    href={w.url.startsWith('http') ? w.url : `https://${w.url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-xs text-primary hover:underline w-fit"
                                                >
                                                    {w.url}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 text-[10px] font-bold uppercase tracking-widest">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full ${w.isActive ? "bg-green-50 text-green-700 border border-green-100" : "bg-gray-100 text-gray-500"}`}>
                                            {w.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right py-4 px-6">
                                        <div className="flex justify-end gap-1">
                                            {can("MASTERS", "EDIT") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(w)}
                                                    className="h-9 w-9 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {can("MASTERS", "DELETE") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(w.id, w.name)}
                                                    className="h-9 w-9 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
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
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                        <p className="text-xs text-gray-500 font-medium">
                            Showing <span className="text-gray-900 font-bold">{(page - 1) * limit + 1}</span> to <span className="text-gray-900 font-bold">{Math.min(page * limit, pagination.total)}</span> of <span className="text-gray-900 font-bold">{pagination.total}</span> entries
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                                className="rounded-xl px-4 border-gray-200 h-9 font-bold text-gray-600"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage(page + 1)}
                                className="rounded-xl px-4 border-gray-200 h-9 font-bold text-gray-600"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={isBulkDeleteOpen}
                onClose={() => setIsBulkDeleteOpen(false)}
                onConfirm={handleBulkDelete}
                title="Bulk Delete Websites"
                description={`Are you sure you want to delete ${selectedIds.size} selected websites? This action cannot be undone.`}
                confirmText="Yes, Delete All"
                variant="destructive"
                isLoading={bulkDeleteMutation.isPending}
            />
        </div>
    );
}
