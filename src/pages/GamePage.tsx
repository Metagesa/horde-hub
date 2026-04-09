import { useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toPng } from "html-to-image";
import { useQueryClient } from "@tanstack/react-query";

import { useConfigs, useMatches, useTables, useAllMatches } from "@/hooks/useGameData";
import MatchCard from "@/components/MatchCard";
import { ResultModal } from "@/components/ResultModal";


import { RegistrationForm } from "@/components/RegistrationForm";
import { Button } from "@/components/ui/button";

function formatDateSpanish(iso: string): string {
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  const [y, m, day] = iso.split("-");
  return `${parseInt(day)} de ${months[parseInt(m) - 1]} de ${y}`;
}

export default function GamePage() {
  const { gameId } = useParams();
  const queryClient = useQueryClient();
  const { data: configs } = useConfigs();
  const { data: matches = [] } = useMatches(gameId); const config = configs?.find((c) => c.gameId === gameId);

  const { data: tables } = useTables();
  const { data: allMatches } = useAllMatches(configs?.map(c => c.gameId) || []);


  const [tab, setTab] = useState<"agenda" | "registro" | "resultados">("agenda");

  const upcomingRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const upcoming = matches?.filter((m) => !m.played) || [];
  const results = matches?.filter((m) => m.played) || [];

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["matches", gameId] });
    queryClient.invalidateQueries({ queryKey: ["allMatches"] });
  }, [queryClient, gameId]);

  const download = async (ref: any, name: string) => {
    if (!ref.current) return;

    const dataUrl = await toPng(ref.current, { pixelRatio: 3 });
    const link = document.createElement("a");
    link.download = name;
    link.href = dataUrl;
    link.click();
  };

  if (!config) return null;
  console.log("RAW matches:", matches);

  const parsedMatches = (matches || []).map((m) => ({
    date: m.date,
    playerA: m.playerA || m.player_a || "",
    factionA: m.factionA || m.faction_a || "",
    playerB: m.playerB || m.player_b || "",
    factionB: m.factionB || m.faction_b || "",
    time: m.time,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
    played: m.played,
  }));

  const date = parsedMatches[0]?.date || "";

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <h1 className="text-gold font-heading text-xl tracking-widest uppercase">
          {config.displayName}
        </h1>

        {/* TABS */}
        <div className="flex gap-6 border-b border-border">
          {["agenda", "registro", "resultados"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`pb-2 text-sm font-heading tracking-widest uppercase ${tab === t
                ? "text-gold border-b-2 border-gold"
                : "text-muted-foreground"
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ================= AGENDA ================= */}
      {tab === "agenda" && (
        <>
          <div className="flex gap-3">
            <Button onClick={() => download(upcomingRef, "proximos.png")}>
              Descargar próximos
            </Button>

            <Button onClick={() => download(resultsRef, "resultados.png")}>
              Descargar resultados
            </Button>
          </div>

          <MatchCard
            ref={upcomingRef}
            matches={parsedMatches.filter(m => !m.played)}
            dateLabel={"Partidos para el viernes " + formatDateSpanish(date)}
            title="PARTIDOS PROGRAMADOS"
          />

          <MatchCard
            ref={resultsRef}
            matches={parsedMatches.filter(m => m.played)}
            dateLabel={"Resultados del " + formatDateSpanish(date)}
            title="RESULTADOS"
          />
        </>
      )}

      {/* ================= REGISTRO ================= */}
      {tab === "registro" && (
        <div className="max-w-lg fade-in">
          <RegistrationForm
            gameId={gameId!}
            config={config}
            tables={tables || []}
            allMatches={allMatches || {}}
            onSuccess={refresh}
          />
        </div>
      )}

      {/* ================= RESULTADOS ================= */}
      {tab === "resultados" && (
        <MatchCard
          ref={resultsRef}
          matches={parsedMatches.filter(m => m.played)}
          dateLabel={"Resultados del " + formatDateSpanish(date)}
          title="RESULTADOS"
        />
      )}
    </div>
  );
}