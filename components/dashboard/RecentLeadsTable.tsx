"use client";

import {
    useReactTable,
    getCoreRowModel,
    ColumnDef,
    flexRender,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface RecentLead extends Lead {
    customer?: {
        name: string;
        email?: string;
        phone?: string;
    } | null;
}

const columns: ColumnDef<RecentLead>[] = [
    {
        accessorKey: "name",
        header: "Lead Name",
        cell: ({ row }) => (
            <div>
                <p className="text-sm font-semibold text-foreground">
                    {row.getValue("name")}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                    {row.original.phone}
                </p>
            </div>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <Badge variant="outline" className={`
                    text-[10px] font-medium uppercase
                    ${status === "NEW" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                        status === "CONVERTED" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                            status === "LOST" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                                "bg-gray-500/10 text-gray-600 border-gray-500/20"}
                `}>
                    {status}
                </Badge>
            );
        },
    },
    {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => (
            <div className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(row.original.updatedAt), { addSuffix: true })}
            </div>
        ),
    },
];

export function RecentLeadsTable({ data }: { data: RecentLead[] }) {
    const router = useRouter();
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="w-full overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-muted/50 border-b border-border">
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
                    <tbody>
                        {table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    onClick={() => router.push(`/leads/${row.original.id}`)}
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
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="h-24 text-center text-muted-foreground text-sm">
                                    No recent leads found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
