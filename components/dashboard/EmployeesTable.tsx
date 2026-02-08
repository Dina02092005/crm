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
import { MoreHorizontal, Eye, Pencil, Trash2, Mail, Phone, Briefcase } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import EmployeeForm from "@/components/forms/EmployeeForm";
import { Employee } from "@/types/api";

interface EmployeesTableProps {
    data: any[];
    onUpdate: () => void;
    onDelete: (id: string) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
}

export function EmployeesTable({ data, onUpdate, onDelete, onToggleStatus }: EmployeesTableProps) {
    const [editSheetOpen, setEditSheetOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined);

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "name",
            header: "Employee",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                        {row.original.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">{row.original.name}</p>
                    </div>
                </div>
            ),
        },
        {
            id: "contact",
            header: "Contact",
            cell: ({ row }) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-3.5 w-3.5" />
                        {row.original.email}
                    </div>
                    {row.original.employeeProfile?.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-3.5 w-3.5" />
                            {row.original.employeeProfile.phone}
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => (
                <Badge
                    variant="outline"
                    className="bg-white border-gray-200 text-gray-700 font-normal"
                >
                    {row.original.role}
                </Badge>
            ),
        },
        {
            id: "department",
            header: "Department",
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="h-3.5 w-3.5" />
                    {row.original.employeeProfile?.department || "N/A"}
                </div>
            ),
        },
        {
            id: "leads",
            header: "Leads",
            cell: ({ row }) => (
                <p className="text-sm text-gray-900">
                    {row.original._count?.assignedLeads || 0}
                </p>
            ),
        },
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }) => (
                <div className={`
                    inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${row.original.isActive ? "text-teal-700 bg-teal-50" : "text-gray-600 bg-gray-100"}
                `}>
                    <div className={`w-1.5 h-1.5 rounded-full ${row.original.isActive ? "bg-teal-600" : "bg-gray-500"}`} />
                    {row.original.isActive ? "Active" : "Inactive"}
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
                                <Link href={`/employees/${row.original.id}`} className="cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" /> View
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    // Map the user+profile data to the Employee type expected by the form
                                    const employeeData: any = {
                                        id: row.original.id,
                                        email: row.original.email,
                                        firstName: row.original.name.split(' ')[0],
                                        lastName: row.original.name.split(' ').slice(1).join(' '),
                                        phone: row.original.employeeProfile?.phone || "",
                                        role: row.original.role,
                                        department: row.original.employeeProfile?.department || "",
                                        salary: row.original.employeeProfile?.salary,
                                        joiningDate: row.original.employeeProfile?.joiningDate,
                                        designation: row.original.employeeProfile?.designation,
                                        password: "", // Password is typically not sent back
                                    };
                                    setEditingEmployee(employeeData);
                                    setEditSheetOpen(true);
                                }}
                                className="cursor-pointer"
                            >
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => onToggleStatus(row.original.id, row.original.isActive)}
                            >
                                {row.original.isActive ? (
                                    <>
                                        <Trash2 className="mr-2 h-4 w-4 text-orange-500" />
                                        <span className="text-orange-600">Deactivate</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="mr-2 h-4 w-4 rounded-full border-2 border-teal-600" />
                                        <span className="text-teal-600">Activate</span>
                                    </>
                                )}
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
                <SheetContent className="overflow-y-auto w-full sm:max-w-sm">
                    <SheetHeader>
                        <SheetTitle>Edit Employee</SheetTitle>
                        <SheetDescription>
                            Update employee details.
                        </SheetDescription>
                    </SheetHeader>
                    {editingEmployee && (
                        <div className="mt-6">
                            <EmployeeForm
                                employee={editingEmployee}
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
