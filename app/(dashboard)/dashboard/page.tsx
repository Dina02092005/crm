"use client";

import { StatsCard } from "@/components/dashboard/StatsCard";
import { LiveRidesTable } from "@/components/dashboard/LiveRidesTable";
import { Car, MapPin, Users, IndianRupee } from "lucide-react";

const driversList = [
    { name: "Maharrm Hasanli", phone: "+91 9876543210" },
    { name: "Maharrm Hasanli", phone: "+91 9876543210" },
    { name: "Maharrm Hasanli", phone: "+91 9876543210" },
    { name: "Maharrm Hasanli", phone: "+91 9876543210" },
    { name: "Maharrm Hasanli", phone: "+91 9876543210" },
];

const liveRidesList = [
    { name: "Maharrm Hasanli", phone: "+91 9876543210", tripId: "#TRP10245", rideNo: "10245" },
    { name: "Maharrm Hasanli", phone: "+91 9876543210", tripId: "#TRP10245", rideNo: "10245" },
    { name: "Maharrm Hasanli", phone: "+91 9876543210", tripId: "#TRP10245", rideNo: "10245" },
    { name: "Maharrm Hasanli", phone: "+91 9876543210", tripId: "#TRP10245", rideNo: "10245" },
];

export default function DashboardPage() {
    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* LEFT COLUMN - Stats & Live Rides List */}
            {/* Adjusted widths for better responsiveness: lg:340px, xl:400px, 2xl:460px */}
            <div className="w-full lg:w-[340px] xl:w-[400px] 2xl:w-[460px] shrink-0 space-y-6 lg:space-y-8">
                {/* Stats Grid */}
                <div>
                    <h2 className="text-[18px] font-medium leading-none tracking-normal font-sans text-foreground mb-4">Dashboard</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <StatsCard
                            title="Total Drivers"
                            value="56"
                            icon={<Car className="w-5 h-5" />}
                            iconBgColor="bg-emerald-50 text-emerald-600"
                        />
                        <StatsCard
                            title="Total Trips"
                            value="4578"
                            icon={<MapPin className="w-5 h-5" />}
                            iconBgColor="bg-emerald-50 text-emerald-600"
                        />
                        <StatsCard
                            title="Active Customers"
                            value="78%"
                            icon={<Users className="w-5 h-5" />}
                            iconBgColor="bg-emerald-50 text-emerald-600"
                        />
                        <StatsCard
                            title="Today's Revenue"
                            value="₹48500"
                            icon={<IndianRupee className="w-5 h-5" />}
                            iconBgColor="bg-emerald-50 text-emerald-600"
                        />
                    </div>
                </div>

                {/* Left Side Live Rides List */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[18px] font-medium leading-none tracking-normal font-sans text-foreground">Live Rides</h2>
                        <button className="text-sm font-semibold text-primary hover:opacity-80 transition-opacity flex items-center gap-1">
                            View All <span className="text-lg leading-none">›</span>
                        </button>
                    </div>
                    {/* Removed border, updated bg to match Figma light gray blocks */}
                    <div className="space-y-3">
                        {liveRidesList.map((ride, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                                <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0 overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&auto=format&fit=crop&q=60" className="w-full h-full object-cover" alt="Driver" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-foreground truncate">{ride.name}</h4>
                                    <p className="text-xs text-muted-foreground">{ride.phone}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-medium text-emerald-600">Trip ID: {ride.tripId}</p>
                                    <p className="text-[10px] text-muted-foreground">Ride No: {ride.rideNo}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN - Map, Drivers, Table */}
            <div className="flex-1 min-w-0 space-y-8">
                {/* Row 1: Map & Drivers List */}
                <div className="flex flex-col xl:flex-row gap-6">
                    {/* Map Section */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[18px] font-medium leading-none tracking-normal font-sans text-foreground">Online Drivers</h2>
                            <button className="text-sm font-semibold text-primary hover:opacity-80 transition-opacity flex items-center gap-1">
                                View All <span className="text-lg leading-none">›</span>
                            </button>
                        </div>
                        <div className="w-full h-[400px] bg-gray-100 rounded-2xl overflow-hidden relative">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d387193.30596073366!2d-74.25986548248684!3d40.69714941932609!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sin!4v1234567890"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="grayscale-20 contrast-[1.1]"
                            ></iframe>
                        </div>
                    </div>

                    {/* Drivers List Sidebar */}
                    <div className="w-full xl:w-[280px] 2xl:w-[320px] shrink-0">
                        <h2 className="text-sm font-bold text-foreground mb-4">Drivers name</h2>
                        <div className="space-y-3">
                            {driversList.map((driver, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                                    <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0 overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60" className="w-full h-full object-cover" alt="Driver" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground">{driver.name}</h4>
                                        <p className="text-xs text-muted-foreground">{driver.phone}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Row 2: Live Rides Table */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[18px] font-medium leading-none tracking-normal font-sans text-foreground">Live Rides</h2>
                        <button className="text-sm font-semibold text-primary hover:opacity-80 transition-opacity flex items-center gap-1">
                            View All <span className="text-lg leading-none">›</span>
                        </button>
                    </div>
                    <LiveRidesTable />
                </div>
            </div>
        </div>
    );
}
