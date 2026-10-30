'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, CircleHelp, ExternalLink, Globe, Lock, MonitorPlay, Tv, type LucideIcon } from 'lucide-react';
import type { Broadcaster, BroadcastType, TuningDetail } from '@/types';
import { cn } from '@/lib/utils';

export const BROADCAST_META: Record<BroadcastType, { label: string; className: string; Icon: LucideIcon }> = {
  fta: {
    label: 'Free-to-air',
    className: 'border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
    Icon: Tv,
  },
  scrambled: {
    label: 'Encrypted TV',
    className: 'border-amber-600/30 bg-amber-500/10 text-amber-800 dark:text-amber-300',
    Icon: Lock,
  },
  platform: {
    label: 'Platforms / IPTV / Cable',
    className: 'border-sky-600/30 bg-sky-500/10 text-sky-800 dark:text-sky-300',
    Icon: MonitorPlay,
  },
  unknown: {
    label: 'Unclassified',
    className: 'border-border bg-secondary text-muted-foreground',
    Icon: CircleHelp,
  },
};

const GROUP_ORDER: BroadcastType[] = ['fta', 'scrambled', 'platform', 'unknown'];

export function BroadcastBadge({ type }: { type: BroadcastType }) {
  const meta = BROADCAST_META[type];
  const Icon = meta.Icon;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', meta.className)}>
      <Icon className="h-3 w-3" aria-hidden />
      {meta.label}
    </span>
  );
}

/** Animates height and visibility; content stays mounted so aria-controls always resolves. */
export function Collapse({ open, id, children }: { open: boolean; id: string; children: ReactNode }) {
  return (
    <div
      id={id}
      className={cn(
        'grid transition-[grid-template-rows,opacity,visibility] duration-200 ease-out',
        open ? 'grid-rows-[1fr] opacity-100' : 'invisible grid-rows-[0fr] opacity-0',
      )}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

export function BroadcasterPanel({ broadcasters }: { broadcasters: Broadcaster[] }) {
  if (broadcasters.length === 0) {
    return <p className="text-[13px] text-muted-foreground">Broadcast details not announced.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {GROUP_ORDER.map((type) => {
        const items = broadcasters.filter((b) => b.type === type);
        if (items.length === 0) return null;
        return (
          <section key={type} aria-label={BROADCAST_META[type].label}>
            <div className="mb-2 flex items-center gap-2">
              <BroadcastBadge type={type} />
              <span className="text-[12px] text-muted-foreground">{items.length}</span>
            </div>
            <ul className="flex flex-col divide-y divide-border/60 rounded-xl border border-border/60">
              {items.map((broadcaster, index) => (
                <BroadcasterItem key={`${broadcaster.channelId}-${index}`} broadcaster={broadcaster} />
              ))}
            </ul>
          </section>
        );
      })}
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        Broadcast availability depends on location, reception and subscription. Categories reflect the
        source listings and are not guarantees that a service is universally free or available.
      </p>
    </div>
  );
}

function BroadcasterItem({ broadcaster }: { broadcaster: Broadcaster }) {
  const [showTuning, setShowTuning] = useState(false);
  const tuningId = `tuning-${broadcaster.channelId}-${broadcaster.name.replace(/\W+/g, '-')}`;

  return (
    <li className="flex flex-col gap-2 px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {broadcaster.logoUrl ? (
          <span className="flex items-center gap-2">
            <img
              src={broadcaster.logoUrl}
              alt=""
              width={28}
              height={28}
              loading="lazy"
              decoding="async"
              className="h-7 w-7 object-contain"
            />
            <span className="text-[14px] font-medium">{broadcaster.name}</span>
          </span>
        ) : (
          <span className="rounded-md border border-border bg-background px-2 py-1 text-[13px] font-medium">
            {broadcaster.name}
          </span>
        )}
        {broadcaster.geoRestricted && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
            <Globe className="h-3 w-3" aria-hidden />
            Geo-restricted
          </span>
        )}
        {broadcaster.providerUrl && (
          <a
            href={broadcaster.providerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-teal underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
          >
            Provider website
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        )}
      </div>

      {broadcaster.tuning.length > 0 && (
        <div>
          <button
            type="button"
            aria-expanded={showTuning}
            aria-controls={tuningId}
            onClick={() => setShowTuning((value) => !value)}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            Satellite details
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', showTuning && 'rotate-180')} aria-hidden />
          </button>
          <Collapse open={showTuning} id={tuningId}>
            <TuningTable details={broadcaster.tuning} />
          </Collapse>
        </div>
      )}
    </li>
  );
}

function TuningTable({ details }: { details: TuningDetail[] }) {
  return (
    <div className="mt-2 overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full min-w-[520px] text-left text-[12px]">
        <thead className="bg-secondary/60 text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Satellite</th>
            <th scope="col" className="px-3 py-2 font-medium">Position</th>
            <th scope="col" className="px-3 py-2 font-medium">Frequency</th>
            <th scope="col" className="px-3 py-2 font-medium">Symbol rate / FEC</th>
            <th scope="col" className="px-3 py-2 font-medium">Encryption</th>
          </tr>
        </thead>
        <tbody>
          {details.map((detail, index) => (
            <tr key={index} className="border-t border-border/60">
              <td className="px-3 py-2">{detail.satellite}</td>
              <td className="px-3 py-2 tabular-nums">{detail.orbitalPosition || '-'}</td>
              <td className="px-3 py-2 tabular-nums">{detail.frequency || '-'}</td>
              <td className="px-3 py-2 tabular-nums">{detail.symbolRateFec || '-'}</td>
              <td className="px-3 py-2">{detail.encryption || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
