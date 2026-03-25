"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon, Pencil } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    useUpdateVisaApplication,
} from "@/hooks/useApi";
import { cn } from "@/lib/utils";

interface EditVisaCaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    visaApplication: any;
    onSuccess: () => void;
}

export function EditVisaCaseModal({
    isOpen,
    onClose,
    visaApplication,
    onSuccess,
}: EditVisaCaseModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>({
        visaType: "",
        status: "",
        appointmentDate: undefined,
        decisionDate: undefined,
        expiryDate: undefined,
        gicTuitionFeePaid: false,
        medicalDone: false,
        biometricsDone: false,
        remarks: "",
    });

    useEffect(() => {
        if (isOpen && visaApplication) {
            setFormData({
                visaType: visaApplication.visaType || "",
                status: visaApplication.status || "",
                appointmentDate: visaApplication.appointmentDate ? new Date(visaApplication.appointmentDate) : undefined,
                decisionDate: visaApplication.decisionDate ? new Date(visaApplication.decisionDate) : undefined,
                expiryDate: visaApplication.expiryDate ? new Date(visaApplication.expiryDate) : undefined,
                gicTuitionFeePaid: visaApplication.gicTuitionFeePaid || false,
                medicalDone: visaApplication.medicalDone || false,
                biometricsDone: visaApplication.biometricsDone || false,
                remarks: visaApplication.remarks || "",
            });
        }
    }, [isOpen, visaApplication]);

    const updateMutation = useUpdateVisaApplication();

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            await updateMutation.mutateAsync({
                id: visaApplication.id,
                data: {
                    ...formData,
                    appointmentDate: formData.appointmentDate?.toISOString() || null,
                    decisionDate: formData.decisionDate?.toISOString() || null,
                    expiryDate: formData.expiryDate?.toISOString() || null,
                }
            });

            onSuccess();
            onClose();
        } catch (error: any) {
            // Error handled by mutation
        } finally {
            setIsSubmitting(false);
        }
    };

    const DatePickerField = ({ label, value, onChange }: { label: string, value: Date | undefined, onChange: (date: Date | undefined) => void }) => (
        <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">{label}</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left font-normal rounded-xl h-11 border-slate-200",
                            !value && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                        {value ? format(value, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={onChange}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    );

    if (!visaApplication) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <Pencil className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-xl font-bold">Edit Visa Case</DialogTitle>
                </DialogHeader>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Visa Type</Label>
                            <Select 
                                value={formData.visaType} 
                                onValueChange={(val) => setFormData((prev: any) => ({ ...prev, visaType: val }))}
                            >
                                <SelectTrigger className="rounded-xl h-11">
                                    <SelectValue placeholder="Select Visa Type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="STUDENT_VISA">Student Visa</SelectItem>
                                    <SelectItem value="DEPENDENT_VISA">Dependent Visa</SelectItem>
                                    <SelectItem value="WORK_VISA">Work Visa</SelectItem>
                                    <SelectItem value="TOURIST_VISA">Tourist Visa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Status</Label>
                            <Select 
                                value={formData.status} 
                                onValueChange={(val) => setFormData((prev: any) => ({ ...prev, status: val }))}
                            >
                                <SelectTrigger className="rounded-xl h-11">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl max-h-[300px]">
                                    {[
                                        "VISA_GUIDANCE_GIVEN", "DOCUMENTS_CHECKLIST_SHARED", "DOCUMENTS_PENDING",
                                        "DOCUMENTS_RECEIVED", "DOCUMENTS_VERIFIED", "FINANCIAL_DOCUMENTS_PENDING",
                                        "SPONSORSHIP_DOCUMENTS_PENDING", "VISA_APPLICATION_IN_PROGRESS",
                                        "VISA_APPLICATION_SUBMITTED", "BIOMETRICS_SCHEDULED", "BIOMETRICS_COMPLETED",
                                        "UNDER_REVIEW", "ADDITIONAL_DOCUMENTS_REQUESTED", "INTERVIEW_SCHEDULED",
                                        "INTERVIEW_COMPLETED", "VISA_APPROVED", "VISA_GRANTED", "VISA_REFUSED",
                                        "VISA_REJECTED", "VISA_WITHDRAWN", "DEFERRED", "ENROLLED", "PENDING"
                                    ].map(status => (
                                        <SelectItem key={status} value={status}>{status.replace(/_/g, ' ')}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <DatePickerField 
                            label="Appointment Date" 
                            value={formData.appointmentDate} 
                            onChange={(date) => setFormData((prev: any) => ({ ...prev, appointmentDate: date }))} 
                        />
                        <DatePickerField 
                            label="Decision Date" 
                            value={formData.decisionDate} 
                            onChange={(date) => setFormData((prev: any) => ({ ...prev, decisionDate: date }))} 
                        />
                         <DatePickerField 
                            label="Expiry Date" 
                            value={formData.expiryDate} 
                            onChange={(date) => setFormData((prev: any) => ({ ...prev, expiryDate: date }))} 
                        />
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center space-x-3">
                                <Checkbox 
                                    id="gic" 
                                    checked={formData.gicTuitionFeePaid} 
                                    onCheckedChange={(checked) => setFormData((prev: any) => ({ ...prev, gicTuitionFeePaid: !!checked }))}
                                />
                                <Label htmlFor="gic" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">GIC / Tuition Fee Paid</Label>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Checkbox 
                                    id="medical" 
                                    checked={formData.medicalDone} 
                                    onCheckedChange={(checked) => setFormData((prev: any) => ({ ...prev, medicalDone: !!checked }))}
                                />
                                <Label htmlFor="medical" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Medical Done</Label>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Checkbox 
                                    id="biometrics" 
                                    checked={formData.biometricsDone} 
                                    onCheckedChange={(checked) => setFormData((prev: any) => ({ ...prev, biometricsDone: !!checked }))}
                                />
                                <Label htmlFor="biometrics" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Biometrics Done</Label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Remarks / Notes</Label>
                            <Textarea 
                                placeholder="Add any specific case remarks here..."
                                value={formData.remarks}
                                onChange={(e) => setFormData((prev: any) => ({ ...prev, remarks: e.target.value }))}
                                className="min-h-[120px] rounded-xl"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="rounded-xl h-11 px-6">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="rounded-xl h-11 px-8 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
