"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: number[]
    min: number
    max: number
    step: number
    onValueChange: (value: number[]) => void
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, value, min, max, step, onValueChange, ...props }, ref) => {
        return (
            <input
                type="range"
                className={cn(
                    "w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary",
                    className
                )}
                ref={ref}
                value={value[0]}
                min={min}
                max={max}
                step={step}
                onChange={(e) => onValueChange([parseFloat(e.target.value)])}
                {...props}
            />
        )
    }
)
Slider.displayName = "Slider"

export { Slider }
