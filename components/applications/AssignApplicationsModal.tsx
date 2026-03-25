"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
    UserPlus,
    Search,
    User,
    Check,
    ChevronLeft,
    Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function AssignApplicationsModal({ 
    isOpen, 
    onClose, 
    selectedIds, 
    selectedNames, 
    onSuccess,
    apiEndpoint = "/api/applications/bulk-assign",
    title = "Applications",
    moduleName = "applications"
}: any) {
    const [selectedAgentId, setSelectedAgentId] = useState<string>("");
    const [agentCounselors, setAgentCounselors] = useState<Record<string, any[]>>({});
    const [loadingCounselors, setLoadingCounselors] = useState<Record<string, boolean>>({});
    const [search, setSearch] = useState("");
    const queryClient = useQueryClient();

    const { data: staffData, isLoading } = useQuery({
        queryKey: ['staff-list'],
        queryFn: async () => {
            const response = await fetch(`/api/employees?limit=1000&status=active`);
            if (!response.ok) throw new Error('Failed to fetch staff');
            return response.json();
        },
        enabled: isOpen
    });

    const assignMutation = useMutation({
        mutationFn: async (userId: string) => {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ids: selectedIds,
                    assignedToId: userId
                })
            });
            if (!response.ok) throw new Error('Failed to assign');
            return response.json();
        },
        onSuccess: () => {
            toast.success(`Assigned ${selectedIds.length} ${title.toLowerCase()}`);
            onSuccess();
            onClose();
            setSelectedAgentId("");
            queryClient.invalidateQueries({ queryKey: [moduleName] });
        }
    });

    const fetchCounselors = async (agentId: string) => {
        if (agentCounselors[agentId] || loadingCounselors[agentId]) return;
        setLoadingCounselors(prev => ({ ...prev, [agentId]: true }));
        try {
            const response = await fetch(`/api/employees?role=COUNSELOR&status=active&agentId=${agentId}&limit=100`);
            const data = await response.json();
            setAgentCounselors(prev => ({ ...prev, [agentId]: data.employees || [] }));
        } catch (error) {
            toast.error("Failed to load counselors");
        } finally {
            setLoadingCounselors(prev => ({ ...prev, [agentId]: false }));
        }
    };

    const agents = (staffData?.employees || []).filter((s: any) =>
        ["AGENT", "SALES_REP", "MANAGER", "ADMIN"].includes(s.role) &&
        (s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-md border-l border-border shadow-2xl p-0 flex flex-col h-full bg-background ring-1 ring-border/50">
                <div className="p-6 border-b border-border bg-muted/40 backdrop-blur-md">
                    <SheetHeader className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-primary/10 dark:bg-primary/20 rounded-xl shadow-inner">
                                <UserPlus className="h-5 w-5 text-primary" />
                             </div>
                             <SheetTitle className="text-xl font-bold tracking-tight">Assign {title}</SheetTitle>
                        </div>
                        <SheetDescription className="text-sm font-medium text-muted-foreground">
                            Select a staff member to assign <span className="text-primary font-black">{selectedIds.length}</span> {title.toLowerCase()}
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <div className="p-4 border-b border-border/50 bg-muted/10">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search Admin/Agents..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 rounded-xl bg-card border-border focus:ring-primary/20 h-11 text-sm font-medium tracking-tight"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[300px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                            <p className="text-sm text-muted-foreground animate-pulse font-medium">Loading staff...</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {!selectedAgentId ? (
                                agents.map((staff: any) => (
                                    <button
                                        key={staff.id}
                                        onClick={() => {
                                            setSelectedAgentId(staff.id);
                                            fetchCounselors(staff.id);
                                        }}
                                        className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-muted dark:hover:bg-slate-900/60 transition-all group text-left border border-transparent hover:border-border/50 hover:shadow-sm active:scale-[0.98]"
                                    >
                                        <Avatar className="h-11 w-11 border-2 border-background shadow-md">
                                            <AvatarImage src={staff.imageUrl} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-black text-sm uppercase">
                                                {staff.name?.charAt(0) || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                                {staff.name}
                                            </p>
                                            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mt-0.5">
                                                {staff.role}
                                            </p>
                                        </div>
                                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-lg">
                                            Select <Search className="h-3 w-3" />
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <button
                                        onClick={() => setSelectedAgentId("")}
                                        className="text-[10px] font-black text-muted-foreground hover:text-primary transition-colors px-2 py-2 flex items-center gap-2 uppercase tracking-widest"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" /> Back to Agents
                                    </button>

                                    <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 bg-primary/10 blur-3xl opacity-20 -mr-4 -mt-4" />
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <div className="h-1 w-1 rounded-full bg-primary" />
                                            Primary Assignee
                                        </p>
                                        <div className="flex items-center justify-between gap-4 relative z-10">
                                            <div className="flex items-center gap-3">
                                                 <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                                    <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                                                        {agents.find((a: any) => a.id === selectedAgentId)?.name?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <p className="font-bold text-foreground">{agents.find((a: any) => a.id === selectedAgentId)?.name}</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => assignMutation.mutate(selectedAgentId)}
                                                className="h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                                            >
                                                Assign Direct
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 px-1 pt-2">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 px-1">
                                            <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                            Assign to a Counselor
                                        </p>
                                        <div className="space-y-1">
                                            {loadingCounselors[selectedAgentId] ? (
                                                <div className="py-10 flex flex-col items-center justify-center gap-2">
                                                    <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Loading counselors...</p>
                                                </div>
                                            ) : agentCounselors[selectedAgentId]?.length > 0 ? (
                                                agentCounselors[selectedAgentId].map((c: any) => (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => assignMutation.mutate(c.id)}
                                                        className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-muted dark:hover:bg-slate-900/40 transition-all group text-left border border-transparent hover:border-border/50 active:scale-[0.98]"
                                                    >
                                                        <Avatar className="h-9 w-9 border-2 border-background">
                                                            <AvatarImage src={c.imageUrl} />
                                                            <AvatarFallback className="text-[10px] font-black uppercase bg-muted text-muted-foreground">
                                                                {c.name?.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <p className="flex-1 font-bold text-sm text-foreground group-hover:text-primary transition-colors">{c.name}</p>
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                            <Check className="h-4 w-4 text-primary" />
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                                                    <User className="h-8 w-8 text-muted-foreground/20 mb-3" />
                                                    <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest leading-relaxed">No counselors reporting to this agent</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-border bg-muted/40 backdrop-blur-md flex items-center justify-between">
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden sm:block">
                        Esc to cancel
                     </p>
                     <Button 
                        variant="ghost" 
                        onClick={onClose}
                        className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
                    >
                        Cancel
                    </Button>
                </div>

                {assignMutation.isPending && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
                        <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-3xl shadow-2xl border border-border ring-1 ring-border/50">
                            <div className="relative">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <div className="absolute inset-0 h-10 w-10 border-4 border-primary/20 rounded-full" />
                            </div>
                            <p className="text-xs font-black text-foreground uppercase tracking-[0.2em] animate-pulse">Assigning...</p>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
