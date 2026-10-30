import {
  SCHEDULE_CHANNELS_CSV_URL,
  SCHEDULE_LEAGUE_INDEX_CSV_URL,
  SCHEDULE_TEAMS_CSV_URL,
} from '@/lib/config/sources';
import { fetchCsvRows } from './csv';
import { buildIndexes, type ScheduleIndexes } from './normalize';

const MATCH_COLUMNS = [
  'match_id', 'league_id', 'league_name', 'league_logo_url', 'competition_round', 'featured',
  'match_date', 'kickoff_time', 'timezone', 'kickoff_utc', 'kickoff_unix',
  'team1_id', 'team1_name', 'team1_logo_url', 'team2_id', 'team2_name', 'team2_logo_url',
  'fta_channels', 'scrambled_channels', 'platforms', 'unknown_channels',
  'channels_json', 'channel_count', 'source_date_heading', 'source_url', 'scraped_at',
];

const TEAM_COLUMNS = ['team_id', 'team_name', 'team_logo_url'];
const LEAGUE_COLUMNS = ['league_id', 'league_name', 'league_logo_url'];
const CHANNEL_COLUMNS = ['channel_id', 'channel_name', 'source_type', 'type_override', 'channel_logo_url'];

export const fetchLeagueMatchRows = (url: string) => fetchCsvRows(url, MATCH_COLUMNS);

export async function fetchScheduleIndexes(): Promise<ScheduleIndexes> {
  const [teamRows, leagueRows, channelRows] = await Promise.all([
    fetchCsvRows(SCHEDULE_TEAMS_CSV_URL, TEAM_COLUMNS),
    fetchCsvRows(SCHEDULE_LEAGUE_INDEX_CSV_URL, LEAGUE_COLUMNS),
    fetchCsvRows(SCHEDULE_CHANNELS_CSV_URL, CHANNEL_COLUMNS),
  ]);
  return buildIndexes(teamRows, leagueRows, channelRows);
}
