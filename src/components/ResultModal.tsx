import { useState } from "react";
import { updateMatchResult } from "@/lib/api";
import type { ParsedMatch } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface ResultModalProps {
  match: ParsedMatch;
  gameId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function parsePlayerClock(value: string): { minutes: string; seconds: string } {
  const matched = String(value || "").match(/^(\d{1,3}):(\d{2})$/);

  if (!matched) {
    return { minutes: "", seconds: "" };
  }

  return {
    minutes: String(Number(matched[1])),
    seconds: matched[2],
  };
}

function formatPlayerClock(minutes: string, seconds: string): string {
  if (minutes.trim() === "" && seconds.trim() === "") {
    return "";
  }

  const parsedMinutes = Number(minutes || "0");
  const parsedSeconds = Number(seconds || "0");

  if (!Number.isFinite(parsedMinutes) || !Number.isFinite(parsedSeconds)) {
    return "";
  }

  return `${String(Math.max(0, parsedMinutes)).padStart(2, "0")}:${String(
    Math.min(59, Math.max(0, parsedSeconds))
  ).padStart(2, "0")}`;
}

export function ResultModal({
  match,
  gameId,
  onClose,
  onSuccess,
}: ResultModalProps) {
  const { toast } = useToast();
  const [scoreA, setScoreA] = useState(match.scoreA?.toString() || "");
  const [scoreB, setScoreB] = useState(match.scoreB?.toString() || "");
  const initialPlayerAClock = parsePlayerClock(match.playerATime);
  const initialPlayerBClock = parsePlayerClock(match.playerBTime);
  const [playerAMinutes, setPlayerAMinutes] = useState(initialPlayerAClock.minutes);
  const [playerASeconds, setPlayerASeconds] = useState(initialPlayerAClock.seconds);
  const [playerBMinutes, setPlayerBMinutes] = useState(initialPlayerBClock.minutes);
  const [playerBSeconds, setPlayerBSeconds] = useState(initialPlayerBClock.seconds);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const normalizedScoreA = scoreA.trim() === "" ? null : Number(scoreA);
    const normalizedScoreB = scoreB.trim() === "" ? null : Number(scoreB);

    const success = await updateMatchResult(
      gameId,
      match,
      normalizedScoreA,
      normalizedScoreB,
      formatPlayerClock(playerAMinutes, playerASeconds),
      formatPlayerClock(playerBMinutes, playerBSeconds)
    );

    setSaving(false);

    if (success) {
      toast({ title: "Resultado guardado" });
      onSuccess();
      onClose();
    } else {
      toast({
        title: "Error",
        description: "No se pudo guardar",
        variant: "destructive",
      });
    }
  };

  const clockInputClass =
    "w-full rounded-2xl bg-input border border-border px-3 py-2 text-sm font-body text-foreground text-center focus:outline-none focus:border-gold transition-colors";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="glass-surface-strong w-full max-w-md max-h-[100dvh] overflow-y-auto rounded-t-[28px] p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-gold font-heading text-sm tracking-widest uppercase">
          CARGAR RESULTADO
        </h3>

        <div className="mb-4 text-center">
          <span className="text-sm font-heading uppercase tracking-wider text-foreground">
            {match.playerA} vs {match.playerB}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <label className="mb-1 block text-xs font-heading uppercase tracking-widest text-muted-foreground">
                {match.playerA}
              </label>
              <input
                type="number"
                min="0"
                max="99"
                value={scoreA}
                onChange={(e) => setScoreA(e.target.value)}
                placeholder="-"
                className="w-16 rounded-2xl border border-border bg-input px-2 py-2 text-center text-lg font-heading text-gold focus:outline-none focus:border-gold"
              />
            </div>

            <span className="mt-4 text-gold font-heading text-lg">-</span>

            <div className="text-center">
              <label className="mb-1 block text-xs font-heading uppercase tracking-widest text-muted-foreground">
                {match.playerB}
              </label>
              <input
                type="number"
                min="0"
                max="99"
                value={scoreB}
                onChange={(e) => setScoreB(e.target.value)}
                placeholder="-"
                className="w-16 rounded-2xl border border-border bg-input px-2 py-2 text-center text-lg font-heading text-gold focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-3">
              <label className="mb-2 block text-xs font-heading uppercase tracking-widest text-muted-foreground">
                Tiempo {match.playerA}
              </label>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="999"
                  inputMode="numeric"
                  value={playerAMinutes}
                  onChange={(e) => setPlayerAMinutes(e.target.value)}
                  className={clockInputClass}
                  placeholder="Min"
                />
                <span className="text-lg font-heading text-gold">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  inputMode="numeric"
                  value={playerASeconds}
                  onChange={(e) => setPlayerASeconds(e.target.value)}
                  className={clockInputClass}
                  placeholder="Seg"
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-black/20 p-3">
              <label className="mb-2 block text-xs font-heading uppercase tracking-widest text-muted-foreground">
                Tiempo {match.playerB}
              </label>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="999"
                  inputMode="numeric"
                  value={playerBMinutes}
                  onChange={(e) => setPlayerBMinutes(e.target.value)}
                  className={clockInputClass}
                  placeholder="Min"
                />
                <span className="text-lg font-heading text-gold">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  inputMode="numeric"
                  value={playerBSeconds}
                  onChange={(e) => setPlayerBSeconds(e.target.value)}
                  className={clockInputClass}
                  placeholder="Seg"
                />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-white/8 bg-[linear-gradient(180deg,rgba(9,12,18,0.12),rgba(9,12,18,0.96)_28%)] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.35rem)] pt-3 sm:static sm:m-0 sm:border-0 sm:bg-transparent sm:p-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl bg-secondary py-2 text-secondary-foreground font-heading text-xs uppercase tracking-widest transition-colors hover:bg-secondary/80"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-2xl bg-gold py-2 text-primary-foreground font-heading text-xs uppercase tracking-widest transition-colors hover:bg-gold-light disabled:opacity-50"
            >
              {saving ? "..." : "GUARDAR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
