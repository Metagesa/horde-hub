import { forwardRef, useState } from "react";
import { Edit2, MoreHorizontal, Trash2, Trophy } from "lucide-react";
import type { ParsedMatch } from "@/types";
import { clubLogoUrl, getPublicAssetPath } from "@/lib/assets";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  actionMode?: "bar" | "menu";
}

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
  const src = imagesMap[name];
  const color = colorsMap[name] || "#444";

  const clip =
    side === "left"
      ? "polygon(0 0, 80% 0, 100% 50%, 80% 100%, 0 100%)"
      : "polygon(20% 0, 100% 0, 100% 100%, 20% 100%, 0 50%)";

  return (
    <div
      className="relative h-9 w-9 shrink-0 sm:h-12 sm:w-12"
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
            className="h-full w-full scale-90 object-contain p-1.5 sm:p-3"
            onError={() => setError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
            {name ? name.slice(0, 4) : "?"}
          </div>
        )}
      </div>
    </div>
  );
}

function getWinner(match: ParsedMatch): "A" | "B" | null {
  if (!match.played || match.scoreA === null || match.scoreB === null) {
    return null;
  }

  if (match.scoreA > match.scoreB) {
    return "A";
  }

  if (match.scoreB > match.scoreA) {
    return "B";
  }

  return null;
}

function getPlayerClass(isWinner: boolean) {
  return isWinner
    ? "text-gold-light drop-shadow-[0_0_10px_rgba(212,162,67,0.35)]"
    : "text-white";
}

function MatchRow({
  match,
  imagesMap,
  colorsMap,
  onEdit,
  onResult,
  onDelete,
  actionMode,
  isMobileActionsOpen,
  onToggleMobileActions,
  isActionMenuOpen,
  onActionMenuOpenChange,
  onAction,
}: {
  match: ParsedMatch;
  imagesMap: Record<string, string>;
  colorsMap: Record<string, string>;
  onEdit?: () => void;
  onResult?: () => void;
  onDelete?: () => void;
  actionMode: "bar" | "menu";
  isMobileActionsOpen: boolean;
  onToggleMobileActions?: () => void;
  isActionMenuOpen: boolean;
  onActionMenuOpenChange?: (open: boolean) => void;
  onAction?: () => void;
}) {
  const showActions = onEdit || onResult || onDelete;
  const winner = getWinner(match);
  const useCompactActionMenu = actionMode === "menu";
  const rowClassName = `group relative flex items-center w-full bg-black/70 backdrop-blur-md border overflow-hidden transition-colors ${
    isMobileActionsOpen || isActionMenuOpen
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

  const triggerLabel = `Abrir acciones del partido ${match.playerA} contra ${match.playerB || "?"}`;
  const handleMenuAction = (action?: () => void) => {
    onActionMenuOpenChange?.(false);
    onAction?.();
    action?.();
  };

  return (
    <div
      className={rowClassName}
      onClick={
        showActions && !useCompactActionMenu ? onToggleMobileActions : undefined
      }
    >
      <div className="flex flex-1 items-center justify-start gap-1.5 sm:gap-2">
        <FactionBadge
          name={match.factionA}
          side="left"
          imagesMap={imagesMap}
          colorsMap={colorsMap}
        />
        <span
          className={`max-w-[70px] truncate text-xs font-black uppercase tracking-wide sm:max-w-[90px] sm:text-sm ${getPlayerClass(
            winner === "A"
          )}`}
        >
          {match.playerA}
        </span>
      </div>

      <div className="flex min-w-[68px] flex-col items-center justify-center px-1 sm:min-w-[80px] sm:px-2">
        {match.played ? (
          <>
            <span className="whitespace-nowrap text-xs font-black tracking-widest text-red-500 sm:text-sm">
              {match.scoreA} - {match.scoreB}
            </span>
            {(match.playerATime || match.playerBTime) && (
              <span className="mt-0.5 whitespace-nowrap text-[8px] font-medium text-gray-300 sm:text-[9px]">
                {match.playerATime || "--:--"} / {match.playerBTime || "--:--"}
              </span>
            )}
          </>
        ) : (
          <>
            <span className="text-sm font-black tracking-widest text-red-500 sm:text-base">
              VS
            </span>
            <span className="mt-0.5 text-[9px] font-medium text-gray-400 sm:text-[10px]">
              {match.time}
            </span>
          </>
        )}
      </div>

      <div
        className={`flex flex-1 items-center justify-end gap-1.5 sm:gap-2 ${
          useCompactActionMenu && showActions ? "pr-12 md:pr-36" : ""
        }`}
      >
        <span
          className={`max-w-[70px] truncate text-right text-xs font-black uppercase tracking-wide sm:max-w-[90px] sm:text-sm ${getPlayerClass(
            winner === "B"
          )}`}
        >
          {match.playerB || "?"}
        </span>
        <FactionBadge
          name={match.factionB}
          side="right"
          imagesMap={imagesMap}
          colorsMap={colorsMap}
        />
      </div>

      {showActions && useCompactActionMenu ? (
        <>
          <div className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 items-center gap-1 rounded-full border border-white/15 bg-black/75 px-1 py-1 backdrop-blur-sm transition-opacity md:flex md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            {onResult && (
              <button
                type="button"
                onClick={(event) => handleActionClick(event, onResult)}
                className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300 hover:text-white"
                title="Puntuar partido"
              >
                <Trophy size={11} />
                Puntuar
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
                title="Borrar partido"
              >
                <Trash2 size={11} />
                Borrar
              </button>
            )}
          </div>

          <DropdownMenu
            open={isActionMenuOpen}
            onOpenChange={onActionMenuOpenChange}
          >
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={triggerLabel}
                className="absolute right-2 top-2 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/75 text-gray-200 backdrop-blur-sm transition hover:border-white/30 hover:text-white md:top-1/2 md:-translate-y-1/2"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="min-w-[10rem] border-white/10 bg-slate-950/95 text-gray-100 backdrop-blur"
            >
              {onResult && (
                <DropdownMenuItem
                  onSelect={() => handleMenuAction(onResult)}
                  className="gap-2"
                >
                  <Trophy size={14} className="text-amber-300" />
                  Puntuar
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem
                  onSelect={() => handleMenuAction(onEdit)}
                  className="gap-2"
                >
                  <Edit2 size={14} className="text-gray-200" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onSelect={() => handleMenuAction(onDelete)}
                  className="gap-2 text-red-300 focus:text-red-200"
                >
                  <Trash2 size={14} />
                  Borrar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : showActions ? (
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

          <div className="absolute inset-x-0 bottom-0 hidden justify-center gap-2 bg-black/75 px-2 py-2 transition-opacity md:flex md:opacity-0 md:group-hover:opacity-100">
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
      actionMode = "bar",
    },
    ref
  ) => {
    const imagesMap: Record<string, string> = {};
    const colorsMap: Record<string, string> = {};
    const [mobileActionsMatchId, setMobileActionsMatchId] = useState<
      string | null
    >(null);
    const [openActionMatchId, setOpenActionMatchId] = useState<string | null>(
      null
    );

    factions.forEach((faction) => {
      if (faction.faction) {
        imagesMap[faction.faction] = faction.image;
        colorsMap[faction.faction] = faction.color;
      }
    });

    const finalBg =
      backgroundUrl || getPublicAssetPath("images/games/GuildBall/background.webp");
    const finalLogo = logoUrl || clubLogoUrl;

    return (
      <div className="flex w-full justify-center">
        <div
          ref={ref}
          className="relative w-full max-w-[450px] shrink-0 overflow-hidden border border-slate-800"
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
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2.5 px-4 pb-4 pt-5 sm:px-6 sm:pt-7">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg sm:h-16 sm:w-16">
                <img
                  src={finalLogo}
                  alt="Card Logo"
                  crossOrigin="anonymous"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex flex-col">
                <h3
                  className="whitespace-nowrap text-[11px] font-black uppercase tracking-[0.14em] sm:text-lg md:text-xl"
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

            <div className="flex flex-1 flex-col justify-center gap-2 px-0 py-2 sm:py-4">
              {matches.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <p
                    className="text-xs font-semibold uppercase tracking-wider sm:text-base"
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
                    actionMode={actionMode}
                    isMobileActionsOpen={
                      actionMode === "bar" && mobileActionsMatchId === match.id
                    }
                    onToggleMobileActions={() => {
                      setOpenActionMatchId(null);
                      setMobileActionsMatchId((currentId) =>
                        currentId === match.id ? null : match.id
                      );
                    }}
                    isActionMenuOpen={openActionMatchId === match.id}
                    onActionMenuOpenChange={(open) => {
                      setMobileActionsMatchId(null);
                      setOpenActionMatchId(open ? match.id : null);
                    }}
                    onAction={() => {
                      setMobileActionsMatchId(null);
                      setOpenActionMatchId(null);
                    }}
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
