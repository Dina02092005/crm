"use client";

import { useState, useEffect } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Globe, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCountries, useBulkDeleteCountries } from "@/hooks/use-masters";
import { useDebounce } from "@/hooks/use-debounce";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Country {
    id: string;
    name: string;
    code: string | null;
    isActive: boolean;
}

export default function CountriesPage() {
    const { can } = usePermissions();

    // Filter & Pagination State
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading, refetch } = useCountries(page, limit, debouncedSearch);

    const countries = data?.countries || [];
    const pagination = data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };

    // Form states
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [editingCountry, setEditingCountry] = useState<Country | null>(null);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    // Multi-select state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const bulkDeleteMutation = useBulkDeleteCountries();
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

    const toggleSelectAll = () => {
        if (selectedIds.size === countries.length && countries.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(countries.map((c: any) => c.id)));
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
            toast.success("Countries deleted successfully");
            setSelectedIds(new Set());
            setIsBulkDeleteOpen(false);
            refetch();
        } catch (error) {
            toast.error("Failed to delete countries");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const url = editingCountry ? `/api/master/countries/${editingCountry.id}` : "/api/master/countries";
            const method = editingCountry ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, code }),
            });

            if (res.ok) {
                toast.success(editingCountry ? "Country updated" : "Country added");
                setName("");
                setCode("");
                setEditingCountry(null);
                setIsSheetOpen(false);
                refetch();
            } else {
                const error = await res.json();
                toast.error(error.message || (editingCountry ? "Failed to update" : "Failed to add"));
            }
        } catch (error) {
            toast.error("Error saving country");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (country: Country) => {
        setEditingCountry(country);
        setName(country.name);
        setCode(country.code || "");
        setIsSheetOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this country?")) return;

        try {
            const res = await fetch(`/api/master/countries/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("Country deleted");
                refetch();
            } else {
                toast.error("Failed to delete country");
            }
        } catch (error) {
            toast.error("Error deleting country");
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
            {/* Minimal Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Countries</h1>
                    <p className="text-sm text-muted-foreground mt-1">Configure global regions and ISO identifiers.</p>
                </div>
                {can("MASTERS", "CREATE") && (
                    <Sheet open={isSheetOpen} onOpenChange={(open) => {
                        setIsSheetOpen(open);
                        if (!open) {
                            setEditingCountry(null);
                            setName("");
                            setCode("");
                        }
                    }}>
                        <SheetTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-6 uppercase tracking-wider text-[11px] rounded-md gap-2">
                                <Plus className="h-4 w-4" /> Add Country
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl">
                            <div className="bg-primary/5 px-6 py-4 border-b">
                                <SheetTitle className="text-base font-bold tracking-tight">
                                    {editingCountry ? "Modify Region" : "Register New Region"}
                                </SheetTitle>
                                <SheetDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1 leading-none opacity-60">
                                    Master Data Management
                                </SheetDescription>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div className="space-y-1.5">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">Official Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. United Kingdom"
                                        required
                                        className="h-10 bg-muted/20 border-muted/50"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="code" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">ISO Alpha Code</Label>
                                    <Input
                                        id="code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="e.g. UK or GBR"
                                        className="h-10 bg-muted/20 border-muted/50"
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-3 pt-4">
                                    <Button type="button" variant="ghost" onClick={() => setIsSheetOpen(false)} className="text-[10px] font-black uppercase tracking-widest h-10 px-6">
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting} className="h-10 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[10px]">
                                        {isSubmitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                        {editingCountry ? "Update Record" : "Create Record"}
                                    </Button>
                                </div>
                            </form>
                        </SheetContent>
                    </Sheet>
                )}
            </div>

            {/* Multi-select Action Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-primary text-primary-foreground px-6 py-4 rounded-md flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-widest">{selectedIds.size} Regions Selected</span>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => setSelectedIds(new Set())}
                            className="h-8 text-[9px] font-black uppercase tracking-wider bg-white/20 hover:bg-white/30 text-white rounded-md border-none"
                        >
                            Deselect All
                        </Button>
                    </div>
                    {can("MASTERS", "DELETE") && (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => setIsBulkDeleteOpen(true)}
                            className="h-8 text-[9px] font-black uppercase tracking-wider bg-white text-destructive hover:bg-white/90 rounded-md border-none px-6"
                        >
                            Bulk Deletion
                        </Button>
                    )}
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filter regions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-10 w-full bg-background border-muted/50 focus:border-primary/50"
                    />
                </div>
            </div>

            {/* Data Table Section */}
            <div className="bg-background rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-12 px-4 border-r">
                                <Checkbox 
                                    checked={countries.length > 0 && selectedIds.size === countries.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="w-12 px-4 border-r text-[10px] font-black uppercase tracking-widest text-muted-foreground">#</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Region Name</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ISO Code</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Registry Status</TableHead>
                            <TableHead className="text-right px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Syncing Global Registry...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : countries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Globe className="h-8 w-8 text-muted-foreground/20" />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-semibold">No regions listed</span>
                                            <span className="text-xs text-muted-foreground">Initialize the registry by adding your first country.</span>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            countries.map((c: any, idx: number) => (
                                <TableRow key={c.id} className="group hover:bg-muted/30 border-b last:border-0 transition-colors">
                                    <TableCell className="px-4 border-r">
                                        <Checkbox 
                                            checked={selectedIds.has(c.id)}
                                            onCheckedChange={() => toggleSelect(c.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="px-4 border-r font-mono text-[10px] text-muted-foreground/60">
                                        {(page - 1) * limit + idx + 1}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground border">
                                                <Globe className="h-3.5 w-3.5" />
                                            </div>
                                            <span className="font-semibold text-sm tracking-tight">{c.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <code className="px-2 py-0.5 rounded bg-muted/50 border text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                            {c.code || "—"}
                                        </code>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <div className={cn(
                                                "h-1.5 w-1.5 rounded-full",
                                                c.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30"
                                            )} />
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest",
                                                c.isActive ? "text-emerald-600" : "text-muted-foreground/50"
                                            )}>
                                                {c.isActive ? "Active" : "Disabled"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-4">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {can("MASTERS", "EDIT") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(c)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            {can("MASTERS", "DELETE") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(c.id)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Enhanced Pagination Controls */}
                <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/5 min-h-[56px]">
                    <div className="flex items-center gap-6">
                        <div className="text-[11px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                            Page {pagination.page} / {pagination.totalPages}
                        </div>
                        <div className="flex items-center gap-2 border-l pl-6 border-muted/30">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Show</span>
                            <Select
                                value={limit.toString()}
                                onValueChange={(v) => {
                                    setLimit(Number(v));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="h-7 w-[70px] text-[10px] font-bold border-muted/30 bg-background focus:ring-1 focus:ring-primary/20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="min-w-[70px]">
                                    {[10, 20, 50, 100].map((size) => (
                                        <SelectItem key={size} value={size.toString()} className="text-[10px] font-bold">
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[10px] font-black uppercase px-4 border-muted/30 hover:bg-muted/50 transition-colors"
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                        >
                            <ChevronLeft className="h-3.5 w-3.5 mr-1.5" /> Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[10px] font-black uppercase px-4 border-muted/30 hover:bg-muted/50 transition-colors"
                            disabled={page >= pagination.totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            Next <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
                        </Button>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={isBulkDeleteOpen}
                onClose={() => setIsBulkDeleteOpen(false)}
                onConfirm={handleBulkDelete}
                title="Bulk Delete Regions"
                description={`Are you sure you want to delete ${selectedIds.size} selected regions? This action cannot be undone and may affect related universities and courses.`}
                confirmText="Yes, Delete All"
                variant="destructive"
                isLoading={bulkDeleteMutation.isPending}
            />
        </div>
    );
}
