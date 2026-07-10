import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-bold uppercase tracking-widest",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-none"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell:
                    "text-[var(--color-text)] opacity-50 rounded-lg w-9 font-normal text-[0.8rem] uppercase tracking-wider font-mono",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-lg [&:has([aria-selected].day-outside)]:bg-[var(--color-surface)]/50 [&:has([aria-selected])]:bg-[var(--color-surface)] first:[&:has([aria-selected])]:rounded-lg last:[&:has([aria-selected])]:rounded-lg focus-within:relative z-20",
                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] transition-colors rounded-lg font-mono text-xs"
                ),
                day_range_end: "day-range-end",
                day_selected:
                    "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)] hover:text-white focus:bg-[var(--color-accent)] focus:text-white rounded-lg",
                day_today: "bg-[var(--color-surface)] text-[var(--color-text)] font-bold",
                day_outside:
                    "day-outside text-[var(--color-text)] opacity-30 aria-selected:bg-[var(--color-surface)]/50 aria-selected:text-[var(--color-text)] aria-selected:opacity-30",
                day_disabled: "text-[var(--color-text)] opacity-50",
                day_range_middle:
                    "aria-selected:bg-[var(--color-surface)] aria-selected:text-[var(--color-text)]",
                day_hidden: "invisible",
                ...classNames,
            }}

            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
