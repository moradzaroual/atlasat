import Papa from 'papaparse';
import type {
  SatelliteDirectoryResponse,
  SatelliteDirectoryEntry,
  SatelliteDetailResponse,
  ChannelRow,
} from '@/types';
import { CHANNELS_INDEX_CSV_URL, CHANNELS_WORKBOOK_CSV_BASE } from '@/lib/config/sources';
import orbitalPositions from '@/lib/data/orbital-positions.json';

type OrbitalPositionEntry = {
  orbital_position: string;
  orbital_longitude_deg: number;
};

export class DataError extends Error {
  constructor(
    message: string,
    public kind: 'network' | 'http' | 'parse' | 'invalid' | 'empty' = 'invalid',
  ) {
    super(message);
    this.name = 'DataError';
  }
}

function cleanValue(v: unknown): string {
  if (v == null) return '';
  let s = String(v);
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  return s.trim();
}

async function fetchCsvText(url: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, { method: 'GET', redirect: 'follow' });
  } catch (e) {
    throw new DataError(
      e instanceof Error ? e.message : 'Network request failed',
      'network',
    );
  }

  if (!res.ok) {
    throw new DataError(`Request failed with status ${res.status}`, 'http');
  }

  const text = await res.text();
  if (text.trim().startsWith('<') || text.trim().toLowerCase().startsWith('<!doctype')) {
    throw new DataError(
      'The data source returned an HTML page instead of CSV.',
      'parse',
    );
  }
  return text;
}

/** Fetch the satellite directory (index CSV). */
export async function fetchDirectory(): Promise<SatelliteDirectoryResponse> {
  const text = await fetchCsvText(CHANNELS_INDEX_CSV_URL);

  return new Promise<SatelliteDirectoryResponse>((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.replace(/^\uFEFF/, '').trim().toLowerCase(),
      complete: (results) => {
        const entries: SatelliteDirectoryEntry[] = [];
        for (const row of results.data) {
          if (!row || Object.keys(row).length === 0) continue;
          const name = cleanValue(row.satellite_name);
          const gid = cleanValue(row.gid);
          let csvUrl = cleanValue(row.csv_url);
          if (!name || !gid) continue;
          if (!csvUrl) {
            csvUrl = `${CHANNELS_WORKBOOK_CSV_BASE}?gid=${encodeURIComponent(gid)}&single=true&output=csv`;
          }
          entries.push({
            satellite_name: name,
            gid,
            csv_url: csvUrl,
            orbital_position: cleanValue(row.orbital_position) || (orbitalPositions as Record<string, OrbitalPositionEntry>)[gid]?.orbital_position || undefined,
            orbital_longitude_deg: cleanValue(row.orbital_longitude_deg) || String((orbitalPositions as Record<string, OrbitalPositionEntry>)[gid]?.orbital_longitude_deg ?? '') || undefined,
            channel_count: cleanValue(row.channel_count) || undefined,
            count_type: cleanValue(row.count_type) || undefined,
          });
        }
        if (entries.length === 0) {
          reject(new DataError('The index CSV contained no satellite entries.', 'empty'));
          return;
        }
        resolve({ success: true, count: entries.length, satellites: entries });
      },
      error: (err: Error) => {
        reject(new DataError(`CSV parse error: ${err.message}`, 'parse'));
      },
    });
  });
}

/**
 * Look up a satellite's csv_url from the directory by gid, then fetch and
 * parse its channel rows. Falls back to constructing the URL from the
 * workbook base + gid if the directory hasn't been loaded yet.
 */
export async function fetchSatelliteChannels(
  gid: string,
  directory?: SatelliteDirectoryResponse,
): Promise<SatelliteDetailResponse> {
  let csvUrl: string | undefined;
  let satelliteName = '';

  if (directory) {
    const entry = directory.satellites.find((s) => s.gid === gid);
    if (entry) {
      csvUrl = entry.csv_url;
      satelliteName = entry.satellite_name;
      if (entry.orbital_position) satelliteName += ` ${entry.orbital_position}`;
    }
  }

  if (!csvUrl) {
    csvUrl = `${CHANNELS_WORKBOOK_CSV_BASE}?gid=${encodeURIComponent(gid)}&single=true&output=csv`;
  }

  const text = await fetchCsvText(csvUrl);

  return new Promise<SatelliteDetailResponse>((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.replace(/^\uFEFF/, '').trim().toLowerCase(),
      complete: (results) => {
        const rows: ChannelRow[] = [];
        let pageTitle = '';
        for (const row of results.data) {
          if (!row || Object.keys(row).length === 0) continue;
          const channelRow: Record<string, string> = {};
          for (const [k, v] of Object.entries(row)) {
            channelRow[k] = cleanValue(v);
          }
          if (channelRow.page_title && !pageTitle) pageTitle = channelRow.page_title;
          rows.push(channelRow as ChannelRow);
        }

        if (rows.length === 0) {
          resolve({
            success: true,
            satellite_name: satelliteName || pageTitle || gid,
            gid,
            count: 0,
            rows: [],
          });
          return;
        }

        resolve({
          success: true,
          satellite_name: satelliteName || pageTitle || rows[0]?.page_title || gid,
          gid,
          count: rows.length,
          rows,
        });
      },
      error: (err: Error) => {
        reject(new DataError(`CSV parse error: ${err.message}`, 'parse'));
      },
    });
  });
}

/** Parse an orbital position string from a satellite name or page_title. */
export function parseOrbitalPosition(input?: string): string | null {
  if (!input) return null;
  const match = input.match(/(-?\d+(?:\.\d+)?)\s*°?\s*([EW])/i);
  if (!match) return null;
  const deg = parseFloat(match[1]);
  const hemi = match[2].toUpperCase();
  return `${deg}°${hemi}`;
}