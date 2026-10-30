import type { ScheduleMatch } from '@/types';
import { dateKeyInZone, shiftDateKey } from './time';

export type BroadcastFilter = 'all' | 'fta' | 'scrambled' | 'platform';

export type DateSelection =
  | { mode: 'today' | 'tomorrow' | 'next7' | 'upcoming' | 'all' }
  | { mode: 'date'; date: string };

export interface FilterCriteria {
  selection: DateSelection;
  search: string;
  broadcast: BroadcastFilter;
  timeZone: string;
  todayKey: string;
}

export interface DayGroup {
  key: string | null;
  matches: ScheduleMatch[];
}

function dateKeyOf(match: ScheduleMatch, timeZone: string): string | null {
  return match.kickoffMs === null ? null : dateKeyInZone(match.kickoffMs, timeZone);
}

function matchesDate(key: string | null, selection: DateSelection, todayKey: string): boolean {
  if (selection.mode === 'all') return true;
  if (key === null) return false;
  switch (selection.mode) {
    case 'today':
      return key === todayKey;
    case 'tomorrow':
      return key === shiftDateKey(todayKey, 1);
    case 'next7':
      return key >= todayKey && key <= shiftDateKey(todayKey, 6);
    case 'upcoming':
      return key >= todayKey;
    case 'date':
      return key === selection.date;
  }
}

function matchesSearch(match: ScheduleMatch, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return [match.home.name, match.away.name, ...match.broadcasters.map((b) => b.name)].some((value) =>
    value.toLowerCase().includes(query),
  );
}

function matchesBroadcast(match: ScheduleMatch, filter: BroadcastFilter): boolean {
  return filter === 'all' || match.broadcasters.some((b) => b.type === filter);
}

export function sortByKickoff(matches: ScheduleMatch[]): ScheduleMatch[] {
  return [...matches].sort((a, b) => {
    if (a.kickoffMs === null) return b.kickoffMs === null ? 0 : 1;
    if (b.kickoffMs === null) return -1;
    return a.kickoffMs - b.kickoffMs;
  });
}

export function filterByDate(matches: ScheduleMatch[], criteria: Pick<FilterCriteria, 'selection' | 'timeZone' | 'todayKey'>): ScheduleMatch[] {
  return matches.filter((m) =>
    matchesDate(dateKeyOf(m, criteria.timeZone), criteria.selection, criteria.todayKey),
  );
}

export function filterFixtures(matches: ScheduleMatch[], criteria: FilterCriteria): ScheduleMatch[] {
  return sortByKickoff(
    filterByDate(matches, criteria).filter(
      (m) => matchesSearch(m, criteria.search) && matchesBroadcast(m, criteria.broadcast),
    ),
  );
}

/** Uses today when it has fixtures, otherwise the next scheduled date. */
export function resolveSelection(
  requested: DateSelection | null,
  matches: ScheduleMatch[],
  timeZone: string,
  todayKey: string,
): DateSelection {
  if (requested) return requested;

  const keys = matches
    .map((m) => dateKeyOf(m, timeZone))
    .filter((key): key is string => key !== null);
  if (keys.includes(todayKey)) return { mode: 'today' };

  const next = keys.filter((key) => key > todayKey).sort()[0];
  return next ? { mode: 'date', date: next } : { mode: 'all' };
}

/** The earliest date after the selection that has fixtures. */
export function nextAvailableDate(
  matches: ScheduleMatch[],
  selection: DateSelection,
  timeZone: string,
  todayKey: string,
): string | null {
  const reference = selection.mode === 'date' ? selection.date : todayKey;
  const keys = matches
    .map((m) => dateKeyOf(m, timeZone))
    .filter((key): key is string => key !== null && key > reference);
  return keys.sort()[0] ?? null;
}

export function groupByDay(matches: ScheduleMatch[], timeZone: string): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const match of matches) {
    const key = dateKeyOf(match, timeZone);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.matches.push(match);
    } else {
      groups.push({ key, matches: [match] });
    }
  }
  return groups;
}
