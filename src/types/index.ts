export interface Match {
  ID: string | number;
  Date: string;
  "Player A": string;
  "Faction A": string;
  "Player B": string;
  "Faction B": string;
  Time: string;
  TableId?: string;
  "Score A": string | number;
  "Score B": string | number;
  Played: boolean | string;
  Status: string;
  "Created At": string;
}

export interface GameConfig {
  gameId: string;
  displayName: string;
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
