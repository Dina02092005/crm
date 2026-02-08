"use client";

import { PhoneInput as ReactPhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

export interface PhoneInputProps extends React.ComponentProps<typeof ReactPhoneInput> {
    className?: string;
    error?: boolean;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
    ({ className, error, ...props }, ref) => {
        return (
            <ReactPhoneInput
                defaultCountry="in"
                ref={ref as any}
                inputClassName={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-red-500 focus-visible:ring-red-500",
                    className
                )}
                style={{
                    '--react-international-phone-border-radius': 'calc(var(--radius) - 2px)',
                    '--react-international-phone-border-color': 'hsl(var(--input))',
                    '--react-international-phone-background-color': 'hsl(var(--background))',
                    '--react-international-phone-text-color': 'hsl(var(--foreground))',
                    '--react-international-phone-selected-dropdown-item-background-color': 'hsl(var(--accent))',
                    '--react-international-phone-country-selector-background-color': 'transparent',
                    '--react-international-phone-country-selector-border-color': 'hsl(var(--input))',
                    '--react-international-phone-country-selector-arrow-color': 'hsl(var(--foreground))',
                } as React.CSSProperties}
                {...props}
            />
        );
    }
);
PhoneInput.displayName = "PhoneInput";
