import * as React from "react"
import { DayPicker } from "react-day-picker"

function Calendar({ className, ...props }) {
  return (
    <DayPicker
      className={className}
      classNames={{
        months: "flex flex-col",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center text-sm font-bold",
        table: "w-full border-collapse",
        head_row: "flex w-full justify-between mt-2",
        head_cell: "text-muted-foreground font-bold text-[0.8rem] uppercase w-9 text-center",
        row: "flex w-full mt-2 justify-between",
        // Aquí está el secreto: definimos un tamaño fijo (h-9 w-9) y centrado
        cell: "h-9 w-9 text-center p-0 relative flex items-center justify-center",
        day: "h-8 w-8 rounded-md hover:bg-zinc-800 transition-all flex items-center justify-center",
        day_selected: "bg-white text-black font-bold hover:bg-white",
        day_today: "text-green-500 font-bold",
        day_outside: "text-zinc-600",
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"
export { Calendar }