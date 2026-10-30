import type { ChannelRow, FrequencyGroup } from '@/types';

/** A stable key for a frequency group. */
export function freqGroupKey(row: ChannelRow): string {
  const f = (row.frequency_mhz ?? '').trim();
  const p = (row.polarization ?? '').trim().toUpperCase();
  const b = (row.beam ?? '').trim();
  return `${f}::${p}::${b}`;
}

/** A human-readable frequency group label, e.g. "10773 H · Pan Europe". */
export function freqGroupLabel(row: ChannelRow): string {
  const f = (row.frequency_mhz ?? '').trim();
  const p = (row.polarization ?? '').trim().toUpperCase();
  const b = (row.beam ?? '').trim();
  const parts: string[] = [];
  if (f) parts.push(f);
  if (p) parts.push(p);
  if (b) parts.push(b);
  return parts.join(' · ');
}

/** Whether a row is a provider/package metadata row, not a channel service. */
export function isProviderRow(row: ChannelRow): boolean {
  const rt = (row.row_type ?? '').trim().toLowerCase();
  return rt === 'provider' || rt === 'package';
}

/** Whether a row is a service/channel row. */
export function isServiceRow(row: ChannelRow): boolean {
  return !isProviderRow(row);
}

/** Whether a row has an explicit encryption value listed. */
export function hasEncryption(row: ChannelRow): boolean {
  const e = (row.encryption ?? '').trim();
  return e.length > 0 && e.toLowerCase() !== 'none' && e.toLowerCase() !== 'fta' && e !== '-';
}

/** Whether a name contains HD or UHD. */
export function isHdUhd(row: ChannelRow): boolean {
  const n = (row.name ?? '').toUpperCase();
  return /\bHD\b|\bUHD\b|\b4K\b/.test(n);
}

/** Build a frequency-grouped structure from channel rows. */
export function groupByFrequency(rows: ChannelRow[]): FrequencyGroup[] {
  const groups = new Map<string, FrequencyGroup>();

  const sorted = [...rows].sort((a, b) => {
    const fa = parseFloat(a.frequency_mhz ?? '0') || 0;
    const fb = parseFloat(b.frequency_mhz ?? '0') || 0;
    if (fa !== fb) return fa - fb;
    return (a.polarization ?? '').localeCompare(b.polarization ?? '');
  });

  for (const row of sorted) {
    const key = freqGroupKey(row);
    if (!groups.has(key)) {
      groups.set(key, {
        key: {
          frequency_mhz: (row.frequency_mhz ?? '').trim(),
          polarization: (row.polarization ?? '').trim(),
          beam: (row.beam ?? '').trim(),
        },
        system: (row.system ?? '').trim(),
        modulation: (row.modulation ?? '').trim(),
        symbol_rate: (row.symbol_rate ?? '').trim(),
        fec: (row.fec ?? '').trim(),
        services: [],
        providers: [],
        subgroups: new Map(),
      });
    }
    const group = groups.get(key)!;

    if (isProviderRow(row)) {
      group.providers.push(row);
    } else {
      group.services.push(row);
    }

    const sgKey = [group.system, group.modulation, group.symbol_rate, group.fec]
      .filter(Boolean)
      .join(' · ');
    if (!group.subgroups.has(sgKey)) {
      group.subgroups.set(sgKey, []);
    }
    group.subgroups.get(sgKey)!.push(row);
  }

  return Array.from(groups.values());
}

/** Count distinct frequency groups. */
export function countFrequencyGroups(rows: ChannelRow[]): number {
  const keys = new Set<string>();
  for (const row of rows) {
    if (!row.frequency_mhz) continue;
    keys.add(freqGroupKey(row));
  }
  return keys.size;
}

/** Extract a logo URL from a row's logo_urls field (pipe or comma separated). */
export function extractLogoUrl(row: ChannelRow): string | null {
  const raw = (row.logo_urls ?? '').trim();
  if (!raw) return null;
  const parts = raw.split(/[|,]/);
  return parts[0]?.trim() || null;
}

/** Extract a name URL (link) from name_urls. */
export function extractNameUrl(row: ChannelRow): string | null {
  const raw = (row.name_urls ?? '').trim();
  if (!raw) return null;
  const parts = raw.split(/[|,]/);
  return parts[0]?.trim() || null;
}
