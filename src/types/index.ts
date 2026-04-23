export interface Match {
  ID: string | number;
  gameId: string;
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
  scoreA: string | number;
  scoreB: string | number;
  played: boolean | string;
  status: string;
  createdAt: string;
}

export interface GameConfig {
  gameId: string;
  displayName: string;
  logo: string;
  matchSize: string;
  estimatedDuration: string;
  factions: string[];
  factionImages: Record<string, string>;
  factionColors: Record<string, string>;
  backgroundImage: string;
}

export interface GameTable {
  tableId: string;
  size: string;
  label: string;
  columnIndex: number;
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
  tableSize: string;
  matchSize: string;
  duration: string;
  playerATime: string;
  playerBTime: string;
  scoreA: number | null;
  scoreB: number | null;
  played: boolean;
  status: string;
  createdAt: string;
}

export interface BoardReservationSlotAssignment {
  time: string;
  tableId: string;
  gameId: string;
  match: ParsedMatch;
}

export interface BoardAvailabilityState {
  tables: GameTable[];
  timeSlots: string[];
  reservationMatches: Record<string, ParsedMatch[]>;
  assignmentsByTime: Record<string, BoardReservationSlotAssignment[]>;
}
