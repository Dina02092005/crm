"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Settings2, Globe, GraduationCap, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const MODULE_CONFIG = {
    COUNTRIES: { label: "Countries", icon: Globe, description: "Manage which countries are available for applications." },
    WEBSITES: { label: "Websites", icon: CheckCircle2, description: "Toggle website sources for lead tracking." },
    QUALIFICATIONS: { label: "Qualifications", icon: GraduationCap, description: "Manage available academic qualification levels." },
    APPLY_LEVELS: { label: "Apply Levels", icon: Settings2, description: "Degree levels like Bachelor, Master, etc." },
    APP_STATUS_MASTER: { label: "App Statuses", icon: CheckCircle2, description: "Manage application workflow statuses." },
    VISA_STATUS_MASTER: { label: "Visa Statuses", icon: ShieldCheck, description: "Manage visa application process stages." },
    USER_ROLES: { label: "User Roles", icon: ShieldCheck, description: "Toggle system-wide user roles (Careful with these)." },
};

export default function ControlPanelPage() {
    const { data: session } = useSession() as any;
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [data, setData] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("COUNTRIES");

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/functions");
            if (res.ok) {
                setData(await res.json());
            } else {
                toast.error("Failed to fetch system functions");
            }
        } catch (error) {
            toast.error("An error occurred while fetching data");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggle = async (model: string, id: string, currentStatus: boolean) => {
        setIsUpdating(id);
        try {
            const res = await fetch("/api/admin/functions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model, id, isActive: !currentStatus }),
            });

            if (res.ok) {
                toast.success("Updated successfully");
                // Update local state
                const key = model.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                // Handle plural mapping if necessary, but my API returns specific keys
                const pluralKeys: any = {
                    COUNTRIES: 'countries',
                    WEBSITES: 'websites',
                    QUALIFICATIONS: 'qualifications',
                    APPLY_LEVELS: 'applyLevels',
                    APP_STATUS_MASTER: 'appStatuses',
                    VISA_STATUS_MASTER: 'visaStatuses',
                    USER_ROLES: 'roles'
                };
                const dataKey = pluralKeys[model];
                
                setData((prev: any) => ({
                    ...prev,
                    [dataKey]: prev[dataKey].map((item: any) =>
                        item.id === id ? { ...item, isActive: !currentStatus } : item
                    ),
                }));
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to update");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsUpdating(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Loading Control Panel...</p>
            </div>
        );
    }

    if (!data) return null;

    const filteredItems = (items: any[]) => {
        return items.filter(item => 
            item.name.toLowerCase().includes(search.toLowerCase())
        );
    };

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">System Control Panel</h1>
                <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em]">Manage application functions and master data availability</p>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearch(""); }} className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm py-4 z-10 border-b">
                    <TabsList className="bg-muted/50 p-1 rounded-2xl h-auto flex flex-wrap gap-1">
                        {Object.entries(MODULE_CONFIG).map(([key, config]) => (
                            <TabsTrigger 
                                key={key} 
                                value={key}
                                className="rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm"
                            >
                                <config.icon className="h-3.5 w-3.5 mr-2" />
                                {config.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input 
                            placeholder="Search items..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-10 rounded-xl pl-9 border-muted bg-muted/20 text-xs font-bold"
                        />
                    </div>
                </div>

                {Object.entries(MODULE_CONFIG).map(([key, config]) => {
                    const pluralKeys: any = {
                        COUNTRIES: 'countries',
                        WEBSITES: 'websites',
                        QUALIFICATIONS: 'qualifications',
                        APPLY_LEVELS: 'applyLevels',
                        APP_STATUS_MASTER: 'appStatuses',
                        VISA_STATUS_MASTER: 'visaStatuses',
                        USER_ROLES: 'roles'
                    };
                    const items = data[pluralKeys[key]] || [];
                    const filtered = filteredItems(items);

                    return (
                        <TabsContent key={key} value={key} className="mt-0">
                            <Card className="border-0 shadow-none bg-transparent">
                                <CardHeader className="px-0 pt-0">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                            <config.icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black uppercase tracking-tight">{config.label}</CardTitle>
                                            <CardDescription className="text-xs font-medium">{config.description}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {filtered.length === 0 ? (
                                            <div className="col-span-full py-20 text-center opacity-40">
                                                <p className="text-sm font-black uppercase tracking-widest italic">No items found</p>
                                            </div>
                                        ) : (
                                            filtered.map((item: any) => (
                                                <Card key={item.id} className={`rounded-2xl border transition-all duration-300 ${item.isActive ? 'border-primary/20 bg-primary/5 shadow-sm' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                                                    <CardContent className="p-4 flex items-center justify-between gap-4">
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                                                            <div className="mt-1 flex items-center gap-2">
                                                                <Badge variant={item.isActive ? "default" : "outline"} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg ${item.isActive ? 'bg-emerald-500 hover:bg-emerald-600 border-transparent text-white' : 'text-slate-400'}`}>
                                                                    {item.isActive ? 'Active' : 'Hidden'}
                                                                </Badge>
                                                                {item.isSystem && (
                                                                    <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border-yellow-200 text-yellow-600 bg-yellow-50">
                                                                        System
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {isUpdating === item.id && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                                            <Switch 
                                                                checked={item.isActive}
                                                                onCheckedChange={() => handleToggle(key, item.id, item.isActive)}
                                                                disabled={isUpdating === item.id || (item.isSystem && item.name === 'Super Admin')}
                                                                className="data-[state=checked]:bg-emerald-500"
                                                            />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    );
                })}
            </Tabs>
        </div>
    );
}
