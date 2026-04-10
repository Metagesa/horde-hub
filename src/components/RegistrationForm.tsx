import { useEffect, useMemo, useState } from "react";
import type { ParsedMatch, GameConfig, GameTable } from "@/types";
import { saveMatch } from "@/lib/api";
import { TableSelector } from "./TableSelector";
import { useToast } from "@/hooks/use-toast";

interface RegistrationFormProps {
  gameId: string;
  config: GameConfig;
  tables: GameTable[];
  factions: Array<{ faction: string }>;
  allMatches: Record<string, ParsedMatch[]>;
  onSuccess: () => void;
  initialMatch?: ParsedMatch | null;
  title?: string;
  submitLabel?: string;
  onCancel?: () => void;
}

function getNextFridays(count: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  const current = new Date(today);
  const dayOfWeek = current.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
  current.setDate(current.getDate() + daysUntilFriday);

  for (let i = 0; i < count; i++) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 7);
  }

  return dates;
}

const TIME_SLOTS = [
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
];

export function RegistrationForm({
  gameId,
  config,
  factions = [],
  tables,
  allMatches,
  onSuccess,
  initialMatch = null,
  title,
  submitLabel,
  onCancel,
}: RegistrationFormProps) {
  const { toast } = useToast();
  const fridays = useMemo(() => getNextFridays(8), []);
  const availableDates = useMemo(() => {
    const extraDate = initialMatch?.date ? [initialMatch.date] : [];
    return Array.from(new Set([...extraDate, ...fridays].filter(Boolean)));
  }, [fridays, initialMatch?.date]);

  const [date, setDate] = useState(initialMatch?.date || fridays[0] || "");
  const [playerA, setPlayerA] = useState(initialMatch?.playerA || "");
  const [factionA, setFactionA] = useState(initialMatch?.factionA || "");
  const [playerB, setPlayerB] = useState(initialMatch?.playerB || "");
  const [factionB, setFactionB] = useState(initialMatch?.factionB || "");
  const [time, setTime] = useState(initialMatch?.time || "");
  const [selectedTable, setSelectedTable] = useState(initialMatch?.tableId || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDate(initialMatch?.date || fridays[0] || "");
    setPlayerA(initialMatch?.playerA || "");
    setFactionA(initialMatch?.factionA || "");
    setPlayerB(initialMatch?.playerB || "");
    setFactionB(initialMatch?.factionB || "");
    setTime(initialMatch?.time || "");
    setSelectedTable(initialMatch?.tableId || "");
  }, [fridays, initialMatch]);

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

    if (selectedTable) {
      for (const matches of Object.values(allMatches)) {
        for (const m of matches) {
          if (initialMatch?.id && m.id === initialMatch.id) {
            continue;
          }

          if (
            m.tableId === selectedTable &&
            m.time === time &&
            m.date === date &&
            !m.played
          ) {
            toast({
              title: "Mesa ocupada",
              description: `${selectedTable} ya esta ocupada a las ${time} por ${m.playerA} vs ${m.playerB}`,
              variant: "destructive",
            });
            return;
          }
        }
      }
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
      tableId: selectedTable,
      scoreA: initialMatch?.scoreA ?? null,
      scoreB: initialMatch?.scoreB ?? null,
      played: initialMatch?.played ?? false,
    });
    setSaving(false);

    if (success) {
      toast({
        title: initialMatch ? "Partido actualizado" : "Partido registrado",
        description: initialMatch
          ? "Los cambios se guardaron correctamente"
          : "El partido se guardo correctamente",
      });

      if (!initialMatch) {
        setPlayerA("");
        setPlayerB("");
        setFactionA("");
        setFactionB("");
        setTime("");
        setSelectedTable("");
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
    <form onSubmit={handleSubmit} className="glass-surface rounded-[28px] p-4 space-y-4 slide-up sm:p-5">
      <h3 className="text-gold font-heading text-sm tracking-widest uppercase">
        {title || (initialMatch ? "EDITAR PARTIDO" : "REGISTRAR PARTIDO")}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Fecha (Viernes)</label>
          <select
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          >
            {availableDates.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Horario *</label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          >
            <option value="">Seleccionar</option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
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
          />
        </div>

        <div>
          <label className={labelClass}>Faccion A</label>
          <select
            value={factionA}
            onChange={(e) => setFactionA(e.target.value)}
            className={inputClass}
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
          />
        </div>

        <div>
          <label className={labelClass}>Faccion B</label>
          <select
            value={factionB}
            onChange={(e) => setFactionB(e.target.value)}
            className={inputClass}
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

      <TableSelector
        tables={tables}
        allMatches={allMatches}
        selectedTime={time}
        selectedDate={date}
        selectedTable={selectedTable}
        onSelectTable={setSelectedTable}
      />

      <div className="space-y-2">
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl py-3 bg-gold text-primary-foreground font-heading uppercase tracking-widest text-sm hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {saving
            ? "GUARDANDO..."
            : submitLabel || (initialMatch ? "GUARDAR CAMBIOS" : "REGISTRAR PARTIDO")}
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
