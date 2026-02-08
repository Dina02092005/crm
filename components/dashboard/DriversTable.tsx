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
import { MoreHorizontal, Eye, Pencil, Trash2, Mail, Phone, Car } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import DriverForm from "@/components/forms/DriverForm";
import { Driver } from "@/types/api";

interface DriversTableProps {
    data: Driver[];
    onUpdate: () => void;
    onDelete: (id: string) => void;
}

export function DriversTable({ data, onUpdate, onDelete }: DriversTableProps) {
    const [editSheetOpen, setEditSheetOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState<Driver | undefined>(undefined);

    const columns: ColumnDef<Driver>[] = [
        {
            accessorKey: "name",
            header: "Driver",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                        {row.original.firstName?.charAt(0) || row.original.phone?.charAt(0)}
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">{row.original.firstName} {row.original.lastName}</p>
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
                        <Phone className="h-3.5 w-3.5" />
                        {row.original.phone}
                    </div>
                    {row.original.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-3.5 w-3.5" />
                            {row.original.email}
                        </div>
                    )}
                </div>
            ),
        },
        {
            id: "vehicle",
            header: "Vehicle",
            cell: ({ row }) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                        <Car className="h-3.5 w-3.5" />
                        {row.original.vehicleModel}
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="text-[10px] font-normal text-gray-500 border-gray-200">
                            {row.original.vehicleType}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-normal text-gray-500 border-gray-200">
                            {row.original.vehiclePlate}
                        </Badge>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "vehicleColor",
            header: "Color",
            cell: ({ row }) => (
                <span className="text-sm text-gray-600 capitalize">
                    {row.original.vehicleColor}
                </span>
            ),
        },
        {
            accessorKey: "licenseNumber",
            header: "License",
            cell: ({ row }) => (
                <span className="text-sm text-gray-600 font-mono">
                    {row.original.licenseNumber}
                </span>
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
                                    setEditingDriver(row.original);
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
                        <SheetTitle>Edit Driver</SheetTitle>
                        <SheetDescription>
                            Update driver details.
                        </SheetDescription>
                    </SheetHeader>
                    {editingDriver && (
                        <div className="mt-6">
                            <DriverForm
                                driver={editingDriver}
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
