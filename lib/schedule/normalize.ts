import type {
  Broadcaster,
  BroadcastType,
  ScheduleMatch,
  ScheduleTeam,
  TuningDetail,
} from '@/types';
import type { CsvRow } from './csv';
import { repairEncoding } from './encoding';
import { SOURCE_TIME_ZONE, zonedDateTimeToMs } from './time';

export interface ScheduleIndexes {
  teams: Map<string, { name: string; logoUrl: string }>;
  leagueLogos: Map<string, string>;
  channels: Map<string, { typeOverride: BroadcastType | null; logoUrl: string }>;
}

const BROADCAST_TYPES: readonly BroadcastType[] = ['fta', 'scrambled', 'platform', 'unknown'];

const GROUPED_BROADCAST_COLUMNS: ReadonlyArray<[string, BroadcastType]> = [
  ['fta_channels', 'fta'],
  ['scrambled_channels', 'scrambled'],
  ['platforms', 'platform'],
  ['unknown_channels', 'unknown'],
];

export const EMPTY_INDEXES: ScheduleIndexes = {
  teams: new Map(),
  leagueLogos: new Map(),
  channels: new Map(),
};

function text(value: unknown): string {
  if (typeof value === 'number') return String(value);
  if (typeof value !== 'string') return '';
  return repairEncoding(value.trim());
}

function httpUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function asBroadcastType(value: string): BroadcastType | null {
  return (BROADCAST_TYPES as readonly string[]).includes(value) ? (value as BroadcastType) : null;
}

export function buildIndexes(
  teamRows: CsvRow[],
  leagueRows: CsvRow[],
  channelRows: CsvRow[],
): ScheduleIndexes {
  const teams = new Map<string, { name: string; logoUrl: string }>();
  for (const row of teamRows) {
    const id = text(row.team_id);
    if (!id) continue;
    teams.set(id, { name: text(row.team_name), logoUrl: httpUrl(text(row.team_logo_url)) });
  }

  const leagueLogos = new Map<string, string>();
  for (const row of leagueRows) {
    const id = text(row.league_id);
    if (id) leagueLogos.set(id, httpUrl(text(row.league_logo_url)));
  }

  const channels = new Map<string, { typeOverride: BroadcastType | null; logoUrl: string }>();
  for (const row of channelRows) {
    const id = text(row.channel_id);
    if (!id) continue;
    channels.set(id, {
      typeOverride: asBroadcastType(text(row.type_override)),
      logoUrl: httpUrl(text(row.channel_logo_url)),
    });
  }

  return { teams, leagueLogos, channels };
}

function toTeam(row: CsvRow, prefix: 'team1' | 'team2', indexes: ScheduleIndexes): ScheduleTeam {
  const id = text(row[`${prefix}_id`]);
  const indexed = indexes.teams.get(id);
  return {
    id,
    name: text(row[`${prefix}_name`]) || indexed?.name || '',
    logoUrl: indexed?.logoUrl || httpUrl(text(row[`${prefix}_logo_url`])),
  };
}

function parseTuning(value: unknown): TuningDetail[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const details: TuningDetail[] = [];
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) continue;
    const record = entry as Record<string, unknown>;
    const satellite = text(record.satellite);
    const frequency = text(record.frequency);
    if (!satellite || satellite.startsWith('*') || frequency === '0.000') continue;
    const detail: TuningDetail = {
      satellite,
      orbitalPosition: text(record.orbital_position),
      frequency,
      symbolRateFec: text(record.symbol_rate_fec),
      encryption: text(record.encryption),
    };
    const key = JSON.stringify(detail);
    if (seen.has(key)) continue;
    seen.add(key);
    details.push(detail);
  }
  return details;
}

function broadcastersFromJson(row: CsvRow, indexes: ScheduleIndexes): Broadcaster[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(row.channels_json ?? '');
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;

  const broadcasters: Broadcaster[] = [];
  for (const entry of parsed) {
    if (typeof entry !== 'object' || entry === null) continue;
    const record = entry as Record<string, unknown>;
    const channelId = text(record.channel_id);
    const name = text(record.name) || text(record.source_label);
    if (!name) continue;

    const indexed = indexes.channels.get(channelId);
    const jsonType = asBroadcastType(text(record.type)) ?? 'unknown';
    broadcasters.push({
      channelId,
      name,
      type: indexed?.typeOverride ?? jsonType,
      logoUrl: indexed?.logoUrl ?? '',
      providerUrl: httpUrl(text(record.url)),
      geoRestricted: record.geo_restricted === true,
      tuning: parseTuning(record.tuning),
    });
  }
  return broadcasters;
}

function broadcastersFromGroupedColumns(row: CsvRow): Broadcaster[] {
  return GROUPED_BROADCAST_COLUMNS.flatMap(([column, type]) =>
    text(row[column])
      .split(' | ')
      .map((name) => text(name))
      .filter(Boolean)
      .map((name) => ({
        channelId: '',
        name,
        type,
        logoUrl: '',
        providerUrl: '',
        geoRestricted: false,
        tuning: [],
      })),
  );
}

function broadcastersFor(row: CsvRow, indexes: ScheduleIndexes): Broadcaster[] {
  const fromJson = broadcastersFromJson(row, indexes);
  if (fromJson && fromJson.length > 0) return fromJson;
  return broadcastersFromGroupedColumns(row);
}

function kickoffMs(row: CsvRow): number | null {
  const unix = text(row.kickoff_unix);
  if (unix && Number.isFinite(Number(unix))) return Number(unix) * 1000;

  const utc = Date.parse(text(row.kickoff_utc));
  if (!Number.isNaN(utc)) return utc;

  return zonedDateTimeToMs(text(row.match_date), text(row.kickoff_time), SOURCE_TIME_ZONE);
}

export function normalizeMatches(rows: CsvRow[], indexes: ScheduleIndexes): ScheduleMatch[] {
  const matches: ScheduleMatch[] = [];
  for (const row of rows) {
    const id = text(row.match_id);
    if (!id) continue;

    const home = toTeam(row, 'team1', indexes);
    const away = toTeam(row, 'team2', indexes);
    if (!home.name && !away.name) continue;

    matches.push({
      id,
      leagueId: text(row.league_id),
      leagueName: text(row.league_name),
      leagueLogoUrl: httpUrl(text(row.league_logo_url)) || indexes.leagueLogos.get(text(row.league_id)) || '',
      round: text(row.competition_round),
      kickoffMs: kickoffMs(row),
      featured: text(row.featured).toLowerCase() === 'yes',
      sourceKickoffTime: text(row.kickoff_time),
      home,
      away,
      broadcasters: broadcastersFor(row, indexes),
      scrapedAt: text(row.scraped_at),
    });
  }
  return matches;
}
