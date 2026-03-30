"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
    ChevronUp, 
    ChevronDown, 
    MoreHorizontal, 
    Settings2, 
    GripVertical,
    Eye,
    EyeOff,
    ArrowUpDown
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface ColumnConfig {
    key: string;
    label: string;
    visible: boolean;
    width?: number;
    sortable?: boolean;
    render?: (value: any, row: any) => React.ReactNode;
}

interface ReportsTableProps {
    reportKey: string;
    columns: ColumnConfig[];
    data: any[];
    isLoading?: boolean;
    onSort?: (key: string, direction: 'asc' | 'desc') => void;
}

export function ReportsTable({ reportKey, columns: initialColumns, data, isLoading, onSort }: ReportsTableProps) {
    const [columns, setColumns] = useState<ColumnConfig[]>(initialColumns);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [resizing, setResizing] = useState<{ key: string, startX: number, startWidth: number } | null>(null);

    // Persist column settings
    useEffect(() => {
        const saved = localStorage.getItem(`reports_cols_${reportKey}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Merge with initial to ensure new columns are added if schema changes
                const merged = initialColumns.map(initCol => {
                    const savedCol = parsed.find((p: any) => p.key === initCol.key);
                    return savedCol ? { ...initCol, ...savedCol } : initCol;
                });
                setColumns(merged);
            } catch (e) {
                console.error("Failed to load table settings", e);
            }
        }
    }, [reportKey, initialColumns]);

    const saveSettings = (newCols: ColumnConfig[]) => {
        localStorage.setItem(`reports_cols_${reportKey}`, JSON.stringify(newCols.map(c => ({ key: c.key, visible: c.visible, width: c.width }))));
    };

    const toggleVisibility = (key: string) => {
        const newCols = columns.map(c => c.key === key ? { ...c, visible: !c.visible } : c);
        setColumns(newCols);
        saveSettings(newCols);
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig?.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        onSort?.(key, direction);
    };

    // Column Resizing logic
    const onMouseDown = (e: React.MouseEvent, key: string, currentWidth: number = 150) => {
        setResizing({ key, startX: e.clientX, startWidth: currentWidth });
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!resizing) return;
            const delta = e.clientX - resizing.startX;
            const newWidth = Math.max(80, resizing.startWidth + delta);
            setColumns(prev => prev.map(c => c.key === resizing.key ? { ...c, width: newWidth } : c));
        };

        const onMouseUp = () => {
            if (resizing) {
                saveSettings(columns);
                setResizing(null);
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [resizing, columns]);

    const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);

    return (
        <div className="flex flex-col h-full overflow-hidden bg-card/10 rounded-[1.5rem] border border-border/40">
            {/* Table Controls */}
            <div className="p-3 border-b border-border/40 flex justify-between items-center bg-muted/20">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2">
                        {data.length} Records Found
                    </span>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 rounded-xl text-[10px] font-black uppercase border-border/60">
                            <Settings2 className="h-3.5 w-3.5 mr-2" /> Columns
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border/60 p-2 shadow-2xl">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground px-2 py-1">Custom Columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <ScrollArea className="h-[200px]">
                            {columns.map(col => (
                                <DropdownMenuCheckboxItem
                                    key={col.key}
                                    checked={col.visible}
                                    onCheckedChange={() => toggleVisibility(col.key)}
                                    className="text-[11px] font-bold rounded-lg p-2"
                                >
                                    {col.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </ScrollArea>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* The Table Container */}
            <div className="flex-1 overflow-auto relative custom-scrollbar">
                <Table className="relative border-collapse min-w-full">
                    <TableHeader className="sticky top-0 z-20 bg-muted/50 backdrop-blur-md">
                        <TableRow className="hover:bg-transparent border-b border-border/40">
                            {visibleColumns.map((col) => (
                                <TableHead 
                                    key={col.key} 
                                    style={{ width: col.width || 'auto', minWidth: col.width || 120 }}
                                    className="p-0 border-r border-border/10 relative group"
                                >
                                    <div className="flex items-center justify-between px-4 py-3 h-full">
                                        <div 
                                            className={cn(
                                                "flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground/80 cursor-default flex-1 truncate",
                                                col.sortable && "cursor-pointer hover:text-foreground transition-colors"
                                            )}
                                            onClick={() => col.sortable && handleSort(col.key)}
                                        >
                                            {col.label}
                                            {col.sortable && (
                                                sortConfig?.key === col.key ? (
                                                    sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                                                ) : <ArrowUpDown className="h-3 w-3 opacity-20 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </div>
                                        
                                        {/* Resize Handle */}
                                        <div 
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/40 active:bg-primary transition-colors"
                                            onMouseDown={(e) => onMouseDown(e, col.key, col.width)}
                                        />
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={visibleColumns.length} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-2 animate-pulse">
                                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                        <span className="text-[10px] font-black uppercase text-muted-foreground">Streaming Records...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={visibleColumns.length} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-40">
                                        <EyeOff className="h-10 w-10 text-muted-foreground" />
                                        <span className="text-xs font-bold text-muted-foreground">No data matches your current filters</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, rowIndex) => (
                                <TableRow 
                                    key={row.id || rowIndex} 
                                    className="group border-b border-border/20 hover:bg-muted/10 transition-colors"
                                >
                                    {visibleColumns.map((col) => (
                                        <TableCell 
                                            key={col.key} 
                                            className="px-4 py-3 text-xs border-r border-border/5 font-medium last:border-r-0"
                                            style={{ width: col.width || 'auto', minWidth: col.width || 120 }}
                                        >
                                            {col.render ? col.render(row[col.key], row) : (row[col.key] || '-')}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
            </div>
        </div>
    );
}
