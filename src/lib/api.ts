import type { ParsedMatch } from "@/types";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwcmcsrOj7K28SPkiBNpDvcZlTslMxzNM2APiN5XYDwrvkJcjnwK3cspym4XcQ-HQfm/exec";
const READ_TIMEOUT_MS = 8_000;
const WRITE_TIMEOUT_MS = 10_000;

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
    (match.scoreA !== "" &&
      match.scoreA !== null &&
      match.scoreA !== undefined) ||
    (match.scoreB !== "" &&
      match.scoreB !== null &&
      match.scoreB !== undefined) ||
    Boolean(String(match.playerATime || "").trim()) ||
    Boolean(String(match.playerBTime || "").trim())
  );
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
  if (!date) {
    return "";
  }

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
  if (!value) {
    return "";
  }

  const parts = parseColonParts(value);
  if (parts?.length === 3 || parts?.length === 2) {
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
  if (parts?.length === 3 || parts?.length === 2) {
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

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = READ_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("La solicitud tardo demasiado");
    }

    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

async function parseSuccessResponse(res: Response): Promise<boolean> {
  if (!res.ok) {
    return false;
  }

  const data = (await res.json()) as { success?: unknown };
  return Boolean(data.success);
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

export async function fetchMatches(gameId?: string): Promise<ParsedMatch[]> {
  if (!gameId) {
    return [];
  }

  const res = await fetchWithTimeout(
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

export async function fetchAllMatches(
  gameIds: string[]
): Promise<Record<string, ParsedMatch[]>> {
  const uniqueGameIds = [...new Set(gameIds)].filter(Boolean);
  const matchesByGame = await Promise.allSettled(
    uniqueGameIds.map(async (gameId) => [gameId, await fetchMatches(gameId)] as const)
  );

  return Object.fromEntries(
    matchesByGame.map((result, index) => {
      const gameId = uniqueGameIds[index];
      return result.status === "fulfilled" ? result.value : [gameId, []];
    })
  );
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
    const res = await fetchWithTimeout(
      APPS_SCRIPT_URL,
      {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(
          buildMatchPayload(gameId, {
            ...match,
            played: match.played ?? false,
            reserveTable: match.reserveTable ?? Boolean(match.tableId),
          })
        ),
      },
      WRITE_TIMEOUT_MS
    );

    return parseSuccessResponse(res);
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
    const res = await fetchWithTimeout(
      APPS_SCRIPT_URL,
      {
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
      },
      WRITE_TIMEOUT_MS
    );

    return parseSuccessResponse(res);
  } catch {
    return false;
  }
}

export async function deleteMatch(
  gameId: string,
  matchId: string
): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(
      APPS_SCRIPT_URL,
      {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          gameId,
          action: "delete",
          id: matchId,
        }),
      },
      WRITE_TIMEOUT_MS
    );

    return parseSuccessResponse(res);
  } catch {
    return false;
  }
}
