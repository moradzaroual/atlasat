import type { DemoChannel, DemoProgram } from '@/types';

const HOUR = 60 * 60 * 1000;

/**
 * Demo schedule generator. Produces fictional program listings relative to
 * the current day so the prototype never opens on an obsolete schedule.
 * A real EPG adapter can replace this later without touching the UI.
 */

export const DEMO_CHANNELS: DemoChannel[] = [
  { id: 'ch1', name: 'Atlas News 24', category: 'News', logoColor: '#087F8C' },
  { id: 'ch2', name: 'Cinema Premiere', category: 'Movies', logoColor: '#B79558' },
  { id: 'ch3', name: 'Sport Plus HD', category: 'Sports', logoColor: '#087F8C' },
  { id: 'ch4', name: 'Documentary World', category: 'Documentary', logoColor: '#647080' },
  { id: 'ch5', name: 'Kids Junior', category: 'Kids', logoColor: '#B79558' },
  { id: 'ch6', name: 'Music Pulse', category: 'Music', logoColor: '#087F8C' },
  { id: 'ch7', name: 'Global Series', category: 'Series', logoColor: '#647080' },
  { id: 'ch8', name: 'Culture & Arts', category: 'Culture', logoColor: '#B79558' },
];

const PROGRAM_TEMPLATES: Record<
  string,
  { title: string; category: string; description: string; language: string }[]
> = {
  ch1: [
    { title: 'Morning Briefing', category: 'News', description: 'Top stories and overnight developments from around the world.', language: 'EN' },
    { title: 'Midday Report', category: 'News', description: 'Noon news hour with business and markets coverage.', language: 'EN' },
    { title: 'World at Six', category: 'News', description: 'International news and analysis at the top of the hour.', language: 'EN' },
    { title: 'The Discussion', category: 'Talk', description: 'In-depth panel on current affairs with guest analysts.', language: 'EN' },
    { title: 'Late Edition', category: 'News', description: 'Evening wrap-up of the day\u2019s most important stories.', language: 'EN' },
  ],
  ch2: [
    { title: 'The Open Road', category: 'Drama', description: 'A road movie about three friends crossing the desert.', language: 'EN' },
    { title: 'Midnight in Tangier', category: 'Drama', description: 'A romance set in the narrow streets of the old medina.', language: 'FR' },
    { title: 'The Cartographer', category: 'Biopic', description: 'The story of a 19th-century mapmaker charting unknown lands.', language: 'EN' },
    { title: 'Silent Frequencies', category: 'Thriller', description: 'A radio operator discovers a signal from the past.', language: 'EN' },
    { title: 'After the Rain', category: 'Drama', description: 'A family reunites after years apart in a coastal village.', language: 'AR' },
  ],
  ch3: [
    { title: 'Live Football: Derby Day', category: 'Sports', description: 'Coverage of the week\u2019s biggest derby match.', language: 'EN' },
    { title: 'Basketball Tonight', category: 'Sports', description: 'Highlights and analysis from the league.', language: 'EN' },
    { title: 'Grand Prix Review', category: 'Sports', description: 'A look back at the weekend\u2019s race and standings.', language: 'EN' },
    { title: 'Athletics Weekly', category: 'Sports', description: 'Track and field events from around the world.', language: 'EN' },
    { title: 'Sports Talk', category: 'Talk', description: 'Discussion with athletes and commentators.', language: 'EN' },
  ],
  ch4: [
    { title: 'Oceans of the World', category: 'Documentary', description: 'Exploring the deep seas and their hidden ecosystems.', language: 'EN' },
    { title: 'Cities from Above', category: 'Documentary', description: 'An aerial journey over great metropolitan areas.', language: 'EN' },
    { title: 'The Silk Road', category: 'Documentary', description: 'Tracing ancient trade routes across Asia.', language: 'EN' },
    { title: 'Wild Coast', category: 'Documentary', description: 'Wildlife along the Atlantic shores of Africa.', language: 'EN' },
    { title: 'Space Frontier', category: 'Documentary', description: 'The latest missions exploring the solar system.', language: 'EN' },
  ],
  ch5: [
    { title: 'Adventure Club', category: 'Animation', description: 'Animated adventures for younger viewers.', language: 'EN' },
    { title: 'Story Time', category: 'Education', description: 'Beloved stories read aloud for early learners.', language: 'EN' },
    { title: 'Nature Kids', category: 'Education', description: 'Discovering animals and their habitats.', language: 'EN' },
    { title: 'Craft Corner', category: 'Education', description: 'Fun craft projects for kids to make at home.', language: 'EN' },
    { title: 'Bedtime Stories', category: 'Animation', description: 'Gentle tales to end the day.', language: 'EN' },
  ],
  ch6: [
    { title: 'Morning Acoustic', category: 'Music', description: 'Soft acoustic sessions to start the day.', language: 'EN' },
    { title: 'World Beats', category: 'Music', description: 'Music from across the continents.', language: 'EN' },
    { title: 'Live Sessions', category: 'Music', description: 'Studio performances from emerging artists.', language: 'EN' },
    { title: 'Classic Albums', category: 'Music', description: 'A full listen-through of a landmark record.', language: 'EN' },
    { title: 'Late Night Jazz', category: 'Music', description: 'Smooth jazz for the small hours.', language: 'EN' },
  ],
  ch7: [
    { title: 'The Diplomat', category: 'Series', description: 'A political drama about an ambassador in a crisis zone.', language: 'EN' },
    { title: 'Northern Lights', category: 'Series', description: 'A mystery series set in a remote fishing town.', language: 'EN' },
    { title: 'Code Red', category: 'Series', description: 'A medical drama following an emergency team.', language: 'EN' },
    { title: 'The Heir', category: 'Series', description: 'A family saga about succession and legacy.', language: 'FR' },
    { title: 'Border Lines', category: 'Series', description: 'A thriller about a customs investigation unit.', language: 'EN' },
  ],
  ch8: [
    { title: 'Modern Architecture', category: 'Culture', description: 'A tour of contemporary buildings and their designers.', language: 'EN' },
    { title: 'Brushstrokes', category: 'Culture', description: 'A close look at paintings from major galleries.', language: 'EN' },
    { title: 'The Orchestra', category: 'Music', description: 'A behind-the-scenes look at a symphony orchestra.', language: 'EN' },
    { title: 'Literary Voices', category: 'Culture', description: 'Interviews with contemporary authors.', language: 'EN' },
    { title: 'Heritage Sites', category: 'Documentary', description: 'Visiting UNESCO World Heritage locations.', language: 'EN' },
  ],
};

/** Generate demo programs for a given date offset from today. */
export function generateDemoPrograms(dayOffset: number): DemoProgram[] {
  const programs: DemoProgram[] = [];

  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);
  baseDate.setDate(baseDate.getDate() + dayOffset);

  const dayStart = baseDate.getTime();

  for (const channel of DEMO_CHANNELS) {
    const templates = PROGRAM_TEMPLATES[channel.id] ?? PROGRAM_TEMPLATES.ch1;
    let cursor = dayStart;

    for (let slot = 0; slot < templates.length; slot++) {
      const tpl = templates[slot];
      const duration = (1 + (slot % 2)) * HOUR;
      const start = cursor;
      const end = cursor + duration;
      cursor = end;

      programs.push({
        id: `${channel.id}-${dayOffset}-${slot}`,
        channelId: channel.id,
        channelName: channel.name,
        title: tpl.title,
        category: tpl.category,
        startUtc: start,
        endUtc: end,
        description: tpl.description,
        language: tpl.language,
      });
    }
  }

  return programs;
}

/** Generate programs for multiple days. */
export function generateDemoWeek(days: number): DemoProgram[] {
  const all: DemoProgram[] = [];
  for (let i = 0; i < days; i++) {
    all.push(...generateDemoPrograms(i));
  }
  return all;
}

export const SCHEDULE_DEMO_LABEL = 'Demo schedule';
export const SCHEDULE_DEFAULT_TIMEZONE = 'Africa/Casablanca';
