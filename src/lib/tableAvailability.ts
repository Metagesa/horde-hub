import type { GameTable, ParsedMatch } from "@/types";

export interface TableStatus {
  table: GameTable;
  occupied: boolean;
  occupiedBy?: { gameId: string; playerA: string; playerB: string };
}

export function getTableStatuses(
  tables: GameTable[],
  allMatches: Record<string, ParsedMatch[]>,
  selectedTime: string,
  selectedDate: string
): TableStatus[] {
  const enabledTables = tables.filter((t) => t.enabled);

  return enabledTables.map((table) => {
    let occupied = false;
    let occupiedBy: TableStatus["occupiedBy"] = undefined;

    for (const [gameId, matches] of Object.entries(allMatches)) {
      for (const match of matches) {
        if (
          match.tableId === table.tableId &&
          match.time === selectedTime &&
          match.date === selectedDate &&
          !match.played
        ) {
          occupied = true;
          occupiedBy = {
            gameId,
            playerA: match.playerA,
            playerB: match.playerB,
          };
          break;
        }
      }
      if (occupied) break;
    }

    return { table, occupied, occupiedBy };
  });
}

export function groupTablesBySize(statuses: TableStatus[]): Record<string, TableStatus[]> {
  const groups: Record<string, TableStatus[]> = {
    small: [],
    medium: [],
    large: [],
  };

  for (const s of statuses) {
    const size = s.table.size;
    if (groups[size]) {
      groups[size].push(s);
    }
  }

  return groups;
}
