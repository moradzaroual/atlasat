/** Format a frequency value, adding MHz suffix. */
export function formatFrequency(mhz?: string): string {
  if (!mhz) return '—';
  const n = parseFloat(mhz);
  if (isNaN(n)) return mhz;
  return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)} MHz`;
}

/** Format a polarization code for display. */
export function formatPolarization(p?: string): string {
  if (!p) return '—';
  const up = p.trim().toUpperCase();
  const map: Record<string, string> = {
    H: 'Horizontal',
    V: 'Vertical',
    L: 'LHCP',
    R: 'RHCP',
    LH: 'LHCP',
    RH: 'RHCP',
    CL: 'Circular L',
    CR: 'Circular R',
  };
  return map[up] ?? up;
}

/** Short polarization label for compact tables. */
export function shortPol(p?: string): string {
  if (!p) return '—';
  return p.trim().toUpperCase().slice(0, 1);
}

/** Format an encryption string. */
export function formatEncryption(enc?: string): string {
  if (!enc || enc === '-' || enc.trim() === '') return 'No encryption listed';
  return enc.trim();
}

/** Format a symbol rate. */
export function formatSymbolRate(sr?: string): string {
  if (!sr || sr === '-') return '—';
  return `SR ${sr}`;
}

/** Format FEC. */
export function formatFec(fec?: string): string {
  if (!fec || fec === '-') return '—';
  return `FEC ${fec}`;
}

/** Get initials from a channel name for fallback logos. */
export function getInitials(name?: string): string {
  if (!name) return 'SAT';
  const clean = name.replace(/[^\p{L}\p{N}\s]/gu, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'SAT';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Format a timestamp to a time string in a given timezone. */
export function formatTime(utc: number, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(new Date(utc));
}

/** Format a timestamp to a full date string in a given timezone. */
export function formatDate(utc: number, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: timezone,
  }).format(new Date(utc));
}

/** Format a date offset to a "Today", "Tomorrow", or weekday name. */
export function dayLabel(dayOffset: number): string {
  if (dayOffset === 0) return 'Today';
  if (dayOffset === 1) return 'Tomorrow';
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(d);
}

/** Get the date string for a day offset in a timezone. */
export function dayDateString(dayOffset: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}
