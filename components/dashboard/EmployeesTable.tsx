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
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Eye, Pencil, Trash2, Mail, Phone, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import EmployeeForm from "@/components/forms/EmployeeForm";
import { Employee } from "@/types/api";
import { ExotelAccountButton } from "@/components/dashboard/ExotelAccountButton";
import { useSession } from "next-auth/react";
import { useRolePath } from "@/hooks/use-role-path";
import { useBulkDeleteEmployees } from "@/hooks/useApi";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

interface EmployeesTableProps {
    data: any[];
    onUpdate: () => void;
    onDelete: (id: string) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
    pagination?: {
        page: number;
        totalPages: number;
        pageSize: number;
        onPageChange: (page: number) => void;
        onPageSizeChange: (pageSize: number) => void;
    };
    title?: string;
}

export function EmployeesTable({ data, onUpdate, onDelete, onToggleStatus, pagination, title = "Employee" }: EmployeesTableProps) {
    const [editSheetOpen, setEditSheetOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined);
    const { data: session } = useSession() as any;
    const { prefixPath } = useRolePath();
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session?.user?.role);
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const bulkDeleteMutation = useBulkDeleteEmployees();

    const handleBulkDelete = async () => {
        const selectedIds = table.getSelectedRowModel().rows.map(row => row.original.id);
        try {
            await bulkDeleteMutation.mutateAsync(selectedIds);
            table.toggleAllRowsSelected(false);
            onUpdate();
        } catch (error) {
            // Error handled by mutation
        } finally {
            setBulkDeleteDialogOpen(false);
        }
    };

    const columns: ColumnDef<any>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className="translate-y-[2px]"
                />
            ),
            cell: ({ row }) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                        className="translate-y-[2px]"
                    />
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "name",
            header: title,
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                        {row.original.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-foreground">{row.original.name}</p>
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
                        <Mail className="h-3.5 w-3.5" />
                        {row.original.email}
                    </div>
                    {(row.original.agentProfile?.phone || row.original.counselorProfile?.phone || row.original.employeeProfile?.phone) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {row.original.agentProfile?.phone || row.original.counselorProfile?.phone || row.original.employeeProfile?.phone}
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
        ...(title !== "Counselor" ? [
            {
                id: "department",
                header: "Department",
                cell: ({ row }: any) => (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5" />
                        {row.original.agentProfile?.companyName || row.original.counselorProfile?.department || row.original.employeeProfile?.department || "N/A"}
                    </div>
                ),
            },
            {
                id: "leads",
                header: "Leads",
                cell: ({ row }: any) => (
                    <p className="text-sm text-foreground">
                        {row.original._count?.assignedLeads || 0}
                    </p>
                ),
            },
            {
                id: "converted",
                header: "Converted",
                cell: ({ row }: any) => (
                    <p className="text-sm text-foreground">
                        {row.original._count?.onboardedStudents || row.original._count?.onboardedCustomers || 0}
                    </p>
                ),
            },
        ] : []),
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }) => (
                <div className={`
                    inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${row.original.isActive ? "text-cyan-700 bg-cyan-50" : "text-gray-600 bg-gray-100"}
                `}>
                    <div className={`w-1.5 h-1.5 rounded-full ${row.original.isActive ? "bg-cyan-600" : "bg-gray-500"}`} />
                    {row.original.isActive ? "Active" : "Inactive"}
                </div>
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    {/* Exotel account creation — admin only, for AGENT/COUNSELOR rows */}
                    {isAdmin && (row.original.role === "AGENT" || row.original.role === "COUNSELOR") && (
                        <ExotelAccountButton
                            userId={row.original.id}
                            role={row.original.role}
                            existingExotelId={
                                row.original.agentProfile?.exotelAgentId ||
                                row.original.counselorProfile?.exotelAgentId ||
                                null
                            }
                        />
                    )}
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
                                    const profile = row.original.agentProfile || row.original.counselorProfile || row.original.employeeProfile;
                                    const employeeData: any = {
                                        id: row.original.id,
                                        email: row.original.email,
                                        firstName: row.original.name.split(' ')[0],
                                        lastName: row.original.name.split(' ').slice(1).join(' '),
                                        phone: profile?.phone || "",
                                        role: row.original.role,
                                        department: (profile as any)?.department || "",
                                        companyName: (profile as any)?.companyName || "",
                                        commission: (profile as any)?.commission || "",
                                        salary: (profile as any)?.salary,
                                        joiningDate: (profile as any)?.joiningDate,
                                        designation: (profile as any)?.designation,
                                        agentId: (profile as any)?.agentId,
                                        address: (profile as any)?.address || "",
                                        password: "",
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
                                        <div className="mr-2 h-4 w-4 rounded-full border-2 border-cyan-600" />
                                        <span className="text-cyan-600">Activate</span>
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

    const router = useRouter();
    const [rowSelection, setRowSelection] = useState({});

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            rowSelection,
        },
    });

    const selectedCount = Object.keys(rowSelection).length;

    return (
        <div className="w-full relative overflow-hidden border rounded-xl bg-background shadow-sm shadow-slate-200/50">
            {selectedCount > 0 && (
                <div className="absolute top-0 inset-x-0 h-12 bg-primary text-primary-foreground flex items-center justify-between px-4 z-20">
                    <span className="text-[11px] font-bold uppercase tracking-wider">{selectedCount} {title.toLowerCase()}s selected</span>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => table.toggleAllRowsSelected(false)} className="h-8 text-[10px] font-bold uppercase text-slate-900 bg-white hover:bg-slate-100">Deselect All</Button>
                        <Button variant="destructive" size="sm" onClick={() => setBulkDeleteDialogOpen(true)} className="h-8 text-[10px] font-bold uppercase">Bulk Delete</Button>
                    </div>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-muted/30 bg-muted/30">
                            {table.getHeaderGroups().map((headerGroup) =>
                                headerGroup.headers.map((header, index) => (
                                    <th
                                        key={header.id}
                                        className={`
                                            py-3 px-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400
                                            ${index === 1 ? "pl-6" : ""}
                                            ${index === headerGroup.headers.length - 1 ? "pr-6 text-right" : ""}
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
                                onClick={(e) => {
                                    const target = e.target as HTMLElement;
                                    if (target.closest('button, a, [role="menuitem"], [role="button"], [role="checkbox"], .select-trigger')) {
                                        return;
                                    }
                                    router.push(prefixPath(`/employees/${row.original.id}`));
                                }}
                                className="group hover:bg-muted/30 transition-colors border-b border-slate-100/50 last:border-0 cursor-pointer"
                            >
                                {row.getVisibleCells().map((cell, index) => (
                                    <td
                                        key={cell.id}
                                        className={`
                                            py-3 px-4 align-middle 
                                            ${index === 1 ? "pl-6" : ""}
                                            ${index === row.getVisibleCells().length - 1 ? "pr-6 text-right" : ""}
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

            {/* Pagination Controls */}
            {pagination && (
                <div className="flex items-center justify-between px-4 py-4 border-t border-border mt-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Rows per page</span>
                        <select
                            value={pagination.pageSize}
                            onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                            className="h-8 w-16 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            {[5, 10, 20, 50].map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="text-xs font-medium text-muted-foreground">
                            Page {pagination.page} of {pagination.totalPages}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
                                disabled={pagination.page <= 1}
                                className="rounded-xl h-8 w-8"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="rounded-xl h-8 w-8"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}


            <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
                <SheetContent className="overflow-y-auto w-full sm:max-w-sm flex flex-col">
                    <SheetHeader>
                        <SheetTitle>Edit {title}</SheetTitle>
                        <SheetDescription>
                            Update {title.toLowerCase()} details.
                        </SheetDescription>
                    </SheetHeader>
                    {editingEmployee && (
                        <div className="mt-6 flex-1 overflow-y-auto">
                            <EmployeeForm
                                employee={editingEmployee}
                                formId="edit-employee-form"
                                onSuccess={() => {
                                    setEditSheetOpen(false);
                                    onUpdate();
                                }}
                            />
                        </div>
                    )}
                    <SheetFooter className="pt-4 border-t gap-2 flex-row justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setEditSheetOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="edit-employee-form"
                        >
                            Save Changes
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
            <ConfirmDialog
                isOpen={bulkDeleteDialogOpen}
                onClose={() => setBulkDeleteDialogOpen(false)}
                onConfirm={handleBulkDelete}
                title={`Bulk Delete ${title}s`}
                description={`Are you sure you want to delete ${selectedCount} selected ${title.toLowerCase()}s? This action cannot be undone.`}
                confirmText="Delete All"
                variant="destructive"
            />
        </div >
    );
}
