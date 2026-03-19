"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRolePath } from "@/hooks/use-role-path";
import { DatePicker } from "@/components/ui/date-picker";

interface ConvertToApplicationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
    onConverted: () => void;
}

export function ConvertToApplicationDialog({
    isOpen,
    onClose,
    studentId,
    studentName,
    onConverted,
}: ConvertToApplicationDialogProps) {
    const router = useRouter();
    const { prefixPath } = useRolePath();
    const [countries, setCountries] = useState<any[]>([]);
    const [universities, setUniversities] = useState<any[]>([]);
    const [isLoadingCountries, setIsLoadingCountries] = useState(false);
    const [isLoadingUniversities, setIsLoadingUniversities] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        universityId: "",
        courseName: "",
        intake: "",
        countryId: "",
        notes: ""
    });

    useEffect(() => {
        if (isOpen) {
            fetchCountries();
        }
    }, [isOpen]);

    useEffect(() => {
        if (formData.countryId) {
            fetchUniversities(formData.countryId);
        } else {
            setUniversities([]);
        }
    }, [formData.countryId]);

    const fetchCountries = async () => {
        setIsLoadingCountries(true);
        try {
            const response = await axios.get("/api/master/countries?limit=500");
            setCountries(response.data?.countries || response.data || []);
        } catch (error) {
            console.error("Failed to load countries", error);
        } finally {
            setIsLoadingCountries(false);
        }
    };

    const fetchUniversities = async (countryId: string) => {
        setIsLoadingUniversities(true);
        try {
            const response = await axios.get(`/api/master/universities?countryId=${countryId}&limit=500`);
            setUniversities(response.data?.universities || response.data || []);
        } catch (error) {
            console.error("Failed to load universities", error);
        } finally {
            setIsLoadingUniversities(false);
        }
    };

    const handleConvert = async () => {
        if (!formData.universityId || !formData.courseName || !formData.countryId) {
            toast.error("Please fill in university, course, and country");
            return;
        }

        setIsSaving(true);
        try {
            const res = await axios.post("/api/applications", {
                studentId,
                applications: [{
                    countryId: formData.countryId,
                    universityId: formData.universityId,
                    courseName: formData.courseName,
                    intake: formData.intake,
                    notes: formData.notes
                }]
            });
            toast.success("Converted to application successfully");
            onConverted();
            onClose();

            // Redirect to newly created application
            if (res.data && res.data.length > 0) {
                router.push(prefixPath(`/applications/${res.data[0].id}`));
            }
        } catch (error: any) {
            console.error("Failed to convert to application", error);
            toast.error(error.response?.data?.error || "Failed to convert student to application");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Convert to Application</DialogTitle>
                    <DialogDescription>
                        Create a university application for <strong>{studentName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Country</Label>
                            <Select
                                value={formData.countryId}
                                onValueChange={(value) => setFormData({ ...formData, countryId: value, universityId: "" })}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder={isLoadingCountries ? "Loading..." : "Select Country"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {countries.map((country) => (
                                        <SelectItem key={country.id} value={country.id}>
                                            {country.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="universityId">University Name</Label>
                            <Select
                                value={formData.universityId}
                                onValueChange={(value) => setFormData({ ...formData, universityId: value })}
                                disabled={!formData.countryId || isLoadingUniversities}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder={isLoadingUniversities ? "Loading..." : "Select University"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {universities.map((uni) => (
                                        <SelectItem key={uni.id} value={uni.id}>
                                            {uni.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="courseName">Course Name</Label>
                        <Input
                            id="courseName"
                            placeholder="e.g. Masters in Computer Science"
                            value={formData.courseName}
                            onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                            className="rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="intake">Intake (Optional)</Label>
                        <DatePicker
                            value={formData.intake}
                            onChange={(val) => setFormData({ ...formData, intake: val })}
                            placeholder="Select intake date"
                            className="rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Add any additional details..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="rounded-xl min-h-[100px]"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-3 sm:flex-row-reverse">
                    <Button
                        onClick={handleConvert}
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary/90 rounded-xl px-8"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Converting...
                            </>
                        ) : (
                            "Convert to Application"
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSaving}
                        className="rounded-xl"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
