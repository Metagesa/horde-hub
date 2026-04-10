import type { GameConfig, GameTable, ParsedMatch } from "@/types";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwcmcsrOj7K28SPkiBNpDvcZlTslMxzNM2APiN5XYDwrvkJcjnwK3cspym4XcQ-HQfm/exec";

type RawGame = {
  gameId: string;
  displayName?: string;
  logo?: string;
  backgroundImage?: string;
};

type RawFaction = {
  gameId: string;
  faction: string;
  image: string;
  color: string;
};

type RawMatch = {
  id: string | number;
  date: string;
  playerA: string;
  factionA: string;
  playerB: string;
  factionB: string;
  time: string;
  tableId?: string;
  scoreA?: string | number;
  scoreB?: string | number;
  played?: boolean | string;
  status?: string;
  createdAt?: string;
  gameId?: string;
};

const DEFAULT_TABLES: GameTable[] = [
  { tableId: "Mesa 1", size: "small", enabled: true },
  { tableId: "Mesa 2", size: "small", enabled: true },
  { tableId: "Mesa 3", size: "medium", enabled: true },
  { tableId: "Mesa 4", size: "medium", enabled: true },
  { tableId: "Mesa 5", size: "large", enabled: true },
];

function normalizeDate(date?: string): string {
  if (!date) return "";
  return date.includes("T") ? date.split("T")[0] : date;
}

function normalizeTime(time?: string): string {
  if (!time) return "";

  if (typeof time === "string" && time.includes("T")) {
    const d = new Date(time);
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(
      d.getUTCMinutes()
    ).padStart(2, "0")}`;
  }

  return time;
}

function normalizePlayed(value: unknown): boolean {
  return (
    value === true ||
    value === "true" ||
    value === "TRUE" ||
    value === "✓"
  );
}

export function parseMatch(raw: RawMatch): ParsedMatch {
  return {
    id: String(raw.id ?? ""),
    date: normalizeDate(raw.date),
    playerA: raw.playerA || "",
    factionA: raw.factionA || "",
    playerB: raw.playerB || "",
    factionB: raw.factionB || "",
    time: normalizeTime(raw.time),
    tableId: raw.tableId || "",
    scoreA:
      raw.scoreA !== "" && raw.scoreA !== undefined ? Number(raw.scoreA) : null,
    scoreB:
      raw.scoreB !== "" && raw.scoreB !== undefined ? Number(raw.scoreB) : null,
    played: normalizePlayed(raw.played),
    status: raw.status || "scheduled",
    createdAt: raw.createdAt || "",
  };
}

export async function fetchConfigs(): Promise<GameConfig[]> {
  const [gamesRes, factionsRes] = await Promise.all([
    fetch(`${APPS_SCRIPT_URL}?type=games`),
    fetch(`${APPS_SCRIPT_URL}?type=factions`),
  ]);

  if (!gamesRes.ok) {
    throw new Error("No se pudo cargar Config");
  }
  if (!factionsRes.ok) {
    throw new Error("No se pudo cargar Facciones");
  }

  const games: RawGame[] = await gamesRes.json();
  const factions: RawFaction[] = await factionsRes.json();

  return games.map((game) => {
    const gameFactions = factions.filter((f) => f.gameId === game.gameId);

    return {
      gameId: game.gameId,
      displayName: game.displayName || game.gameId,
      logo: game.logo || "",
      backgroundImage: game.backgroundImage || "",
      factions: gameFactions.map((f) => f.faction),
      factionImages: Object.fromEntries(
        gameFactions.map((f) => [f.faction, f.image])
      ),
      factionColors: Object.fromEntries(
        gameFactions.map((f) => [f.faction, f.color])
      ),
    };
  });
}

export async function fetchFactions(gameId: string): Promise<RawFaction[]> {
  const res = await fetch(
    `${APPS_SCRIPT_URL}?type=factions&gameId=${encodeURIComponent(gameId)}`
  );
  if (!res.ok) {
    throw new Error("No se pudieron cargar las facciones");
  }
  return res.json();
}

export async function fetchMatches(gameId?: string): Promise<ParsedMatch[]> {
  if (!gameId) {
    return [];
  }

  const res = await fetch(
    `${APPS_SCRIPT_URL}?type=matches&gameId=${encodeURIComponent(gameId)}`
  );
  if (!res.ok) {
    throw new Error("No se pudieron cargar los partidos");
  }

  const data: RawMatch[] = await res.json();
  return data
    .map(parseMatch)
    .filter((m) => m.playerA && m.date && m.time);
}

export async function fetchTables(): Promise<GameTable[]> {
  return DEFAULT_TABLES;
}

export async function fetchAllMatches(gameIds: string[]): Promise<Record<string, ParsedMatch[]>> {
  const matchesByGame = await Promise.all(
    gameIds.map(async (gameId) => [gameId, await fetchMatches(gameId)] as const)
  );

  return Object.fromEntries(matchesByGame);
}

function buildMatchPayload(gameId: string, match: Partial<ParsedMatch>) {
  return {
    gameId,
    id: match.id,
    date: match.date || "",
    playerA: match.playerA || "",
    factionA: match.factionA || "",
    playerB: match.playerB || "",
    factionB: match.factionB || "",
    time: match.time || "",
    tableId: match.tableId || "",
    scoreA:
      match.scoreA !== null && match.scoreA !== undefined ? match.scoreA : "",
    scoreB:
      match.scoreB !== null && match.scoreB !== undefined ? match.scoreB : "",
    played: Boolean(match.played),
  };
}

export async function saveMatch(
  gameId: string,
  match: Partial<ParsedMatch>
): Promise<boolean> {
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(
        buildMatchPayload(gameId, {
          ...match,
          played: match.played ?? false,
        })
      ),
    });

    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

export async function updateMatchResult(
  gameId: string,
  match: ParsedMatch,
  scoreA: number,
  scoreB: number
): Promise<boolean> {
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(
        buildMatchPayload(gameId, {
          ...match,
          scoreA,
          scoreB,
          played: true,
        })
      ),
    });

    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

export async function deleteMatch(gameId: string, matchId: string): Promise<boolean> {
  try {
    const payload = {
      gameId,
      action: "delete",
      id: matchId,
    };

    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}
