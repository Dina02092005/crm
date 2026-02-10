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

    // Initialize state from date prop, but don't use useEffect to update it
    useEffect(() => {
        if (date) {
            const dateVal = fromDate(date, getLocalTimeZone());
            setSelectedDateValue([dateVal]);

            let h = date.getHours();
            const p = h >= 12 ? "PM" : "AM";
            if (h > 12) h -= 12;
            if (h === 0) h = 12;

            setHour(h.toString());
            setMinute(date.getMinutes().toString().padStart(2, "0"));
            setPeriod(p);
        } else {
            setSelectedDateValue([]);
            setHour("12");
            setMinute("00");
            setPeriod("AM");
        }
    }, [date]);

    const handleTimeChange = (type: "hour" | "minute" | "period", value: string) => {
        let newHour = hour;
        let newMinute = minute;
        let newPeriod = period;

        if (type === "hour") newHour = value;
        if (type === "minute") newMinute = value;
        if (type === "period") newPeriod = value as "AM" | "PM";

        // Update local state immediately for UI responsiveness
        if (type === "hour") setHour(value);
        if (type === "minute") setMinute(value);
        if (type === "period") setPeriod(value as "AM" | "PM");

        // Calculate functionality
        if (selectedDateValue.length > 0) {
            const currentVal = selectedDateValue[0];
            const nativeDate = currentVal.toDate(getLocalTimeZone());

            let h = parseInt(newHour, 10);
            const m = parseInt(newMinute, 10);

            if (newPeriod === "PM" && h !== 12) h += 12;
            if (newPeriod === "AM" && h === 12) h = 0;

            const newDate = setMinutes(setHours(nativeDate, h), m);
            setDate(newDate);
        }
    };

    const handleDateChange = (details: { value: DateValue[], valueAsString: string[], view: string }) => {
        const newDateVal = details.value[0];
        if (newDateVal) {
            const nativeDate = newDateVal.toDate(getLocalTimeZone());

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
                        <Select value={hour} onValueChange={(v) => handleTimeChange("hour", v)}>
                            <SelectTrigger className="h-8 w-[60px] text-xs bg-background">
                                <SelectValue placeholder="HH" />
                            </SelectTrigger>
                            <SelectContent className="z-[110]">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                                    <SelectItem key={h} value={h.toString()} className="text-xs">
                                        {h}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span className="text-muted-foreground text-xs">:</span>
                        {/* Minute */}
                        <Select value={minute} onValueChange={(v) => handleTimeChange("minute", v)}>
                            <SelectTrigger className="h-8 w-[60px] text-xs bg-background">
                                <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent className="z-[110]">
                                {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                                    <SelectItem key={m} value={m.toString().padStart(2, "0")} className="text-xs">
                                        {m.toString().padStart(2, "0")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {/* Period */}
                        <Select value={period} onValueChange={(v) => handleTimeChange("period", v)}>
                            <SelectTrigger className="h-8 w-[65px] text-xs bg-background">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[110]">
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
