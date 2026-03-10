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
import { Search, Globe, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCountriesWithUniversityCount } from "@/hooks/use-masters";
import { useDebounce } from "@/hooks/use-debounce";

export default function UniversitiesCountryListPage() {
    const router = useRouter();
    const params = useParams();
    const role = params.role as string;

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(25);

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading } = useCountriesWithUniversityCount(page, limit, debouncedSearch);

    const countries = data?.countries || [];
    const pagination = data?.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 };

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Masters &gt; Universities</h1>
                <p className="text-sm text-muted-foreground">Select a country to manage its universities.</p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search country..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Country Name</TableHead>
                            <TableHead>Country Code</TableHead>
                            <TableHead>Universities</TableHead>
                            <TableHead className="w-[150px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <span>Loading countries...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : countries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Globe className="h-8 w-8 opacity-20" />
                                        <span>No countries found.</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            countries.map((country: any, idx: number) => (
                                <TableRow
                                    key={country.id}
                                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                                    onClick={() => router.push(`/${role}/master/universities/${country.id}`)}
                                >
                                    <TableCell className="font-medium text-muted-foreground">
                                        {(page - 1) * limit + idx + 1}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <Globe className="h-4 w-4" />
                                            </div>
                                            <span className="font-semibold text-base">{country.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {country.code ? (
                                            <Badge variant="outline" className="font-mono bg-muted/50">
                                                {country.code}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground italic text-xs">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-medium">
                                            {country.universityCount} Universities
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="group-hover:text-primary">
                                            Manage
                                            <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-4 border-t bg-muted/20">
                        <p className="text-sm text-muted-foreground">
                            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} countries
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
