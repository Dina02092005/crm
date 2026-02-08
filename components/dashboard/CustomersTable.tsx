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
import { MoreHorizontal, Eye, Pencil, Trash2, Phone, Mail, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import CustomerForm from "@/components/forms/CustomerForm";
import { Customer } from "@/types/api";

interface CustomersTableProps {
    data: Customer[];
    onUpdate: () => void;
    onDelete: (id: string) => void;
    pagination?: {
        page: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    }
}

export function CustomersTable({ data, onUpdate, onDelete, pagination }: CustomersTableProps) {
    const [editSheetOpen, setEditSheetOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "name",
            header: "Customer",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                        {row.original.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-foreground">{row.original.name}</p>
                        {row.original.lead?.source && (
                            <Badge variant="outline" className="text-[10px] mt-1">
                                {row.original.lead.source}
                            </Badge>
                        )}
                    </div>
                </div>
            ),
        },
        {
            id: "contact",
            header: "Contact",
            cell: ({ row }) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {row.original.phone}
                    </div>
                    {row.original.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            {row.original.email}
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "onboardedBy",
            header: "Onboarded By",
            cell: ({ row }) => (
                <p className="text-sm text-foreground">{row.original.user?.name || "N/A"}</p>
            ),
        },
        {
            accessorKey: "createdAt",
            header: "Date",
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(row.original.createdAt).toLocaleDateString()}
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
                            <DropdownMenuItem asChild>
                                <Link href={`/customers/${row.original.id}`} className="cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" /> View
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    // Map the row data to the Customer type format expected by the form
                                    const customerData: Customer = {
                                        id: row.original.id,
                                        userId: row.original.userId,
                                        phone: row.original.phone,
                                        email: row.original.email,
                                        firstName: row.original.name.split(' ')[0], // Approximate
                                        lastName: row.original.name.split(' ').slice(1).join(' '), // Approximate
                                        savedAddresses: row.original.savedAddresses || [],
                                        // Add other fields as necessary or leave optional
                                    };
                                    setEditingCustomer(customerData);
                                    setEditSheetOpen(true);
                                }}
                                className="cursor-pointer"
                            >
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 cursor-pointer"
                                onClick={() => onDelete(row.original.id)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];

    const router = useRouter();

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
                        <tr className="border-b border-border">
                            {table.getHeaderGroups().map((headerGroup) =>
                                headerGroup.headers.map((header, index) => (
                                    <th
                                        key={header.id}
                                        className={`
                                            py-3 px-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground
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
                                onClick={() => router.push(`/customers/${row.original.id}`)}
                                className="group hover:bg-muted/50 transition-colors border-b border-border last:border-0 cursor-pointer"
                            >
                                {row.getVisibleCells().map((cell, index) => (
                                    <td
                                        key={cell.id}
                                        className={`
                                            py-4 px-4 align-middle 
                                            ${index === 0 ? "pl-6" : ""}
                                            ${index === row.getVisibleCells().length - 1 ? "pr-6" : ""}
                                        `}
                                        onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('button, a, [role="menuitem"], [role="button"]')) {
                                                e.stopPropagation();
                                            }
                                        }}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4 pr-6 border-t border-gray-100">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
                        disabled={pagination.page <= 1}
                        className="rounded-xl h-8"
                    >
                        Previous
                    </Button>
                    <div className="text-sm font-medium text-gray-600">
                        Page {pagination.page} of {pagination.totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                        disabled={pagination.page >= pagination.totalPages}
                        className="rounded-xl h-8"
                    >
                        Next
                    </Button>
                </div>
            )}

            <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
                <SheetContent className="overflow-y-auto w-full sm:max-w-sm">
                    <SheetHeader>
                        <SheetTitle>Edit Customer</SheetTitle>
                        <SheetDescription>
                            Update customer details.
                        </SheetDescription>
                    </SheetHeader>
                    {editingCustomer && (
                        <div className="mt-6">
                            <CustomerForm
                                customer={editingCustomer}
                                onSuccess={() => {
                                    setEditSheetOpen(false);
                                    onUpdate();
                                }}
                            />
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
