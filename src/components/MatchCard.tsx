import { forwardRef, useState } from "react";
import { Edit2, Trash2, Trophy } from "lucide-react";
import type { ParsedMatch } from "@/types";

interface MatchCardProps {
  matches: ParsedMatch[];
  dateLabel: string;
  title?: string;
  logoUrl?: string;
  backgroundUrl?: string;
  factions?: Array<{ faction: string; image: string; color: string }>;
  onEdit?: (match: ParsedMatch) => void;
  onResult?: (match: ParsedMatch) => void;
  onDelete?: (match: ParsedMatch) => void;
}

const proxyImage = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) {
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
  }
  return url;
};

function FactionBadge({
  name,
  side,
  imagesMap,
  colorsMap,
}: {
  name: string;
  side: "left" | "right";
  imagesMap: Record<string, string>;
  colorsMap: Record<string, string>;
}) {
  const [error, setError] = useState(false);
  const src = proxyImage(imagesMap[name]);
  const color = colorsMap[name] || "#444";

  const clip =
    side === "left"
      ? "polygon(0 0, 80% 0, 100% 50%, 80% 100%, 0 100%)"
      : "polygon(20% 0, 100% 0, 100% 100%, 20% 100%, 0 50%)";

  return (
    <div
      className="relative w-9 h-9 sm:w-12 sm:h-12 shrink-0"
      style={{ clipPath: clip, background: color }}
    >
      <div
        className="absolute inset-[2px]"
        style={{
          clipPath: clip,
          background: "linear-gradient(135deg, rgba(0,0,0,0.6), #0b0f1a)",
        }}
      >
        {!error && src ? (
          <img
            src={src}
            alt={name}
            crossOrigin="anonymous"
            className="w-full h-full object-contain p-1.5 sm:p-3 scale-90"
            onError={() => setError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-white font-bold">
            {name ? name.slice(0, 4) : "?"}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchRow({
  match,
  imagesMap,
  colorsMap,
  onEdit,
  onResult,
  onDelete,
  isMobileActionsOpen,
  onToggleMobileActions,
}: {
  match: ParsedMatch;
  imagesMap: Record<string, string>;
  colorsMap: Record<string, string>;
  onEdit?: () => void;
  onResult?: () => void;
  onDelete?: () => void;
  isMobileActionsOpen: boolean;
  onToggleMobileActions?: () => void;
}) {
  const showActions = onEdit || onResult || onDelete;
  const rowClassName = `group relative flex items-center w-full bg-black/70 backdrop-blur-md border overflow-hidden transition-colors ${
    isMobileActionsOpen
      ? "border-white/30"
      : "border-white/10 hover:border-white/30"
  }`;

  const handleActionClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    action?: () => void
  ) => {
    event.stopPropagation();
    action?.();
  };

  return (
    <div
      className={rowClassName}
      onClick={showActions ? onToggleMobileActions : undefined}
    >
      <div className="flex items-center flex-1 justify-start gap-1.5 sm:gap-2">
        <FactionBadge
          name={match.factionA}
          side="left"
          imagesMap={imagesMap}
          colorsMap={colorsMap}
        />
        <span className="text-xs sm:text-sm font-black uppercase text-white tracking-wide truncate max-w-[70px] sm:max-w-[90px]">
          {match.playerA}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center px-1 sm:px-2 min-w-[50px] sm:min-w-[60px]">
        {match.played ? (
          <span className="text-red-500 font-black text-xs sm:text-sm tracking-widest whitespace-nowrap">
            {match.scoreA} - {match.scoreB}
          </span>
        ) : (
          <>
            <span className="text-red-500 font-black text-sm sm:text-base tracking-widest">
              VS
            </span>
            <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium mt-0.5">
              {match.time}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center flex-1 justify-end gap-1.5 sm:gap-2">
        <span className="text-xs sm:text-sm font-black uppercase text-white tracking-wide truncate max-w-[70px] sm:max-w-[90px] text-right">
          {match.playerB || "?"}
        </span>
        <FactionBadge
          name={match.factionB}
          side="right"
          imagesMap={imagesMap}
          colorsMap={colorsMap}
        />
      </div>

      {showActions ? (
        <>
          <div
            className={`absolute inset-x-0 bottom-0 justify-center gap-2 bg-black/75 px-2 py-2 md:hidden ${
              isMobileActionsOpen ? "flex" : "hidden"
            }`}
          >
            {onResult && (
              <button
                type="button"
                onClick={(event) => handleActionClick(event, onResult)}
                className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300 hover:text-white"
                title={match.played ? "Editar resultado" : "Cargar resultado"}
              >
                <Trophy size={11} />
                {match.played ? "Resultado" : "Cargar"}
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={(event) => handleActionClick(event, onEdit)}
                className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-200 hover:text-white"
                title="Editar partido"
              >
                <Edit2 size={11} />
                Editar
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={(event) => handleActionClick(event, onDelete)}
                className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-300 hover:text-white"
                title="Eliminar partido"
              >
                <Trash2 size={11} />
                Eliminar
              </button>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 hidden justify-center gap-2 bg-black/75 px-2 py-2 md:flex md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            {onResult && (
              <button
                type="button"
                onClick={(event) => handleActionClick(event, onResult)}
                className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300 hover:text-white"
                title={match.played ? "Editar resultado" : "Cargar resultado"}
              >
                <Trophy size={11} />
                {match.played ? "Resultado" : "Cargar"}
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={(event) => handleActionClick(event, onEdit)}
                className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-200 hover:text-white"
                title="Editar partido"
              >
                <Edit2 size={11} />
                Editar
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={(event) => handleActionClick(event, onDelete)}
                className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-300 hover:text-white"
                title="Eliminar partido"
              >
                <Trash2 size={11} />
                Eliminar
              </button>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

const MatchCard = forwardRef<HTMLDivElement, MatchCardProps>(
  (
    {
      matches,
      dateLabel,
      title,
      logoUrl,
      backgroundUrl,
      factions = [],
      onEdit,
      onResult,
      onDelete,
    },
    ref
  ) => {
    const imagesMap: Record<string, string> = {};
    const colorsMap: Record<string, string> = {};
    const [mobileActionsMatchId, setMobileActionsMatchId] = useState<
      string | null
    >(null);

    factions.forEach((faction) => {
      if (faction.faction) {
        imagesMap[faction.faction] = faction.image;
        colorsMap[faction.faction] = faction.color;
      }
    });

    const finalBg = proxyImage(backgroundUrl) || "/images/background.jpg";
    const finalLogo = proxyImage(logoUrl) || "/images/logo.png";

    return (
      <div className="w-full flex justify-center">
        <div
          ref={ref}
          className="relative w-full max-w-[450px] overflow-hidden border border-slate-800 shrink-0"
          style={{
            aspectRatio: "4 / 5",
            backgroundImage: `
            linear-gradient(
              rgba(0,0,0,0.95),
              rgba(0,0,0,0.35),
              rgba(0,0,0,0.35),
              rgba(0,0,0,0.35),
              rgba(0,0,0,0.85)
            ),
            url('${finalBg}')
          `,
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: "1px solid hsl(220,15%,16%)",
          }}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2.5 px-4 sm:px-6 pt-5 sm:pt-7 pb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg sm:h-16 sm:w-16">
                <img
                  src={finalLogo}
                  alt="Card Logo"
                  crossOrigin="anonymous"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0 flex flex-col">
                <h3
                  className="text-[11px] sm:text-lg md:text-xl font-black uppercase tracking-[0.14em] whitespace-nowrap"
                  style={{ color: "hsl(var(--gold-light))" }}
                >
                  {title || "Partidos Semanales"}
                </h3>
                <p
                  className="mt-1 whitespace-nowrap text-[10px] font-medium sm:text-sm"
                  style={{ color: "rgba(233, 223, 203, 0.72)" }}
                >
                  {dateLabel}
                </p>
              </div>
            </div>

            <div
              className="mx-5 sm:mx-6"
              style={{
                borderTop: "2px solid hsl(220,15%,18%)",
                boxShadow: "0 1px 0 hsl(220,15%,10%)",
              }}
            />

            <div className="flex-1 flex flex-col justify-center py-2 sm:py-4 gap-2 px-0">
              {matches.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p
                    className="text-xs sm:text-base font-semibold uppercase tracking-wider"
                    style={{ color: "hsl(215,12%,40%)" }}
                  >
                    Sin partidos registrados
                  </p>
                </div>
              ) : (
                matches.slice(0, 6).map((match) => (
                  <MatchRow
                    key={match.id}
                    match={match}
                    imagesMap={imagesMap}
                    colorsMap={colorsMap}
                    onEdit={onEdit ? () => onEdit(match) : undefined}
                    onResult={onResult ? () => onResult(match) : undefined}
                    onDelete={onDelete ? () => onDelete(match) : undefined}
                    isMobileActionsOpen={mobileActionsMatchId === match.id}
                    onToggleMobileActions={() =>
                      setMobileActionsMatchId((currentId) =>
                        currentId === match.id ? null : match.id
                      )
                    }
                  />
                ))
              )}
            </div>

            <div
              className="h-1.5 w-full"
              style={{
                background:
                  "linear-gradient(90deg, hsl(0,65%,38%) 0%, hsl(43,40%,40%) 50%, hsl(220,30%,28%) 100%)",
              }}
            />
          </div>
        </div>
      </div>
    );
  }
);

MatchCard.displayName = "MatchCard";

export default MatchCard;
