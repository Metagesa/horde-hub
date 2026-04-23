import { useQuery } from "@tanstack/react-query";
import { fetchAllMatches, fetchMatches } from "@/lib/api";
import {
  GAME_CONFIGS,
  TABLES,
  TABLE_TIME_SLOTS,
  getGameFactions,
} from "@/lib/localData";

interface MatchQueryOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

const LOCAL_QUERY_RESULT = {
  isLoading: false,
  isError: false,
  error: null,
} as const;

export function useConfigs() {
  return {
    data: GAME_CONFIGS,
    ...LOCAL_QUERY_RESULT,
  };
}

export function useFactions(gameId?: string) {
  return {
    data: getGameFactions(gameId),
    ...LOCAL_QUERY_RESULT,
  };
}

export function useTables() {
  return {
    data: TABLES,
    ...LOCAL_QUERY_RESULT,
  };
}

export function useTableTimeSlots() {
  return {
    data: TABLE_TIME_SLOTS,
    ...LOCAL_QUERY_RESULT,
  };
}

export function useMatches(gameId?: string, options: MatchQueryOptions = {}) {
  const enabled = options.enabled ?? Boolean(gameId);

  return useQuery({
    queryKey: ["matches", gameId],
    queryFn: () => fetchMatches(gameId),
    enabled,
    staleTime: 30_000,
    refetchInterval: options.refetchInterval ?? false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
}

export function useAllMatches(
  gameIds: string[],
  options: MatchQueryOptions = {}
) {
  const normalizedGameIds = [...new Set(gameIds)].filter(Boolean).sort();
  const enabled = options.enabled ?? true;

  return useQuery({
    queryKey: ["allMatches", normalizedGameIds],
    queryFn: () => fetchAllMatches(normalizedGameIds),
    staleTime: 30_000,
    refetchInterval: options.refetchInterval ?? false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    enabled: enabled && normalizedGameIds.length > 0,
  });
}
