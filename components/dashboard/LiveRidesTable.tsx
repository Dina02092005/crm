"use client";

import {
    useReactTable,
    getCoreRowModel,
    ColumnDef,
    flexRender,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

interface LiveRide {
    customerName: string;
    customerPhone: string;
    customerImage: string;
    bookingId: string;
    driverName: string;
    startLocation: string;
    endLocation: string;
    status: "Completed" | "In Progress" | "Cancelled";
    paymentMode: string;
    amount: string;
}

const columns: ColumnDef<LiveRide>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                checked={table.getIsAllPageRowsSelected()}
                onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                checked={row.getIsSelected()}
                onChange={(e) => row.toggleSelected(!!e.target.checked)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "customerName",
        header: "Customer Name",
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                        src={row.original.customerImage}
                        alt={row.getValue("customerName")}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-900">
                        {row.getValue("customerName")}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                        {row.original.customerPhone}
                    </p>
                </div>
            </div>
        ),
    },
    {
        accessorKey: "bookingId",
        header: "Booking ID",
        cell: ({ row }) => (
            <div className="text-sm font-medium text-gray-900">
                {row.getValue("bookingId")}
            </div>
        ),
    },
    {
        accessorKey: "driverName",
        header: "Driver Name",
        cell: ({ row }) => (
            <div className="text-sm text-gray-900">
                {row.getValue("driverName")}
            </div>
        ),
    },
    {
        accessorKey: "startLocation",
        header: "Start Location",
        cell: ({ row }) => (
            <div className="text-sm font-medium text-gray-700">
                {row.getValue("startLocation")}
            </div>
        ),
    },
    {
        accessorKey: "endLocation",
        header: "End Location",
        cell: ({ row }) => (
            <div className="text-sm font-medium text-gray-700">
                {row.getValue("endLocation")}
            </div>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <div className={`
                    inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                    ${status === "Completed" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600"}
                `}>
                    {status}
                </div>
            );
        },
    },
    {
        accessorKey: "paymentMode",
        header: "Payment Mode",
        cell: ({ row }) => (
            <div className="text-sm text-gray-900">
                {row.getValue("paymentMode")}
            </div>
        ),
    },
    {
        accessorKey: "amount",
        header: "Trip Amount",
        cell: ({ row }) => (
            <div className="text-sm font-bold text-gray-900">
                {row.getValue("amount")}
            </div>
        ),
    },
];

const mockData: LiveRide[] = [
    {
        customerName: "Corey",
        customerPhone: "+91 9876543210",
        customerImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
        bookingId: "BK10245",
        driverName: "Cooper",
        startLocation: "R S Puram",
        endLocation: "Ganthipuram",
        status: "Completed",
        paymentMode: "Online",
        amount: "₹168",
    },
    {
        customerName: "Alfonso",
        customerPhone: "+91 9876543210",
        customerImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=60",
        bookingId: "BK10245",
        driverName: "Abram",
        startLocation: "R S Puram",
        endLocation: "Ganthipuram",
        status: "Completed",
        paymentMode: "Online",
        amount: "₹168",
    },
    {
        customerName: "Nolan",
        customerPhone: "+91 9876543210",
        customerImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60",
        bookingId: "BK10245",
        driverName: "Corey",
        startLocation: "R S Puram",
        endLocation: "Ganthipuram",
        status: "Completed",
        paymentMode: "Online",
        amount: "₹168",
    },
    {
        customerName: "Nolan",
        customerPhone: "+91 9876543210",
        customerImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60",
        bookingId: "BK10245",
        driverName: "Carter",
        startLocation: "R S Puram",
        endLocation: "Ganthipuram",
        status: "Completed",
        paymentMode: "Online",
        amount: "₹168",
    },
    {
        customerName: "Craig",
        customerPhone: "+91 9876543210",
        customerImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
        bookingId: "BK10245",
        driverName: "Lincoln",
        startLocation: "R S Puram",
        endLocation: "Ganthipuram",
        status: "Completed",
        paymentMode: "Online",
        amount: "₹168",
    },
];

export function LiveRidesTable() {
    const table = useReactTable({
        data: mockData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="w-full overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-[#F9FAFB] border-none rounded-lg">
                            {table.getHeaderGroups().map((headerGroup) =>
                                headerGroup.headers.map((header, index) => (
                                    <th
                                        key={header.id}
                                        className={`
                                            py-4 px-4 text-left text-sm font-semibold text-gray-500
                                            ${index === 0 ? "rounded-l-xl pl-6" : ""}
                                            ${index === headerGroup.headers.length - 1 ? "rounded-r-xl pr-6" : ""}
                                        `}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </th>
                                ))
                            )}
                        </tr>
                    </thead>
                    <tbody className="space-y-4">
                        {/* Spacer row to create gap between header and body */}
                        <tr className="h-4"></tr>
                        {table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                className="group hover:bg-gray-50/50 transition-colors border-b border-dashed border-gray-100 last:border-0"
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
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
