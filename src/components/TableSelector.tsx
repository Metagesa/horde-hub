import type { GameTable, ParsedMatch } from "@/types";
import { getTableStatuses, groupTablesBySize } from "@/lib/tableAvailability";

interface TableSelectorProps {
  tables: GameTable[];
  allMatches: Record<string, ParsedMatch[]>;
  selectedTime: string;
  selectedDate: string;
  selectedTable: string;
  onSelectTable: (tableId: string) => void;
}

export function TableSelector({
  tables,
  allMatches,
  selectedTime,
  selectedDate,
  selectedTable,
  onSelectTable,
}: TableSelectorProps) {
  const statuses = getTableStatuses(tables, allMatches, selectedTime, selectedDate);
  const grouped = groupTablesBySize(statuses);

  if (!selectedTime || !selectedDate) {
    return (
      <div className="glass-surface rounded-[24px] p-4">
        <h3 className="text-gold font-heading text-sm tracking-widest uppercase mb-2">
          SELECCIONAR MESA
        </h3>
        <p className="text-xs text-muted-foreground font-body">
          Seleccioná una fecha y horario primero
        </p>
      </div>
    );
  }

  return (
    <div className="glass-surface rounded-[24px] p-4">
      <h3 className="text-gold font-heading text-sm tracking-widest uppercase mb-3">
        SELECCIONAR MESA
      </h3>
      {Object.entries(grouped).map(([size, items]) => {
        if (items.length === 0) return null;
        return (
          <div key={size} className="mb-3">
            <p className="text-xs font-heading tracking-widest uppercase text-muted-foreground mb-1.5">
              {size}
            </p>
            <div className="flex flex-wrap gap-2">
              {items.map((s) => {
                const isSelected = selectedTable === s.table.tableId;
                const isOccupied = s.occupied;

                return (
                  <button
                    key={s.table.tableId}
                    disabled={isOccupied}
                    onClick={() => onSelectTable(s.table.tableId)}
                    className={`rounded-2xl px-3 py-2 text-xs font-heading uppercase tracking-wider transition-all duration-200 border ${
                      isSelected
                        ? "bg-status-selected text-primary-foreground border-gold animate-pulse-gold"
                        : isOccupied
                        ? "bg-status-occupied/20 text-destructive border-destructive/30 cursor-not-allowed opacity-60"
                        : "bg-status-free/10 text-foreground border-status-free/30 hover:bg-status-free/20"
                    }`}
                    title={
                      isOccupied && s.occupiedBy
                        ? `Ocupada: ${s.occupiedBy.playerA} vs ${s.occupiedBy.playerB} (${s.occupiedBy.gameId})`
                        : undefined
                    }
                  >
                    <span className={`inline-block w-2 h-2 mr-1.5 ${
                      isSelected ? "bg-primary-foreground" : isOccupied ? "bg-status-occupied" : "bg-status-free"
                    }`} />
                    {s.table.tableId}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
