/**
 * Atlasat configuration module.
 *
 * Centralized data source URLs. Keep all external endpoints here;
 * do not scatter URLs throughout components.
 *
 * Real data sources:
 *  - CHANNELS_INDEX_CSV_URL: Published Google Sheets CSV of the Index tab
 *    referencing ~205 satellite worksheets. Each row has satellite_name, gid,
 *    and csv_url (plus optional orbital_position, orbital_longitude_deg,
 *    channel_count, count_type).
 *  - BEAMS_CSV_URL: Published Google Sheets CSV of beam footprint records
 *    grouped by Satbeams satellite IDs.
 *
 * Optional / future:
 *  - COVERAGE_SATELLITES_CSV_URL: An optional satellite metadata table
 *    (positions, statuses). Its value is intentionally left empty until a
 *    verified source is available. Do not invent its value.
 */

/** Published CSV of the Index tab (satellite directory with csv_url per row). */
export const CHANNELS_INDEX_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTa1OSAouyiq5X_PljsApnFfpxvZ1YN1RWkUro-jzdqnyjkXXHmFylIOmgIS2joRZknywNgLzalbhe4/pub?gid=210786606&single=true&output=csv';

/** Base published workbook URL (used to derive per-worksheet CSVs if needed). */
export const CHANNELS_WORKBOOK_CSV_BASE =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTa1OSAouyiq5X_PljsApnFfpxvZ1YN1RWkUro-jzdqnyjkXXHmFylIOmgIS2joRZknywNgLzalbhe4/pub';

export const BEAMS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBhs-heILEogLIBuUETlEUrOTvXA4_NYXbhmhJBcgP1YDt6Fc-OApdVC3U9FDdSsRmT13yTaogxPwC/pub?output=csv';

/** Published CSV of Atlasat Journal articles. */
export const BLOG_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSzJczGmrKZhClHOyYMRgjot07pRpT7ZlqOgO38cnoHUp11LoxaOlCnT6Vam4BOYga6ea9wvehoW2PU/pub?output=csv';

/**
 * Optional satellite metadata CSV (positions, statuses). Leave empty until a
 * verified source is available. Do not invent its value.
 */
export const COVERAGE_SATELLITES_CSV_URL = '';

const SCHEDULE_PUBLISHED_BASE =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRERQ5hl7zxK-CE7JFGLyUEqNaf5slVIGs-szjWtTjWp4Y0tGRXgc8c7KxZ-VLfamWFzqTrt_UAakl9/pub';

const scheduleTabCsvUrl = (gid: string) =>
  `${SCHEDULE_PUBLISHED_BASE}?gid=${gid}&single=true&output=csv`;

/** Football fixture tabs, one per competition. Each tab lists matches with channels_json. */
export const SCHEDULE_LEAGUES = [
  { id: 'pl', name: 'Premier League', matchesCsvUrl: scheduleTabCsvUrl('1075435373') },
  { id: 'laliga', name: 'La Liga', matchesCsvUrl: scheduleTabCsvUrl('605857725') },
  { id: 'seriea', name: 'Serie A', matchesCsvUrl: scheduleTabCsvUrl('1247532585') },
  { id: 'ligue1', name: 'Ligue 1', matchesCsvUrl: scheduleTabCsvUrl('2098760757') },
  { id: 'bundesliga', name: 'Bundesliga', matchesCsvUrl: scheduleTabCsvUrl('1729345219') },
  { id: 'ucl', name: 'Champions League', matchesCsvUrl: scheduleTabCsvUrl('945599702') },
] as const;

/** Index tabs used to join team, competition and channel IDs to logos and types. */
export const SCHEDULE_TEAMS_CSV_URL = scheduleTabCsvUrl('1846775106');
export const SCHEDULE_LEAGUE_INDEX_CSV_URL = scheduleTabCsvUrl('1038031702');
export const SCHEDULE_CHANNELS_CSV_URL = scheduleTabCsvUrl('1808422132');

/** Browser cache durations (ms). */
export const CACHE = {
  directory: 30 * 60 * 1000,
  beams: 30 * 60 * 1000,
  channels: 10 * 60 * 1000,
} as const;

/** Maximum simultaneously active coverage layers. */
export const MAX_ACTIVE_LAYERS = 3;
