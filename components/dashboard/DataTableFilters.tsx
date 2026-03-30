"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterConfig {
    key: string;
    label: string;
    type: "select" | "input" | "date";
    options?: { label: string; value: string }[];
    placeholder?: string;
    width?: string;
}

interface DataTableFiltersProps {
    filters: FilterConfig[];
    values: Record<string, string>;
    onFilterChange: (key: string, value: string) => void;
    onClear: () => void;
    onSearch?: (value: string) => void;
    searchValue?: string;
    className?: string;
}

export function DataTableFilters({
    filters,
    values,
    onFilterChange,
    onClear,
    onSearch,
    searchValue = "",
    className
}: DataTableFiltersProps) {
    const hasActiveFilters = Object.values(values).some(v => v !== "" && v !== "ALL") || searchValue !== "";

    return (
        <div className={cn("flex flex-wrap gap-2 items-center py-3", className)}>
            {onSearch && (
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search..."
                        value={searchValue}
                        onChange={(e) => onSearch(e.target.value)}
                        className="h-9 pl-9 bg-white border-slate-200 focus-visible:ring-primary/20 rounded-lg text-sm"
                    />
                </div>
            )}

            {filters.map((filter) => (
                <div key={filter.key} className={cn("min-w-[140px]", filter.width)}>
                    {filter.type === "select" ? (
                        <Select
                            value={values[filter.key] || "ALL"}
                            onValueChange={(value) => onFilterChange(filter.key, value)}
                        >
                            <SelectTrigger className="h-9 bg-white border-slate-200 focus:ring-primary/20 rounded-lg text-sm">
                                <SelectValue placeholder={filter.label} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All {filter.label}s</SelectItem>
                                {filter.options?.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : filter.type === "input" ? (
                        <Input
                            placeholder={filter.placeholder || filter.label}
                            value={values[filter.key] || ""}
                            onChange={(e) => onFilterChange(filter.key, e.target.value)}
                            className="h-9 bg-white border-slate-200 focus-visible:ring-primary/20 rounded-lg text-sm"
                        />
                    ) : null}
                </div>
            ))}

            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    onClick={onClear}
                    className="h-9 px-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors text-xs font-medium gap-1.5"
                >
                    <X className="h-3.5 w-3.5" />
                    Reset
                </Button>
            )}
        </div>
    );
}
