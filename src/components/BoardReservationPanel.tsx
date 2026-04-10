import { Switch } from "@/components/ui/switch";
import {
  chooseBestTable,
  getCompatibleTableStatuses,
} from "@/lib/tableAvailability";
import type { GameTable, ParsedMatch } from "@/types";

interface BoardReservationPanelProps {
  matchSize: string;
  duration: string;
  tables: GameTable[];
  allMatches: Record<string, ParsedMatch[]>;
  selectedTime: string;
  selectedDate: string;
  reserveTable: boolean;
  onReserveTableChange: (value: boolean) => void;
}

function formatDuration(duration: string) {
  return duration === "TODO_EL_DIA" ? "TODO EL DIA" : duration || "Sin definir";
}

export function BoardReservationPanel({
  matchSize,
  duration,
  tables,
  allMatches,
  selectedTime,
  selectedDate,
  reserveTable,
  onReserveTableChange,
}: BoardReservationPanelProps) {
  const compatibleStatuses =
    selectedDate && selectedTime && matchSize && duration
      ? getCompatibleTableStatuses(
          tables,
          allMatches,
          selectedTime,
          selectedDate,
          matchSize,
          duration
        )
      : [];

  const reservedTable =
    selectedDate && selectedTime && matchSize && duration
      ? chooseBestTable(
          tables,
          allMatches,
          selectedTime,
          selectedDate,
          matchSize,
          duration
        )
      : null;

  if (!matchSize) {
    return (
      <div className="glass-surface rounded-[24px] p-4">
        <div className="flex items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-black/20 p-3">
          <div>
            <h3 className="text-gold font-heading text-sm tracking-widest uppercase">
              RESERVA DE TABLON
            </h3>
            <p className="mt-1 text-xs text-muted-foreground font-body">
              Falta configurar el tamaño de partida para este juego.
            </p>
          </div>
          <Switch checked={reserveTable} onCheckedChange={onReserveTableChange} />
        </div>
      </div>
    );
  }

  if (!selectedTime || !selectedDate) {
    return (
      <div className="glass-surface rounded-[24px] p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-black/20 p-3">
            <div>
              <h3 className="text-gold font-heading text-sm tracking-widest uppercase">
                RESERVA DE TABLON
              </h3>
              <p className="mt-1 text-xs text-muted-foreground font-body">
                Actívalo solo si querés intentar reservar un tablón.
              </p>
            </div>
            <Switch checked={reserveTable} onCheckedChange={onReserveTableChange} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-heading tracking-[0.28em] text-muted-foreground uppercase">
                TAMAÑO DE PARTIDA
              </p>
              <p className="mt-1 text-sm text-foreground">{matchSize}</p>
            </div>
            <div>
              <p className="text-[11px] font-heading tracking-[0.28em] text-muted-foreground uppercase">
                DURACIÓN
              </p>
              <p className="mt-1 text-sm text-foreground">
                {formatDuration(duration)}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground font-body">
            Seleccioná una fecha y horario para verificar la disponibilidad.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-surface rounded-[24px] p-4">
      <div className="mb-4 flex items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-black/20 p-3">
        <div>
          <h3 className="text-gold font-heading text-sm tracking-widest uppercase">
            RESERVA DE TABLON
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Actívalo solo si querés que el sistema intente reservar un tablón.
          </p>
        </div>
        <Switch checked={reserveTable} onCheckedChange={onReserveTableChange} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="site-panel rounded-[20px] border border-white/8 bg-black/20 p-3">
          <p className="text-[11px] font-heading tracking-[0.28em] text-muted-foreground uppercase">
            TAMAÑO DE PARTIDA
          </p>
          <p className="mt-1 text-base font-heading tracking-[0.16em] text-white">
            {matchSize}
          </p>
        </div>

        <div className="site-panel rounded-[20px] border border-white/8 bg-black/20 p-3">
          <p className="text-[11px] font-heading tracking-[0.28em] text-muted-foreground uppercase">
            DURACIÓN
          </p>
          <p className="mt-1 text-base font-heading tracking-[0.16em] text-white">
            {formatDuration(duration)}
          </p>
        </div>

        <div className="site-panel rounded-[20px] border border-white/8 bg-black/20 p-3">
          <p className="text-[11px] font-heading tracking-[0.28em] text-muted-foreground uppercase">
            ESTADO DE RESERVA
          </p>
          <p
            className={`mt-1 text-base font-heading tracking-[0.16em] ${
              reserveTable && reservedTable
                ? "text-gold-light"
                : "text-muted-foreground"
            }`}
          >
            {reserveTable
              ? reservedTable?.label || "SIN RESERVA"
              : "DESACTIVADA"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {!reserveTable
              ? "La partida se guarda sin reserva. Podés activarla cuando quieras."
              : reservedTable
              ? "Se asignará el tablón compatible más chico disponible."
              : "No hay tablones compatibles libres para ese rango horario."}
          </p>
        </div>
      </div>

      {compatibleStatuses.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-heading tracking-[0.28em] text-muted-foreground uppercase">
            DISPONIBILIDAD COMPATIBLE
          </p>
          <div className="flex flex-wrap gap-2">
            {compatibleStatuses.map((status) => {
              const selected = reservedTable?.size === status.size;

              return (
                <div
                  key={status.size}
                  className={`rounded-2xl border px-3 py-2 text-xs font-heading tracking-[0.16em] uppercase ${
                    reserveTable && selected
                      ? "border-gold/40 bg-gold/15 text-gold-light"
                      : status.availableCount > 0
                      ? "border-status-free/30 bg-status-free/10 text-foreground"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  }`}
                >
                  {status.size} - {status.availableCount}/{status.totalCount}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          No hay tamaños de tablón compatibles cargados.
        </p>
      )}
    </div>
  );
}
