import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { SCHEDULE_LEAGUES } from '@/lib/config/sources';
import { fetchLeagueMatchRows, fetchScheduleIndexes } from '@/lib/schedule/feeds';
import { EMPTY_INDEXES, normalizeMatches, type ScheduleIndexes } from '@/lib/schedule/normalize';
import type { ScheduleMatch } from '@/types';

const HALF_HOUR = 30 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

export const scheduleIndexesOptions = {
  queryKey: ['schedule', 'indexes'] as const,
  queryFn: fetchScheduleIndexes,
  staleTime: HALF_HOUR,
};

export function useScheduleIndexes() {
  return useQuery(scheduleIndexesOptions);
}

/** Fixtures for every configured league. Logos degrade to fallbacks if the indexes fail. */
export function useLeagueFixtures() {
  const queryClient = useQueryClient();
  return useQueries({
    queries: SCHEDULE_LEAGUES.map((league) => ({
      queryKey: ['schedule', 'fixtures', league.id] as const,
      queryFn: async (): Promise<ScheduleMatch[]> => {
        const indexes: ScheduleIndexes = await queryClient
          .ensureQueryData(scheduleIndexesOptions)
          .catch(() => EMPTY_INDEXES);
        const rows = await fetchLeagueMatchRows(league.matchesCsvUrl);
        return normalizeMatches(rows, indexes);
      },
      staleTime: TEN_MINUTES,
    })),
  });
}
