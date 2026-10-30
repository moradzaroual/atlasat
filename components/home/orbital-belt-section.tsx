'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { SatelliteDirectoryEntry, CoverageSatellite } from '@/types';
import { parseOrbitalPosition } from '@/lib/data/channels';
import { Satellite, ArrowRight, Search, X, Compass } from 'lucide-react';

interface OrbitalBeltSectionProps {
  satellites: SatelliteDirectoryEntry[];
  coverageSatellites: CoverageSatellite[];
}

interface OrbitalSlot {
  key: string;
  degrees: number;
  hemisphere: 'E' | 'W';
  label: string;
  sats: SatelliteDirectoryEntry[];
  bands: string[];
}

const BAND_COLORS: Record<string, string> = {
  Ku: 'text-teal border-teal/30 bg-teal/5',
  C: 'text-gold border-gold/30 bg-gold/5',
  Ka: 'text-blue-500 border-blue-500/30 bg-blue-500/5',
  S: 'text-purple-500 border-purple-500/30 bg-purple-500/5',
  L: 'text-rose-500 border-rose-500/30 bg-rose-500/5',
  X: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5',
};

function getBandsForSatellite(
  satName: string,
  coverageSatellites: CoverageSatellite[],
): string[] {
  const bands = new Set<string>();
  const lowerName = satName.toLowerCase();
  for (const cov of coverageSatellites) {
    const covName = cov.satellite_name.toLowerCase();
    if (lowerName.includes(covName) || covName.includes(lowerName)) {
      for (const b of cov.bands) {
        if (b) bands.add(b);
      }
    }
  }
  const result = Array.from(bands).sort();
  return result.length > 0 ? result : ['Ku'];
}

function extractDegrees(sat: SatelliteDirectoryEntry): number | null {
  if (sat.orbital_longitude_deg) {
    const d = parseFloat(sat.orbital_longitude_deg);
    if (!isNaN(d)) return d;
  }
  const pos = sat.orbital_position ?? parseOrbitalPosition(sat.satellite_name);
  if (pos) {
    const match = pos.match(/(-?\d+(?:\.\d+)?)°([EW])/i);
    if (match) {
      let deg = parseFloat(match[1]);
      if (match[2].toUpperCase() === 'W') deg = -deg;
      return deg;
    }
  }
  const nameMatch = sat.satellite_name.match(/(-?\d+(?:\.\d+)?)\s*°?\s*([EW])/i);
  if (nameMatch) {
    let deg = parseFloat(nameMatch[1]);
    if (nameMatch[2].toUpperCase() === 'W') deg = -deg;
    return deg;
  }
  return null;
}

export function OrbitalBeltSection({
  satellites,
  coverageSatellites,
}: OrbitalBeltSectionProps) {
  const [search, setSearch] = useState('');
  const [activeBand, setActiveBand] = useState<string | null>(null);

  const slots = useMemo(() => {
    const map = new Map<string, OrbitalSlot>();

    for (const sat of satellites) {
      const deg = extractDegrees(sat);
      if (deg === null) continue;

      const hemisphere = deg < 0 ? 'W' : 'E';
      const absDeg = Math.abs(deg);
      const key = `${absDeg}${hemisphere}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          degrees: deg,
          hemisphere,
          label: `${absDeg}°${hemisphere}`,
          sats: [],
          bands: [],
        });
      }

      const slot = map.get(key)!;
      slot.sats.push(sat);
      const satBands = getBandsForSatellite(sat.satellite_name, coverageSatellites);
      for (const b of satBands) {
        if (!slot.bands.includes(b)) slot.bands.push(b);
      }
    }

    return Array.from(map.values()).sort((a, b) => a.degrees - b.degrees);
  }, [satellites, coverageSatellites]);

  const allBands = useMemo(
    () => Array.from(new Set(slots.flatMap((s) => s.bands))).sort(),
    [slots],
  );

  const filteredSlots = useMemo(() => {
    if (!search.trim() && !activeBand) return slots;
    return slots.filter((slot) => {
      if (activeBand && !slot.bands.includes(activeBand)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesSlot = slot.label.toLowerCase().includes(q);
        const matchesSat = slot.sats.some((s) =>
          s.satellite_name.toLowerCase().includes(q),
        );
        if (!matchesSlot && !matchesSat) return false;
      }
      return true;
    });
  }, [slots, search, activeBand]);

  // SVG arc parameters
  const arcWidth = 1200;
  const arcHeight = 100;
  const arcRadius = 500;
  const arcCx = arcWidth / 2;
  const arcCy = arcRadius + 20;

  const degToX = (deg: number) => {
    const normalized = (deg + 180) / 360;
    return normalized * arcWidth;
  };

  const degToArcPoint = (deg: number) => {
    const x = degToX(deg);
    const dx = x - arcCx;
    const y = arcCy - Math.sqrt(Math.max(0, arcRadius * arcRadius - dx * dx));
    return { x, y };
  };

  if (slots.length === 0) return null;

  const westSlots = slots.filter((s) => s.degrees < 0);
  const eastSlots = slots.filter((s) => s.degrees >= 0);

  return (
    <section className="px-4 pb-12 md:px-6 md:pb-16">
      <div className="mb-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[12px] font-medium text-muted-foreground">
          <Satellite className="h-3 w-3 text-teal" />
          Geostationary orbital belt
        </div>
        <h2 className="font-serif text-[26px] tracking-tight md:text-[32px]">
          Satellites by orbital position
        </h2>
        <p className="mt-1 max-w-2xl text-[14px] text-muted-foreground">
          {slots.length} orbital slots · {satellites.length} satellites across
          the Clarke belt. Tap any position to open its channel lineup. Band
          indicators show which frequency bands each slot serves.
        </p>
      </div>

      {/* Orbital arc visualization */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-secondary/40 to-background">
        <div className="relative w-full">
          <svg
            viewBox={`0 0 ${arcWidth} ${arcHeight}`}
            className="w-full"
            preserveAspectRatio="xMidYMid meet"
            style={{ height: 'auto', maxHeight: '120px' }}
          >
            {/* Arc path */}
            <path
              d={`M 0 ${arcCy - Math.sqrt(Math.max(0, arcRadius * arcRadius - arcCx * arcCx))} A ${arcRadius} ${arcRadius} 0 0 1 ${arcWidth} ${arcCy - Math.sqrt(Math.max(0, arcRadius * arcRadius - arcCx * arcCx))}`}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Center line (0°) */}
            <line
              x1={arcCx}
              y1={arcCy - Math.sqrt(Math.max(0, arcRadius * arcRadius))}
              x2={arcCx}
              y2={arcCy - Math.sqrt(Math.max(0, arcRadius * arcRadius)) + 8}
              stroke="hsl(var(--teal))"
              strokeWidth="1.5"
            />
            {/* Position markers */}
            {slots.map((slot) => {
              const pt = degToArcPoint(slot.degrees);
              return (
                <g key={slot.key}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={Math.min(3 + slot.sats.length * 0.5, 7)}
                    fill="hsl(var(--teal))"
                    fillOpacity={0.6}
                    stroke="hsl(var(--teal))"
                    strokeWidth="1"
                  />
                </g>
              );
            })}
            {/* Hemisphere labels */}
            <text
              x={20}
              y={arcHeight - 5}
              className="fill-muted-foreground/60"
              style={{ fontSize: '11px', fontWeight: 500 }}
            >
              WEST ←
            </text>
            <text
              x={arcWidth - 20}
              y={arcHeight - 5}
              textAnchor="end"
              className="fill-muted-foreground/60"
              style={{ fontSize: '11px', fontWeight: 500 }}
            >
              → EAST
            </text>
            <text
              x={arcCx}
              y={arcHeight - 5}
              textAnchor="middle"
              className="fill-teal"
              style={{ fontSize: '11px', fontWeight: 600 }}
            >
              0°
            </text>
          </svg>
        </div>
        {/* Arc legend showing range */}
        <div className="flex items-center justify-center gap-2 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <Compass className="h-3 w-3" />
          <span className="tabular-nums">
            {Math.abs(slots[0]?.degrees ?? 0)}°W
          </span>
          <span className="text-muted-foreground/40">—</span>
          <span className="tabular-nums">0°</span>
          <span className="text-muted-foreground/40">—</span>
          <span className="tabular-nums">
            {Math.abs(slots[slots.length - 1]?.degrees ?? 0)}°E
          </span>
          <span className="ml-2 hidden sm:inline">· {slots.length} orbital slots</span>
        </div>
      </div>

      {/* Band filter + search */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-medium text-muted-foreground">Bands:</span>
        <button
          onClick={() => setActiveBand(null)}
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
            !activeBand
              ? 'border-foreground/40 bg-secondary text-foreground'
              : 'border-border bg-card text-muted-foreground hover:border-teal/30'
          }`}
        >
          All
        </button>
        {allBands.map((band) => (
          <button
            key={band}
            onClick={() => setActiveBand(activeBand === band ? null : band)}
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
              activeBand === band
                ? BAND_COLORS[band] ?? 'text-foreground border-foreground/40 bg-secondary'
                : 'border-border bg-card text-muted-foreground hover:border-teal/30'
            }`}
          >
            {band}
          </button>
        ))}
        <div className="relative ml-auto min-w-[140px] flex-1 max-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter slots or satellites…"
            className="h-8 w-full rounded-lg border border-border bg-card pl-8 pr-7 text-[12px] outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
            aria-label="Filter orbital positions"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Orbital position cards */}
      {filteredSlots.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-[13px] text-muted-foreground">
          No slots match the current filter.
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredSlots.map((slot) => (
            <Link
              key={slot.key}
              href={`/channels/${slot.sats[0].gid}`}
              className="group relative flex flex-col gap-1.5 rounded-lg border border-border bg-card p-3 transition-all hover:border-teal/40 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-serif text-[20px] font-semibold tabular-nums leading-none">
                    {slot.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {slot.sats.length}
                    {slot.sats.length === 1 ? ' sat' : ' sats'}
                  </span>
                </div>
                <ArrowRight className="h-3 w-3 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-teal" />
              </div>

              {/* Satellite names */}
              <div className="min-h-[2.5em] space-y-0">
                {slot.sats.slice(0, 2).map((sat, i) => (
                  <div
                    key={sat.gid}
                    className="truncate text-[11px] font-medium leading-tight"
                  >
                    {sat.satellite_name}
                    {i === 0 && slot.sats.length > 2 && (
                      <span className="ml-1 text-[10px] text-muted-foreground">
                        +{slot.sats.length - 1} more
                      </span>
                    )}
                  </div>
                ))}
                {slot.sats.length === 2 && (
                  <div
                    key={slot.sats[1].gid}
                    className="truncate text-[11px] font-medium leading-tight"
                  >
                    {slot.sats[1].satellite_name}
                  </div>
                )}
              </div>

              {/* Band badges */}
              <div className="mt-auto flex flex-wrap gap-1 pt-1">
                {slot.bands.map((band) => (
                  <span
                    key={band}
                    className={`inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium ${BAND_COLORS[band] ?? 'text-muted-foreground border-border bg-secondary'}`}
                  >
                    {band}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* West / East summary for quick navigation */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-secondary/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[13px] font-semibold">Western arc</span>
            <span className="text-[12px] tabular-nums text-muted-foreground">
              {westSlots.length} slots · {westSlots.reduce((s, sl) => s + sl.sats.length, 0)} satellites
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {westSlots.map((slot) => (
              <Link
                key={slot.key}
                href={`/channels/${slot.sats[0].gid}`}
                className="rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium tabular-nums transition-colors hover:border-teal/40 hover:text-teal"
              >
                {slot.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-secondary/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[13px] font-semibold">Eastern arc</span>
            <span className="text-[12px] tabular-nums text-muted-foreground">
              {eastSlots.length} slots · {eastSlots.reduce((s, sl) => s + sl.sats.length, 0)} satellites
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {eastSlots.map((slot) => (
              <Link
                key={slot.key}
                href={`/channels/${slot.sats[0].gid}`}
                className="rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium tabular-nums transition-colors hover:border-teal/40 hover:text-teal"
              >
                {slot.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}