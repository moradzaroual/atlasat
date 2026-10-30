import Papa from 'papaparse';
import type { BeamRecord, CoverageSatellite } from '@/types';
import { BEAMS_CSV_URL } from '@/lib/config/sources';

export class CoverageError extends Error {
  constructor(
    message: string,
    public kind: 'network' | 'http' | 'parse' | 'invalid' | 'empty' = 'invalid',
  ) {
    super(message);
    this.name = 'CoverageError';
  }
}

/** Strip a UTF-8 BOM and whitespace from a value. */
function cleanValue(v: unknown): string {
  if (v == null) return '';
  let s = String(v);
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  return s.trim();
}

/** Parse the beams CSV and group records by satellite_id. */
export async function fetchBeams(): Promise<CoverageSatellite[]> {
  let res: Response;
  try {
    res = await fetch(BEAMS_CSV_URL, { method: 'GET', redirect: 'follow' });
  } catch (e) {
    throw new CoverageError(
      e instanceof Error ? e.message : 'Network request failed',
      'network',
    );
  }

  if (!res.ok) {
    throw new CoverageError(`Request failed with status ${res.status}`, 'http');
  }

  const text = await res.text();

  return new Promise<CoverageSatellite[]>((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.replace(/^\uFEFF/, '').trim().toLowerCase(),
      complete: (results) => {
        if (results.errors.length > 0) {
          const fatal = results.errors.find((e) => e.type === 'Delimiter');
          if (fatal) {
            reject(new CoverageError(`CSV parse error: ${fatal.message}`, 'parse'));
            return;
          }
        }

        const records: BeamRecord[] = [];
        for (const row of results.data) {
          if (!row || Object.keys(row).length === 0) continue;

          const beam: BeamRecord = {
            beam_id: cleanValue(row.beam_id),
            satellite_id: cleanValue(row.satellite_id),
            satellite_name: cleanValue(row.satellite_name),
            name: cleanValue(row.name),
            fullname: cleanValue(row.fullname),
            alternatename: cleanValue(row.alternatename),
            band: cleanValue(row.band),
            status: cleanValue(row.status),
            is_uplink: cleanValue(row.is_uplink),
            coverage_type: cleanValue(row.coverage_type),
            coverage_tile_url: cleanValue(row.coverage_tile_url),
            coverage_status: cleanValue(row.coverage_status),
            visible: cleanValue(row.visible),
            color: cleanValue(row.color),
            opacity: cleanValue(row.opacity),
            source_url: cleanValue(row.source_url),
            raw_json: cleanValue(row.raw_json),
          };

          if (!beam.satellite_id && !beam.beam_id) continue;
          if (!beam.satellite_id) beam.satellite_id = 'unknown';
          records.push(beam);
        }

        if (records.length === 0) {
          reject(new CoverageError('The beams CSV contained no records.', 'empty'));
          return;
        }

        const grouped = groupBySatellite(records);
        resolve(grouped);
      },
      error: (err: Error) => {
        reject(new CoverageError(`CSV parse error: ${err.message}`, 'parse'));
      },
    });
  });
}

function groupBySatellite(records: BeamRecord[]): CoverageSatellite[] {
  const map = new Map<string, CoverageSatellite>();

  for (const beam of records) {
    const id = beam.satellite_id;
    if (!map.has(id)) {
      map.set(id, {
        satellite_id: id,
        satellite_name: beam.satellite_name || id,
        beams: [],
        bands: [],
      });
    }

    const sat = map.get(id)!;
    sat.beams.push(beam);
    if (beam.band && !sat.bands.includes(beam.band)) {
      sat.bands.push(beam.band);
    }
  }

  for (const sat of Array.from(map.values())) {
    sat.bands.sort();
  }

  return Array.from(map.values()).sort((a, b) =>
    a.satellite_name.localeCompare(b.satellite_name),
  );
}

/**
 * Convert an XYZ tile template URL into a MapLibre tile URL by replacing
 * {z}, {x}, {y} placeholders. Only actual URL values should be encoded.
 * If the template is marked template_unverified, flag it.
 */
export function isTemplateVerified(tileUrl: string): boolean {
  if (!tileUrl) return false;
  if (tileUrl.toLowerCase() === 'template_unverified') return false;
  if (tileUrl.includes('template_unverified')) return false;
  return tileUrl.includes('{z}') && tileUrl.includes('{x}') && tileUrl.includes('{y}');
}

/** Determine whether a tile URL is TMS (y flipped) vs XYZ. */
export function isTMS(tileUrl: string): boolean {
  return /{y}/i.test(tileUrl) && !/{-y}/i.test(tileUrl) && /tms/i.test(tileUrl);
}

/** Normalize the tile template: keep placeholders, encode nothing extra. */
export function normalizeTileTemplate(tileUrl: string): string {
  return tileUrl.trim();
}

/** Default opacity from the CSV record (0-1). Falls back to 0.7. */
export function defaultOpacity(beam: BeamRecord): number {
  const o = parseFloat(beam.opacity);
  if (!isNaN(o) && o >= 0 && o <= 1) return o;
  return 0.7;
}
