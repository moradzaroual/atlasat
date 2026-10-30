'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDirectory } from '@/lib/data/channels';
import { parseOrbitalPosition } from '@/lib/data/channels';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ArrowUpDown, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortKey = 'name-asc' | 'name-desc';

export default function ChannelsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [search, setSearch] = useState(initialQuery);
  const [sort, setSort] = useState<SortKey>('name-asc');

  const directoryQuery = useQuery({
    queryKey: ['directory'],
    queryFn: fetchDirectory,
  });

  const satellites = directoryQuery.data?.satellites ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return satellites;
    const q = search.toLowerCase();
    return satellites.filter((s) =>
      s.satellite_name?.toLowerCase().includes(q),
    );
  }, [satellites, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort === 'name-asc') {
      arr.sort((a, b) => a.satellite_name.localeCompare(b.satellite_name));
    } else {
      arr.sort((a, b) => b.satellite_name.localeCompare(a.satellite_name));
    }
    return arr;
  }, [filtered, sort]);

  const toggleSort = () =>
    setSort((s) => (s === 'name-asc' ? 'name-desc' : 'name-asc'));

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <h1 className="font-serif text-[28px] tracking-tight md:text-[36px]">
          Satellite directory
        </h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Find a satellite and open its channel lineup. Data is loaded live from the channels API.
        </p>
      </div>

      {/* Search + sort */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search satellite names…"
            className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-[14px] outline-none transition-colors focus:border-teal focus:ring-2 focus:ring-teal/20"
            aria-label="Search satellites"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-10 gap-1.5"
          onClick={toggleSort}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          A–Z
        </Button>
        {directoryQuery.isError && (
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-1.5"
            onClick={() => directoryQuery.refetch()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        )}
      </div>

      {/* Status */}
      {directoryQuery.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-14 skeleton-shimmer rounded-lg" />
          ))}
        </div>
      )}

      {directoryQuery.isError && (
        <Card className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div>
            <p className="font-medium text-[15px]">Could not load the satellite directory</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              The channels API may be unavailable or returning an unexpected response.
              {(directoryQuery.error as Error)?.message &&
                ` ${directoryQuery.error.message}`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => directoryQuery.refetch()}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        </Card>
      )}

      {directoryQuery.isSuccess && (
        <>
          <div className="mb-3 flex items-center gap-2 text-[13px] text-muted-foreground">
            <span className="tabular-nums">{sorted.length} satellites</span>
          </div>
          {sorted.length === 0 ? (
            <Card className="p-8 text-center text-[14px] text-muted-foreground">
              No satellites match &ldquo;{search}&rdquo;.
            </Card>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((sat) => {
                const pos = sat.orbital_position ?? parseOrbitalPosition(sat.satellite_name);
                return (
                  <Link
                    key={sat.gid}
                    href={`/channels/${sat.gid}`}
                    className="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-teal/40 hover:bg-secondary/30"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">
                        {sat.satellite_name}
                      </span>
                      {pos && (
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {pos}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-teal" />
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}