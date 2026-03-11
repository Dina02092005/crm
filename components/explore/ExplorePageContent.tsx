"use client";

import { ExploreHeader } from "@/components/explore/ExploreHeader";
import { SearchBar } from "@/components/explore/SearchBar";
import { UniversityCard } from "@/components/explore/UniversityCard";
import { CourseCard } from "@/components/explore/CourseCard";
import { MobileBottomNav } from "@/components/explore/MobileBottomNav";

// Mock Data
const UNIVERSITIES = [
    {
        id: "1",
        name: "Algonquin College",
        location: "Ottawa, Canada",
        description: "Algonquin College has campuses in Ottawa, Perth, and Pembroke, Ontario, Canada, as well as K...",
        bannerImage: "/explore/university_banner_1.png",
        logoImage: "/explore/university_logo_1.png",
        appliedCount: 308,
    },
    {
        id: "2",
        name: "McGill University",
        location: "Montreal, Canada",
        description: "McGill University is a public research university in Montreal, Quebec, Canada. Founded in 1821...",
        bannerImage: "/explore/university_banner_1.png",
        logoImage: "/explore/university_logo_1.png",
        appliedCount: 452,
    },
    {
        id: "3",
        name: "University of Toronto",
        location: "Toronto, Canada",
        description: "The University of Toronto is a public research university in Toronto, Ontario, Canada, on the grounds...",
        bannerImage: "/explore/university_banner_1.png",
        logoImage: "/explore/university_logo_1.png",
        appliedCount: 890,
    }
];

const COURSES = [
    {
        id: "1",
        name: "Information Systems",
        level: "Undergraduate",
        university: "McGill University Canada",
        thumbnail: "/explore/course_thumbnail_1.png",
        universityLogo: "/explore/university_logo_1.png",
    },
    {
        id: "2",
        name: "Data Science",
        level: "Postgraduate",
        university: "University of Toronto",
        thumbnail: "/explore/course_thumbnail_1.png",
        universityLogo: "/explore/university_logo_1.png",
    },
    {
        id: "3",
        name: "Artificial Intelligence",
        level: "Postgraduate",
        university: "McGill University",
        thumbnail: "/explore/course_thumbnail_1.png",
        universityLogo: "/explore/university_logo_1.png",
    },
    {
        id: "4",
        name: "Business Administration",
        level: "Undergraduate",
        university: "Algonquin College",
        thumbnail: "/explore/course_thumbnail_1.png",
        universityLogo: "/explore/university_logo_1.png",
    }
];

export function ExplorePageContent() {
    return (
        <div className="min-h-screen bg-white pb-24 md:pb-8">
            <ExploreHeader />
            <SearchBar />

            <div className="max-w-[1200px] mx-auto">
                {/* Universities Section */}
                <section className="mt-4">
                    <div className="flex items-center justify-between px-4 mb-4">
                        <h2 className="text-xl font-extrabold text-[#4A0E0E]">Universities</h2>
                        <button className="text-sm font-bold text-[#AD0000] flex items-center gap-1 hover:opacity-80 transition-opacity">
                            See all
                        </button>
                    </div>

                    {/* Horizontal Scroll on Mobile, Grid on Desktop */}
                    <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-5 px-4 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar md:overflow-x-visible">
                        {UNIVERSITIES.map((uni) => (
                            <UniversityCard key={uni.id} {...uni} />
                        ))}
                    </div>
                </section>

                {/* Courses Section */}
                <section className="mt-8">
                    <div className="flex items-center justify-between px-4 mb-2">
                        <h2 className="text-xl font-extrabold text-[#4A0E0E]">Courses</h2>
                        <button className="text-sm font-bold text-[#AD0000] flex items-center gap-1 hover:opacity-80 transition-opacity">
                            See all
                        </button>
                    </div>

                    <div className="px-4 divide-y divide-slate-100 md:grid md:grid-cols-2 lg:grid-cols-2 md:gap-x-12 md:divide-y-0">
                        {COURSES.map((course) => (
                            <CourseCard key={course.id} {...course} />
                        ))}
                    </div>
                </section>
            </div>

            <MobileBottomNav />

            <style jsx global>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
