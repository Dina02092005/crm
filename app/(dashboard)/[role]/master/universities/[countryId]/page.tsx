"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft,
    Plus,
    Pencil,
    Trash2,
    Search,
    ExternalLink,
    Loader2,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Building2
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useUniversities, useBulkDeleteUniversities } from "@/hooks/use-masters";
import { useDebounce } from "@/hooks/use-debounce";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface University {
    id: string;
    name: string;
    website: string | null;
    address: string | null;
    description: string | null;
    imageUrl: string | null;
}

export default function UniversityDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { data: session } = useSession() as any;
    const countryId = params.countryId as string;
    const role = params.role as string;
    const canEdit = ["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role || "");

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [countryName, setCountryName] = useState("");

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading, refetch } = useUniversities(countryId, page, limit, debouncedSearch);

    const universities = data?.universities || [];
    const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };

    // Modal states
    const [isAddEditOpen, setIsAddEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedUni, setSelectedUni] = useState<University | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        website: "",
        address: "",
        description: "",
        imageUrl: ""
    });
    const [submitting, setSubmitting] = useState(false);

    // Multi-select state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const bulkDeleteMutation = useBulkDeleteUniversities();
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

    const toggleSelectAll = () => {
        if (selectedIds.size === universities.length && universities.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(universities.map((u: any) => u.id)));
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
            setSubmitting(true);
            await bulkDeleteMutation.mutateAsync(Array.from(selectedIds));
            toast.success("Universities deleted successfully");
            setSelectedIds(new Set());
            setIsBulkDeleteOpen(false);
            refetch();
        } catch (error) {
            toast.error("Failed to delete universities");
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        const fetchCountry = async () => {
            try {
                const res = await axios.get("/api/master/countries-with-university-count");
                const currentCountry = res.data.countries?.find((c: any) => c.id === countryId);
                if (currentCountry) setCountryName(currentCountry.name);
            } catch (err) {
                console.error("Failed to fetch country name:", err);
            }
        };
        if (countryId) fetchCountry();
    }, [countryId]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const handleOpenAdd = () => {
        setSelectedUni(null);
        setFormData({ name: "", website: "", address: "", description: "", imageUrl: "" });
        setIsAddEditOpen(true);
    };

    const handleOpenEdit = (uni: University) => {
        setSelectedUni(uni);
        setFormData({
            name: uni.name,
            website: uni.website || "",
            address: uni.address || "",
            description: uni.description || "",
            imageUrl: uni.imageUrl || ""
        });
        setIsAddEditOpen(true);
    };

    const handleOpenDelete = (uni: University) => {
        setSelectedUni(uni);
        setIsDeleteOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return toast.error("University name is required");

        try {
            setSubmitting(true);
            if (selectedUni) {
                await axios.put(`/api/master/universities/${selectedUni.id}`, formData);
                toast.success("University updated successfully");
            } else {
                await axios.post(`/api/master/universities`, { ...formData, countryId });
                toast.success("University added successfully");
            }
            setIsAddEditOpen(false);
            refetch();
        } catch (error) {
            console.error("Failed to save university:", error);
            toast.error("Failed to save university");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedUni) return;
        try {
            setSubmitting(true);
            await axios.delete(`/api/master/universities/${selectedUni.id}`);
            toast.success("University deleted successfully");
            setIsDeleteOpen(false);
            refetch();
        } catch (error) {
            console.error("Failed to delete university:", error);
            toast.error("Failed to delete university");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
            {/* Minimal Header & Navigation */}
            <div className="flex flex-col gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit -ml-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all"
                    onClick={() => router.push(`/${role}/master/universities`)}
                >
                    <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                    Back to Countries
                </Button>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                            <span>Masters</span>
                            <span className="opacity-30">/</span>
                            <span>Universities</span>
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {countryName || "..."} <span className="text-muted-foreground/40 font-light ml-1">Institutions</span>
                        </h1>
                    </div>
                    {canEdit && (
                        <Button onClick={handleOpenAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-6 uppercase tracking-wider text-[11px] rounded-md gap-2">
                            <Plus className="h-4 w-4" />
                            Add University
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search institutions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-10 w-full bg-background border-muted/50 focus:border-primary/50"
                    />
                </div>
            </div>

            {/* Multi-select Action Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-primary text-primary-foreground px-6 py-3 rounded-lg flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-4">
                        <span className="text-[11px] font-black uppercase tracking-widest">{selectedIds.size} Institutions Selected</span>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => setSelectedIds(new Set())}
                            className="h-8 text-[10px] font-black uppercase tracking-wider bg-white/20 hover:bg-white/30 text-white border-none"
                        >
                            Clear
                        </Button>
                    </div>
                    {canEdit && (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => setIsBulkDeleteOpen(true)}
                            className="h-8 text-[10px] font-black uppercase tracking-wider bg-white text-destructive hover:bg-white/90 border-none px-6"
                        >
                            Delete Selected
                        </Button>
                    )}
                </div>
            )}

            {/* Data Table Section */}
            <div className="bg-background rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-12 px-4 border-r">
                                <Checkbox 
                                    checked={universities.length > 0 && selectedIds.size === universities.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="w-12 px-4 border-r text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">#</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Institution Name</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Portal / Link</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location</TableHead>
                            <TableHead className="text-right px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-none">Scanning Databases...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : universities.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Building2 className="h-8 w-8 text-muted-foreground/20" />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-semibold">No records found</span>
                                            <span className="text-xs text-muted-foreground">The registry for {countryName} is currently empty.</span>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            universities.map((uni: any, idx: number) => (
                                <TableRow key={uni.id} className="group hover:bg-muted/30 border-b last:border-0 transition-colors">
                                    <TableCell className="px-4 border-r">
                                        <Checkbox 
                                            checked={selectedIds.has(uni.id)}
                                            onCheckedChange={() => toggleSelect(uni.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="px-4 border-r font-mono text-[10px] text-muted-foreground/60 text-center">
                                        {(page - 1) * limit + idx + 1}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-semibold text-sm tracking-tight leading-tight">{uni.name}</span>
                                            {uni.description && (
                                                <span className="text-[10px] text-muted-foreground/70 truncate max-w-[250px]">{uni.description}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {uni.website ? (
                                            <a
                                                href={uni.website.startsWith('http') ? uni.website : `https://${uni.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-primary/70 underline decoration-primary/20 underline-offset-4 transition-all"
                                            >
                                                {uni.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        ) : (
                                            <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                        <span className="text-[11px] font-medium text-muted-foreground italic">
                                            {uni.address || "—"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right px-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem 
                                                    onClick={() => handleOpenEdit(uni)} 
                                                    disabled={!canEdit}
                                                    className="text-xs font-semibold py-2"
                                                >
                                                    <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Information
                                                </DropdownMenuItem>
                                                <div className="h-px bg-muted my-1" />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive focus:bg-destructive/10 text-xs font-semibold py-2"
                                                    onClick={() => handleOpenDelete(uni)}
                                                    disabled={!canEdit}
                                                >
                                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove Entry
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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

            {/* Redesigned Minimal Modals */}
            <Dialog open={isAddEditOpen} onOpenChange={setIsAddEditOpen}>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-primary/5 px-6 py-4 border-b">
                        <DialogTitle className="text-base font-bold tracking-tight">
                            {selectedUni ? "Modify Institution" : "Register New Institution"}
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1 leading-none opacity-60">
                            Location: {countryName}
                        </DialogDescription>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="grid gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">Official Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="h-10 bg-muted/20 border-muted/50"
                                    placeholder="e.g. University of Oxford"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="website" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">Portal Domain</Label>
                                    <Input
                                        id="website"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        className="h-10 bg-muted/20 border-muted/50"
                                        placeholder="oxford.ac.uk"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="imageUrl" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">Logo Resource (URL)</Label>
                                    <Input
                                        id="imageUrl"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        className="h-10 bg-muted/20 border-muted/50"
                                        placeholder="Link to branding asset"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">Physical Address</Label>
                                <Textarea
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="bg-muted/20 border-muted/50 min-h-[80px] resize-none"
                                    placeholder="Street, Campus, City..."
                                    rows={2}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">Institutional Pitch (Internal)</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-muted/20 border-muted/50 min-h-[100px] resize-none"
                                    placeholder="Brief overview for internal reference..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setIsAddEditOpen(false)} className="text-[10px] font-black uppercase tracking-widest h-10 px-6">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting} className="h-10 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[10px]">
                                {submitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                {selectedUni ? "Commit Changes" : "Create Record"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Deauthorizing Institution"
                description={`This will permanently remove ${selectedUni?.name} from the registry. This action is terminal and cannot be reversed.`}
                confirmText="Yes, Proceed"
                variant="destructive"
                isLoading={submitting}
            />

            <ConfirmDialog
                isOpen={isBulkDeleteOpen}
                onClose={() => setIsBulkDeleteOpen(false)}
                onConfirm={handleBulkDelete}
                title="Bulk Deauthorizing Institutions"
                description={`This will permanently remove ${selectedIds.size} selected institutions from the registry. This action is terminal and cannot be reversed.`}
                confirmText="Yes, Proceed All"
                variant="destructive"
                isLoading={submitting}
            />
        </div>
    );
}
