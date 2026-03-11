"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Globe, ChevronRight, Loader2, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCountriesWithUniversityCount } from "@/hooks/use-masters";
import { useDebounce } from "@/hooks/use-debounce";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function UniversitiesCountryListPage() {
    const router = useRouter();
    const params = useParams();
    const role = params.role as string;

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading } = useCountriesWithUniversityCount(page, limit, debouncedSearch);

    const countries = data?.countries || [];
    const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
            {/* Header section with minimal design */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Universities</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Select a country to explore and manage affiliated universities.
                    </p>
                </div>
            </div>

            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filter countries..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-10 w-full bg-background"
                    />
                </div>
            </div>

            {/* Data Table Section */}
            <div className="bg-background rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-12 px-4 border-r text-[10px] font-black uppercase tracking-widest text-muted-foreground">#</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Country Name</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ISO Code</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Institutions</TableHead>
                            <TableHead className="text-right px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Retrieving Data...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : countries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Globe className="h-8 w-8 text-muted-foreground/20" />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-semibold">No countries located</span>
                                            <span className="text-xs text-muted-foreground">Try refining your search parameters.</span>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            countries.map((country: any, idx: number) => (
                                <TableRow
                                    key={country.id}
                                    className="group cursor-pointer hover:bg-muted/30 border-b last:border-0 transition-colors"
                                    onClick={() => router.push(`/${role}/master/universities/${country.id}`)}
                                >
                                    <TableCell className="px-4 border-r font-mono text-[10px] text-muted-foreground/60">
                                        {(page - 1) * limit + idx + 1}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground border group-hover:border-primary/20 group-hover:bg-primary/5 transition-all">
                                                <Globe className="h-3.5 w-3.5" />
                                            </div>
                                            <span className="font-semibold text-sm tracking-tight">{country.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {country.code ? (
                                            <code className="px-2 py-0.5 rounded bg-muted/50 border text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                {country.code}
                                            </code>
                                        ) : (
                                            <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold">{country.universityCount}</span>
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider tabular-nums opacity-50">Units</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-4">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 text-[10px] font-black uppercase tracking-wider group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                                        >
                                            Inspect
                                            <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Enhanced Pagination Controls */}
                <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/5 min-h-[56px]">
                    <div className="flex items-center gap-6">
                        <div className="text-[11px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                            Page {pagination.page} / {pagination.totalPages}
                        </div>
                        <div className="flex items-center gap-2 border-l pl-6 border-muted/30">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Show</span>
                            <Select
                                value={limit.toString()}
                                onValueChange={(v) => {
                                    setLimit(Number(v));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="h-7 w-[70px] text-[10px] font-bold border-muted/30 bg-background focus:ring-1 focus:ring-primary/20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="min-w-[70px]">
                                    {[10, 20, 50, 100].map((size) => (
                                        <SelectItem key={size} value={size.toString()} className="text-[10px] font-bold">
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[10px] font-black uppercase px-4 border-muted/30 hover:bg-muted/50 transition-colors"
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                        >
                            <ChevronLeft className="h-3.5 w-3.5 mr-1.5" /> Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[10px] font-black uppercase px-4 border-muted/30 hover:bg-muted/50 transition-colors"
                            disabled={page >= pagination.totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            Next <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
