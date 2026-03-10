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
import { Plus, Pencil, Trash2, Globe, Search, Loader2 } from "lucide-react";
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
import { useCountries } from "@/hooks/use-masters";
import { useDebounce } from "@/hooks/use-debounce";

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
    const [limit] = useState(25);
    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading, refetch } = useCountries(page, limit, debouncedSearch);

    const countries = data?.countries || [];
    const pagination = data?.pagination || { total: 0, page: 1, limit: 25, totalPages: 1 };

    // Form states
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [editingCountry, setEditingCountry] = useState<Country | null>(null);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

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
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Master Settings: Countries</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage countries available across the platform.</p>
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
                            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-6 font-bold shadow-md flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Add Country
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-[425px] border-l border-border bg-card">
                            <SheetHeader className="mb-6">
                                <SheetTitle className="text-xl font-bold text-foreground">
                                    {editingCountry ? "Edit Country" : "Add New Country"}
                                </SheetTitle>
                                <SheetDescription className="text-muted-foreground">
                                    {editingCountry ? "Update the details of the existing country." : "Create a new country entry for the system."}
                                </SheetDescription>
                            </SheetHeader>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Country Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. United Kingdom"
                                        required
                                        className="rounded-xl border-border bg-background focus:ring-primary/20 h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="code" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Country Code (Optional)</Label>
                                    <Input
                                        id="code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="e.g. UK or GBR"
                                        className="rounded-xl border-border bg-background focus:ring-primary/20 h-11"
                                    />
                                </div>
                                <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-11 font-bold transition-all shadow-md mt-6">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingCountry ? "Update Country" : "Save Country"}
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
                        placeholder="Search country..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 rounded-xl border-border/50 bg-card shadow-sm h-11"
                    />
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="w-[50px] font-bold text-xs uppercase tracking-widest py-4 px-6 text-muted-foreground">#</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4 px-6 text-muted-foreground">Name</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4 px-6 text-muted-foreground">Code</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4 px-6 text-muted-foreground">Status</TableHead>
                            <TableHead className="text-right font-bold text-xs uppercase tracking-widest py-4 px-6 text-muted-foreground">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <span>Loading countries...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : countries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                                    No countries found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            countries.map((c: any, idx: number) => (
                                <TableRow key={c.id} className="border-border/40 hover:bg-primary/[0.02] transition-colors">
                                    <TableCell className="font-medium py-4 px-6 text-xs text-muted-foreground">
                                        {(page - 1) * limit + idx + 1}
                                    </TableCell>
                                    <TableCell className="font-semibold py-4 px-6 text-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <Globe className="h-4 w-4" />
                                            </div>
                                            {c.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-sm text-muted-foreground font-mono uppercase tracking-tighter bg-muted/20 w-fit rounded-lg">{c.code || "-"}</TableCell>
                                    <TableCell className="py-4 text-xs font-medium uppercase tracking-widest">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full ${c.isActive ? "bg-emerald-100 text-emerald-700 font-bold border border-emerald-200" : "bg-gray-100 text-gray-500 font-medium border border-gray-200"}`}>
                                            {c.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right py-4 px-6">
                                        <div className="flex justify-end gap-1">
                                            {can("MASTERS", "EDIT") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(c)}
                                                    className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {can("MASTERS", "DELETE") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(c.id)}
                                                    className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
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
                            Showing <span className="text-foreground">{(page - 1) * limit + 1}</span> to <span className="text-foreground">{Math.min(page * limit, pagination.total)}</span> of <span className="text-foreground">{pagination.total}</span> countries
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                                className="rounded-xl px-4 border-border shadow-sm"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage(page + 1)}
                                className="rounded-xl px-4 border-border shadow-sm"
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
