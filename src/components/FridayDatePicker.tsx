import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  formatDateSpanish,
  getCurrentOrNextFriday,
  isFridayDate,
  parseIsoDate,
  toIsoDate,
} from "@/lib/dates";

interface FridayDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function FridayDatePicker({
  value,
  onChange,
  disabled = false,
  className,
}: FridayDatePickerProps) {
  const selectedDate = useMemo(
    () => parseIsoDate(value || getCurrentOrNextFriday()),
    [value]
  );
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-auto w-full justify-between rounded-2xl border-white/10 bg-black/25 px-3 py-2 text-left text-white hover:bg-black/35 hover:text-white",
            className
          )}
        >
          <span className="min-w-0">
            <span className="block text-[10px] font-heading uppercase tracking-[0.24em] text-muted-foreground">
              Viernes
            </span>
            <span className="block truncate text-sm text-white">
              {value ? formatDateSpanish(value) : "Seleccionar viernes"}
            </span>
          </span>
          <CalendarDays className="ml-3 h-4 w-4 shrink-0 text-gold-light" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={10}
        className="w-auto rounded-[24px] border border-white/10 bg-[#090c12]/95 p-0 text-white shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
      >
        <div className="border-b border-white/8 px-4 py-3">
          <p className="text-[11px] font-heading uppercase tracking-[0.24em] text-gold-light">
            Seleccionar Viernes
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cambia de mes o año y elige cualquier viernes.
          </p>
        </div>

        <Calendar
          mode="single"
          locale={es}
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={(date) => {
            if (!date) {
              return;
            }

            const nextValue = toIsoDate(date);
            if (!isFridayDate(nextValue)) {
              return;
            }

            onChange(nextValue);
            setOpen(false);
          }}
          disabled={(date) => date.getDay() !== 5}
          captionLayout="dropdown-buttons"
          fromYear={currentYear - 5}
          toYear={currentYear + 5}
          className="p-3"
          classNames={{
            months: "flex flex-col",
            month: "space-y-4",
            caption: "flex items-center justify-center px-8 pt-1",
            caption_label:
              "text-sm font-heading uppercase tracking-[0.16em] text-gold-light",
            dropdown_month:
              "rounded-xl border border-white/10 bg-black/30 px-2 py-1 text-xs text-white",
            dropdown_year:
              "rounded-xl border border-white/10 bg-black/30 px-2 py-1 text-xs text-white",
            head_cell:
              "text-muted-foreground rounded-md w-10 font-heading text-[10px] uppercase tracking-[0.18em]",
            row: "flex w-full mt-2",
            cell: "h-10 w-10 text-center text-sm p-0 relative",
            day: "h-10 w-10 rounded-2xl p-0 text-sm font-medium text-white transition-colors hover:bg-white/10",
            day_selected:
              "bg-gold text-black hover:bg-gold-light hover:text-black focus:bg-gold focus:text-black",
            day_today: "border border-gold/30 bg-gold/10 text-gold-light",
            day_disabled: "text-white/20 line-through opacity-100",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
