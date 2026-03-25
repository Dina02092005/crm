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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Mail,
    Send,
    Users,
    X,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function EmailComposeModal({ 
    isOpen, 
    onClose, 
    selectedEmails,
    apiEndpoint = "/api/applications/email"
}: any) {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [emails, setEmails] = useState<string[]>([]);

    // Sync emails when modal opens
    useEffect(() => {
        if (isOpen) {
            setEmails(selectedEmails || []);
        }
    }, [isOpen, selectedEmails]);

    const sendEmailMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to send email');
            return response.json();
        },
        onSuccess: () => {
            toast.success("Emails sent successfully");
            onClose();
            setSubject("");
            setMessage("");
        },
        onError: () => {
            toast.error("Failed to send emails");
        }
    });

    const handleSend = () => {
        if (!subject.trim() || !message.trim() || emails.length === 0) {
            toast.error("Subject, message and recipients are required");
            return;
        }
        sendEmailMutation.mutate({ recipients: emails, subject, message });
    };

    const removeEmail = (email: string) => {
        setEmails(emails.filter(e => e !== email));
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-xl border-l border-border shadow-2xl p-0 flex flex-col h-full bg-background ring-1 ring-border/50">
                <div className="p-6 border-b border-border bg-muted/40 backdrop-blur-md">
                    <SheetHeader className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2.5 bg-amber-100 dark:bg-amber-500/10 rounded-xl shadow-inner">
                                <Mail className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                             </div>
                             <SheetTitle className="text-xl font-bold tracking-tight">Compose Email</SheetTitle>
                        </div>
                        <SheetDescription className="text-sm font-medium text-muted-foreground">
                            Sending to <span className="text-foreground font-black">{emails.length}</span> recipients
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 px-1">
                            <Users className="h-3 w-3" /> recipients
                        </label>
                        <div className="flex flex-wrap gap-2 p-3 bg-muted/20 border border-border/50 rounded-2xl min-h-[50px] shadow-inner backdrop-blur-sm">
                            {emails.map(email => (
                                <Badge key={email} variant="secondary" className="bg-background border-border/50 text-foreground h-8 pr-1.5 gap-2 rounded-lg shadow-sm">
                                    <span className="text-[11px] font-medium">{email}</span>
                                    <button 
                                        onClick={() => removeEmail(email)} 
                                        className="hover:bg-muted rounded-full p-0.5 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                            {emails.length === 0 && <span className="text-[11px] text-muted-foreground/50 italic px-1 py-1">No recipients selected</span>}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Subject</label>
                        <Input
                            placeholder="Enter email subject..."
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="h-12 rounded-xl bg-muted/20 border-border/50 focus:ring-primary/20 text-sm font-medium"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Message</label>
                        <Textarea
                            placeholder="Type your message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[300px] rounded-2xl bg-muted/20 border-border/50 focus:ring-primary/20 resize-none p-4 text-sm leading-relaxed"
                        />
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground italic px-1 opacity-70">
                            <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                            Tip: These emails will be sent individually to each recipient.
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
                        disabled={sendEmailMutation.isPending || emails.length === 0}
                        className="rounded-xl px-8 gap-3 font-black text-[11px] uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
                    >
                        {sendEmailMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                Send Now
                            </>
                        )}
                    </Button>
                </div>

                {sendEmailMutation.isPending && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
                         <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-3xl shadow-2xl border border-border ring-1 ring-border/50">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-xs font-black text-foreground uppercase tracking-[0.2em] animate-pulse">Sending Emails...</p>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
