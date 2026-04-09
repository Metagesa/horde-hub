import type { ParsedMatch, GameConfig } from "@/types";

function FactionBadge({
  faction,
  config,
  side,
}: {
  faction: string;
  config: GameConfig;
  side: "left" | "right";
}) {
  const color = config.factionColors[faction] || "#444";
  const image = config.factionImages[faction];

  const clip =
    side === "left"
      ? "polygon(0 0, 80% 0, 100% 50%, 80% 100%, 0 100%)"
      : "polygon(20% 0, 100% 0, 100% 100%, 20% 100%, 0 50%)";

  return (
    <div
      className="relative w-16 h-16 shrink-0"
      style={{
        clipPath: clip,
        background: color,
      }}
    >
      {/* inner layer para borde perfecto sin cambiar tamaño */}
      <div
        className="absolute inset-[2px]"
        style={{
          clipPath: clip,
          background: "linear-gradient(135deg, rgba(0,0,0,0.6), #0b0f1a)",
        }}
      >
        {image ? (
          <img
            src={image}
            alt={faction}
            className="w-full h-full object-contain p-3 scale-90"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-white font-bold">
            {faction.slice(0, 3)}
          </div>
        )}
      </div>
    </div>
  );
}

interface MatchRowProps {
  match: ParsedMatch;
  config: GameConfig;
  onEdit?: (match: ParsedMatch) => void;
  onDelete?: (match: ParsedMatch) => void;
  onResult?: (match: ParsedMatch) => void;
}

export function MatchRow({
  match,
  config,
  onEdit,
  onDelete,
  onResult,
}: MatchRowProps) {
  return (
    <div className="relative flex items-center w-full bg-black/70 backdrop-blur-md border border-white/10 overflow-hidden group">

      {/* LEFT */}
      <div className="flex items-center flex-1 justify-start gap-5 pl-0">
        <FactionBadge faction={match.factionA} config={config} side="left" />
        <span className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
          {match.playerA}
        </span>
      </div>

      {/* CENTER */}
      <div className="flex flex-col items-center justify-center px-4 min-w-[90px]">
        {match.played ? (
          <span className="text-red-500 font-black text-lg tracking-widest">
            {match.scoreA} - {match.scoreB}
          </span>
        ) : (
          <>
            <span className="text-red-500 font-black text-xl tracking-widest">
              VS
            </span>
            <span className="text-xs text-gray-400 mt-1 font-medium">
              {match.time}
            </span>
          </>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex items-center flex-1 justify-end gap-5 pr-0">
        <span className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
          {match.playerB || ""}
        </span>
        <FactionBadge faction={match.factionB} config={config} side="right" />
      </div>

      {/* ACTIONS OVERLAY */}
      <div className="absolute inset-0 hidden group-hover:flex items-center justify-end pr-4 gap-2 bg-black/60 backdrop-blur-sm">

        {onResult && !match.played && (
          <button
            onClick={() => onResult(match)}
            className="text-xs text-yellow-400 underline"
          >
            Resultado
          </button>
        )}

        {onEdit && (
          <button
            onClick={() => onEdit(match)}
            className="text-xs text-primary underline"
          >
            Editar
          </button>
        )}

        {onDelete && (
          <button
            onClick={() => onDelete(match)}
            className="text-xs text-red-500"
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}