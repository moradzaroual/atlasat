import type { DemoArticle } from '@/types';

/**
 * Demo blog articles. These are demonstration content, not articles from a
 * real publication. Content is factual and source-supported where relevant.
 */

export const BLOG_DEMO_LABEL = 'Demonstration article';

export const DEMO_ARTICLES: DemoArticle[] = [
  {
    slug: 'understanding-satellite-frequencies',
    title: 'Understanding satellite frequencies',
    excerpt:
      'A practical guide to the frequency bands used by geostationary satellites, from C band to Ka band, and what each means for reception.',
    category: 'Fundamentals',
    readingTime: 6,
    publishedAt: '2026-10-20',
    image:
      'https://images.pexels.com/photos/35967/satellite-transmission-network-35967.jpeg?auto=compress&cs=tinysrgb&w=1200',
    content: `# Understanding satellite frequencies

Satellite television relies on radio waves transmitted between an orbiting satellite and a ground-based dish. The frequencies used are grouped into several internationally recognized bands.

## The main downlink bands

**C band** (3.7–4.2 GHz) was the first band used for satellite television. It uses lower frequencies that are less affected by rain fade but require larger dish diameters, typically between 1.8 and 3 meters. C band remains important in tropical regions where heavy rainfall is common.

**Ku band** (10.7–12.75 GHz) is the most widely used band for direct-to-home satellite television in Europe, the Middle East, and North America. Ku band allows for smaller dishes, usually between 60 and 120 cm, because the higher frequency can be focused more tightly by the satellite antenna.

**Ka band** (18.3–21.2 GHz) enables very small dishes and high-capacity transmissions, but it is more sensitive to rain attenuation. Ka band is increasingly used for broadband and some satellite TV services.

## Why bands matter

The band a satellite uses determines the dish size, LNB type, and the expected reception quality in a given climate. When exploring channel lineups, the band is one of the first technical details to check.

## Uplink vs. downlink

Each band has an uplink (Earth to satellite) and downlink (satellite to Earth) portion. Satellite television viewers are concerned with the downlink. The uplink frequencies are managed by the satellite operator.

Understanding which band a service uses helps you choose the right equipment and set realistic expectations for reception in your location.`,
  },
  {
    slug: 'ku-band-and-c-band',
    title: 'Ku band and C band compared',
    excerpt:
      'Two of the most common satellite television bands serve different needs. Here is how they compare for reception, equipment, and climate.',
    category: 'Fundamentals',
    readingTime: 5,
    publishedAt: '2026-10-18',
    image:
      'https://images.pexels.com/photos/73830/satellite-antenna-receiver-system-73830.jpeg?auto=compress&cs=tinysrgb&w=1200',
    content: `# Ku band and C band compared

Ku and C band are the two most established bands for satellite television. They are suited to different use cases.

## C band: robust and wide-reaching

C band operates in the 4 GHz range for downlink. Its lower frequency is less affected by atmospheric conditions, making it the preferred choice in tropical and equatorial regions where heavy rain is frequent. The trade-off is dish size: C band typically requires dishes of 1.8 m or larger.

## Ku band: compact and high-capacity

Ku band operates around 11–12 GHz. The higher frequency allows tighter beam shaping and smaller dishes (60–120 cm). It is the standard for most direct-to-home services in temperate regions. Ku band is more susceptible to rain fade than C band, but its smaller equipment and higher channel capacity make it the dominant choice for consumer satellite TV.

## Practical guidance

- If you live in a high-rainfall area, C band may offer more reliable reception.
- If you want a compact dish, Ku band is the standard choice.
- Most satellites use one or the other, but some carry both.

Both bands appear in satellite channel lineups alongside the beam information that determines which geographic areas can receive the signal.`,
  },
  {
    slug: 'polarization-explained',
    title: 'Polarization explained',
    excerpt:
      'Horizontal, vertical, circular left, circular right. Polarization lets satellites reuse frequencies. Here is what it means for your setup.',
    category: 'Transmission',
    readingTime: 4,
    publishedAt: '2026-10-15',
    image:
      'https://images.pexels.com/photos/8210/satellite-space-communication-8210.jpeg?auto=compress&cs=tinysrgb&w=1200',
    content: `# Polarization explained

Polarization describes the orientation of a radio wave's electric field as it travels from satellite to dish. It is a key part of satellite transmission engineering.

## The four main types

- **Horizontal (H):** The wave's electric field is parallel to the Earth's surface.
- **Vertical (V):** The electric field is perpendicular to the Earth's surface.
- **Left-hand circular (L):** The wave rotates counterclockwise as seen from the receiver.
- **Right-hand circular (R):** The wave rotates clockwise as seen from the receiver.

## Why polarization matters

Satellites reuse the same frequency for multiple beams by giving each beam a different polarization. This doubles or quadruples the available bandwidth without needing more spectrum. For a viewer, this means your LNB must be set to the correct polarization to receive the signal. Many modern LNBs switch automatically based on the voltage supplied by the receiver.

## In channel tables

Polarization is shown alongside the frequency in every channel lineup. A frequency group is defined by the combination of frequency and polarization — the same MHz value can carry different services on H and V.`,
  },
  {
    slug: 'symbol-rate-and-fec',
    title: 'Symbol rate and FEC',
    excerpt:
      'Two numbers that define how a digital satellite signal is transmitted. Here is what they tell you and why they matter.',
    category: 'Transmission',
    readingTime: 5,
    publishedAt: '2026-10-12',
    image:
      'https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg?auto=compress&cs=tinysrgb&w=1200',
    content: `# Symbol rate and FEC

In digital satellite television, the symbol rate (SR) and forward error correction (FEC) ratio are two of the most important transmission parameters. They define how the digital bitstream is encoded onto the carrier signal.

## Symbol rate

The symbol rate, measured in kilosymbols per second (ksym/s or SR), is the number of modulation symbols transmitted per second. Common values range from 2200 to 30000. A higher symbol rate means more data capacity on the transponder but also requires a wider bandwidth and a better signal-to-noise ratio.

## FEC

Forward error correction adds redundancy to the transmitted data so that the receiver can detect and correct errors caused by noise or interference. The FEC ratio (such as 3/4, 5/6, or 2/3) describes the proportion of useful data to total data. A lower ratio (like 1/2) adds more redundancy and is more robust, while a higher ratio (like 7/8) is more efficient but less resilient.

## Why they appear together

Both values are needed to tune a receiver. They are always listed together in a channel lineup alongside the frequency and polarization. Modern receivers can often detect them automatically, but knowing how to read them is useful for troubleshooting reception issues.`,
  },
  {
    slug: 'reading-footprint-maps',
    title: 'Reading footprint maps',
    excerpt:
      'A satellite footprint map shows where a beam can be received, but it does not guarantee reception. Here is how to read one correctly.',
    category: 'Coverage',
    readingTime: 6,
    publishedAt: '2026-10-08',
    image:
      'https://images.pexels.com/photos/41162/satellite-earth-from-space-41162.jpeg?auto=compress&cs=tinysrgb&w=1200',
    content: `# Reading footprint maps

A satellite footprint map shows the geographic area a satellite beam covers. Understanding how to read one is essential for knowing whether you can receive a given service.

## What a footprint shows

Footprint maps typically display contour lines indicating the signal strength across the coverage area, usually measured in dBW (decibels relative to one watt). The innermost contour represents the strongest signal; the outermost represents the weakest usable signal.

## What a footprint does not show

A footprint map does not guarantee reception. Actual reception depends on:

- Your dish size and quality.
- Your LNB sensitivity.
- Local obstacles and weather.
- The receiver and its configuration.

## Contour values and dish size

Higher dBW values mean stronger signals, which allow smaller dishes. Lower dBW values require larger dishes. Operators often publish a table mapping contour values to recommended dish diameters.

## In Atlasat

The Coverage workspace displays footprint tiles as map layers. Each layer comes from the published beam data. Because the color meaning of these tiles is not always documented, Atlasat does not display a numeric signal-strength legend unless that information is verified from the source.`,
  },
  {
    slug: 'organizing-an-fta-channel-list',
    title: 'Organizing an FTA channel list',
    excerpt:
      'Free-to-air satellite channels can number in the thousands. Here is a practical approach to organizing and navigating them.',
    category: 'Practical',
    readingTime: 5,
    publishedAt: '2026-10-03',
    image:
      'https://images.pexels.com/photos/260425/pexels-photo-260425.jpeg?auto=compress&cs=tinysrgb&w=1200',
    content: `# Organizing an FTA channel list

Free-to-air (FTA) satellite channels are transmitted without encryption. A single satellite can carry hundreds of FTA services across multiple beams. Organizing them makes navigation far easier.

## Start with the satellite

Group channels by satellite first. Each satellite occupies an orbital slot, and you will typically point your dish at one or two satellites. Knowing which satellite a channel is on is the first step.

## Group by frequency

Within a satellite, channels are transmitted on frequency groups (transponders). Each transponder carries several services. Grouping by frequency gives you a clear technical view of how the satellite is organized.

## Use filters

A good channel list lets you filter by:
- **Channel name** — to find a specific service.
- **Provider** — to see packages or bouquets.
- **Encryption** — to identify FTA services.
- **Compression format** — to check compatibility with your receiver.

## Mark your favorites

Most receivers let you create favorite lists. After scanning, go through the list and mark the channels you watch regularly. This turns a list of hundreds into a focused lineup.

## Remember: no encryption listed ≠ guaranteed FTA

A channel with no encryption listed in its technical data is a candidate for FTA reception, but always confirm. Encryption status can change, and the absence of an encryption field in a dataset does not guarantee free reception.`,
  },
];

export function getArticleBySlug(slug: string): DemoArticle | undefined {
  return DEMO_ARTICLES.find((a) => a.slug === slug);
}

export function getRelatedArticles(slug: string, count = 3): DemoArticle[] {
  const current = getArticleBySlug(slug);
  if (!current) return DEMO_ARTICLES.slice(0, count);
  return DEMO_ARTICLES.filter(
    (a) => a.slug !== slug && (a.category === current.category || true),
  )
    .slice(0, count);
}

export const BLOG_CATEGORIES = Array.from(
  new Set(DEMO_ARTICLES.map((a) => a.category)),
);
