import type { GameTable, ParsedMatch } from "@/types";
import { getTableStatuses, groupTablesBySize } from "@/lib/tableAvailability";

interface FloatingTableCardProps {
  tables: GameTable[];
  allMatches: Record<string, ParsedMatch[]>;
  selectedTime: string;
  selectedDate: string;
}

export function FloatingTableCard({
  tables,
  allMatches,
  selectedTime,
  selectedDate,
}: FloatingTableCardProps) {
  const statuses = getTableStatuses(
    tables,
    allMatches,
    selectedTime || "00:00",
    selectedDate || new Date().toISOString().split("T")[0]
  );
  const grouped = groupTablesBySize(statuses);

  return (
    <div className="fixed bottom-0 right-0 z-30 w-full lg:w-72 lg:bottom-4 lg:right-4">
      <div className="glass-surface-strong p-3 lg:p-4 border-t lg:border border-border">
        <h4 className="text-gold font-heading text-xs tracking-widest uppercase mb-2">
          MESAS
        </h4>
        <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible">
          {Object.entries(grouped).map(([size, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={size} className="min-w-fit">
                <p className="text-[10px] font-heading tracking-widest uppercase text-muted-foreground mb-1">
                  {size}
                </p>
                <div className="flex gap-1.5">
                  {items.map((s) => (
                    <div
                      key={s.table.tableId}
                      className="flex items-center gap-1 text-[10px] font-body"
                    >
                      <span
                        className={`w-2 h-2 shrink-0 ${
                          s.occupied ? "bg-status-occupied" : "bg-status-free"
                        }`}
                      />
                      <span className="text-foreground whitespace-nowrap">
                        {s.table.tableId}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
