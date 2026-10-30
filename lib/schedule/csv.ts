import Papa from 'papaparse';

export type CsvRow = Record<string, string>;

export class ScheduleFeedError extends Error {
  constructor(
    message: string,
    public kind: 'config' | 'network' | 'http' | 'not-csv' | 'format',
  ) {
    super(message);
    this.name = 'ScheduleFeedError';
  }
}

export async function fetchCsvRows(
  url: string,
  requiredColumns: readonly string[],
): Promise<CsvRow[]> {
  if (!url) {
    throw new ScheduleFeedError('This schedule tab has not been connected yet.', 'config');
  }

  let res: Response;
  try {
    res = await fetch(url, { redirect: 'follow' });
  } catch (e) {
    throw new ScheduleFeedError(
      e instanceof Error ? e.message : 'Network request failed',
      'network',
    );
  }

  if (!res.ok) {
    throw new ScheduleFeedError(`Request failed with status ${res.status}`, 'http');
  }

  const text = (await res.text()).replace(/^\uFEFF/, '');
  if (text.trimStart().startsWith('<')) {
    throw new ScheduleFeedError('The schedule source returned a web page instead of CSV data.', 'not-csv');
  }

  const parsed = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.replace(/^\uFEFF/, '').trim().toLowerCase(),
  });

  const fields = parsed.meta.fields ?? [];
  const missing = requiredColumns.filter((column) => !fields.includes(column));
  if (missing.length > 0) {
    throw new ScheduleFeedError(
      `The schedule tab is missing columns: ${missing.join(', ')}.`,
      'format',
    );
  }

  return parsed.data;
}
