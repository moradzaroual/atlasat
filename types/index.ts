/** Channels CSV index — satellite directory entry. */
export interface SatelliteDirectoryEntry {
  satellite_name: string;
  gid: string;
  csv_url: string;
  orbital_position?: string;
  orbital_longitude_deg?: string;
  channel_count?: string;
  count_type?: string;
}

/** Channels directory response (normalized from CSV). */
export interface SatelliteDirectoryResponse {
  success: boolean;
  count: number;
  satellites: SatelliteDirectoryEntry[];
}

/** A single channel/service row from a satellite worksheet. */
export interface ChannelRow {
  page_title?: string;
  row_type?: string;
  frequency_mhz?: string;
  polarization?: string;
  transponder?: string;
  beam?: string;
  frequency_beam_eirp_raw?: string;
  system?: string;
  modulation?: string;
  symbol_rate?: string;
  fec?: string;
  provider?: string;
  sid?: string;
  name?: string;
  onid_tid?: string;
  compression_format?: string;
  vpid?: string;
  cn_lock?: string;
  audio?: string;
  encryption?: string;
  source?: string;
  updated_yymmdd?: string;
  logo_urls?: string;
  name_urls?: string;
  stream_package_urls?: string;
  frequency_beam_urls?: string;
  page_url?: string;
  raw_cells_json?: string;
  cell_links_json?: string;
}

/** Channels API — satellite detail response. */
export interface SatelliteDetailResponse {
  success: boolean;
  satellite_name: string;
  gid: string;
  count: number;
  rows: ChannelRow[];
}

/** A frequency group key. */
export interface FrequencyGroupKey {
  frequency_mhz: string;
  polarization: string;
  beam: string;
}

/** A normalized frequency group with its service/provider rows. */
export interface FrequencyGroup {
  key: FrequencyGroupKey;
  system: string;
  modulation: string;
  symbol_rate: string;
  fec: string;
  services: ChannelRow[];
  providers: ChannelRow[];
  subgroups: Map<string, ChannelRow[]>;
}

/** Beam record from the coverage CSV. */
export interface BeamRecord {
  beam_id: string;
  satellite_id: string;
  satellite_name: string;
  name: string;
  fullname: string;
  alternatename: string;
  band: string;
  status: string;
  is_uplink: string;
  coverage_type: string;
  coverage_tile_url: string;
  coverage_status: string;
  visible: string;
  color: string;
  opacity: string;
  source_url: string;
  raw_json: string;
}

/** Satellite grouped beams for the coverage sidebar. */
export interface CoverageSatellite {
  satellite_id: string;
  satellite_name: string;
  beams: BeamRecord[];
  bands: string[];
}

/** Demo schedule program. */
export interface DemoProgram {
  id: string;
  channelId: string;
  channelName: string;
  title: string;
  category: string;
  startUtc: number;
  endUtc: number;
  description: string;
  language: string;
}

/** Demo schedule channel. */
export interface DemoChannel {
  id: string;
  name: string;
  category: string;
  logoColor: string;
}

/** Demo blog article. */
export interface DemoArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: number;
  publishedAt: string;
  content: string;
  image: string;
}

/** Blog article from the published CSV. */
export interface BlogArticle {
  id: string;
  title: string;
  alt_title: string;
  image_url: string;
  image_alt: string;
  author: string;
  published_at: string;
  body: string;
  source_url: string;
  source_date: string;
  category: string;
  slug: string;
  status: string;
}

/** Broadcast category shown for a channel. */
export type BroadcastType = 'fta' | 'scrambled' | 'platform' | 'unknown';

/** Satellite tuning details for a broadcaster. */
export interface TuningDetail {
  satellite: string;
  orbitalPosition: string;
  frequency: string;
  symbolRateFec: string;
  encryption: string;
}

/** A channel or platform that broadcasts a match. */
export interface Broadcaster {
  channelId: string;
  name: string;
  type: BroadcastType;
  logoUrl: string;
  providerUrl: string;
  geoRestricted: boolean;
  tuning: TuningDetail[];
}

/** A team in a fixture, with its crest URL when one exists. */
export interface ScheduleTeam {
  id: string;
  name: string;
  logoUrl: string;
}

/** A fixture from a league tab, with its kickoff and broadcasters. */
export interface ScheduleMatch {
  id: string;
  leagueId: string;
  round: string;
  kickoffMs: number | null;
  leagueName: string;
  leagueLogoUrl: string;
  featured: boolean;
  sourceKickoffTime: string;
  home: ScheduleTeam;
  away: ScheduleTeam;
  broadcasters: Broadcaster[];
  scrapedAt: string;
}
