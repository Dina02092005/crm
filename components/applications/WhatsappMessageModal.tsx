"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    MessageCircle,
    Send,
    Users,
    X,
    ExternalLink,
    Loader2,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function WhatsappMessageModal({ 
    isOpen, 
    onClose, 
    selectedStudents,
    apiEndpoint = "/api/applications/whatsapp"
}: any) {
    const [message, setMessage] = useState("");
    const [students, setStudents] = useState<any[]>([]);

    // Sync students when modal opens
    useEffect(() => {
        if (isOpen) {
            setStudents(selectedStudents || []);
        }
    }, [isOpen, selectedStudents]);

    const logWhatsappMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to log whatsapp activities');
            return response.json();
        }
    });

    const handleSend = () => {
        if (!message.trim() || students.length === 0) {
            toast.error("Message and recipients are required");
            return;
        }

        const validStudents = students.filter(s => s.phone);

        if (validStudents.length === 0) {
            toast.error("None of the selected students have a phone number");
            return;
        }

        // Log to DB
        logWhatsappMutation.mutate({
            students: validStudents.map(s => ({ id: s.id, phone: s.phone, leadId: s.leadId })),
            message
        });

        // Open first one as a courtesy
        if (validStudents.length === 1) {
            const phone = validStudents[0].phone.replace(/\D/g, '');
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
        } else {
            toast.success(`${validStudents.length} WhatsApp activities logged. Since bulk sending from browser is restricted, please send messages individually.`);
        }

        onClose();
    };

    const removeStudent = (id: string) => {
        setStudents(students.filter(s => s.id !== id));
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-xl border-l border-border shadow-2xl p-0 flex flex-col h-full bg-background ring-1 ring-border/50">
                <div className="p-6 border-b border-border bg-muted/40 backdrop-blur-md">
                    <SheetHeader className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-green-100 dark:bg-green-500/10 rounded-xl shadow-inner">
                                <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                             </div>
                             <SheetTitle className="text-xl font-bold tracking-tight">WhatsApp Broadcast</SheetTitle>
                        </div>
                        <SheetDescription className="text-sm font-medium text-muted-foreground">
                            Broadcasting to <span className="text-foreground font-black">{students.length}</span> students
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 px-1">
                            <Users className="h-3 w-3" /> recipients
                        </label>
                        <div className="flex flex-wrap gap-2 p-3 bg-muted/20 border border-border/50 rounded-2xl min-h-[50px] shadow-inner backdrop-blur-sm">
                            {students.map(s => (
                                <Badge key={s.id} variant="secondary" className="bg-background border-border/50 text-foreground h-8 pr-1.5 gap-2 rounded-lg shadow-sm">
                                    <span className="text-[11px] font-medium">{s.name}</span>
                                    {s.phone && <span className="text-[9px] opacity-50 font-bold">{s.phone}</span>}
                                    <button 
                                        onClick={() => removeStudent(s.id)} 
                                        className="hover:bg-muted rounded-full p-0.5 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                            {students.length === 0 && <span className="text-[11px] text-muted-foreground/50 italic px-1 py-1">No students selected</span>}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Message Content</label>
                        <Textarea
                            placeholder="Type your WhatsApp message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[250px] rounded-2xl bg-muted/20 border-border/50 focus:ring-green-500/20 resize-none p-4 text-sm leading-relaxed"
                        />
                    </div>

                    <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/20 flex gap-4 relative overflow-hidden group">
                         <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50" />
                         <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                         <div className="text-[11px] text-amber-800 dark:text-amber-200/80 leading-relaxed font-medium">
                            <p className="font-black uppercase tracking-widest mb-1 text-amber-600 dark:text-amber-500">Important Note</p>
                            Browsers restrict opening multiple WhatsApp tabs at once. Clicking 'Send' will 
                            <span className="font-black text-amber-700 dark:text-amber-400 mx-1">log this activity</span> 
                            for all students, but only open a tab for the first student if multiple are selected.
                         </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border bg-muted/40 backdrop-blur-md flex justify-end gap-3 mt-auto">
                    <Button 
                        variant="ghost" 
                        onClick={onClose} 
                        className="rounded-xl px-6 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={logWhatsappMutation.isPending || students.length === 0}
                        className="rounded-xl px-8 gap-3 font-black text-[11px] uppercase tracking-widest bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25 transition-all active:scale-[0.98]"
                    >
                        {logWhatsappMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                {students.length === 1 ? "Open WhatsApp" : "Log & Open First"}
                            </>
                        )}
                    </Button>
                </div>

                {logWhatsappMutation.isPending && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
                         <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-3xl shadow-2xl border border-border ring-1 ring-border/50">
                            <Loader2 className="h-10 w-10 animate-spin text-green-600" />
                            <p className="text-xs font-black text-foreground uppercase tracking-[0.2em] animate-pulse">Logging Activity...</p>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
