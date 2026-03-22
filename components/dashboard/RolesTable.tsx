"use client";

import {
    useReactTable,
    getCoreRowModel,
    ColumnDef,
    flexRender,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash2, ShieldCheck, Shield } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useBulkDeleteRoles } from "@/hooks/useApi";
import { toast } from "sonner";

interface Role {
    id: string;
    name: string;
    description: string;
    users: number;
    status: string;
    isSystem?: boolean;
}

interface RolesTableProps {
    data: Role[];
    onUpdate?: () => void;
    onDelete?: (id: string) => void;
    pagination?: {
        page: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    }
}

export function RolesTable({ data, onUpdate, onDelete, pagination }: RolesTableProps) {
    const [editSheetOpen, setEditSheetOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

    const bulkDeleteRoles = useBulkDeleteRoles();

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(data.filter(r => !r.isSystem).map(r => r.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };

    const handleBulkDelete = async () => {
        try {
            await bulkDeleteRoles.mutateAsync(Array.from(selectedIds));
            setSelectedIds(new Set());
            onUpdate?.();
        } catch (error) {
            // Error handled by mutation
        } finally {
            setBulkDeleteDialogOpen(false);
        }
    };

    const columns: ColumnDef<Role>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={data.length > 0 && selectedIds.size === data.filter(r => !r.isSystem).length}
                    onCheckedChange={(v) => toggleSelectAll(!!v)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={selectedIds.has(row.original.id)}
                    onCheckedChange={(v) => toggleSelect(row.original.id)}
                    disabled={row.original.isSystem}
                    aria-label="Select row"
                />
            ),
        },
        {
            accessorKey: "name",
            header: "Role Name",
            cell: ({ row }) => {
                const isSelected = selectedIds.has(row.original.id);
                const Icon = isSelected ? ShieldCheck : Shield;
                return (
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${isSelected ? "bg-primary text-primary-foreground" : "bg-cyan-50 text-cyan-600"}`}>
                            {row.original.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-foreground text-sm leading-none flex items-center gap-1.5">
                                {row.original.name}
                                {row.original.isSystem && <span className="text-[10px] lowercase text-muted-foreground font-normal border px-1 rounded opacity-60">system</span>}
                            </p>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => (
                <p className="text-sm text-muted-foreground line-clamp-1">{row.original.description}</p>
            ),
        },
        {
            accessorKey: "users",
            header: "Users",
            cell: ({ row }) => (
                <p className="text-sm text-foreground font-medium">{row.original.users}</p>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <div className={`
                    inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${row.original.status === "Active" ? "text-cyan-700 bg-cyan-50" : "text-gray-600 bg-gray-100"}
                `}>
                    <div className={`w-1.5 h-1.5 rounded-full ${row.original.status === "Active" ? "bg-cyan-600" : "bg-gray-500"}`} />
                    {row.original.status}
                </div>
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-40 hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-border/50 shadow-xl">
                            <DropdownMenuItem
                                onClick={() => {
                                    setEditingRole(row.original);
                                    setEditSheetOpen(true);
                                }}
                                className="cursor-pointer text-xs font-medium"
                            >
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 cursor-pointer text-xs font-medium"
                                onClick={() => onDelete?.(row.original.id)}
                                disabled={row.original.isSystem}
                            >
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="w-full relative bg-white h-full flex flex-col">
            {selectedIds.size > 0 && (
                <div className="absolute top-0 inset-x-0 h-11 bg-primary text-primary-foreground flex items-center justify-between px-6 z-30 animate-in slide-in-from-top-1 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black tracking-tighter uppercase">
                            {selectedIds.size} Selected
                        </div>
                        <span className="text-xs font-bold tracking-tight">Perform bulk action on system roles</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[10px] font-black uppercase text-white hover:bg-white/10"
                            onClick={() => setSelectedIds(new Set())}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 px-4 text-[10px] font-black uppercase shadow-sm bg-rose-500 hover:bg-rose-600 text-white border-0"
                            onClick={() => setBulkDeleteDialogOpen(true)}
                        >
                            Delete Selected
                        </Button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto flex-1">
                <table className="w-full border-collapse">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="border-b border-border/40 bg-slate-50/50">
                                {headerGroup.headers.map((header, index) => (
                                    <th
                                        key={header.id}
                                        className={`
                                            py-3 px-4 text-left text-[10px] font-black uppercase tracking-[0.15em] text-slate-400
                                            ${index === 0 ? "pl-6 w-12" : ""}
                                            ${index === headerGroup.headers.length - 1 ? "pr-6" : ""}
                                        `}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {table.getRowModel().rows.map((row) => {
                            const isSelected = selectedIds.has(row.original.id);
                            return (
                                <tr
                                    key={row.id}
                                    className={`
                                        group transition-all 
                                        ${isSelected ? "bg-slate-50/80" : "hover:bg-slate-50/30"}
                                    `}
                                >
                                    {row.getVisibleCells().map((cell, index) => (
                                        <td
                                            key={cell.id}
                                            className={`
                                                py-3.5 px-4 align-middle 
                                                ${index === 0 ? "pl-6" : ""}
                                                ${index === row.getVisibleCells().length - 1 ? "pr-6" : ""}
                                            `}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {pagination && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 bg-white shrink-0">
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">
                        Matrix Page {pagination.page} <span className="mx-2 opacity-50">/</span> {pagination.totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
                            disabled={pagination.page <= 1}
                            className="rounded-xl h-8 px-4 text-[10px] font-black uppercase tracking-tight border-border/40 hover:bg-slate-50"
                        >
                            Back
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                            disabled={pagination.page >= pagination.totalPages}
                            className="rounded-xl h-8 px-4 text-[10px] font-black uppercase tracking-tight border-border/40 hover:bg-slate-50"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={bulkDeleteDialogOpen}
                onClose={() => setBulkDeleteDialogOpen(false)}
                onConfirm={handleBulkDelete}
                title="Bulk Deletion"
                description={`You are about to permanently remove ${selectedIds.size} permission sets. This action will revoke access for all assigned users.`}
                confirmText="Confirm Deletion"
                variant="destructive"
                isLoading={bulkDeleteRoles.isPending}
            />

            <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
                <SheetContent className="w-full sm:max-w-sm">
                    <SheetHeader>
                        <SheetTitle>Edit Role</SheetTitle>
                        <SheetDescription>
                            Modify role permissions.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                        <p className="text-gray-500 text-sm">Role editing is not yet implemented.</p>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
