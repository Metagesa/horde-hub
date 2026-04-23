import { lazy, Suspense, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDateSpanish, getCurrentOrNextFriday, parseIsoDate } from "@/lib/dates";

const FridayDatePickerCalendar = lazy(
  () => import("@/components/FridayDatePickerCalendar")
);

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

      {open ? (
        <PopoverContent
          align="start"
          sideOffset={10}
          className="w-auto rounded-[24px] border border-white/10 bg-[#090c12]/95 p-0 text-white shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
        >
          <Suspense
            fallback={
              <div className="px-4 py-5 text-sm text-muted-foreground">
                Cargando calendario...
              </div>
            }
          >
            <FridayDatePickerCalendar
              currentYear={currentYear}
              selectedDate={selectedDate}
              onChange={onChange}
              onClose={() => setOpen(false)}
            />
          </Suspense>
        </PopoverContent>
      ) : null}
    </Popover>
  );
}
