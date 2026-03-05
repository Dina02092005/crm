"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";
import { StudentsTable } from "@/components/dashboard/StudentsTable";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useStudents } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/use-debounce";
import { useRolePath } from "@/hooks/use-role-path";
import { useCountries, useCounselors } from "@/hooks/use-masters";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FilterX } from "lucide-react";

export default function StudentsPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { prefixPath } = useRolePath();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("ALL");
    const [onboardedBy, setOnboardedBy] = useState("ALL");
    const [interestedCountry, setInterestedCountry] = useState("ALL");
    const [intake, setIntake] = useState("ALL");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading, refetch } = useStudents(
        page,
        limit,
        debouncedSearch,
        status === "ALL" ? "" : status,
        onboardedBy === "ALL" ? "" : onboardedBy,
        interestedCountry === "ALL" ? "" : interestedCountry,
        intake === "ALL" ? "" : intake
    );

    const { data: countries } = useCountries();
    const { data: counselors } = useCounselors();

    // Reset page on search/filter changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status, onboardedBy, interestedCountry, intake]);

    const students = data?.students || [];
    const pagination = data?.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 };

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDeleteStudent = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await axios.delete(`/api/students/${deleteId}`);
            toast.success("Student deleted successfully");
            refetch();
        } catch (error) {
            toast.error("Failed to delete student");
        } finally {
            setDeleteId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="p-10">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 p-3 sm:p-4">
            <Card className="border-0 rounded-3xl overflow-hidden bg-card">
                <CardContent className="p-4">
                    {/* Integrated Search and Action Row */}
                    <div className="flex flex-row items-center justify-between mb-2 gap-4">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                            <Input
                                placeholder="Search students..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-[13px] placeholder:text-muted-foreground/40 font-sans w-full"
                            />
                        </div>
                        <Button
                            onClick={() => router.push(prefixPath("/addstudent"))}
                            className="bg-primary hover:bg-primary/90 text-white rounded-xl h-9 px-6 transition-colors shadow-sm font-medium"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Student
                        </Button>
                    </div>

                    {/* Advanced Filters */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <div className="w-full sm:w-[150px]">
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="h-9 text-[12px] rounded-xl bg-muted/50 border-0 focus:ring-0">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Status</SelectItem>
                                    <SelectItem value="PROSPECT">Prospect</SelectItem>
                                    <SelectItem value="APPLICANT">Applicant</SelectItem>
                                    <SelectItem value="ENROLLED">Enrolled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full sm:w-[150px]">
                            <Select value={onboardedBy} onValueChange={setOnboardedBy}>
                                <SelectTrigger className="h-9 text-[12px] rounded-xl bg-muted/50 border-0 focus:ring-0">
                                    <SelectValue placeholder="Onboarded By" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Staff</SelectItem>
                                    {counselors?.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full sm:w-[150px]">
                            <Select value={interestedCountry} onValueChange={setInterestedCountry}>
                                <SelectTrigger className="h-9 text-[12px] rounded-xl bg-muted/50 border-0 focus:ring-0">
                                    <SelectValue placeholder="Country" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Countries</SelectItem>
                                    {countries?.map((c: any) => (
                                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full sm:w-[150px]">
                            <Select value={intake} onValueChange={setIntake}>
                                <SelectTrigger className="h-9 text-[12px] rounded-xl bg-muted/50 border-0 focus:ring-0">
                                    <SelectValue placeholder="Intake" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Intakes</SelectItem>
                                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => (
                                        <SelectItem key={m} value={m}>{m} 2024/25</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {(status !== "ALL" || onboardedBy !== "ALL" || interestedCountry !== "ALL" || intake !== "ALL") && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setStatus("ALL");
                                    setOnboardedBy("ALL");
                                    setInterestedCountry("ALL");
                                    setIntake("ALL");
                                }}
                                className="h-8 text-[11px] text-muted-foreground hover:text-destructive gap-1"
                            >
                                <FilterX className="h-3 w-3" /> Clear filters
                            </Button>
                        )}
                    </div>

                    <StudentsTable
                        data={students}
                        onUpdate={refetch}
                        onDelete={handleDeleteStudent}
                        pagination={{
                            page: pagination.page,
                            totalPages: pagination.totalPages,
                            pageSize: limit,
                            onPageChange: setPage,
                            onPageSizeChange: (newLimit) => {
                                setLimit(newLimit);
                                setPage(1);
                            }
                        }}
                    />
                </CardContent>
            </Card>

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Student"
                description="Are you sure you want to delete this student? This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    );
}
