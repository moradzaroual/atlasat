export const FALLBACK_TIME_ZONE = 'Africa/Casablanca';
export const SOURCE_TIME_ZONE = 'Africa/Casablanca';

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(\d{1,2}):(\d{2})/;

export function isValidTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

export function getBrowserTimeZone(): string {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return zone && isValidTimeZone(zone) ? zone : FALLBACK_TIME_ZONE;
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function zonedParts(ms: number, zone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(ms);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  };
}

function zoneOffsetMs(ms: number, zone: string): number {
  const p = zonedParts(ms, zone);
  const wallClockAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wallClockAsUtc - Math.floor(ms / 1000) * 1000;
}

export function dateKeyInZone(ms: number, zone: string): string {
  const p = zonedParts(ms, zone);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function shiftDateKey(key: string, days: number): string {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Converts a wall-clock date and time in a timezone to an epoch timestamp. */
export function zonedDateTimeToMs(dateKey: string, time: string, zone: string): number | null {
  const timeMatch = TIME_PATTERN.exec(time);
  if (!DATE_KEY_PATTERN.test(dateKey) || !timeMatch) return null;

  const [year, month, day] = dateKey.split('-').map(Number);
  const guess = Date.UTC(year, month - 1, day, Number(timeMatch[1]), Number(timeMatch[2]));
  if (Number.isNaN(guess)) return null;

  const firstPass = guess - zoneOffsetMs(guess, zone);
  return guess - zoneOffsetMs(firstPass, zone);
}

export function formatKickoffTime(ms: number, zone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(ms);
}

export function formatDayHeading(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  const includeYear = dateKey.slice(0, 4) !== String(new Date().getUTCFullYear());
  const base = `${read('weekday')}, ${read('day')} ${read('month')}`;
  return includeYear ? `${base} ${dateKey.slice(0, 4)}` : base;
}

export function formatTimestamp(ms: number, zone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).format(ms);
}
