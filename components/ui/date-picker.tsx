import { DatePicker as ArkDatePicker } from "@ark-ui/react/date-picker";
import { Portal } from "@ark-ui/react/portal";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// Re-exporting Ark UI components with default styling
const DatePickerRoot = ArkDatePicker.Root;
const DatePickerLabel = ArkDatePicker.Label;
const DatePickerControl = ArkDatePicker.Control;
const DatePickerInput = ArkDatePicker.Input;
const DatePickerTrigger = ArkDatePicker.Trigger;
const DatePickerPositioner = ArkDatePicker.Positioner;
const DatePickerContent = forwardRef<
    React.ElementRef<typeof ArkDatePicker.Content>,
    React.ComponentPropsWithoutRef<typeof ArkDatePicker.Content>
>(({ className, ...props }, ref) => (
    <Portal>
        <ArkDatePicker.Positioner>
            <ArkDatePicker.Content
                ref={ref}
                className={cn(
                    "z-[100] w-auto rounded-xl border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                    className
                )}
                {...props}
            />
        </ArkDatePicker.Positioner>
    </Portal>
));
DatePickerContent.displayName = "DatePickerContent";

const DatePickerYearSelect = ArkDatePicker.YearSelect;
const DatePickerMonthSelect = ArkDatePicker.MonthSelect;
const DatePickerView = ArkDatePicker.View;
const DatePickerViewControl = ArkDatePicker.ViewControl;
const DatePickerPrevTrigger = ArkDatePicker.PrevTrigger;
const DatePickerNextTrigger = ArkDatePicker.NextTrigger;
const DatePickerViewTrigger = ArkDatePicker.ViewTrigger;
const DatePickerTable = ArkDatePicker.Table;
const DatePickerTableHead = ArkDatePicker.TableHead;
const DatePickerTableHeader = ArkDatePicker.TableHeader;
const DatePickerTableBody = ArkDatePicker.TableBody;
const DatePickerTableRow = ArkDatePicker.TableRow;
const DatePickerTableCell = ArkDatePicker.TableCell;
const DatePickerTableCellTrigger = ArkDatePicker.TableCellTrigger;
const DatePickerContext = ArkDatePicker.Context;

export {
    DatePickerRoot,
    DatePickerLabel,
    DatePickerControl,
    DatePickerInput,
    DatePickerTrigger,
    DatePickerContent,
    DatePickerPositioner, // Exported but usage handled in Content for convenience, or user can use it manually
    DatePickerYearSelect,
    DatePickerMonthSelect,
    DatePickerView,
    DatePickerViewControl,
    DatePickerPrevTrigger,
    DatePickerNextTrigger,
    DatePickerViewTrigger,
    DatePickerTable,
    DatePickerTableHead,
    DatePickerTableHeader,
    DatePickerTableBody,
    DatePickerTableRow,
    DatePickerTableCell,
    DatePickerTableCellTrigger,
    DatePickerContext,
};

// Also export a pre-composed DatePicker for simple use cases
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface SimpleDatePickerProps extends ArkDatePicker.RootProps {
    label?: string;
    placeholder?: string;
    className?: string;
}

export const DatePicker = ({ label, placeholder, className, children, ...props }: SimpleDatePickerProps & { children?: React.ReactNode }) => {
    return (
        <DatePickerRoot selectionMode="single" className={cn("flex flex-col gap-1.5 w-full", className)} {...props}>
            {label && (
                <DatePickerLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                </DatePickerLabel>
            )}
            <DatePickerControl className="flex gap-2">
                <DatePickerInput asChild>
                    <Input
                        placeholder={placeholder || "Pick a date"}
                        className="w-full justify-start text-left font-normal"
                    />
                </DatePickerInput>
                <DatePickerTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 text-muted-foreground">
                        <CalendarIcon className="w-4 h-4" />
                    </Button>
                </DatePickerTrigger>
            </DatePickerControl>

            <DatePickerContent>
                <DatePickerView view="day">
                    <DatePickerContext>
                        {(api) => (
                            <>
                                <DatePickerViewControl className="flex items-center justify-between gap-2 mb-4">
                                    <DatePickerPrevTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100">
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                    </DatePickerPrevTrigger>
                                    <DatePickerViewTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 text-base font-bold">
                                            {api.visibleRange.start.month} {api.visibleRange.start.year}
                                        </Button>
                                    </DatePickerViewTrigger>
                                    <DatePickerNextTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100">
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </DatePickerNextTrigger>
                                </DatePickerViewControl>

                                <DatePickerTable className="w-full border-collapse space-y-1">
                                    <DatePickerTableHead>
                                        <DatePickerTableRow className="flex w-full mt-2">
                                            {api.weekDays.map((weekDay, id) => (
                                                <DatePickerTableHeader key={id} className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]">
                                                    {weekDay.short}
                                                </DatePickerTableHeader>
                                            ))}
                                        </DatePickerTableRow>
                                    </DatePickerTableHead>
                                    <DatePickerTableBody>
                                        {api.weeks.map((week, id) => (
                                            <DatePickerTableRow key={id} className="flex w-full mt-2">
                                                {week.map((day, id) => (
                                                    <DatePickerTableCell key={id} value={day} className="h-9 w-9 text-center p-0 relative [&:has([data-selected])]:bg-accent first:[&:has([data-selected])]:rounded-l-md last:[&:has([data-selected])]:rounded-r-md focus-within:relative focus-within:z-20">
                                                        <DatePickerTableCellTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                className={cn(
                                                                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                                                                    "data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground data-[selected]:focus:bg-primary data-[selected]:focus:text-primary-foreground",
                                                                    "data-[today]:bg-accent data-[today]:text-accent-foreground",
                                                                    "data-[outside-range]:text-muted-foreground data-[outside-range]:opacity-50",
                                                                    "data-[disabled]:text-muted-foreground data-[disabled]:opacity-50"
                                                                )}
                                                            >
                                                                {day.day}
                                                            </Button>
                                                        </DatePickerTableCellTrigger>
                                                    </DatePickerTableCell>
                                                ))}
                                            </DatePickerTableRow>
                                        ))}
                                    </DatePickerTableBody>
                                </DatePickerTable>
                            </>
                        )}
                    </DatePickerContext>
                </DatePickerView>
                <DatePickerView view="month">
                    <DatePickerContext>
                        {(api) => (
                            <>
                                <DatePickerViewControl className="flex items-center justify-between gap-2 mb-4">
                                    <DatePickerPrevTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                    </DatePickerPrevTrigger>
                                    <DatePickerViewTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 text-base font-bold">
                                            {api.visibleRange.start.year}
                                        </Button>
                                    </DatePickerViewTrigger>
                                    <DatePickerNextTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100">
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </DatePickerNextTrigger>
                                </DatePickerViewControl>
                                <DatePickerTable className="w-full border-collapse space-y-1">
                                    <DatePickerTableBody>
                                        {api.getMonthsGrid({ columns: 4, format: 'short' }).map((months, rowId) => (
                                            <DatePickerTableRow key={rowId} className="flex w-full mt-2">
                                                {months.map((month, colId) => (
                                                    <DatePickerTableCell key={colId} value={month.value} className="h-9 w-16 text-center p-0 relative">
                                                        <DatePickerTableCellTrigger asChild>
                                                            <Button variant="ghost" className="h-9 w-full p-0 font-normal data-[selected]:bg-primary data-[selected]:text-primary-foreground">
                                                                {month.label}
                                                            </Button>
                                                        </DatePickerTableCellTrigger>
                                                    </DatePickerTableCell>
                                                ))}
                                            </DatePickerTableRow>
                                        ))}
                                    </DatePickerTableBody>
                                </DatePickerTable>
                            </>
                        )}
                    </DatePickerContext>
                </DatePickerView>
                <DatePickerView view="year">
                    <DatePickerContext>
                        {(api) => (
                            <>
                                <DatePickerViewControl className="flex items-center justify-between gap-2 mb-4">
                                    <DatePickerPrevTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                    </DatePickerPrevTrigger>
                                    <DatePickerViewTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 text-base font-bold">
                                            {api.visibleRange.start.year} - {api.visibleRange.end.year}
                                        </Button>
                                    </DatePickerViewTrigger>
                                    <DatePickerNextTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </DatePickerNextTrigger>
                                </DatePickerViewControl>
                                <DatePickerTable className="w-full border-collapse space-y-1">
                                    <DatePickerTableBody>
                                        {api.getYearsGrid({ columns: 4 }).map((years, rowId) => (
                                            <DatePickerTableRow key={rowId} className="flex w-full mt-2">
                                                {years.map((year, colId) => (
                                                    <DatePickerTableCell key={colId} value={year.value} className="h-9 w-16 text-center p-0 relative">
                                                        <DatePickerTableCellTrigger asChild>
                                                            <Button variant="ghost" className="h-9 w-full p-0 font-normal data-[selected]:bg-primary data-[selected]:text-primary-foreground">
                                                                {year.label}
                                                            </Button>
                                                        </DatePickerTableCellTrigger>
                                                    </DatePickerTableCell>
                                                ))}
                                            </DatePickerTableRow>
                                        ))}
                                    </DatePickerTableBody>
                                </DatePickerTable>
                            </>
                        )}
                    </DatePickerContext>
                </DatePickerView>

                {/* Render children (like time picker) if provided */}
                {children}
            </DatePickerContent>
        </DatePickerRoot>
    );
};
