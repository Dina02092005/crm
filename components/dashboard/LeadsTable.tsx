"use client";

import {
    useReactTable,
    getCoreRowModel,
    ColumnDef,
    flexRender,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { MoreHorizontal, Eye, Pencil, Trash2, UserPlus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AssignLeadDialog } from "./AssignLeadDialog";
import { useSession } from "next-auth/react";

import axios from "axios";
import { toast } from "sonner";
import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LeadForm } from "./LeadForm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Lead {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    source: string;
    status: string;
    temperature: string;
    createdAt: string;
    assignments?: {
        employee: {
            name: string;
            email: string;
        }
    }[];
}

const statusOptions = ["NEW", "ASSIGNED", "IN_PROGRESS", "FOLLOW_UP", "CONVERTED", "LOST"];
const tempOptions = ["COLD", "WARM", "HOT"];

export function LeadsTable({ data, onUpdate }: { data: Lead[], onUpdate: () => void }) {
    const { data: session } = useSession() as any;
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<{ id: string; name: string } | null>(null);
    const [editSheetOpen, setEditSheetOpen] = useState(false);
    const [editingLeadId, setEditingLeadId] = useState<string | null>(null);

    // Delete Dialog State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

    const handleUpdate = async (id: string, field: string, value: string) => {
        try {
            await axios.patch(`/api/leads/${id}`, { [field]: value });
            toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated`);
            onUpdate();
        } catch (error) {
            toast.error("Failed to update lead");
        }
    };

    const handleDeleteClick = (id: string) => {
        setLeadToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!leadToDelete) return;

        try {
            await axios.delete(`/api/leads/${leadToDelete}`);
            toast.success("Lead deleted successfully");
            onUpdate();
        } catch (error) {
            toast.error("Failed to delete lead");
        } finally {
            setDeleteDialogOpen(false);
            setLeadToDelete(null);
        }
    };

    const handleAssignClick = (lead: Lead) => {
        setSelectedLead({ id: lead.id, name: lead.name });
        setAssignDialogOpen(true);
    };

    const columns: ColumnDef<Lead>[] = [
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => (
                <div>
                    <p className="text-sm font-semibold text-gray-900">{row.getValue("name")}</p>
                    <p className="text-xs text-muted-foreground">{row.original.phone}</p>
                </div>
            ),
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => (
                <div className="text-sm text-gray-600">{row.getValue("email") || "N/A"}</div>
            ),
        },
        {
            accessorKey: "source",
            header: "Source",
            cell: ({ row }) => (
                <Badge variant="outline" className="text-[10px] font-medium uppercase">
                    {row.getValue("source")}
                </Badge>
            ),
        },
        {
            accessorKey: "assignedTo",
            header: "Assigned To",
            cell: ({ row }) => {
                const assignments = row.original.assignments;
                const assignee = assignments && assignments.length > 0 ? assignments[0].employee.name : "Unassigned";
                return (
                    <div className="text-sm font-medium text-gray-700">
                        {assignee}
                    </div>
                );
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                const [isOpen, setIsOpen] = useState(false);

                return (
                    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                        <DropdownMenuTrigger asChild onMouseEnter={() => setIsOpen(true)}>
                            <div className={`
                                cursor-pointer hover:bg-gray-100 transition-all
                                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
                                ${status === "NEW" ? "text-blue-600" :
                                    status === "CONVERTED" ? "text-teal-600" :
                                        status === "LOST" ? "text-red-500" : "text-gray-600"}
                            `}>
                                <div className={`w-1.5 h-1.5 rounded-full 
                                    ${status === "NEW" ? "bg-blue-600" :
                                        status === "CONVERTED" ? "bg-teal-600" :
                                            status === "LOST" ? "bg-red-500" : "bg-gray-400"}
                                `} />
                                {status}
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent onMouseLeave={() => setIsOpen(false)}>
                            {statusOptions.map((opt) => (
                                <DropdownMenuItem
                                    key={opt}
                                    onClick={() => handleUpdate(row.original.id, "status", opt)}
                                    className={opt === status ? "bg-teal-50 text-teal-700 font-medium" : ""}
                                >
                                    {opt}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
        {
            accessorKey: "temperature",
            header: "Temp",
            cell: ({ row }) => {
                const temp = row.getValue("temperature") as string;
                const [isOpen, setIsOpen] = useState(false);

                return (
                    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                        <DropdownMenuTrigger asChild onMouseEnter={() => setIsOpen(true)}>
                            <div className={`
                                cursor-pointer hover:bg-gray-100 transition-all
                                inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
                                ${temp === "HOT" ? "border-orange-200 text-orange-600" :
                                    temp === "WARM" ? "border-yellow-200 text-yellow-600 ml-3" : "border-blue-200 text-blue-600 ml-3"}
                            `}>
                                {temp}
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent onMouseLeave={() => setIsOpen(false)}>
                            {tempOptions.map((opt) => (
                                <DropdownMenuItem
                                    key={opt}
                                    onClick={() => handleUpdate(row.original.id, "temperature", opt)}
                                    className={opt === temp ? "bg-teal-50 text-teal-700 font-medium" : ""}
                                >
                                    {opt}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    {(session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER") && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAssignClick(row.original)}
                            className="h-8 w-8 p-0 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                            title="Assign Lead"
                        >
                            <UserPlus className="h-4 w-4" />
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            {(session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER") && (
                                <DropdownMenuItem
                                    onClick={() => handleAssignClick(row.original)}
                                    className="cursor-pointer text-teal-600"
                                >
                                    <UserPlus className="mr-2 h-4 w-4" /> Assign Lead
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                                <Link href={`/leads/${row.original.id}`} className="cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" /> View
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    setEditingLeadId(row.original.id);
                                    setEditSheetOpen(true);
                                }}
                                className="cursor-pointer"
                            >
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 cursor-pointer"
                                onClick={() => handleDeleteClick(row.original.id)}
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

            <AssignLeadDialog
                isOpen={assignDialogOpen}
                onClose={() => setAssignDialogOpen(false)}
                leadId={selectedLead?.id || null}
                leadName={selectedLead?.name || null}
                onAssign={onUpdate}
            />

            <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
                <SheetContent className="overflow-y-auto w-full sm:max-w-sm">
                    <SheetHeader>
                        <SheetTitle>Edit Lead</SheetTitle>
                        <SheetDescription>
                            Update the lead details below.
                        </SheetDescription>
                    </SheetHeader>
                    {editingLeadId && (
                        <LeadForm
                            leadId={editingLeadId}
                            onSuccess={() => {
                                setEditSheetOpen(false);
                                onUpdate();
                            }}
                        />
                    )}
                </SheetContent>
            </Sheet>

            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setLeadToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Lead"
                description="Are you sure you want to delete this lead? This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    );
}
