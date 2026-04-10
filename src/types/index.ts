export interface Match {
  ID: string | number;
  gameId: string;
  date: string;
  "playerA": string;
  "factionA": string;
  "playerB": string;
  "factionB": string;
  time: string;
  tableId?: string;
  "scoreA": string | number;
  "scoreB": string | number;
  played: boolean | string;
  status: string;
  "createdAt": string;
}

export interface GameConfig {
  gameId: string;
  displayName: string;
  logo: string;
  factions: string[];
  factionImages: Record<string, string>;
  factionColors: Record<string, string>;
  backgroundImage: string;
}

export interface GameTable {
  tableId: string;
  size: "small" | "medium" | "large";
  enabled: boolean;
}

export interface ParsedMatch {
  id: string;
  date: string;
  playerA: string;
  factionA: string;
  playerB: string;
  factionB: string;
  time: string;
  tableId: string;
  scoreA: number | null;
  scoreB: number | null;
  played: boolean;
  status: string;
  createdAt: string;
}
