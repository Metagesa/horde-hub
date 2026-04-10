import { useEffect, useMemo, useState } from "react";
import { saveMatch } from "@/lib/api";
import { getCurrentOrNextFriday } from "@/lib/dates";
import { chooseBestTable } from "@/lib/tableAvailability";
import type { GameConfig, GameTable, ParsedMatch } from "@/types";
import { BoardReservationPanel } from "./BoardReservationPanel";
import { FridayDatePicker } from "./FridayDatePicker";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface RegistrationFormProps {
  gameId: string;
  config: GameConfig;
  tables: GameTable[];
  timeSlots: string[];
  factions: Array<{ faction: string }>;
  allMatches: Record<string, ParsedMatch[]>;
  onSuccess: () => void;
  initialMatch?: ParsedMatch | null;
  title?: string;
  submitLabel?: string;
  onCancel?: () => void;
  forcedDate?: string;
  disabled?: boolean;
  disabledMessage?: string;
  className?: string;
  stickyActions?: boolean;
}

const DEFAULT_DURATION_OPTIONS = [
  "01:00",
  "01:30",
  "02:00",
  "02:30",
  "03:00",
  "04:00",
  "TODO_EL_DIA",
];

function getDurationOptions(
  estimatedDuration: string,
  initialDuration?: string
): string[] {
  return Array.from(
    new Set(
      [estimatedDuration, initialDuration, ...DEFAULT_DURATION_OPTIONS].filter(
        Boolean
      )
    )
  );
}

function formatDurationLabel(duration: string) {
  return duration === "TODO_EL_DIA" ? "TODO EL DIA" : duration;
}

export function RegistrationForm({
  gameId,
  config,
  factions = [],
  tables,
  timeSlots,
  allMatches,
  onSuccess,
  initialMatch = null,
  title,
  submitLabel,
  onCancel,
  forcedDate,
  disabled = false,
  disabledMessage = "La gestion de reservas no esta disponible para viernes pasados.",
  className,
  stickyActions = false,
}: RegistrationFormProps) {
  const { toast } = useToast();
  const durationOptions = useMemo(
    () => getDurationOptions(config.estimatedDuration, initialMatch?.duration),
    [config.estimatedDuration, initialMatch?.duration]
  );
  const availableTimeSlots = useMemo(
    () =>
      Array.from(new Set([...timeSlots, initialMatch?.time || ""]))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [initialMatch?.time, timeSlots]
  );

  const [date, setDate] = useState(
    forcedDate || initialMatch?.date || getCurrentOrNextFriday()
  );
  const [playerA, setPlayerA] = useState(initialMatch?.playerA || "");
  const [factionA, setFactionA] = useState(initialMatch?.factionA || "");
  const [playerB, setPlayerB] = useState(initialMatch?.playerB || "");
  const [factionB, setFactionB] = useState(initialMatch?.factionB || "");
  const [time, setTime] = useState(initialMatch?.time || "");
  const [duration, setDuration] = useState(
    initialMatch?.duration || config.estimatedDuration || "01:30"
  );
  const [reserveTable, setReserveTable] = useState(Boolean(initialMatch?.tableId));
  const [saving, setSaving] = useState(false);

  const matchSize = initialMatch?.matchSize || config.matchSize || "";
  const reservedTable =
    date && time && duration && matchSize
      ? chooseBestTable(tables, allMatches, time, date, matchSize, duration)
      : null;

  useEffect(() => {
    setDate(forcedDate || initialMatch?.date || getCurrentOrNextFriday());
    setPlayerA(initialMatch?.playerA || "");
    setFactionA(initialMatch?.factionA || "");
    setPlayerB(initialMatch?.playerB || "");
    setFactionB(initialMatch?.factionB || "");
    setTime(initialMatch?.time || "");
    setDuration(initialMatch?.duration || config.estimatedDuration || "01:30");
    setReserveTable(Boolean(initialMatch?.tableId));
  }, [config.estimatedDuration, forcedDate, initialMatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerA.trim()) {
      toast({
        title: "Error",
        description: "Jugador A es requerido",
        variant: "destructive",
      });
      return;
    }

    if (!time) {
      toast({
        title: "Error",
        description: "Horario es requerido",
        variant: "destructive",
      });
      return;
    }

    if (!duration) {
      toast({
        title: "Error",
        description: "Duracion es requerida",
        variant: "destructive",
      });
      return;
    }

    if (disabled) {
      toast({
        title: "Fecha bloqueada",
        description: disabledMessage,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const success = await saveMatch(gameId, {
      id: initialMatch?.id,
      date,
      playerA: playerA.trim().toUpperCase(),
      factionA,
      playerB: playerB.trim().toUpperCase(),
      factionB,
      time,
      duration,
      tableId: reserveTable ? reservedTable?.tableId || "" : "",
      tableSize: reserveTable ? reservedTable?.size || "" : "",
      matchSize,
      reserveTable,
      playerATime: initialMatch?.playerATime || "",
      playerBTime: initialMatch?.playerBTime || "",
      scoreA: initialMatch?.scoreA ?? null,
      scoreB: initialMatch?.scoreB ?? null,
      played: initialMatch?.played ?? false,
    });
    setSaving(false);

    if (success) {
      toast({
        title: initialMatch ? "Partido actualizado" : "Partido registrado",
        description: reserveTable && reservedTable
          ? `Reserva asignada: ${reservedTable.label}`
          : "Se guardo sin reserva de tablon",
      });

      if (!initialMatch) {
        setPlayerA("");
        setPlayerB("");
        setFactionA("");
        setFactionB("");
        setTime("");
        setDuration(config.estimatedDuration || "01:30");
      }

      onSuccess();
      onCancel?.();
      return;
    }

    toast({
      title: "Error",
      description: "No se pudo guardar el partido",
      variant: "destructive",
    });
  };

  const inputClass =
    "w-full rounded-2xl bg-input border border-border px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors";
  const labelClass =
    "text-xs font-heading uppercase tracking-widest text-muted-foreground mb-1 block";

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "glass-surface rounded-[28px] p-4 space-y-4 slide-up sm:p-5",
        className
      )}
    >
      <h3 className="text-gold font-heading text-sm tracking-widest uppercase">
        {title || (initialMatch ? "EDITAR PARTIDO" : "REGISTRAR PARTIDO")}
      </h3>

      {disabled && (
        <div className="rounded-[22px] border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {disabledMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Fecha (Viernes)</label>
          <FridayDatePicker
            value={date}
            onChange={setDate}
            disabled={Boolean(forcedDate) || disabled}
          />
        </div>

        <div>
          <label className={labelClass}>Horario *</label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
            disabled={disabled}
          >
            <option value="">Seleccionar</option>
            {availableTimeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Duracion *</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={inputClass}
            disabled={disabled}
          >
            {durationOptions.map((option) => (
              <option key={option} value={option}>
                {formatDurationLabel(option)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Tamaño de partida</label>
          <input value={matchSize} readOnly className={`${inputClass} opacity-80`} />
        </div>

        <div>
          <label className={labelClass}>Jugador A *</label>
          <input
            type="text"
            value={playerA}
            onChange={(e) => setPlayerA(e.target.value)}
            placeholder="Nombre"
            className={inputClass}
            maxLength={50}
            disabled={disabled}
          />
        </div>

        <div>
          <label className={labelClass}>Faccion A</label>
          <select
            value={factionA}
            onChange={(e) => setFactionA(e.target.value)}
            className={inputClass}
            disabled={disabled}
          >
            <option value="">Sin faccion</option>
            {factions.map((faction) => (
              <option key={faction.faction} value={faction.faction}>
                {faction.faction}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Jugador B</label>
          <input
            type="text"
            value={playerB}
            onChange={(e) => setPlayerB(e.target.value)}
            placeholder="Nombre (opcional)"
            className={inputClass}
            maxLength={50}
            disabled={disabled}
          />
        </div>

        <div>
          <label className={labelClass}>Faccion B</label>
          <select
            value={factionB}
            onChange={(e) => setFactionB(e.target.value)}
            className={inputClass}
            disabled={disabled}
          >
            <option value="">Sin faccion</option>
            {factions.map((faction) => (
              <option key={faction.faction} value={faction.faction}>
                {faction.faction}
              </option>
            ))}
          </select>
        </div>
      </div>

      <BoardReservationPanel
        matchSize={matchSize}
        duration={duration}
        tables={tables}
        allMatches={allMatches}
        selectedTime={time}
        selectedDate={date}
        reserveTable={reserveTable}
        onReserveTableChange={disabled ? () => undefined : setReserveTable}
      />

      <div
        className={cn(
          "space-y-2",
          stickyActions &&
            "sticky bottom-0 -mx-4 border-t border-white/8 bg-[linear-gradient(180deg,rgba(9,12,18,0.12),rgba(9,12,18,0.96)_28%)] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.35rem)] pt-3 sm:static sm:m-0 sm:border-0 sm:bg-transparent sm:p-0"
        )}
      >
        <button
          type="submit"
          disabled={saving || disabled}
          className="w-full rounded-2xl py-3 bg-gold text-primary-foreground font-heading uppercase tracking-widest text-sm hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {saving
            ? "GUARDANDO..."
            : submitLabel ||
              (initialMatch ? "GUARDAR CAMBIOS" : "REGISTRAR PARTIDO")}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-2xl py-3 bg-secondary text-secondary-foreground font-heading uppercase tracking-widest text-sm hover:bg-secondary/80 transition-colors"
          >
            CANCELAR
          </button>
        )}
      </div>
    </form>
  );
}
