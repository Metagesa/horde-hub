import { useState } from "react";
import type { ParsedMatch, GameConfig, GameTable } from "@/types";
import { saveMatch } from "@/lib/api";
import { TableSelector } from "./TableSelector";
import { useToast } from "@/hooks/use-toast";

interface RegistrationFormProps {
  gameId: string;
  config: GameConfig;
  tables: GameTable[];
  allMatches: Record<string, ParsedMatch[]>;
  onSuccess: () => void;
}

function getNextFridays(count: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  const current = new Date(today);
  // Find next Friday
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
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30", "23:00",
];

export function RegistrationForm({
  gameId,
  config,
  tables,
  allMatches,
  onSuccess,
}: RegistrationFormProps) {
  const { toast } = useToast();
  const fridays = getNextFridays(8);

  const [date, setDate] = useState(fridays[0] || "");
  const [playerA, setPlayerA] = useState("");
  const [factionA, setFactionA] = useState("");
  const [playerB, setPlayerB] = useState("");
  const [factionB, setFactionB] = useState("");
  const [time, setTime] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerA.trim()) {
      toast({ title: "Error", description: "Jugador A es requerido", variant: "destructive" });
      return;
    }
    if (!time) {
      toast({ title: "Error", description: "Horario es requerido", variant: "destructive" });
      return;
    }

    // Validate table not occupied
    if (selectedTable) {
      for (const [gId, matches] of Object.entries(allMatches)) {
        for (const m of matches) {
          if (m.tableId === selectedTable && m.time === time && m.date === date && !m.played) {
            toast({
              title: "Mesa ocupada",
              description: `${selectedTable} ya está ocupada a las ${time} por ${m.playerA} vs ${m.playerB}`,
              variant: "destructive",
            });
            return;
          }
        }
      }
    }

    setSaving(true);
    const success = await saveMatch(gameId, {
      date,
      playerA: playerA.trim().toUpperCase(),
      factionA,
      playerB: playerB.trim().toUpperCase(),
      factionB,
      time,
      tableId: selectedTable,
    });

    setSaving(false);

    if (success) {
      toast({ title: "Partido registrado", description: "El partido se guardó correctamente" });
      setPlayerA("");
      setPlayerB("");
      setFactionA("");
      setFactionB("");
      setTime("");
      setSelectedTable("");
      onSuccess();
    } else {
      toast({ title: "Error", description: "No se pudo guardar el partido", variant: "destructive" });
    }
  };

  const inputClass =
    "w-full bg-input border border-border px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors";
  const labelClass = "text-xs font-heading uppercase tracking-widest text-muted-foreground mb-1 block";

  return (
    <form onSubmit={handleSubmit} className="glass-surface p-4 space-y-4 slide-up">
      <h3 className="text-gold font-heading text-sm tracking-widest uppercase">
        REGISTRAR PARTIDO
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date */}
        <div>
          <label className={labelClass}>Fecha (Viernes)</label>
          <select value={date} onChange={(e) => setDate(e.target.value)} className={inputClass}>
            {fridays.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Time */}
        <div>
          <label className={labelClass}>Horario *</label>
          <select value={time} onChange={(e) => setTime(e.target.value)} className={inputClass}>
            <option value="">Seleccionar</option>
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Player A */}
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

        {/* Faction A */}
        <div>
          <label className={labelClass}>Facción A</label>
          <select value={factionA} onChange={(e) => setFactionA(e.target.value)} className={inputClass}>
            <option value="">Sin facción</option>
            {config.factions.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Player B */}
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

        {/* Faction B */}
        <div>
          <label className={labelClass}>Facción B</label>
          <select value={factionB} onChange={(e) => setFactionB(e.target.value)} className={inputClass}>
            <option value="">Sin facción</option>
            {config.factions.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Selector */}
      <TableSelector
        tables={tables}
        allMatches={allMatches}
        selectedTime={time}
        selectedDate={date}
        selectedTable={selectedTable}
        onSelectTable={setSelectedTable}
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 bg-gold text-primary-foreground font-heading uppercase tracking-widest text-sm hover:bg-gold-light transition-colors disabled:opacity-50"
      >
        {saving ? "GUARDANDO..." : "REGISTRAR PARTIDO"}
      </button>
    </form>
  );
}
