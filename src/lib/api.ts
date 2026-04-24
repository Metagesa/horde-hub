import type { ParsedMatch } from "@/types";
import { clearAdminSession, getAdminCredential } from "@/lib/adminAuth";
import {
  buildMatchPayload,
  parseMatch,
  type MatchFetchState,
  type MatchPayload,
  type RawMatch,
} from "@/lib/matchNormalization";
import type { BoardAvailabilityState } from "@/types";

const MATCHES_API_URL = "/api/matches";
const BOARD_AVAILABILITY_API_URL = "/api/board-availability";
const READ_TIMEOUT_MS = 8_000;
const WRITE_TIMEOUT_MS = 10_000;
const HTML_RESPONSE_MESSAGE =
  "La API devolvio HTML en vez de JSON. Si estas en desarrollo, inicia el proyecto con Vercel Functions activas.";
const ADMIN_SESSION_EXPIRED_EVENT = "admin-session-expired";

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

    if (error instanceof TypeError) {
      throw new Error("No se pudo conectar con el servicio de partidas");
    }

    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

async function parseSuccessResponse(res: Response): Promise<boolean> {
  if (!res.ok) {
    if (res.status === 401) {
      clearAdminSession();
      window.dispatchEvent(new CustomEvent(ADMIN_SESSION_EXPIRED_EVENT));
    }

    return false;
  }

  const data = (await parseJsonResponse(res)) as { success?: unknown };
  return Boolean(data.success);
}

async function parseJsonResponse(res: Response): Promise<unknown> {
  const contentType = String(res.headers?.get?.("content-type") || "").toLowerCase();

  if (contentType.includes("application/json")) {
    return res.json();
  }

  if (typeof res.text !== "function" && typeof res.json === "function") {
    return res.json();
  }

  const text = await res.text();
  const trimmed = text.trim();

  if (trimmed.startsWith("<!doctype") || trimmed.startsWith("<html") || trimmed.startsWith("<")) {
    throw new Error(HTML_RESPONSE_MESSAGE);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("La API devolvio una respuesta invalida.");
  }
}

async function requestMatches(gameId: string): Promise<ParsedMatch[]> {
  const url = new URL(MATCHES_API_URL, window.location.origin);
  url.searchParams.set("gameId", gameId);
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error("No se pudieron cargar los partidos");
  }

  const data = (await parseJsonResponse(res)) as RawMatch[];
  return data.map(parseMatch);
}

export async function fetchMatches(gameId?: string): Promise<ParsedMatch[]> {
  if (!gameId) {
    return [];
  }

  return requestMatches(gameId);
}

export async function fetchMatchesWithState(
  gameId?: string
): Promise<MatchFetchState> {
  if (!gameId) {
    return {
      matches: [],
      visibilityWarning: null,
    };
  }

  return {
    matches: await requestMatches(gameId),
    visibilityWarning: null,
  };
}

export async function fetchAllMatches(
  gameIds: string[]
): Promise<Record<string, ParsedMatch[]>> {
  const uniqueGameIds = [...new Set(gameIds)].filter(Boolean);

  if (uniqueGameIds.length === 0) {
    return {};
  }

  const url = new URL(`${MATCHES_API_URL}/bulk`, window.location.origin);
  uniqueGameIds.forEach((gameId) => url.searchParams.append("gameId", gameId));

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      throw new Error("No se pudieron cargar los partidos");
    }

    const data = (await parseJsonResponse(res)) as Record<string, RawMatch[]>;
    return Object.fromEntries(
      uniqueGameIds.map((gameId) => [
        gameId,
        (data[gameId] || []).map(parseMatch),
      ])
    );
  } catch {
    return Object.fromEntries(uniqueGameIds.map((gameId) => [gameId, []]));
  }
}

export async function fetchBoardAvailability(
  selectedDate?: string
): Promise<BoardAvailabilityState> {
  const url = new URL(BOARD_AVAILABILITY_API_URL, window.location.origin);

  if (selectedDate) {
    url.searchParams.set("date", selectedDate);
  }

  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error("No se pudo cargar la disponibilidad de tablones");
  }

  const data = (await parseJsonResponse(res)) as BoardAvailabilityState;

  return {
    ...data,
    reservationMatches: Object.fromEntries(
      Object.entries(data.reservationMatches || {}).map(([gameId, matches]) => [
        gameId,
        (matches || []).map(parseMatch),
      ])
    ),
  };
}

function buildWriteInit(method: "POST" | "PATCH" | "DELETE", body?: unknown): RequestInit {
  const credential = getAdminCredential();
  const headers: Record<string, string> = {};

  if (credential) {
    headers.Authorization = `Bearer ${credential}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  return {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

export async function saveMatch(
  gameId: string,
  match: MatchPayload
): Promise<boolean> {
  try {
    const payload = buildMatchPayload(gameId, {
      ...match,
      played: match.played ?? false,
      reserveTable: match.reserveTable ?? Boolean(match.tableId),
    });
    const isUpdate = Boolean(match.id);
    const targetUrl = isUpdate
      ? `${MATCHES_API_URL}/${encodeURIComponent(String(match.id))}`
      : MATCHES_API_URL;
    const res = await fetchWithTimeout(
      targetUrl,
      buildWriteInit(isUpdate ? "PATCH" : "POST", payload),
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
    const payload = buildMatchPayload(gameId, {
      ...match,
      scoreA,
      scoreB,
      playerATime,
      playerBTime,
      reserveTable: Boolean(match.tableId),
    });
    const res = await fetchWithTimeout(
      `${MATCHES_API_URL}/${encodeURIComponent(match.id)}`,
      buildWriteInit("PATCH", payload),
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
    const url = new URL(
      `${MATCHES_API_URL}/${encodeURIComponent(matchId)}`,
      window.location.origin
    );
    url.searchParams.set("gameId", gameId);
    const res = await fetchWithTimeout(
      url,
      buildWriteInit("DELETE"),
      WRITE_TIMEOUT_MS
    );

    return parseSuccessResponse(res);
  } catch {
    return false;
  }
}

export { parseMatch };
export { ADMIN_SESSION_EXPIRED_EVENT };
