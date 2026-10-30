import Papa from 'papaparse';
import type { BlogArticle } from '@/types';
import { BLOG_CSV_URL } from '@/lib/config/sources';

export class BlogError extends Error {
  constructor(
    message: string,
    public kind: 'network' | 'http' | 'parse' | 'empty' | 'invalid' = 'invalid',
  ) {
    super(message);
    this.name = 'BlogError';
  }
}

function cleanValue(v: unknown): string {
  if (v == null) return '';
  let s = String(v);
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  return s.trim();
}

function isPublished(status: string): boolean {
  const s = status.toLowerCase().trim();
  if (!s) return true;
  return s === 'published';
}

/** Fetch and parse all published blog articles from the CSV. */
export async function fetchBlogArticles(): Promise<BlogArticle[]> {
  let res: Response;
  try {
    res = await fetch(BLOG_CSV_URL, { method: 'GET', redirect: 'follow' });
  } catch (e) {
    throw new BlogError(
      e instanceof Error ? e.message : 'Network request failed',
      'network',
    );
  }

  if (!res.ok) {
    throw new BlogError(`Request failed with status ${res.status}`, 'http');
  }

  const text = await res.text();
  if (text.trim().startsWith('<') || text.trim().toLowerCase().startsWith('<!doctype')) {
    throw new BlogError('The blog source returned an HTML page instead of CSV.', 'parse');
  }

  return new Promise<BlogArticle[]>((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.replace(/^\uFEFF/, '').trim().toLowerCase(),
      complete: (results) => {
        const articles: BlogArticle[] = [];
        for (const row of results.data) {
          if (!row || Object.keys(row).length === 0) continue;
          const status = cleanValue(row.status);
          if (!isPublished(status)) continue;

          const id = cleanValue(row.id);
          if (!id && !cleanValue(row.title)) continue;

          const slug = cleanValue(row.slug) || id;
          articles.push({
            id,
            title: cleanValue(row.title),
            alt_title: cleanValue(row.alt_title),
            image_url: cleanValue(row.image_url),
            image_alt: cleanValue(row.image_alt),
            author: cleanValue(row.author),
            published_at: cleanValue(row.published_at),
            body: cleanValue(row.body),
            source_url: cleanValue(row.source_url),
            source_date: cleanValue(row.source_date),
            category: cleanValue(row.category),
            slug,
            status,
          });
        }
        resolve(articles);
      },
      error: (err: Error) => {
        reject(new BlogError(`CSV parse error: ${err.message}`, 'parse'));
      },
    });
  });
}

/** Format a date string as a human-readable publication date. */
export function formatBlogDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
