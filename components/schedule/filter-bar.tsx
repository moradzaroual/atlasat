import { Search } from 'lucide-react';
import type { BroadcastFilter, DateSelection } from '@/lib/schedule/filters';
import { cn } from '@/lib/utils';

const DATE_SHORTCUTS: ReadonlyArray<{ label: string; selection: DateSelection }> = [
  { label: 'Today', selection: { mode: 'today' } },
  { label: 'Tomorrow', selection: { mode: 'tomorrow' } },
  { label: 'Next 7 Days', selection: { mode: 'next7' } },
  { label: 'All Upcoming', selection: { mode: 'upcoming' } },
];

const BROADCAST_OPTIONS: ReadonlyArray<{ value: BroadcastFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'fta', label: 'FTA' },
  { value: 'scrambled', label: 'Encrypted' },
  { value: 'platform', label: 'Platforms' },
];

const CHIP =
  'rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40';

export function FilterBar({
  search,
  onSearch,
  selection,
  onSelection,
  broadcast,
  onBroadcast,
}: {
  search: string;
  onSearch: (value: string) => void;
  selection: DateSelection;
  onSelection: (value: DateSelection) => void;
  broadcast: BroadcastFilter;
  onBroadcast: (value: BroadcastFilter) => void;
}) {
  const pickedDate = selection.mode === 'date' ? selection.date : '';

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative w-full lg:max-w-sm">
          <span className="sr-only">Search by team or broadcaster</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search team or broadcaster"
            className="h-10 w-full rounded-full border border-border bg-background pl-10 pr-4 text-[14px] outline-none transition-colors duration-200 focus:border-teal focus:ring-2 focus:ring-teal/20"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          {DATE_SHORTCUTS.map((shortcut) => {
            const active = selection.mode === shortcut.selection.mode;
            return (
              <button
                key={shortcut.label}
                type="button"
                aria-pressed={active}
                onClick={() => onSelection(shortcut.selection)}
                className={cn(
                  CHIP,
                  active ? 'bg-teal text-teal-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground',
                )}
              >
                {shortcut.label}
              </button>
            );
          })}
          <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className="sr-only md:not-sr-only">Choose a date</span>
            <input
              type="date"
              value={pickedDate}
              onChange={(e) =>
                onSelection(e.target.value ? { mode: 'date', date: e.target.value } : { mode: 'upcoming' })
              }
              className="h-8 rounded-full border border-border bg-background px-3 text-[12px] text-foreground outline-none transition-colors duration-200 focus:border-teal focus:ring-2 focus:ring-teal/20"
            />
          </label>
        </div>
      </div>

      <div role="group" aria-label="Broadcast type" className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[12px] font-medium text-muted-foreground">Broadcast</span>
        {BROADCAST_OPTIONS.map((option) => {
          const active = broadcast === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onBroadcast(option.value)}
              className={cn(
                CHIP,
                active ? 'bg-teal text-teal-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
