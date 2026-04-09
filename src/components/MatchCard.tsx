import { forwardRef, useState } from "react";

const factionImages: Record<string, string> = {
  Alchemists: "/images/factions/alchemists.png",
  Blacksmiths: "/images/factions/blacksmiths.png",
  Brewers: "/images/factions/brewers.png",
  Butchers: "/images/factions/butchers.png",
  Cooks: "/images/factions/cooks.png",
  Engineers: "/images/factions/engineers.png",
  Falconers: "/images/factions/falconers.png",
  Farmers: "/images/factions/farmers.png",
  Fishermen: "/images/factions/fishermen.png",
  Hunters: "/images/factions/hunters.png",
  Lamplighters: "/images/factions/lamplighters.png",
  Masons: "/images/factions/masons.png",
  Miners: "/images/factions/miners.png",
  Morticians: "/images/factions/morticians.png",
  Navigators: "/images/factions/navigators.png",
  "Order Of Solthecius": "/images/factions/order.png",
  Ratcatchers: "/images/factions/ratcatchers.png",
  Shepherds: "/images/factions/shepherds.png",
  "The Union": "/images/factions/union.png",
};

const factionColors: Record<string, string> = {
  Alchemists: "#d97706",
  Blacksmiths: "#6b7280",
  Brewers: "#92400e",
  Butchers: "#991b1b",
  Cooks: "#b45309",
  Engineers: "#0ea5e9",
  Falconers: "#16a34a",
  Farmers: "#65a30d",
  Fishermen: "#2563eb",
  Hunters: "#15803d",
  Lamplighters: "#f59e0b",
  Masons: "#eab308",
  Miners: "#57534e",
  Morticians: "#7c3aed",
  Navigators: "#0891b2",
  "Order Of Solthecius": "#dc2626",
  Ratcatchers: "#4b5563",
  Shepherds: "#a3a3a3",
  "The Union": "#9ca3af",
};

interface Match {
  date: string;
  playerA: string;
  factionA: string;
  playerB: string;
  factionB: string;
  time: string;

  scoreA?: number;
  scoreB?: number;
  played?: boolean;
}

interface MatchCardProps {
  matches: Match[];
  dateLabel: string;
  title?: string;
}

function FactionBadge({ name, side }: { name: string; side: "left" | "right" }) {
  const [error, setError] = useState(false);
  const src = factionImages[name];
  const color = factionColors[name] || "#444";

  const clip =
    side === "left"
      ? "polygon(0 0, 80% 0, 100% 50%, 80% 100%, 0 100%)"
      : "polygon(20% 0, 100% 0, 100% 100%, 20% 100%, 0 50%)";

  return (
    <div
      className="relative w-16 h-16 sm:w-18 sm:h-18 shrink-0"
      style={{
        clipPath: clip,
        background: color,
      }}
    >
      {/* capa interna (NO cambia tamaño externo) */}
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
            className="w-full h-full object-contain p-3 scale-90"
            onError={() => setError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-white font-bold">
            {name.slice(0, 4)}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchRow({ match }: { match: Match }) {
  return (
    <div className="flex items-center w-full bg-black/70 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">

      {/* LEFT SIDE */}
      <div className="flex items-center flex-1 justify-start gap-5">
        <div>
          <FactionBadge name={match.factionA} side="left" />
        </div>
        <span className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
          {match.playerA}
        </span>
      </div>

      {/* CENTER */}
      <div className="flex flex-col items-center justify-center px-4 min-w-[80px]">
        <div className="flex flex-col items-center justify-center px-4 min-w-[80px]">
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
      </div>
      {/* RIGHT SIDE */}
      <div className="flex items-center flex-1 justify-end gap-5">
        <span className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
          {match.playerB}
        </span>
        <div>
          <FactionBadge name={match.factionB} side="right" />
        </div>
      </div>
    </div>
  );
}

const MatchCard = forwardRef<HTMLDivElement, MatchCardProps>(
  ({ matches, dateLabel, title }, ref) => {
    return (
      <div
        ref={ref}
        className="w-full overflow-hidden"
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
    url('/images/background.jpg')
  `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "1px solid hsl(220,15%,16%)",
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 sm:px-6 pt-6 sm:pt-7 pb-4">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center shrink-0"
            >
              <img
                src="/images/logo.png"
                alt="Club Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h3
                className="text-sm sm:text-lg md:text-xl font-black uppercase tracking-[0.15em] whitespace-nowrap"
                style={{ color: "hsl(43,45%,58%)" }}
              >
                {title || "Partidos Semanales"}
              </h3>
              <p className="text-xs sm:text-sm font-medium mt-1" style={{ color: "hsl(215,12%,48%)" }}>{dateLabel}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-5 sm:mx-6" style={{ borderTop: "2px solid hsl(220,15%,18%)", boxShadow: "0 1px 0 hsl(220,15%,10%)" }} />

          {/* Body */}
          <div className="flex-1 flex flex-col justify-center py-5 sm:py-6 gap-3">
            {matches.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-base font-semibold uppercase tracking-wider" style={{ color: "hsl(215,12%,40%)" }}>
                  Sin partidos registrados
                </p>
              </div>
            ) : (
              matches.map((m, i) => (
                <MatchRow key={i} match={m} />
              ))
            )}
          </div>

          {/* Footer accent line */}
          <div
            className="h-1.5 w-full"
            style={{ background: "linear-gradient(90deg, hsl(0,65%,38%) 0%, hsl(43,40%,40%) 50%, hsl(220,30%,28%) 100%)" }}
          />
        </div>
      </div>
    );
  }
);

MatchCard.displayName = "MatchCard";

export default MatchCard;
