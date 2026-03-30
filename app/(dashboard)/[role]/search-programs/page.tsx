"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, MapPin, Calendar, Clock, GraduationCap, DollarSign, Bookmark, ArrowRight, ExternalLink } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useRolePath } from "@/hooks/use-role-path";
import { useCountries, useUniversities } from "@/hooks/use-masters";
import { DataTableFilters, FilterConfig } from "@/components/dashboard/DataTableFilters";

// Quick Filter Constants
const QUICK_FILTERS = [
    "Faster Offer TAT",
    "Scholarship Available",
    "High Offer Acceptance Rate",
    "English Proficiency Exam Waiver",
    "Affordable University",
    "Co-op & Built-in Internships",
    "High Job Demand",
    "No Tuition Deposit (US)",
    "Major City",
    "Eligible Non-Collateral Loan",
    "GS Approval with KC (Australia)",
    "Regional University (Australia)",
    "Higher Backlog Acceptance",
    "Low Tuition Deposit",
    "No Interview Required",
    "MBA Programs",
    "Russell Group Universities (UK)",
    "MOI Acceptable",
    "University has own English Test"
];

const EDU_LEVELS = [
    "High School (11th–12th)",
    "UG Diploma / Certificate / Associate Degree",
    "UG",
    "PG Diploma / Certificate",
    "PG",
    "UG+PG (Accelerated) Degree",
    "PhD",
    "Short-term / Summer Programs",
    "Pathway Programs (UG)",
    "Pathway Programs (PG)",
    "Semester Study Abroad",
    "Twinning Programmes (UG)",
    "Twinning Programmes (PG)",
    "English Language Program",
    "Online / Distance Learning",
    "Hybrid"
];

const ENGLISH_TESTS = [
    "PTE", "TOEFL iBT", "IELTS", "DET", "SAT", "ACT", "GRE", "GMAT",
    "Without English Proficiency", "Without GRE", "Without GMAT", "Without Maths"
];

const PROGRAM_FEATURES = [
    "STEM Programs",
    "Application Fee Waiver (up to 100%)",
    "Scholarship Available",
    "With 15 Years of Education",
    "Open Programs"
];

export default function SearchProgramsPage() {
    const { prefixPath } = useRolePath();
    const [q, setQ] = useState("");
    const [intake, setIntake] = useState("All");
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [nationality, setNationality] = useState("India");
    const [studentState, setStudentState] = useState("All");
    const [country, setCountry] = useState("ALL");
    const [universityId, setUniversityId] = useState("ALL");

    // Advanced search states
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [selectedDuration, setSelectedDuration] = useState("All");

    // Pagination
    const [page, setPage] = useState(1);
    const limit = 12;

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["programsSearch", q, intake, year, country, selectedLevels, selectedDuration, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (q) params.append("q", q);
            if (intake !== "All") params.append("intake", intake);
            if (year !== "All") params.append("year", year);
            if (country !== "ALL") params.append("country", country);
            if (universityId !== "ALL") params.append("universityId", universityId);
            if (selectedDuration !== "All") params.append("duration", selectedDuration);
            params.append("page", page.toString());
            params.append("limit", limit.toString());

            selectedLevels.forEach(lvl => params.append("level[]", lvl));

            const res = await axios.get(`/api/programs/search?${params.toString()}`);
            return res.data;
        },
        placeholderData: (previousData) => previousData, // keep old data while fetching
    });
 
    const { data: countries } = useCountries();
    const { data: universities } = useUniversities(country === "ALL" ? undefined : country);

    const handleSearch = () => {
        setPage(1);
        refetch();
    };

    const toggleLevel = (level: string) => {
        setSelectedLevels(prev =>
            prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
        );
        setPage(1);
    };

    const handleQuickFilter = (filter: string) => {
        toast.info(`Quick filter "${filter}" selected. (Implementation pending map to schema)`);
    };

    const programs = data?.data || [];
    const pagination = data?.pagination || { total: 0, totalPages: 1 };

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Search Programs</h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Find and filter university courses and programs globally.</p>
                </div>
            </div>

            {/* Basic Search Top Bar */}
            <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardContent className="p-6">
                    <DataTableFilters
                        onSearch={(val) => { setQ(val); setPage(1); }}
                        searchValue={q}
                        onClear={() => {
                            setQ("");
                            setIntake("All");
                            setYear("All");
                            setCountry("ALL");
                            setUniversityId("ALL");
                            setSelectedLevels([]);
                            setSelectedDuration("All");
                        }}
                        filters={[
                            {
                                key: "country",
                                label: "Country",
                                type: "select",
                                options: countries?.countries?.map((c: any) => ({ label: c.name, value: c.id })) || []
                            },
                            {
                                key: "universityId",
                                label: "University",
                                type: "select",
                                options: universities?.universities?.map((u: any) => ({ label: u.name, value: u.id })) || []
                            },
                            {
                                key: "intake",
                                label: "Intake",
                                type: "select",
                                options: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => ({ label: m, value: m }))
                            },
                            {
                                key: "applyLevel",
                                label: "Level",
                                type: "select",
                                options: EDU_LEVELS.map(l => ({ label: l, value: l }))
                            }
                        ]}
                        values={{
                            country,
                            universityId,
                            intake,
                            applyLevel: selectedLevels[0] || "ALL"
                        }}
                        onFilterChange={(key, value) => {
                            if (key === "country") {
                                setCountry(value);
                                setUniversityId("ALL");
                            }
                            if (key === "universityId") setUniversityId(value);
                            if (key === "intake") setIntake(value);
                            if (key === "applyLevel") {
                                setSelectedLevels(value === "ALL" ? [] : [value]);
                            }
                            setPage(1);
                        }}
                    />

                    <div className="flex items-center gap-2 mb-4">
                        <Button
                            variant={showAdvanced ? "default" : "outline"}
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={`h-9 px-4 rounded-xl border-slate-200 text-xs font-bold gap-2 ${showAdvanced ? "bg-slate-800 text-white hover:bg-slate-700" : ""}`}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            {showAdvanced ? "Hide Advanced Filters" : "Show Advanced Filters"}
                        </Button>
                    </div>

                    {/* Advanced Search Panel */}
                    {showAdvanced && (
                        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 animate-in slide-in-from-top-4 fade-in duration-200">

                            {/* Education Level */}
                            <div className="space-y-3 lg:col-span-2">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-primary" />
                                    Education Level
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin">
                                    {EDU_LEVELS.map(level => (
                                        <div key={level} className="flex items-center space-x-2 bg-slate-50/50 p-2 rounded-lg border border-transparent hover:border-slate-200 transition-colors">
                                            <Checkbox
                                                id={`level-${level}`}
                                                checked={selectedLevels.includes(level)}
                                                onCheckedChange={() => toggleLevel(level)}
                                            />
                                            <label htmlFor={`level-${level}`} className="text-[11px] font-medium leading-none cursor-pointer">
                                                {level}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-800">Duration</h3>
                                    <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                                        <SelectTrigger className="h-10 rounded-xl">
                                            <SelectValue placeholder="Any Duration" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">Any Duration</SelectItem>
                                            {["6 Months", "1 Year", "2 Years", "3 Years", "4 Years"].map(d => (
                                                <SelectItem key={d} value={d}>{d}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-800">Study Area</h3>
                                    <Select defaultValue="All">
                                        <SelectTrigger className="h-10 rounded-xl">
                                            <SelectValue placeholder="All Areas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Areas</SelectItem>
                                            {["Business", "Engineering", "Computer Science", "Health Sciences", "Hospitality", "Arts", "Law"].map(a => (
                                                <SelectItem key={a} value={a}>{a}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* English Test & Features */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-800">English Test</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {ENGLISH_TESTS.slice(0, 4).map(test => (
                                            <Badge key={test} variant="outline" className="cursor-pointer hover:bg-slate-100 font-medium">{test}</Badge>
                                        ))}
                                        <Badge variant="secondary" className="cursor-pointer font-medium">+ More</Badge>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-800">Program Features</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {PROGRAM_FEATURES.slice(0, 2).map(test => (
                                            <Badge key={test} variant="outline" className="cursor-pointer hover:bg-slate-100 font-medium">{test}</Badge>
                                        ))}
                                        <Badge variant="secondary" className="cursor-pointer font-medium">+ More</Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Filters Full Width Row */}
                            <div className="lg:col-span-4 space-y-3 pt-4 border-t border-slate-100">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    ⚡ Quick Filters
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {QUICK_FILTERS.map(filter => (
                                        <Badge
                                            key={filter}
                                            variant="secondary"
                                            className="cursor-pointer bg-amber-50 text-amber-900 border border-amber-200/50 hover:bg-amber-100 font-semibold px-3 py-1 text-[10px]"
                                            onClick={() => handleQuickFilter(filter)}
                                        >
                                            {filter}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Results Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">
                        {isLoading ? "Searching..." : `${pagination.total} Programs Found`}
                    </h2>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <Card key={i} className="rounded-3xl border-none shadow-sm h-[320px] animate-pulse bg-slate-50" />
                        ))}
                    </div>
                ) : programs.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-700">No programs found</h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2">Try adjusting your search criteria, removing some filters, or trying different keywords.</p>
                        <Button variant="outline" onClick={() => { setQ(""); setIntake("All"); setYear("All"); setSelectedLevels([]); setPage(1); }} className="mt-6 rounded-xl">
                            Reset All Filters
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {programs.map((program: any) => (
                                <Card key={program.id} className="rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white flex flex-col h-full">
                                    <CardContent className="p-0 flex flex-col h-full relative">
                                        {/* Colored Header Banner */}
                                        <div className="h-2 w-full bg-gradient-to-r from-primary to-blue-400"></div>

                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start gap-4 mb-3">
                                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 font-bold px-2.5 py-1 text-[10px]">
                                                    {program.level || "Degree"}
                                                </Badge>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-500 rounded-full -mt-2 -mr-2">
                                                    <Bookmark className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <h3 className="font-bold text-lg text-slate-900 leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                                {program.name}
                                            </h3>

                                            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium mb-6">
                                                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                <span className="truncate">{program.university?.name}</span>
                                                <span className="text-slate-300">•</span>
                                                <span className="truncate">{program.university?.country?.name}</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mt-auto">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase">
                                                        <Clock className="h-3 w-3" /> Duration
                                                    </div>
                                                    <p className="font-semibold text-slate-800 text-sm">{program.durationMonths ? `${program.durationMonths} Months` : 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase">
                                                        <DollarSign className="h-3 w-3" /> Tuition
                                                    </div>
                                                    <p className="font-semibold text-emerald-600 text-sm truncate">{program.tuitionFee || 'Check Site'}</p>
                                                </div>
                                                <div className="space-y-1 col-span-2">
                                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase">
                                                        <Calendar className="h-3 w-3" /> Next Intakes
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {program.intakes?.slice(0, 3).map((i: any) => (
                                                            <Badge key={i.id} variant="secondary" className="text-[10px] bg-slate-100 text-slate-600">
                                                                {i.month}
                                                            </Badge>
                                                        )) || <span className="text-xs text-slate-400 italic">No intake data</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-3 mt-auto">
                                            <Button variant="outline" className="flex-1 rounded-xl text-xs font-bold border-slate-200" onClick={() => toast.info("View Details coming soon")}>
                                                Details <ExternalLink className="ml-1 h-3 w-3 text-slate-400" />
                                            </Button>
                                            <Button className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold" onClick={() => toast.success("Started application draft!")}>
                                                Apply <ArrowRight className="ml-1 h-3 w-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="rounded-xl border-slate-200"
                                >
                                    Previous
                                </Button>
                                <span className="text-sm font-medium text-slate-600 px-4">
                                    Page {page} of {pagination.totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page === pagination.totalPages}
                                    className="rounded-xl border-slate-200"
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

