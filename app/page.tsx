'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchDirectory } from '@/lib/data/channels';
import { fetchBeams } from '@/lib/data/beams';
import { HomeStatistics } from '@/components/home/home-statistics';
import { OrbitSymbol } from '@/components/shared/orbit-symbol';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrbitalBeltSection } from '@/components/home/orbital-belt-section';
import { ArrowRight, Search, Radio, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_CHANNELS, SCHEDULE_DEMO_LABEL } from '@/demo/schedule-data';
import { BLOG_DEMO_LABEL } from '@/demo/blog-data';


export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const directoryQuery = useQuery({
    queryKey: ['directory'],
    queryFn: fetchDirectory,
  });

  const beamsQuery = useQuery({
    queryKey: ['beams'],
    queryFn: fetchBeams,
  });

  const satellites = directoryQuery.data?.satellites ?? [];


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/channels${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 pb-20 md:px-6 md:pt-24 md:pb-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute right-0 top-0 h-full w-full opacity-[0.03] dark:opacity-[0.06]">
            <OrbitSymbol size={500} className="text-teal absolute -right-20 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[12px] font-medium text-muted-foreground">
            <Radio className="h-3 w-3 text-teal" />
            Satellite television directory
          </div>

          <h1 className="font-serif text-[40px] leading-[1.1] tracking-tight md:text-[56px] text-balance">
            A clearer view of satellite television.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground md:text-[17px]">
            Atlasat helps you explore satellite channel lineups, transmission details,
            beam coverage footprints, and program schedules — all in one place.
          </p>

          <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-md items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search satellites…"
                className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-[14px] outline-none transition-colors focus:border-teal focus:ring-2 focus:ring-teal/20"
                aria-label="Search satellites"
              />
            </div>
            <Button type="submit" size="sm" className="h-11 rounded-full px-5">
              Search
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button asChild variant="default" size="default" className="rounded-full">
              <Link href="/channels">
                Explore channels
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="default" className="rounded-full">
              <Link href="/coverage">
                Explore coverage
              </Link>
            </Button>
          </div>
        </div>

      </section>

      <HomeStatistics />

      {/* Orbital belt — satellites by orbital position */}
      {directoryQuery.isSuccess && satellites.length > 0 && (
        <OrbitalBeltSection
          satellites={satellites}
          coverageSatellites={beamsQuery.data ?? []}
        />
      )}

      {/* Demo labels */}
      <section className="px-4 pb-16 md:px-6 md:pb-24">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[11px]">{SCHEDULE_DEMO_LABEL}</Badge>
          <Badge variant="outline" className="text-[11px]">Live blog data</Badge>
          <Badge variant="outline" className="text-[11px]">Live channels data</Badge>
          <Badge variant="outline" className="text-[11px]">Live beam coverage data</Badge>
        </div>
      </section>
    </div>
  );
}