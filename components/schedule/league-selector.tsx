'use client';

import { useEffect, useRef, useState } from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LeagueButton {
  id: string;
  name: string;
  logoUrl: string;
  count: number;
  loading: boolean;
}

export function LeagueSelector({
  leagues,
  selectedId,
  onSelect,
}: {
  leagues: LeagueButton[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [selectedId]);

  return (
    <nav aria-label="Competitions">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-6 md:overflow-visible md:px-0">
        {leagues.map((league) => {
          const selected = league.id === selectedId;
          return (
            <button
              key={league.id}
              ref={selected ? selectedRef : undefined}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(league.id)}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 md:shrink md:min-w-0',
                selected
                  ? 'border-teal bg-teal/10 shadow-sm'
                  : 'border-border bg-card hover:border-foreground/20 hover:shadow-sm',
              )}
            >
              <LeagueMark name={league.name} logoUrl={league.logoUrl} />
              <span className="min-w-0 leading-tight">
                <span className="block text-[13px] font-semibold md:text-[14px]">{league.name}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {league.loading ? 'Loading' : `${league.count} ${league.count === 1 ? 'fixture' : 'fixtures'}`}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function LeagueMark({ name, logoUrl }: { name: string; logoUrl: string }) {
  const [failed, setFailed] = useState(false);
  if (!logoUrl || failed) {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground" aria-hidden>
        <Trophy className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <img
      src={logoUrl}
      alt=""
      aria-hidden
      width={28}
      height={28}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      title={name}
      className="h-7 w-7 shrink-0 object-contain"
    />
  );
}
