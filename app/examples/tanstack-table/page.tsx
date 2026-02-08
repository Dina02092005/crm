'use client';

import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    ColumnDef,
    flexRender,
    SortingState,
    ColumnFiltersState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

// Example data type
interface Driver {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: 'active' | 'inactive' | 'busy';
    rating: number;
}

// Sample data
const sampleDrivers: Driver[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', phone: '+1234567890', status: 'active', rating: 4.8 },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891', status: 'busy', rating: 4.9 },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', phone: '+1234567892', status: 'inactive', rating: 4.5 },
    { id: '4', name: 'Alice Williams', email: 'alice@example.com', phone: '+1234567893', status: 'active', rating: 4.7 },
    { id: '5', name: 'Charlie Brown', email: 'charlie@example.com', phone: '+1234567894', status: 'busy', rating: 4.6 },
];

// Define columns
const columns: ColumnDef<Driver>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
        accessorKey: 'email',
        header: 'Email',
    },
    {
        accessorKey: 'phone',
        header: 'Phone',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('status') as string;
            const statusColors = {
                active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
                busy: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            };
            return (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status as keyof typeof statusColors]}`}>
                    {status}
                </span>
            );
        },
    },
    {
        accessorKey: 'rating',
        header: 'Rating',
        cell: ({ row }) => {
            const rating = row.getValue('rating') as number;
            return <div className="font-medium">⭐ {rating.toFixed(1)}</div>;
        },
    },
];

export default function TanStackTableExample() {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const table = useReactTable({
        data: sampleDrivers,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        state: {
            sorting,
            columnFilters,
        },
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>TanStack Table Example</CardTitle>
                <CardDescription>
                    Advanced table with sorting, filtering, and pagination
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filter */}
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Filter by name..."
                        value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                        onChange={(event) =>
                            table.getColumn('name')?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={
                                                        header.column.getCanSort()
                                                            ? 'flex items-center gap-2 cursor-pointer select-none'
                                                            : ''
                                                    }
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {header.column.getCanSort() && (
                                                        <span>
                                                            {header.column.getIsSorted() === 'asc' ? (
                                                                <FaSortUp />
                                                            ) : header.column.getIsSorted() === 'desc' ? (
                                                                <FaSortDown />
                                                            ) : (
                                                                <FaSort className="opacity-50" />
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && 'selected'}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Page {table.getState().pagination.pageIndex + 1} of{' '}
                        {table.getPageCount()}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
