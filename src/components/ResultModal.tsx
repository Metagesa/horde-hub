import { useState } from "react";
import type { ParsedMatch } from "@/types";
import { updateMatchResult } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ResultModalProps {
  match: ParsedMatch;
  gameId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ResultModal({ match, gameId, onClose, onSuccess }: ResultModalProps) {
  const { toast } = useToast();
  const [scoreA, setScoreA] = useState(match.scoreA?.toString() || "0");
  const [scoreB, setScoreB] = useState(match.scoreB?.toString() || "0");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const success = await updateMatchResult(
      gameId,
      match,
      Number(scoreA),
      Number(scoreB)
    );

    setSaving(false);

    if (success) {
      toast({ title: "Resultado guardado" });
      onSuccess();
      onClose();
    } else {
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="glass-surface-strong p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-gold font-heading text-sm tracking-widest uppercase mb-4">
          CARGAR RESULTADO
        </h3>

        <div className="text-center mb-4">
          <span className="text-sm font-heading uppercase tracking-wider text-foreground">
            {match.playerA} vs {match.playerB}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4 justify-center">
            <div className="text-center">
              <label className="text-xs font-heading uppercase tracking-widest text-muted-foreground block mb-1">
                {match.playerA}
              </label>
              <input
                type="number"
                min="0"
                max="99"
                value={scoreA}
                onChange={(e) => setScoreA(e.target.value)}
                className="w-16 text-center bg-input border border-border px-2 py-2 text-lg font-heading text-gold focus:outline-none focus:border-gold"
              />
            </div>

            <span className="text-gold font-heading text-lg mt-4">-</span>

            <div className="text-center">
              <label className="text-xs font-heading uppercase tracking-widest text-muted-foreground block mb-1">
                {match.playerB}
              </label>
              <input
                type="number"
                min="0"
                max="99"
                value={scoreB}
                onChange={(e) => setScoreB(e.target.value)}
                className="w-16 text-center bg-input border border-border px-2 py-2 text-lg font-heading text-gold focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-secondary text-secondary-foreground font-heading uppercase tracking-widest text-xs hover:bg-secondary/80 transition-colors"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-gold text-primary-foreground font-heading uppercase tracking-widest text-xs hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {saving ? "..." : "GUARDAR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
