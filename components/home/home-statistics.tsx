'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, Globe2, Newspaper, Satellite } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchDirectory } from '@/lib/data/channels';
import { fetchBeams } from '@/lib/data/beams';
import { fetchBlogArticles } from '@/lib/data/blog';
import { useLeagueFixtures, useScheduleIndexes } from '@/hooks/use-schedule-data';
import { formatDayHeading, formatKickoffTime, getBrowserTimeZone, FALLBACK_TIME_ZONE, dateKeyInZone } from '@/lib/schedule/time';
import type { ScheduleMatch, ScheduleTeam } from '@/types';

function AnimatedNumber({ value, ready, className = '' }: { value: number; ready: boolean; className?: string }) {
  const [display, setDisplay] = useState(0);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.2 });
    const element = document.getElementById('atlasat-home-statistics');
    if (element) observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!ready || !visible) return;
    if (reducedMotion) {
      setDisplay(value);
      return;
    }
    const started = performance.now();
    const duration = 1200;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ready, visible, reducedMotion, value]);

  return <span className={className}>{ready ? display.toLocaleString() : <span className="inline-block h-[1em] w-20 animate-pulse rounded bg-current/10" aria-label="Loading" />}</span>;
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

function Crest({ team }: { team: ScheduleTeam }) {
  const [failed, setFailed] = useState(false);
  if (!team.logoUrl || failed) {
    return <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-t-2xl rounded-b-[35%] border border-[#b6d3bf] bg-[#d2e4d8] text-sm font-semibold text-[#126344]">{initials(team.name)}</span>;
  }
  return <img src={team.logoUrl} alt="" width={56} height={56} onError={() => setFailed(true)} className="h-14 w-14 shrink-0 object-contain" />;
}

function StatLink({ href, icon: Icon, value, ready, unavailable, retry, label, description, tone }: {
  href: string;
  icon: typeof Satellite;
  value: number;
  ready: boolean;
  unavailable?: boolean;
  retry?: () => void;
  label: string;
  description: string;
  tone: 'sage' | 'mint' | 'ivory';
}) {
  const tones = { sage: 'bg-[#e4eee7]', mint: 'bg-[#d2e4d8]', ivory: 'bg-[#f8f7f2]' };
  return (
    <div className={`grid min-h-[300px] grid-rows-[auto_minmax(0,1fr)_auto_auto_minmax(64px,auto)_auto] rounded-3xl border border-[#c4dacb] ${tones[tone]} p-6 text-[#063d29] md:min-h-[400px]`}>
      <Link href={href} className="contents group focus-visible:outline-none">
        <Icon className="h-7 w-7 stroke-[1.35]" aria-hidden />
        <span aria-hidden />
        {unavailable ? <span className="block text-3xl font-light">Unavailable</span> : <AnimatedNumber value={value} ready={ready} className="block text-6xl font-light leading-none tracking-[-0.06em] tabular-nums md:text-7xl" />}
        <p className="mt-3 text-[15px] font-semibold">{label}</p>
        <p className="mt-2 max-w-[18rem] self-start text-[13px] leading-relaxed text-[#37624c]">{description}</p>
        <span className="mt-6 inline-flex items-center gap-1 text-[12px] font-semibold">Explore <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
      </Link>
      {unavailable && retry && <button type="button" onClick={retry} className="col-start-1 row-start-6 mt-2 justify-self-start text-[12px] font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#126344]">Retry</button>}
    </div>
  );
}

export function HomeStatistics() {
  const directoryQuery = useQuery({ queryKey: ['directory'], queryFn: fetchDirectory });
  const beamsQuery = useQuery({ queryKey: ['beams'], queryFn: fetchBeams });
  const blogQuery = useQuery({ queryKey: ['blog-articles'], queryFn: fetchBlogArticles, staleTime: 10 * 60 * 1000 });
  const indexesQuery = useScheduleIndexes();
  const fixtureQueries = useLeagueFixtures();
  const [timeZone, setTimeZone] = useState(FALLBACK_TIME_ZONE);

  useEffect(() => setTimeZone(getBrowserTimeZone()), []);

  const directoryCount = useMemo(() => new Set((directoryQuery.data?.satellites ?? []).map((satellite) => satellite.gid)).size, [directoryQuery.data]);
  const coverageSatelliteCount = useMemo(() => new Set((beamsQuery.data ?? []).map((satellite) => satellite.satellite_id)).size, [beamsQuery.data]);
  const beamCount = useMemo(() => new Set((beamsQuery.data ?? []).flatMap((satellite) => satellite.beams.map((beam) => beam.beam_id)).filter(Boolean)).size, [beamsQuery.data]);
  const articleCount = useMemo(() => new Set((blogQuery.data ?? []).map((article) => article.id || article.slug)).size, [blogQuery.data]);
  const leagueCount = indexesQuery.data?.leagueLogos.size ?? 0;
  const scheduleReady = indexesQuery.isSuccess && fixtureQueries.every((query) => query.isSuccess);
  const scheduleFailed = indexesQuery.isError || fixtureQueries.some((query) => query.isError);

  const featuredMatch = useMemo(() => {
    const now = Date.now();
    return fixtureQueries.flatMap((query) => query.data ?? [])
      .filter((match): match is ScheduleMatch & { kickoffMs: number } => match.featured && match.kickoffMs !== null && match.kickoffMs >= now)
      .sort((a, b) => a.kickoffMs - b.kickoffMs)[0] ?? null;
  }, [fixtureQueries]);

  const retryAll = () => {
    void indexesQuery.refetch();
    fixtureQueries.forEach((query) => void query.refetch());
  };
  const directoryUnavailable = directoryQuery.isError;
  const coverageUnavailable = beamsQuery.isError;
  const blogUnavailable = blogQuery.isError;

  return (
    <section id="atlasat-home-statistics" className="bg-[#f8f7f2] px-4 py-12 md:px-6 md:py-16" aria-label="Atlasat statistics">
      <div className="mx-auto grid max-w-[1400px] gap-4 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <article className="relative min-h-[420px] overflow-hidden rounded-3xl bg-[#063d29] p-6 text-[#f8f7f2] md:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-[0.11]" style={{ backgroundImage: 'linear-gradient(rgba(120,217,165,.55) 1px, transparent 1px), linear-gradient(90deg, rgba(120,217,165,.55) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <svg aria-hidden className="pointer-events-none absolute right-0 top-0 h-[90px] w-[90px] overflow-visible opacity-[0.88] md:h-[160px] md:w-[160px]" viewBox="0 0 160 160" preserveAspectRatio="xMidYMid meet">
            <path d="M 0 0 A 160 160 0 0 0 160 160" fill="none" stroke="white" strokeWidth="7" vectorEffect="non-scaling-stroke" strokeLinecap="butt" />
          </svg>
          <div className="relative flex h-full flex-col">
            <CalendarDays className="h-7 w-7 stroke-[1.25] text-[#78d9a5]" aria-hidden />
            <div className="mt-8">
              {scheduleFailed ? <span className="text-3xl font-light">Unavailable</span> : <AnimatedNumber value={leagueCount} ready={scheduleReady} className="block text-7xl font-light leading-none tracking-[-0.07em] text-[#78d9a5] tabular-nums md:text-8xl" />}
              <p className="mt-3 text-[15px] font-semibold">Leagues covered</p>
            </div>
            <div className="mt-8 border-t border-[#78d9a5]/25 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#78d9a5]">Featured match</p>
              {featuredMatch ? (
                <>
                  <div className="mt-2 flex items-center gap-2 text-[12px] text-[#b7ddc5]">
                    {featuredMatch.leagueLogoUrl && <img src={featuredMatch.leagueLogoUrl} alt="" width={20} height={20} className="h-5 w-5 object-contain" />}
                    <span>{featuredMatch.leagueName || featuredMatch.leagueId}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="flex min-w-0 flex-col items-center gap-2 text-center"><Crest team={featuredMatch.home} /><span className="text-[13px] font-semibold leading-snug">{featuredMatch.home.name}</span></div>
                    <span className="text-[10px] font-semibold tracking-[0.18em] text-[#78d9a5]">VS</span>
                    <div className="flex min-w-0 flex-col items-center gap-2 text-center"><Crest team={featuredMatch.away} /><span className="text-[13px] font-semibold leading-snug">{featuredMatch.away.name}</span></div>
                  </div>
                  <p className="mt-4 text-center text-[12px] text-[#b7ddc5]">{formatDayHeading(dateKeyInZone(featuredMatch.kickoffMs, timeZone))} · {formatKickoffTime(featuredMatch.kickoffMs, timeZone)}</p>
                  <Link href={`/schedule?league=${encodeURIComponent(featuredMatch.leagueId)}&match=${encodeURIComponent(featuredMatch.id)}`} className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#78d9a5] px-4 py-2.5 text-[13px] font-semibold text-[#063d29] transition-colors hover:bg-[#9be6ba] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78d9a5]">View channels</Link>
                </>
              ) : scheduleFailed ? <button type="button" onClick={retryAll} className="mt-4 text-left text-[13px] text-[#78d9a5] underline underline-offset-4">Retry schedule</button> : <p className="mt-3 text-[13px] text-[#b7ddc5]">No featured match selected</p>}
            </div>
            <Link href="/schedule" className="relative mt-auto inline-flex items-center gap-1 pt-5 text-[12px] font-semibold text-[#78d9a5] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78d9a5]">Explore schedule <ChevronRight className="h-4 w-4" /></Link>
          </div>
        </article>

        <div className="grid min-h-[300px] grid-rows-[auto_minmax(0,1fr)_auto_auto_minmax(64px,auto)_auto] rounded-3xl border border-[#c4dacb] bg-[#d2e4d8] p-6 text-[#063d29] md:min-h-[400px]">
          <Globe2 className="h-7 w-7 stroke-[1.35]" aria-hidden />
          <span aria-hidden />
          {coverageUnavailable ? <span className="block text-3xl font-light">Unavailable</span> : <AnimatedNumber value={coverageSatelliteCount} ready={beamsQuery.isSuccess} className="block text-6xl font-light leading-none tracking-[-0.06em] tabular-nums md:text-7xl" />}
          <p className="mt-3 text-[15px] font-semibold">Satellites mapped</p>
          <div className="mt-2 self-start text-[#37624c]">
            <p className="text-3xl font-light tabular-nums">{coverageUnavailable ? 'Unavailable' : beamsQuery.isSuccess ? beamCount.toLocaleString() : '—'}</p>
            <p className="text-[12px]">Beam footprints</p>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link href="/coverage" className="inline-flex items-center gap-1 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#126344]">Explore 2D / 3D coverage <ChevronRight className="h-4 w-4" /></Link>
            {coverageUnavailable && <button type="button" onClick={() => void beamsQuery.refetch()} className="text-[12px] font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#126344]">Retry</button>}
          </div>
        </div>
        <StatLink href="/channels" icon={Satellite} value={directoryCount} ready={directoryQuery.isSuccess && !directoryUnavailable} unavailable={directoryUnavailable} retry={() => void directoryQuery.refetch()} label="Satellites" description="Explore channels and frequencies" tone="sage" />
        <StatLink href="/blog" icon={Newspaper} value={articleCount} ready={blogQuery.isSuccess && !blogUnavailable} unavailable={blogUnavailable} retry={() => void blogQuery.refetch()} label="Published articles" description="News from the satellite world" tone="ivory" />
      </div>
    </section>
  );
}
