import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ScheduleMatch, ScheduleTeam } from '@/types';
import { formatKickoffTime } from '@/lib/schedule/time';
import { cn } from '@/lib/utils';
import { BroadcasterPanel, Collapse } from './broadcaster-panel';

export function MatchCard({ match, timeZone, selected = false }: { match: ScheduleMatch; timeZone: string; selected?: boolean }) {
  const [open, setOpen] = useState(selected);

  useEffect(() => {
    if (selected) setOpen(true);
  }, [selected]);
  const panelId = `broadcasters-${match.id}`;
  const kickoffPassed = match.kickoffMs !== null && match.kickoffMs < Date.now();
  const kickoffLabel =
    match.kickoffMs !== null ? formatKickoffTime(match.kickoffMs, timeZone) : match.sourceKickoffTime || 'Time TBA';
  const count = match.broadcasters.length;

  return (
    <article id={`match-${match.id}`} className={cn('overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-500 hover:shadow-md', selected ? 'border-teal ring-2 ring-teal/20' : 'border-border')}>
      <div className="grid gap-4 p-4 md:grid-cols-[120px_minmax(0,1fr)_minmax(0,260px)] md:items-center md:px-5 md:py-4">
        <div className="flex items-center justify-between md:block">
          <div>
            <p className="text-[18px] font-semibold tabular-nums leading-none">{kickoffLabel}</p>
            {match.round && (
              <p className="mt-1.5 line-clamp-2 text-[12px] text-muted-foreground">{match.round}</p>
            )}
          </div>
          <span
            className={cn(
              'mt-0 rounded-full px-2.5 py-1 text-[11px] font-medium md:mt-2 md:inline-block',
              kickoffPassed ? 'bg-secondary text-muted-foreground' : 'bg-teal/10 text-teal',
            )}
          >
            {kickoffPassed ? 'Kickoff passed' : 'Upcoming'}
          </span>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)] items-center gap-2 md:gap-3">
          <TeamSide team={match.home} />
          <span className="text-center text-[11px] font-semibold tracking-[0.2em] text-muted-foreground">VS</span>
          <TeamSide team={match.away} />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-muted-foreground">
            {count > 0
              ? `${count} ${count === 1 ? 'broadcaster' : 'broadcasters'} listed`
              : 'Broadcast details not announced'}
          </p>
          {count > 0 && (
            <p className="line-clamp-1 text-[13px] font-medium">
              {match.broadcasters
                .slice(0, 2)
                .map((b) => b.name)
                .join(' · ')}
            </p>
          )}
          {count > 0 && (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((value) => !value)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-[13px] font-medium transition-colors duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
            >
              {open ? 'Hide channels' : 'View channels'}
              <ChevronDown
                className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')}
                aria-hidden
              />
            </button>
          )}
        </div>
      </div>

      {count > 0 && (
        <div className="border-t border-border/60 px-4 md:px-5">
          <Collapse open={open} id={panelId}>
            <div className="py-4">
              <BroadcasterPanel broadcasters={match.broadcasters} />
            </div>
          </Collapse>
        </div>
      )}
    </article>
  );
}

function TeamSide({ team }: { team: ScheduleTeam }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <TeamCrest team={team} />
      <span className="min-w-0 text-balance break-words text-[14px] font-semibold leading-snug md:text-[15px]">
        {team.name || 'TBA'}
      </span>
    </div>
  );
}

function TeamCrest({ team }: { team: ScheduleTeam }) {
  const [failed, setFailed] = useState(false);
  if (!team.logoUrl || failed) {
    return (
      <span
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-t-xl rounded-b-[40%] border border-border bg-secondary text-[12px] font-semibold text-muted-foreground md:h-12 md:w-12"
      >
        {initials(team.name)}
      </span>
    );
  }
  return (
    <img
      src={team.logoUrl}
      alt=""
      width={48}
      height={48}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-11 w-11 shrink-0 object-contain md:h-12 md:w-12"
    />
  );
}

function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
  return letters || '?';
}
