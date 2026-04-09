import type { Match, GameConfig, GameTable, ParsedMatch } from "@/types";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwtyAsM0R7gMCZTLBTfjDoLSwMWXPBpKrHcld6_qSBLkCPBQw_CKiCLSJZl__L1dcr7_A/exec";

async function fetchSheet<T>(sheet?: string): Promise<T[]> {
  const url = sheet
    ? `${APPS_SCRIPT_URL}?sheet=${encodeURIComponent(sheet)}`
    : APPS_SCRIPT_URL;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch sheet ${sheet || "default"}`);
  return res.json();
}

// Default config if CONFIG sheet not available
const DEFAULT_CONFIGS: GameConfig[] = [
  {
    gameId: "GuildBall",
    displayName: "Guild Ball",
    factions: [
      "Falconers", "Blacksmiths", "Butchers", "Brewers", "Engineers",
      "Farmers", "Fishermen", "Hunters", "Masons", "Morticians",
      "Navigators", "Order", "Ratcatchers", "Alchemists"
    ],
    factionImages: {},
    factionColors: {
      Falconers: "#5b8c5a",
      Blacksmiths: "#8b7355",
      Butchers: "#cc3333",
      Brewers: "#b8860b",
      Engineers: "#4682b4",
      Farmers: "#6b8e23",
      Fishermen: "#20b2aa",
      Hunters: "#556b2f",
      Masons: "#708090",
      Morticians: "#483d8b",
      Navigators: "#4169e1",
      Order: "#daa520",
      Ratcatchers: "#8b4513",
      Alchemists: "#9932cc",
    },
    backgroundImage: "",
  },
];

const DEFAULT_TABLES: GameTable[] = [
  { tableId: "Mesa 1", size: "small", enabled: true },
  { tableId: "Mesa 2", size: "small", enabled: true },
  { tableId: "Mesa 3", size: "medium", enabled: true },
  { tableId: "Mesa 4", size: "medium", enabled: true },
  { tableId: "Mesa 5", size: "large", enabled: true },
];

export function parseMatch(raw: Match): ParsedMatch {
  const played =
    raw.Played === true ||
    raw.Played === "true" ||
    raw.Played === "TRUE" ||
    raw.Played === "✓";

  let time = raw.Time || "";
  // Handle ISO date format from sheets (1899-12-31T...)
  if (time.includes("T")) {
    const d = new Date(time);
    time = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  }

  let date = raw.Date || "";
  if (date.includes("T")) {
    date = date.split("T")[0];
  }

  return {
    id: String(raw.ID),
    date,
    playerA: raw["Player A"] || "",
    factionA: raw["Faction A"] || "",
    playerB: raw["Player B"] || "",
    factionB: raw["Faction B"] || "",
    time,
    tableId: raw.TableId || "",
    scoreA: raw["Score A"] !== "" && raw["Score A"] !== undefined ? Number(raw["Score A"]) : null,
    scoreB: raw["Score B"] !== "" && raw["Score B"] !== undefined ? Number(raw["Score B"]) : null,
    played,
    status: raw.Status || "scheduled",
    createdAt: raw["Created At"] || "",
  };
}

export async function fetchConfigs(): Promise<GameConfig[]> {
  try {
    const data = await fetchSheet<Record<string, string>>("CONFIG");
    if (!data || data.length === 0 || !data[0].gameId) return DEFAULT_CONFIGS;
    return data.map((row) => ({
      gameId: row.gameId,
      displayName: row.displayName || row.gameId,
      factions: row.factions ? JSON.parse(row.factions) : [],
      factionImages: row.factionImages ? JSON.parse(row.factionImages) : {},
      factionColors: row.factionColors ? JSON.parse(row.factionColors) : {},
      backgroundImage: row.backgroundImage || "",
    }));
  } catch {
    return DEFAULT_CONFIGS;
  }
}

export async function fetchTables(): Promise<GameTable[]> {
  try {
    const data = await fetchSheet<Record<string, string>>("TABLES");
    if (!data || data.length === 0 || !data[0].tableId) return DEFAULT_TABLES;
    return data.map((row) => ({
      tableId: row.tableId,
      size: (row.size as GameTable["size"]) || "medium",
      enabled: row.enabled === "true" || row.enabled === "TRUE" || row.enabled === "✓",
    }));
  } catch {
    return DEFAULT_TABLES;
  }
}

export async function fetchMatches(gameId: string): Promise<ParsedMatch[]> {
  try {
    const data = await fetchSheet<Match>(gameId);
    return data.map(parseMatch);
  } catch {
    return [];
  }
}

export async function fetchAllMatches(gameIds: string[]): Promise<Record<string, ParsedMatch[]>> {
  const results: Record<string, ParsedMatch[]> = {};
  await Promise.all(
    gameIds.map(async (id) => {
      results[id] = await fetchMatches(id);
    })
  );
  return results;
}

export async function saveMatch(
  gameId: string,
  match: Partial<ParsedMatch>
): Promise<boolean> {
  try {
    const payload = {
      sheet: gameId,
      action: "add",
      data: {
        ID: match.id || Date.now(),
        Date: match.date,
        "Player A": match.playerA,
        "Faction A": match.factionA,
        "Player B": match.playerB,
        "Faction B": match.factionB,
        Time: match.time,
        TableId: match.tableId,
        "Score A": match.scoreA ?? "",
        "Score B": match.scoreB ?? "",
        Played: false,
        Status: "scheduled",
        "Created At": new Date().toISOString(),
      },
    };
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      mode: "no-cors",
    });
    return true;
  } catch {
    return false;
  }
}

export async function updateMatchResult(
  gameId: string,
  matchId: string,
  scoreA: number,
  scoreB: number
): Promise<boolean> {
  try {
    const payload = {
      sheet: gameId,
      action: "updateResult",
      data: { ID: matchId, "Score A": scoreA, "Score B": scoreB, Played: true },
    };
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      mode: "no-cors",
    });
    return true;
  } catch {
    return false;
  }
}

export async function deleteMatch(gameId: string, matchId: string): Promise<boolean> {
  try {
    const payload = { sheet: gameId, action: "delete", data: { ID: matchId } };
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      mode: "no-cors",
    });
    return true;
  } catch {
    return false;
  }
}
