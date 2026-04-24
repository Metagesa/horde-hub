import { lazy, Suspense, useCallback, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, LayoutGrid, Menu, ScrollText, Trophy } from "lucide-react";
import { deleteMatch } from "@/lib/api";

import {
  useBoardAvailability,
  useConfigs,
  useFactions,
  useMatches,
} from "@/hooks/useGameData";
import { FridayDatePicker } from "@/components/FridayDatePicker";
import {
  formatDateSpanish,
  getCurrentOrNextFriday,
  isPastDate,
} from "@/lib/dates";
import { clubLogoUrl } from "@/lib/assets";
import MatchCard from "@/components/MatchCard";
import { SiteLoading } from "@/components/SiteLoading";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getStoredAdminSession } from "@/lib/adminAuth";
import type { ParsedMatch } from "@/types";

const RegistrationForm = lazy(async () => {
  const module = await import("@/components/RegistrationForm");
  return { default: module.RegistrationForm };
});

const BoardsHeatmap = lazy(async () => {
  const module = await import("@/components/BoardsHeatmap");
  return { default: module.BoardsHeatmap };
});

const MatchEditorModal = lazy(async () => {
  const module = await import("@/components/MatchEditorModal");
  return { default: module.MatchEditorModal };
});

const ResultModal = lazy(async () => {
  const module = await import("@/components/ResultModal");
  return { default: module.ResultModal };
});

function DeferredPanelLoading({ message }: { message: string }) {
  return (
    <div className="site-panel glass-surface rounded-[28px] px-4 py-8 text-center sm:px-5">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export default function GamePage() {
  const { gameId } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: configs } = useConfigs();
  const { data: factions = [] } = useFactions(gameId);

  const [tab, setTab] = useState<"agenda" | "registro" | "mesas" | "resultados">(
    "agenda"
  );
  const [selectedDate, setSelectedDate] = useState(getCurrentOrNextFriday);
  const [selectedEditMatch, setSelectedEditMatch] = useState<ParsedMatch | null>(
    null
  );
  const [selectedResultMatch, setSelectedResultMatch] =
    useState<ParsedMatch | null>(null);
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null);
  const selectedDateIsPast = isPastDate(selectedDate);
  const adminSession = getStoredAdminSession();
  const canManageMatches = Boolean(adminSession);
  const needsBoardAvailability =
    tab === "registro" || tab === "mesas" || selectedEditMatch !== null;
  const {
    data: matchesState = { matches: [], visibilityWarning: null },
    isLoading: matchesLoading,
    error: matchesError,
  } = useMatches(gameId, { refetchInterval: 60_000 });
  const { matches, visibilityWarning } = matchesState;

  const upcomingRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const config = configs.find((item) => item.gameId === gameId);
  const {
    data: boardAvailability = {
      tables: [],
      timeSlots: [],
      reservationMatches: {},
      assignmentsByTime: {},
    },
    isLoading: boardAvailabilityLoading,
  } = useBoardAvailability(selectedDate, {
    enabled: needsBoardAvailability && !selectedDateIsPast,
    refetchInterval: needsBoardAvailability && !selectedDateIsPast ? 60_000 : false,
  });
  const {
    tables,
    timeSlots: boardTimeSlots,
    reservationMatches,
    assignmentsByTime,
  } = boardAvailability;

  const gameMatchesForSelectedDate = useMemo(
    () =>
      matches
        .filter((match) => !selectedDate || match.date === selectedDate)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [matches, selectedDate]
  );

  const scheduledMatchesForSelectedDate = useMemo(
    () =>
      gameMatchesForSelectedDate.filter(
        (match) => !match.played && match.status !== "completed"
      ),
    [gameMatchesForSelectedDate]
  );

  const resultsForSelectedDate = useMemo(
    () =>
      gameMatchesForSelectedDate.filter(
        (match) => match.played || match.status === "completed"
      ),
    [gameMatchesForSelectedDate]
  );

  const effectiveTimeSlots = useMemo(() => {
    if (boardTimeSlots.length > 0) {
      return boardTimeSlots;
    }

    return Array.from(
      new Set(
        matches
          .map((match) => match.time)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b))
      )
    );
  }, [boardTimeSlots, matches]);
  const reservationMatchesWithCurrentGame = useMemo(
    () =>
      gameId
        ? {
            ...reservationMatches,
            [gameId]: matches.filter(
              (match) =>
                match.date === selectedDate &&
                !match.played &&
                (Boolean(match.tableId) || Boolean(match.tableSize))
            ),
          }
        : reservationMatches,
    [gameId, matches, reservationMatches, selectedDate]
  );
  const matchesErrorMessage =
    matchesError instanceof Error
      ? matchesError.message
      : "No se pudieron cargar los partidos.";

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["matches", gameId] });
    queryClient.invalidateQueries({ queryKey: ["boardAvailability"] });
  }, [gameId, queryClient]);

  const download = async (
    ref: { current: HTMLDivElement | null },
    name: string
  ) => {
    if (!ref.current) return;

    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(ref.current, { pixelRatio: 3 });
    const link = document.createElement("a");
    link.download = name;
    link.href = dataUrl;
    link.click();
  };

  const handleDelete = useCallback(
    async (match: ParsedMatch) => {
      if (!gameId || !window.confirm("Eliminar partido?")) {
        return;
      }

      setBusyMatchId(match.id);
      const success = await deleteMatch(gameId, match.id);
      setBusyMatchId(null);

      if (success) {
        toast({ title: "Partido eliminado" });
        refresh();
        return;
      }

      toast({
        title: "Error",
        description: "No se pudo eliminar el partido",
        variant: "destructive",
      });
    },
    [gameId, refresh, toast]
  );

  if (!config) {
    return (
      <SiteLoading message="Si tarda mucho, probablemente algo no este configurado correctamente. Contacta al administrador para solucionarlo." />
    );
  }

  const gameLogo = config.logo;
  const gameBackground = config.backgroundImage;
  const mobileNavItems = [
    { id: "agenda", label: "Agenda", icon: CalendarDays },
    { id: "registro", label: "Registro", icon: ScrollText },
    { id: "mesas", label: "Mesas", icon: LayoutGrid },
    { id: "resultados", label: "Resultados", icon: Trophy },
  ] as const;

  const openMobileSidebar = () => {
    window.dispatchEvent(new Event("open-mobile-sidebar"));
  };

  const reservationDataPending =
    needsBoardAvailability &&
    !selectedDateIsPast &&
    (matchesLoading || boardAvailabilityLoading);

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
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex sm:hidden">
                <div className="flex shrink-0 items-center gap-2 rounded-full border border-red-500/20 bg-black/30 px-2.5 py-1.5">
                  <img
                    src={clubLogoUrl}
                    alt="Horda de Plata"
                    className="h-6 w-6 object-contain"
                  />
                  <div className="h-6 w-px bg-white/10" />
                  <span className="font-heading text-[10px] tracking-[0.18em] text-red-200/85">
                    HORDA DE PLATA
                  </span>
                </div>
              </div>

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
                      src={clubLogoUrl}
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

              <div className="hidden shrink-0 items-center gap-2 rounded-full border border-red-500/20 bg-black/30 px-2.5 py-1.5 sm:flex sm:gap-3 sm:px-3 sm:py-2">
                <img
                  src={clubLogoUrl}
                  alt="Horda de Plata"
                  className="h-6 w-6 object-contain sm:h-8 sm:w-8"
                />
                <div className="h-6 w-px bg-white/10 sm:h-8" />
                <span className="font-heading text-[10px] tracking-[0.18em] text-red-200/85 sm:text-xs sm:tracking-[0.28em]">
                  HORDA DE PLATA
                </span>
              </div>
            </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openMobileSidebar}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-muted-foreground transition-colors hover:text-white md:hidden"
                aria-label="Abrir menu"
                title="Abrir menu"
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
                {["agenda", "registro", "mesas", "resultados"].map((item) => (
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

              <div className="min-w-[180px] flex-1 md:flex-none">
                <FridayDatePicker value={selectedDate} onChange={setSelectedDate} />
              </div>
            </div>
          </div>
        </section>

        {matchesError ? (
          <section className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {matchesErrorMessage}
          </section>
        ) : null}

        {visibilityWarning ? (
          <section className="rounded-[24px] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {visibilityWarning}
          </section>
        ) : null}

        {tab === "agenda" && (
          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  download(
                    upcomingRef,
                    selectedDate ? `agenda-${selectedDate}.png` : "agenda.png"
                  )
                }
              >
                Descargar agenda
              </Button>
            </div>

            {matchesLoading && matches.length === 0 ? (
              <DeferredPanelLoading message="Cargando agenda..." />
            ) : (
              <div className="mx-auto w-full max-w-[450px]">
                <MatchCard
                  ref={upcomingRef}
                  matches={scheduledMatchesForSelectedDate}
                  dateLabel={
                    selectedDate
                      ? `Partidos para el viernes ${formatDateSpanish(selectedDate)}`
                      : "Sin fecha cargada"
                  }
                  title="PARTIDOS PROGRAMADOS"
                  logoUrl={config.logo}
                  backgroundUrl={config.backgroundImage}
                  factions={factions}
                  onEdit={canManageMatches ? (match) => setSelectedEditMatch(match) : undefined}
                  onResult={
                    canManageMatches
                      ? (match) => setSelectedResultMatch(match)
                      : undefined
                  }
                  onDelete={
                    canManageMatches
                      ? (match) =>
                          busyMatchId === match.id ? undefined : handleDelete(match)
                      : undefined
                  }
                />
              </div>
            )}
          </section>
        )}

        {tab === "registro" && (
          <section className="mx-auto w-full max-w-lg fade-in">
            {reservationDataPending ? (
              <SiteLoading message="Cargando disponibilidad de tablones..." />
            ) : (
              <Suspense
                fallback={
                  <DeferredPanelLoading message="Cargando registro de partidas..." />
                }
              >
                <RegistrationForm
                  gameId={gameId!}
                  config={config}
                  factions={factions}
                  tables={tables}
                  timeSlots={effectiveTimeSlots}
                  allMatches={reservationMatchesWithCurrentGame}
                  onSuccess={refresh}
                  forcedDate={selectedDate}
                  disabled={selectedDateIsPast}
                  disabledMessage="Las reservas y nuevas partidas no se gestionan desde viernes pasados."
                />
              </Suspense>
            )}
          </section>
        )}

        {tab === "mesas" && (
          reservationDataPending ? (
            <SiteLoading message="Cargando disponibilidad de tablones..." />
          ) : (
            <Suspense
              fallback={
                <DeferredPanelLoading message="Cargando disponibilidad de tablones..." />
              }
            >
              <BoardsHeatmap
                tables={tables}
                assignmentsByTime={assignmentsByTime}
                configs={configs}
                selectedDate={selectedDate}
                timeSlots={effectiveTimeSlots}
                disabled={selectedDateIsPast}
              />
            </Suspense>
          )
        )}

        {tab === "resultados" && (
          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  download(
                    resultsRef,
                    selectedDate
                      ? `resultados-${selectedDate}.png`
                      : "resultados.png"
                  )
                }
              >
                Descargar resultados
              </Button>
            </div>

            {matchesLoading && matches.length === 0 ? (
              <DeferredPanelLoading message="Cargando resultados..." />
            ) : (
              <div className="mx-auto w-full max-w-[450px]">
                <MatchCard
                  ref={resultsRef}
                  matches={resultsForSelectedDate}
                  dateLabel={
                    selectedDate
                      ? `Resultados del ${formatDateSpanish(selectedDate)}`
                      : "Sin fecha cargada"
                  }
                  title="RESULTADOS"
                  logoUrl={config.logo}
                  backgroundUrl={config.backgroundImage}
                  factions={factions}
                  onEdit={canManageMatches ? (match) => setSelectedEditMatch(match) : undefined}
                  onResult={
                    canManageMatches
                      ? (match) => setSelectedResultMatch(match)
                      : undefined
                  }
                  onDelete={
                    canManageMatches
                      ? (match) =>
                          busyMatchId === match.id ? undefined : handleDelete(match)
                      : undefined
                  }
                />
              </div>
            )}
          </section>
        )}

        {selectedEditMatch && gameId && (
          reservationDataPending ? (
            <SiteLoading message="Cargando disponibilidad de tablones..." />
          ) : (
            <Suspense
              fallback={<SiteLoading message="Cargando editor de partidas..." />}
            >
              <MatchEditorModal
                match={selectedEditMatch}
                gameId={gameId}
                config={config}
                factions={factions}
                tables={tables}
                timeSlots={effectiveTimeSlots}
                allMatches={reservationMatchesWithCurrentGame}
                onClose={() => setSelectedEditMatch(null)}
                onSuccess={refresh}
              />
            </Suspense>
          )
        )}

        {selectedResultMatch && gameId && (
          <Suspense
            fallback={<SiteLoading message="Cargando carga de resultados..." />}
          >
            <ResultModal
              match={selectedResultMatch}
              gameId={gameId}
              onClose={() => setSelectedResultMatch(null)}
              onSuccess={refresh}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
