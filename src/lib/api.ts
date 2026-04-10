import type { GameConfig, GameTable, ParsedMatch } from "@/types";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwcmcsrOj7K28SPkiBNpDvcZlTslMxzNM2APiN5XYDwrvkJcjnwK3cspym4XcQ-HQfm/exec";

type RawGame = {
  gameId: string;
  displayName?: string;
  logo?: string;
  backgroundImage?: string;
  matchSize?: string;
  estimatedDuration?: string;
};

type RawFaction = {
  gameId: string;
  faction: string;
  image: string;
  color: string;
};

type RawTable = {
  tableId?: string;
  size?: string;
  enabled?: boolean | string;
  columnIndex?: number | string;
  label?: string;
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
  tableSize?: string;
  matchSize?: string;
  duration?: string;
  playerATime?: string;
  playerBTime?: string;
  scoreA?: string | number;
  scoreB?: string | number;
  played?: boolean | string;
  status?: string;
  createdAt?: string;
  gameId?: string;
};

type MatchPayload = Partial<ParsedMatch> & {
  reserveTable?: boolean;
};

function hasResultData(match: {
  scoreA?: string | number | null;
  scoreB?: string | number | null;
  playerATime?: string;
  playerBTime?: string;
}): boolean {
  return (
    match.scoreA !== "" &&
    match.scoreA !== null &&
    match.scoreA !== undefined
  ) || (
    match.scoreB !== "" &&
    match.scoreB !== null &&
    match.scoreB !== undefined
  ) || Boolean(String(match.playerATime || "").trim()) || Boolean(String(match.playerBTime || "").trim());
}

function deriveMatchState(match: {
  scoreA?: string | number | null;
  scoreB?: string | number | null;
  playerATime?: string;
  playerBTime?: string;
}) {
  const played = hasResultData(match);

  return {
    played,
    status: played ? "completed" : "scheduled",
  };
}

function normalizeStatus(value: unknown, played: boolean): string {
  const normalized = String(value || "").trim().toLowerCase();

  if (played || normalized === "completed" || normalized === "played") {
    return "completed";
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return "cancelled";
  }

  return "scheduled";
}

function normalizeDate(date?: string): string {
  if (!date) return "";
  return date.includes("T") ? date.split("T")[0] : date;
}

function padClockSegment(value: number): string {
  return String(Math.max(0, value)).padStart(2, "0");
}

function parseColonParts(value?: string): number[] | null {
  if (!value) {
    return null;
  }

  const matched = String(value)
    .trim()
    .match(/^(\d{1,3})(?::(\d{2}))(?::(\d{2}))?$/);

  if (!matched) {
    return null;
  }

  return matched
    .slice(1)
    .filter((part): part is string => part !== undefined)
    .map((part) => Number(part));
}

function normalizeTimeOfDay(value?: string): string {
  if (!value) return "";

  const parts = parseColonParts(value);
  if (parts?.length === 3) {
    return `${padClockSegment(parts[0])}:${padClockSegment(parts[1])}`;
  }

  if (parts?.length === 2) {
    return `${padClockSegment(parts[0])}:${padClockSegment(parts[1])}`;
  }

  if (typeof value === "string") {
    const isoMatch = value.match(/T(\d{2}):(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}:${isoMatch[2]}`;
    }
  }

  return String(value);
}

function normalizeDuration(value?: string): string {
  if (!value) {
    return "";
  }

  if (value === "TODO_EL_DIA") {
    return value;
  }

  const parts = parseColonParts(value);
  if (parts?.length === 3) {
    return `${padClockSegment(parts[0])}:${padClockSegment(parts[1])}`;
  }

  if (parts?.length === 2) {
    return `${padClockSegment(parts[0])}:${padClockSegment(parts[1])}`;
  }

  if (typeof value === "string") {
    const isoMatch = value.match(/T(\d{2}):(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}:${isoMatch[2]}`;
    }
  }

  return String(value);
}

function normalizePlayerClock(value?: string): string {
  if (!value) {
    return "";
  }

  const parts = parseColonParts(value);
  if (parts?.length === 3) {
    const totalMinutes = parts[0] * 60 + parts[1];
    return `${padClockSegment(totalMinutes)}:${padClockSegment(parts[2])}`;
  }

  if (parts?.length === 2) {
    return `${padClockSegment(parts[0])}:${padClockSegment(parts[1])}`;
  }

  return String(value);
}

function normalizePlayed(value: unknown): boolean {
  return (
    value === true ||
    value === "true" ||
    value === "TRUE" ||
    value === "✓" ||
    value === "âœ“" ||
    value === "Ã¢Å“â€œ"
  );
}

function normalizeEnabled(value: unknown): boolean {
  if (value === undefined || value === null || value === "") {
    return true;
  }

  return value !== false && value !== "false" && value !== "FALSE";
}

function normalizeColumnIndex(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildTableLabels(tables: Array<Omit<GameTable, "label">>): GameTable[] {
  const counters: Record<string, number> = {};

  return tables.map((table) => {
    const nextCount = (counters[table.size] || 0) + 1;
    counters[table.size] = nextCount;

    return {
      ...table,
      label: `${table.size} #${nextCount}`,
    };
  });
}

export function parseMatch(raw: RawMatch): ParsedMatch {
  const playerATime = normalizePlayerClock(raw.playerATime);
  const playerBTime = normalizePlayerClock(raw.playerBTime);
  const scoreA =
    raw.scoreA !== "" && raw.scoreA !== undefined ? Number(raw.scoreA) : null;
  const scoreB =
    raw.scoreB !== "" && raw.scoreB !== undefined ? Number(raw.scoreB) : null;
  const derivedState = deriveMatchState({
    scoreA,
    scoreB,
    playerATime,
    playerBTime,
  });
  const played = normalizePlayed(raw.played) || derivedState.played;

  return {
    id: String(raw.id ?? ""),
    date: normalizeDate(raw.date),
    playerA: raw.playerA || "",
    factionA: raw.factionA || "",
    playerB: raw.playerB || "",
    factionB: raw.factionB || "",
    time: normalizeTimeOfDay(raw.time),
    tableId: raw.tableId || "",
    tableSize: raw.tableSize || "",
    matchSize: raw.matchSize || "",
    duration: normalizeDuration(raw.duration),
    playerATime,
    playerBTime,
    scoreA,
    scoreB,
    played,
    status: normalizeStatus(raw.status, played),
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
      matchSize: game.matchSize || "",
      estimatedDuration: normalizeDuration(game.estimatedDuration) || "01:30",
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
    .filter((match) => match.playerA && match.date && match.time);
}

export async function fetchTables(): Promise<GameTable[]> {
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?type=tables`);
    if (!res.ok) {
      throw new Error("No se pudieron cargar los tablones");
    }

    const data: RawTable[] = await res.json();
    const physicalTables = data
      .map((table, index) => {
        const size = table.size || "";
        const columnIndex = normalizeColumnIndex(table.columnIndex, index + 2);
        const tableId = table.tableId || String(columnIndex);

        return {
          tableId,
          size,
          columnIndex,
          enabled: normalizeEnabled(table.enabled),
        };
      })
      .filter((table) => table.size && table.enabled)
      .sort((a, b) => a.columnIndex - b.columnIndex);

    return buildTableLabels(physicalTables);
  } catch {
    return [];
  }
}

export async function fetchTableTimeSlots(): Promise<string[]> {
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?type=tableTimes`);
    if (!res.ok) {
      throw new Error("No se pudieron cargar los horarios de tablones");
    }

    const data: unknown = await res.json();
    return Array.isArray(data)
      ? Array.from(
          new Set(
            data
              .map((item) => normalizeTimeOfDay(String(item || "")))
              .filter(Boolean)
          )
        )
      : [];
  } catch {
    return [];
  }
}

export async function fetchAllMatches(
  gameIds: string[]
): Promise<Record<string, ParsedMatch[]>> {
  const matchesByGame = await Promise.all(
    gameIds.map(async (gameId) => [gameId, await fetchMatches(gameId)] as const)
  );

  return Object.fromEntries(matchesByGame);
}

function buildMatchPayload(gameId: string, match: MatchPayload) {
  const state = deriveMatchState(match);

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
    tableSize: match.tableSize || "",
    matchSize: match.matchSize || "",
    duration: match.duration || "",
    playerATime: match.playerATime || "",
    playerBTime: match.playerBTime || "",
    scoreA:
      match.scoreA !== null && match.scoreA !== undefined ? match.scoreA : "",
    scoreB:
      match.scoreB !== null && match.scoreB !== undefined ? match.scoreB : "",
    played: state.played,
    status: state.status,
    reserveTable: Boolean(match.reserveTable),
  };
}

export async function saveMatch(
  gameId: string,
  match: MatchPayload
): Promise<boolean> {
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(
        buildMatchPayload(gameId, {
          ...match,
          played: match.played ?? false,
          reserveTable: match.reserveTable ?? Boolean(match.tableId),
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
  scoreA: number | null,
  scoreB: number | null,
  playerATime: string,
  playerBTime: string
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
          playerATime,
          playerBTime,
          reserveTable: Boolean(match.tableId),
        })
      ),
    });

    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

export async function deleteMatch(
  gameId: string,
  matchId: string
): Promise<boolean> {
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
