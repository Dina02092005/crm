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
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Role {
    name: string;
    description: string;
    users: number;
    status: string;
}

interface RolesTableProps {
    data: Role[];
    onUpdate?: () => void;
    onDelete?: (id: string) => void;
}

export function RolesTable({ data, onUpdate, onDelete }: RolesTableProps) {
    // Placeholder for edit functionality
    const [editSheetOpen, setEditSheetOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);

    const columns: ColumnDef<Role>[] = [
        {
            accessorKey: "name",
            header: "Role Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                        {row.original.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">{row.original.name}</p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => (
                <p className="text-sm text-gray-600">{row.original.description}</p>
            ),
        },
        {
            accessorKey: "users",
            header: "Users",
            cell: ({ row }) => (
                <p className="text-sm text-gray-900 font-medium">{row.original.users}</p>
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
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => {
                                    // Placeholder edit
                                    setEditingRole(row.original);
                                    setEditSheetOpen(true);
                                }}
                                className="cursor-pointer"
                            >
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 cursor-pointer"
                                onClick={() => onDelete?.(row.original.name)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
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
        <div className="w-full overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100">
                            {table.getHeaderGroups().map((headerGroup) =>
                                headerGroup.headers.map((header, index) => (
                                    <th
                                        key={header.id}
                                        className={`
                                            py-3 px-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400
                                            ${index === 0 ? "pl-6" : ""}
                                            ${index === headerGroup.headers.length - 1 ? "pr-6" : ""}
                                        `}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0"
                            >
                                {row.getVisibleCells().map((cell, index) => (
                                    <td
                                        key={cell.id}
                                        className={`
                                            py-4 px-4 align-middle 
                                            ${index === 0 ? "pl-6" : ""}
                                            ${index === row.getVisibleCells().length - 1 ? "pr-6" : ""}
                                        `}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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
