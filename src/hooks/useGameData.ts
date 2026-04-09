import { useQuery } from "@tanstack/react-query";
import { fetchConfigs, fetchTables, fetchMatches, fetchAllMatches } from "@/lib/api";

export function useConfigs() {
  return useQuery({
    queryKey: ["configs"],
    queryFn: fetchConfigs,
    staleTime: 60_000,
  });
}

export function useTables() {
  return useQuery({
    queryKey: ["tables"],
    queryFn: fetchTables,
    staleTime: 60_000,
  });
}

export function useMatches(gameId: string) {
  return useQuery({
    queryKey: ["matches", gameId],
    queryFn: () => fetchMatches(gameId),
    staleTime: 30_000,
    enabled: !!gameId,
  });
}

export function useAllMatches(gameIds: string[]) {
  return useQuery({
    queryKey: ["allMatches", ...gameIds],
    queryFn: () => fetchAllMatches(gameIds),
    staleTime: 30_000,
    enabled: gameIds.length > 0,
  });
}
