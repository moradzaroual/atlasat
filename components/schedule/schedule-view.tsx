'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { SCHEDULE_LEAGUES } from '@/lib/config/sources';
import { useLeagueFixtures, useScheduleIndexes } from '@/hooks/use-schedule-data';
import {
  filterByDate,
  filterFixtures,
  groupByDay,
  nextAvailableDate,
  resolveSelection,
  type BroadcastFilter,
  type DateSelection,
  type FilterCriteria,
} from '@/lib/schedule/filters';
import {
  dateKeyInZone,
  formatDayHeading,
  formatTimestamp,
  getBrowserTimeZone,
  FALLBACK_TIME_ZONE,
} from '@/lib/schedule/time';
import { cn } from '@/lib/utils';
import { LeagueSelector } from './league-selector';
import { FilterBar } from './filter-bar';
import { MatchCard } from './match-card';

const BATCH_SIZE = 12;
const MOROCCO_TIME_ZONE = 'Africa/Casablanca';

type TimeZoneMode = 'local' | 'morocco' | 'utc';

const TIME_ZONE_OPTIONS: ReadonlyArray<{ id: TimeZoneMode; label: string }> = [
  { id: 'local', label: 'My local time' },
  { id: 'morocco', label: 'Morocco' },
  { id: 'utc', label: 'UTC' },
];

function isLeagueId(value: string | null): value is string {
  return SCHEDULE_LEAGUES.some((league) => league.id === value);
}

export function ScheduleView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedLeague = searchParams.get('league');
  const requestedMatchId = searchParams.get('match');

  const [leagueId, setLeagueId] = useState<string>(
    isLeagueId(requestedLeague) ? requestedLeague : SCHEDULE_LEAGUES[0].id,
  );
  const [timeZoneMode, setTimeZoneMode] = useState<TimeZoneMode>('local');
  const [browserZone, setBrowserZone] = useState(FALLBACK_TIME_ZONE);
  const [requestedDate, setRequestedDate] = useState<DateSelection | null>(null);
  const [search, setSearch] = useState('');
  const [broadcast, setBroadcast] = useState<BroadcastFilter>('all');
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBrowserZone(getBrowserTimeZone());
  }, []);

  const timeZone =
    timeZoneMode === 'local' ? browserZone : timeZoneMode === 'morocco' ? MOROCCO_TIME_ZONE : 'UTC';

  const indexesQuery = useScheduleIndexes();
  const feeds = useLeagueFixtures();
  const selectedIndex = Math.max(0, SCHEDULE_LEAGUES.findIndex((l) => l.id === leagueId));
  const feed = feeds[selectedIndex];
  const matches = feed.data ?? [];
  const selectedMatch = matches.find((match) => match.id === requestedMatchId);

  useEffect(() => {
    if (!selectedMatch || requestedDate || selectedMatch.kickoffMs === null) return;
    setRequestedDate({ mode: 'date', date: dateKeyInZone(selectedMatch.kickoffMs, timeZone) });
  }, [selectedMatch, requestedDate, timeZone]);

  const todayKey = dateKeyInZone(Date.now(), timeZone);
  const selection = resolveSelection(requestedDate, matches, timeZone, todayKey);
  const criteria: FilterCriteria = { selection, search, broadcast, timeZone, todayKey };
  const fixtures = filterFixtures(matches, criteria);
  const visibleFixtures = fixtures.slice(0, visibleCount);
  const groups = groupByDay(visibleFixtures, timeZone);

  const counts = feeds.map((f) => filterFixtures(f.data ?? [], criteria).length);
  const leagueButtons = SCHEDULE_LEAGUES.map((league, i) => ({
    id: league.id,
    name: league.name,
    logoUrl: indexesQuery.data?.leagueLogos.get(league.id) ?? '',
    count: counts[i],
    loading: feeds[i].isPending,
  }));

  const sourceUpdatedMs = matches.reduce<number | null>((latest, m) => {
    const ms = Date.parse(m.scrapedAt);
    return Number.isNaN(ms) ? latest : Math.max(latest ?? 0, ms);
  }, null);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [leagueId, requestedDate, search, broadcast, timeZone, requestedMatchId]);

  useEffect(() => {
    if (!requestedMatchId || !selectedMatch) return;
    const matchIndex = fixtures.findIndex((match) => match.id === requestedMatchId);
    if (matchIndex < 0) return;
    setVisibleCount((count) => Math.max(count, matchIndex + 1));
    const frame = requestAnimationFrame(() => {
      document.getElementById(`match-${requestedMatchId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => cancelAnimationFrame(frame);
  }, [requestedMatchId, selectedMatch, fixtures.length, visibleCount]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisibleCount((count) => count + BATCH_SIZE);
      },
      { rootMargin: '400px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, fixtures.length]);

  const selectLeague = (id: string) => {
    setLeagueId(id);
    setRequestedDate(null);
    router.replace(`${pathname}?league=${id}`, { scroll: false });
  };

  const clearFilters = () => {
    setSearch('');
    setBroadcast('all');
  };

  const renderResults = () => {
    if (feed.isPending) {
      return (
        <div className="flex flex-col gap-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
      );
    }

    if (feed.isError) {
      return (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
          <AlertCircle className="h-9 w-9 text-destructive" />
          <div>
            <p className="text-[15px] font-medium">Could not load this competition</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {(feed.error as Error)?.message || 'The schedule feed may be unavailable.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => feed.refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-[13px] font-medium transition-colors duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      );
    }

    if (matches.length === 0) {
      return (
        <EmptyState
          title="No fixtures in this schedule yet"
          body="This competition has no matches listed right now."
        />
      );
    }

    if (fixtures.length === 0) {
      const dateOnlyMatches = filterByDate(matches, criteria);
      if (dateOnlyMatches.length === 0) {
        const next = nextAvailableDate(matches, selection, timeZone, todayKey);
        return (
          <EmptyState
            title="No matches on this date"
            body="Pick another day to see the next fixtures."
            action={
              next
                ? { label: 'Show next available date', onClick: () => setRequestedDate({ mode: 'date', date: next }) }
                : undefined
            }
          />
        );
      }
      return (
        <EmptyState
          title="No matches match your filters"
          body="Try a different team, channel or broadcast type."
          action={{ label: 'Clear filters', onClick: clearFilters }}
        />
      );
    }

    return (
      <>
        <p className="mb-6 text-[13px] text-muted-foreground">
          {fixtures.length} {fixtures.length === 1 ? 'fixture' : 'fixtures'}
        </p>
        {groups.map((group) => (
          <section key={group.key ?? 'tba'} className="mb-8" aria-label={group.key ? formatDayHeading(group.key) : 'Date to be announced'}>
            <h2 className="mb-3 flex items-center gap-3 text-[15px] font-semibold">
              {group.key ? formatDayHeading(group.key) : 'Date to be announced'}
              {group.key === todayKey && (
                <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-teal">
                  Today
                </span>
              )}
            </h2>
            <div className="flex flex-col gap-3">
              {group.matches.map((match) => (
                <MatchCard key={match.id} match={match} timeZone={timeZone} selected={match.id === requestedMatchId} />
              ))}
            </div>
          </section>
        ))}
        {visibleCount < fixtures.length && (
          <div ref={sentinelRef} className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-teal" />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-12">
      <header className="max-w-3xl">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-gold">
          Atlasat Schedule
        </p>
        <h1 className="font-serif text-[32px] leading-[1.1] tracking-tight md:text-[40px] text-balance">
          Find your match. Find your channel.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Browse fixtures across six competitions and see which channels or platforms show each
          match. This page lists kickoff times only, not scores or live status.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Time zone" className="inline-flex rounded-full border border-border bg-card p-1">
          {TIME_ZONE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={timeZoneMode === option.id}
              onClick={() => setTimeZoneMode(option.id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40',
                timeZoneMode === option.id
                  ? 'bg-teal text-teal-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-[12px] text-muted-foreground">
          {feed.dataUpdatedAt > 0 && <>Last fetched {formatTimestamp(feed.dataUpdatedAt, timeZone)}</>}
          {sourceUpdatedMs !== null && <> · Source updated {formatTimestamp(sourceUpdatedMs, timeZone)}</>}
        </p>
      </div>

      <div className="mt-8">
        <LeagueSelector leagues={leagueButtons} selectedId={leagueId} onSelect={selectLeague} />
      </div>

      <div className="mt-6">
        <FilterBar
          search={search}
          onSearch={setSearch}
          selection={selection}
          onSelection={setRequestedDate}
          broadcast={broadcast}
          onBroadcast={setBroadcast}
        />
      </div>

      <div className="mt-8">{renderResults()}</div>
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
      <p className="text-[15px] font-medium">{title}</p>
      <p className="max-w-md text-[13px] text-muted-foreground">{body}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 rounded-lg border border-border bg-card px-4 py-2 text-[13px] font-medium transition-colors duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
