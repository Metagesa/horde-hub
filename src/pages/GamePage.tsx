import { useCallback, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toPng } from "html-to-image";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Menu, ScrollText, Trophy } from "lucide-react";

import {
  useAllMatches,
  useConfigs,
  useFactions,
  useMatches,
  useTables,
} from "@/hooks/useGameData";
import MatchCard from "@/components/MatchCard";
import { MatchEditorModal } from "@/components/MatchEditorModal";
import { RegistrationForm } from "@/components/RegistrationForm";
import { ResultModal } from "@/components/ResultModal";
import { SiteLoading } from "@/components/SiteLoading";
import { Button } from "@/components/ui/button";
import { deleteMatch } from "@/lib/api";
import type { ParsedMatch } from "@/types";

function formatDateSpanish(iso: string): string {
  const months = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  const [year, month, day] = iso.split("-");
  return `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`;
}

const proxyImage = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) {
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
  }
  return url;
};

export default function GamePage() {
  const { gameId } = useParams();
  const queryClient = useQueryClient();
  const { data: configs, isLoading: configsLoading } = useConfigs();
  const { data: matches = [], isLoading: matchesLoading } = useMatches(gameId);
  const { data: factions = [] } = useFactions(gameId);
  const { data: tables = [] } = useTables();
  const { data: allMatches = {} } = useAllMatches(
    configs?.map((config) => config.gameId) || []
  );

  const config = configs?.find((item) => item.gameId === gameId);
  const [selectedEditMatch, setSelectedEditMatch] = useState<ParsedMatch | null>(
    null
  );
  const [selectedResultMatch, setSelectedResultMatch] =
    useState<ParsedMatch | null>(null);
  const [tab, setTab] = useState<"agenda" | "registro" | "resultados">(
    "agenda"
  );

  const upcomingRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["matches", gameId] });
    queryClient.invalidateQueries({ queryKey: ["allMatches"] });
  }, [gameId, queryClient]);

  const handleDelete = async (match: ParsedMatch) => {
    if (!gameId) return;

    if (window.confirm("Eliminar partido?")) {
      await deleteMatch(gameId, match.id);
      refresh();
    }
  };

  const download = async (
    ref: { current: HTMLDivElement | null },
    name: string
  ) => {
    if (!ref.current) return;

    const dataUrl = await toPng(ref.current, { pixelRatio: 3 });
    const link = document.createElement("a");
    link.download = name;
    link.href = dataUrl;
    link.click();
  };

  if (configsLoading || (!config && matchesLoading)) {
    return (
      <SiteLoading message="Si tarda mucho, probablemente algo no este configurado correctamente. Contacta al administrador para solucionarlo." />
    );
  }

  if (!config) {
    return (
      <SiteLoading message="Si tarda mucho, probablemente algo no este configurado correctamente. Contacta al administrador para solucionarlo." />
    );
  }

  const firstValidDate = matches.find((match) => match.date)?.date || "";
  const upcomingMatches = matches.filter((match) => !match.played);
  const resultMatches = matches.filter((match) => match.played);
  const gameLogo = proxyImage(config.logo);
  const gameBackground = proxyImage(config.backgroundImage);
  const mobileNavItems = [
    { id: "agenda", label: "Agenda", icon: CalendarDays },
    { id: "registro", label: "Registro", icon: ScrollText },
    { id: "resultados", label: "Resultados", icon: Trophy },
  ] as const;

  const openMobileSidebar = () => {
    window.dispatchEvent(new Event("open-mobile-sidebar"));
  };

  return (
    <div className="relative px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="site-panel glass-surface-strong relative overflow-hidden rounded-[28px] p-4 sm:p-6">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: gameBackground
                ? `linear-gradient(90deg, rgba(9,12,18,0.96), rgba(9,12,18,0.72), rgba(9,12,18,0.92)), url('${gameBackground}')`
                : "linear-gradient(135deg, rgba(173,30,43,0.18), transparent 35%)",
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          />

          <div className="relative flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-gold/25 bg-black/35 shadow-[0_0_30px_rgba(212,162,67,0.12)] sm:h-20 sm:w-20 sm:rounded-[22px]">
                  {gameLogo ? (
                    <img
                      src={gameLogo}
                      alt={config.displayName}
                      className="h-9 w-9 object-contain sm:h-14 sm:w-14"
                    />
                  ) : (
                    <img
                      src="/images/logoclub.png"
                      alt="Horda de Plata"
                      className="h-8 w-8 object-contain"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-sm tracking-[0.16em] text-gold-light sm:text-2xl sm:tracking-[0.22em]">
                    {config.displayName}
                  </h1>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-full border border-red-500/20 bg-black/30 px-2.5 py-1.5 sm:gap-3 sm:px-3 sm:py-2">
                <img
                  src="/images/logoclub.png"
                  alt="Horda de Plata"
                  className="h-6 w-6 object-contain sm:h-8 sm:w-8"
                />
                <div className="h-6 w-px bg-white/10 sm:h-8" />
                <span className="font-heading text-[10px] tracking-[0.18em] text-red-200/85 sm:text-xs sm:tracking-[0.28em]">
                  HORDA DE PLATA
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openMobileSidebar}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-muted-foreground transition-colors hover:text-white md:hidden"
                aria-label="Abrir menú"
                title="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex gap-2 md:hidden">
                {mobileNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = tab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${
                        active
                          ? "border-gold/50 bg-gold/15 text-gold-light shadow-[0_10px_30px_rgba(212,162,67,0.08)]"
                          : "border-white/10 bg-black/20 text-muted-foreground hover:border-red-400/25 hover:text-white"
                      }`}
                      aria-label={item.label}
                      title={item.label}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>

              <div className="hidden gap-2 md:flex">
              {["agenda", "registro", "resultados"].map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item as typeof tab)}
                  className={`rounded-full border px-4 py-2 text-sm font-heading tracking-[0.24em] uppercase transition-all ${
                    tab === item
                      ? "border-gold/50 bg-gold/15 text-gold-light shadow-[0_10px_30px_rgba(212,162,67,0.08)]"
                      : "border-white/10 bg-black/20 text-muted-foreground hover:border-red-400/25 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
              </div>
            </div>
          </div>
        </section>

        {tab === "agenda" && (
          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => download(upcomingRef, "proximos.png")}>
                Descargar proximos
              </Button>
            </div>

            <div className="mx-auto w-full max-w-[450px]">
              <MatchCard
                ref={upcomingRef}
                matches={upcomingMatches}
                dateLabel={
                  firstValidDate
                    ? `Partidos para el viernes ${formatDateSpanish(firstValidDate)}`
                    : "Sin fecha cargada"
                }
                title="PARTIDOS PROGRAMADOS"
                logoUrl={config.logo}
                backgroundUrl={config.backgroundImage}
                factions={factions}
                onEdit={setSelectedEditMatch}
                onResult={setSelectedResultMatch}
                onDelete={handleDelete}
              />
            </div>
          </section>
        )}

        {tab === "registro" && (
          <section className="mx-auto w-full max-w-lg fade-in">
            <RegistrationForm
              gameId={gameId!}
              config={config}
              factions={factions}
              tables={tables}
              allMatches={allMatches}
              onSuccess={refresh}
            />
          </section>
        )}

        {tab === "resultados" && (
          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => download(resultsRef, "resultados.png")}>
                Descargar resultados
              </Button>
            </div>

            <div className="mx-auto w-full max-w-[450px]">
              <MatchCard
                ref={resultsRef}
                matches={resultMatches}
                dateLabel={
                  firstValidDate
                    ? `Resultados del ${formatDateSpanish(firstValidDate)}`
                    : "Sin fecha cargada"
                }
                title="RESULTADOS"
                logoUrl={config.logo}
                backgroundUrl={config.backgroundImage}
                factions={factions}
                onEdit={setSelectedEditMatch}
                onResult={setSelectedResultMatch}
                onDelete={handleDelete}
              />
            </div>
          </section>
        )}

        {selectedEditMatch && gameId && (
          <MatchEditorModal
            match={selectedEditMatch}
            gameId={gameId}
            config={config}
            factions={factions}
            tables={tables}
            allMatches={allMatches}
            onClose={() => setSelectedEditMatch(null)}
            onSuccess={refresh}
          />
        )}

        {selectedResultMatch && gameId && (
          <ResultModal
            match={selectedResultMatch}
            gameId={gameId}
            onClose={() => setSelectedResultMatch(null)}
            onSuccess={refresh}
          />
        )}
      </div>
    </div>
  );
}
