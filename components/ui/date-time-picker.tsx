"use client";

import React, { useState, useEffect } from "react";
import { setHours, setMinutes } from "date-fns";
import { Clock } from "lucide-react";
import { fromDate, getLocalTimeZone, DateValue } from "@internationalized/date";

import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface DateTimePickerProps {
    date?: Date;
    setDate: (date: Date | undefined) => void;
    label?: string;
    required?: boolean;
    name?: string; // For hidden input if needed in forms
    className?: string;
}

export function DateTimePicker({
    date,
    setDate,
    label,
    required,
    name,
    className,
}: DateTimePickerProps) {
    const [selectedDateValue, setSelectedDateValue] = useState<DateValue[]>([]);
    const [hour, setHour] = useState<string>("12");
    const [minute, setMinute] = useState<string>("00");
    const [period, setPeriod] = useState<"AM" | "PM">("PM");

    // Sync internal state with external date prop
    useEffect(() => {
        if (date) {
            try {
                const dateVal = fromDate(date, getLocalTimeZone());
                setSelectedDateValue([dateVal]);

                let h = date.getHours();
                const m = date.getMinutes();
                const p = h >= 12 ? "PM" : "AM";

                if (h > 12) h -= 12;
                if (h === 0) h = 12;

                setHour(h.toString());
                setMinute(m.toString().padStart(2, "0"));
                setPeriod(p);
            } catch (e) {
                // Handle invalid dates if necessary
                console.error("Invalid date passed to DateTimePicker", e);
            }
        } else {
            setSelectedDateValue([]);
        }
    }, [date]);

    // Update parent when time selection changes
    useEffect(() => {
        if (selectedDateValue.length > 0) {
            const currentVal = selectedDateValue[0];
            // Convert to native Date to start calculation
            const nativeDate = currentVal.toDate(getLocalTimeZone());

            let h = parseInt(hour, 10);
            const m = parseInt(minute, 10);

            if (period === "PM" && h !== 12) h += 12;
            if (period === "AM" && h === 12) h = 0;

            const newDate = setMinutes(setHours(nativeDate, h), m);

            // Only update if differrent
            if (!date || newDate.getTime() !== date.getTime()) {
                setDate(newDate);
            }
        }
    }, [hour, minute, period]);
    // Note: We don't include selectedDateValue in dependency array for time update loop, 
    // because handleDateChange handles the date change part. 
    // If selectedDateValue changes (date changed), we update parent in handleDateChange.
    // However, if Time changes, we must update using current date.
    // But verify if selectedDateValue is stable/updated.
    // Actually simpler: 


    const handleDateChange = (details: { value: DateValue[], valueAsString: string[], view: string }) => {
        const newDateVal = details.value[0];
        if (newDateVal) {
            // Convert to native Date
            const nativeDate = newDateVal.toDate(getLocalTimeZone());

            // Preserve time from current selection
            let h = parseInt(hour, 10);
            const m = parseInt(minute, 10);

            if (period === "PM" && h !== 12) h += 12;
            if (period === "AM" && h === 12) h = 0;

            const updatedDate = setMinutes(setHours(nativeDate, h), m);
            setSelectedDateValue(details.value);
            setDate(updatedDate);
        } else {
            setSelectedDateValue([]);
            setDate(undefined);
        }
    };

    // Generate ISO string for hidden input
    const isoValue = date ? date.toISOString() : "";

    return (
        <div className={cn("space-y-1", className)}>
            <DatePicker
                label={label ? `${label} ${required ? "*" : ""}` : undefined}
                value={selectedDateValue}
                onValueChange={handleDateChange}
            >
                <div className="p-3 border-t bg-muted/20">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-xs text-muted-foreground">Time</Label>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                        {/* Hour */}
                        <Select value={hour} onValueChange={(v) => setHour(v)}>
                            <SelectTrigger className="h-8 w-[60px] text-xs bg-background">
                                <SelectValue placeholder="HH" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                                    <SelectItem key={h} value={h.toString()} className="text-xs">
                                        {h}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span className="text-muted-foreground text-xs">:</span>
                        {/* Minute */}
                        <Select value={minute} onValueChange={(v) => setMinute(v)}>
                            <SelectTrigger className="h-8 w-[60px] text-xs bg-background">
                                <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                                    <SelectItem key={m} value={m.toString().padStart(2, "0")} className="text-xs">
                                        {m.toString().padStart(2, "0")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {/* Period */}
                        <Select value={period} onValueChange={(v) => setPeriod(v as "AM" | "PM")}>
                            <SelectTrigger className="h-8 w-[65px] text-xs bg-background">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="AM" className="text-xs">AM</SelectItem>
                                <SelectItem value="PM" className="text-xs">PM</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </DatePicker>
            {name && <input type="hidden" name={name} value={isoValue} required={required} />}
        </div>
    );
}
