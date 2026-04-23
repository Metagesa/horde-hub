import { useMemo } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  BoardReservationSlotAssignment,
  GameConfig,
  GameTable,
  ParsedMatch,
} from "@/types";

interface BoardsHeatmapProps {
  tables: GameTable[];
  assignmentsByTime: Record<string, BoardReservationSlotAssignment[]>;
  configs: GameConfig[];
  selectedDate: string;
  timeSlots: string[];
  disabled?: boolean;
}

interface ReservationDetails {
  statusLabel: string;
  players: string;
  gameName: string;
}

function sortTables(tables: GameTable[]) {
  return [...tables]
    .filter((table) => table.enabled)
    .sort((a, b) => a.columnIndex - b.columnIndex);
}

function buildReservationLabel(
  gameNames: Record<string, string>,
  gameId: string,
  match: ParsedMatch
): ReservationDetails {
  return {
    statusLabel: "Reservada",
    players: `${match.playerA}${match.playerB ? ` vs ${match.playerB}` : ""}`,
    gameName: gameNames[gameId] || gameId,
  };
}

function getCellTone(reservation?: ReservationDetails) {
  return reservation
    ? "border-red-400/35 bg-[linear-gradient(180deg,rgba(140,26,26,0.55),rgba(70,10,10,0.78))] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]"
    : "border-emerald-400/25 bg-[linear-gradient(180deg,rgba(14,86,61,0.42),rgba(6,43,31,0.74))] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]";
}

export function BoardsHeatmap({
  tables,
  assignmentsByTime,
  configs,
  timeSlots,
  disabled = false,
}: BoardsHeatmapProps) {
  const gameNames = useMemo(
    () =>
      Object.fromEntries(
        configs.map((config) => [config.gameId, config.displayName || config.gameId])
      ),
    [configs]
  );

  const visibleTables = useMemo(() => sortTables(tables), [tables]);

  const reservationMap = useMemo(() => {
    const entries = timeSlots.flatMap((time) =>
      (assignmentsByTime[time] || []).map((assignment) => [
        `${time}-${assignment.tableId}`,
        buildReservationLabel(gameNames, assignment.gameId, assignment.match),
      ] as const)
    );

    return new Map(entries);
  }, [assignmentsByTime, gameNames, timeSlots]);

  if (disabled) {
    return (
      <section className="site-panel glass-surface rounded-[28px] px-4 py-6 sm:px-5">
        <h3 className="text-gold font-heading text-sm tracking-widest uppercase">
          USO DE TABLONES
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          La disponibilidad de mesas y reservas no se muestra para viernes pasados.
        </p>
      </section>
    );
  }

  return (
    <section className="site-panel glass-surface rounded-[28px] overflow-hidden">
      <div className="border-b border-border/80 px-4 py-4 sm:px-5">
        <h3 className="text-gold font-heading text-sm tracking-widest uppercase">
          USO DE TABLONES
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Tocá o pasá el mouse para ver la disponibilidad de cada horario.
        </p>
      </div>

      {visibleTables.length === 0 ? (
        <div className="px-4 py-8 text-sm text-muted-foreground sm:px-5">
          No hay tablones cargados.
        </div>
      ) : timeSlots.length === 0 ? (
        <div className="px-4 py-8 text-sm text-muted-foreground sm:px-5">
          No hay horarios cargados en la columna `horarios` de la hoja Mesas.
        </div>
      ) : (
        <div className="overflow-x-auto px-4 py-4 sm:px-5">
          <div
            className="grid min-w-[760px] gap-2"
            style={{
              gridTemplateColumns: `100px repeat(${visibleTables.length}, minmax(88px, 1fr))`,
            }}
          >
            <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3 text-center text-[11px] font-heading tracking-[0.22em] text-muted-foreground uppercase">
              Horario
            </div>

            {visibleTables.map((table) => (
              <div
                key={table.tableId}
                className="rounded-2xl border border-white/8 bg-black/20 px-2 py-3 text-center text-[11px] font-heading tracking-[0.2em] text-muted-foreground uppercase"
              >
                {table.size}
              </div>
            ))}

            {timeSlots.map((time) => (
              <HeatmapTimeRow
                key={time}
                time={time}
                tables={visibleTables}
                reservationMap={reservationMap}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

interface HeatmapTimeRowProps {
  time: string;
  tables: GameTable[];
  reservationMap: Map<string, ReservationDetails>;
}

function HeatmapTimeRow({
  time,
  tables,
  reservationMap,
}: HeatmapTimeRowProps) {
  return (
    <>
      <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3 text-center text-sm font-heading tracking-[0.14em] text-white">
        {time}
      </div>

      {tables.map((table) => {
        const reservation = reservationMap.get(`${time}-${table.tableId}`);

        return (
          <BoardHeatmapCell
            key={`${time}-${table.tableId}`}
            reservation={reservation}
          />
        );
      })}
    </>
  );
}

interface BoardHeatmapCellProps {
  reservation?: ReservationDetails;
}

function BoardHeatmapCell({ reservation }: BoardHeatmapCellProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="group relative block w-full">
          <div
            className={`relative min-h-[56px] rounded-2xl border transition-all duration-200 ${getCellTone(
              reservation
            )}`}
          >
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_58%)]" />
            <div className="relative flex min-h-[56px] items-center justify-center">
              {reservation ? (
                <Lock className="h-4 w-4 text-red-100/85" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-100/85" />
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-1 z-20 hidden w-[220px] -translate-x-1/2 -translate-y-full rounded-[18px] border border-white/10 bg-[#090c12]/95 p-3 text-left shadow-[0_18px_40px_rgba(0,0,0,0.4)] md:block md:opacity-0 md:transition-all md:duration-150 md:group-hover:opacity-100 md:group-hover:-translate-y-[calc(100%+8px)] md:group-focus-visible:opacity-100 md:group-focus-visible:-translate-y-[calc(100%+8px)]">
            <HeatmapTooltipContent reservation={reservation} />
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="center"
        sideOffset={10}
        className="w-[220px] rounded-[18px] border border-white/10 bg-[#090c12]/95 p-3 text-white shadow-[0_18px_40px_rgba(0,0,0,0.4)] md:hidden"
      >
        <HeatmapTooltipContent reservation={reservation} />
      </PopoverContent>
    </Popover>
  );
}

function HeatmapTooltipContent({
  reservation,
}: {
  reservation?: ReservationDetails;
}) {
  if (!reservation) {
    return (
      <div>
        <p className="text-[11px] font-heading uppercase tracking-[0.24em] text-emerald-200">
          Disponible
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Este tablon esta libre en este horario.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-heading uppercase tracking-[0.24em] text-red-200">
        {reservation.statusLabel}
      </p>
      <p className="mt-1 text-sm font-heading tracking-[0.12em] text-white">
        {reservation.players}
      </p>
      <p className="mt-1 text-xs text-gold-light">{reservation.gameName}</p>
    </div>
  );
}
