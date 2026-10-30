'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchBlogArticles, formatBlogDate } from '@/lib/data/blog';
import type { BlogArticle } from '@/types';
import { Search, AlertCircle, RefreshCw, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const BATCH_SIZE = 9;

export default function BlogPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const blogQuery = useQuery({
    queryKey: ['blog-articles'],
    queryFn: fetchBlogArticles,
    staleTime: 10 * 60 * 1000,
  });

  const articles = blogQuery.data ?? [];

  const categories = useMemo(
    () => Array.from(new Set(articles.map((a) => a.category).filter(Boolean))).sort(),
    [articles],
  );

  const filtered = useMemo(() => {
    let result = [...articles];

    if (category) {
      result = result.filter((a) => a.category === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.body.toLowerCase().includes(q) ||
          a.alt_title.toLowerCase().includes(q),
      );
    }

    result.sort((a, b) => {
      const da = new Date(a.published_at).getTime() || 0;
      const db = new Date(b.published_at).getTime() || 0;
      return db - da;
    });

    return result;
  }, [articles, category, search]);

  const visible = filtered.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [search, category]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filtered.length) {
          setVisibleCount((prev) => prev + BATCH_SIZE);
        }
      },
      { rootMargin: '400px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, filtered.length]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-12">
      {/* Page header */}
      <div className="mb-10 max-w-2xl">
        <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-gold">
          Atlasat Journal
        </div>
        <h1 className="font-serif text-[34px] leading-[1.1] tracking-tight md:text-[44px] text-balance">
          The satellite world, in focus.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground md:text-[16px]">
          Reporting on satellite broadcasting, channel updates, orbital slots, and
          connectivity. From transponder changes to new launches — the stories that
          shape what viewers receive.
        </p>
      </div>

      {/* Search + category filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles…"
            className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-4 text-[14px] outline-none transition-colors focus:border-teal focus:ring-2 focus:ring-teal/20"
            aria-label="Search articles"
          />
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategory(null)}
              className={cn(
                'rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors',
                !category
                  ? 'bg-teal text-teal-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground',
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat === category ? null : cat)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors',
                  category === cat
                    ? 'bg-teal text-teal-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading skeletons */}
      {blogQuery.isLoading && (
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[16/10] skeleton-shimmer rounded-[20px]"
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {blogQuery.isError && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <div>
            <p className="font-medium text-[15px]">Could not load the blog</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {(blogQuery.error as Error)?.message || 'The blog feed may be unavailable.'}
            </p>
          </div>
          <button
            onClick={() => blogQuery.refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-[13px] font-medium transition-colors hover:bg-secondary"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      )}

      {/* No published articles */}
      {blogQuery.isSuccess && articles.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="text-[15px] font-medium">No published articles found</div>
          <p className="max-w-md text-[13px] text-muted-foreground">
            Articles must be marked as &ldquo;published&rdquo; in the Google Sheet
            to appear here. Rows with a blank status are also shown, but drafts and
            archived items are hidden.
          </p>
        </div>
      )}

      {/* No search results */}
      {blogQuery.isSuccess && articles.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="text-[15px] font-medium">No articles match your search</div>
          <p className="text-[13px] text-muted-foreground">
            Try a different keyword or category.
          </p>
        </div>
      )}

      {/* Article grid */}
      {blogQuery.isSuccess && filtered.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            {visible.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          {visibleCount < filtered.length && (
            <div ref={sentinelRef} className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-teal" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ArticleCard({ article }: { article: BlogArticle }) {
  const dateStr = formatBlogDate(article.published_at);
  const hasImage = !!article.image_url;

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group relative block aspect-[16/10] overflow-hidden rounded-[20px] border border-border/60 shadow-sm transition-all duration-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 focus-visible:ring-offset-2"
      aria-label={article.title}
    >
      {/* Image or fallback */}
      {hasImage ? (
        <img
          src={article.image_url}
          alt={article.image_alt || article.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[350ms] ease-out group-hover:scale-[1.035] group-focus-visible:scale-[1.035]"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : null}
      <CardFallback visible={!hasImage} />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent transition-all duration-300 group-hover:from-black/85 group-hover:via-black/35" />

      {/* Category badge — upper left */}
      {article.category && (
        <div className="absolute left-4 top-4 z-10 transition-opacity duration-300 group-hover:opacity-0 group-focus-visible:opacity-0">
          <span className="inline-flex items-center rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md border border-white/15">
            {article.category}
          </span>
        </div>
      )}

      {/* Arrow — lower right */}
      <div className="absolute bottom-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-md border border-white/15 transition-all duration-300 group-hover:opacity-0 group-focus-visible:opacity-0">
        <ArrowUpRight className="h-4 w-4" />
      </div>

      {/* Date pill — below headline */}
      <div className="absolute bottom-4 left-4 right-14 z-10">
        <div className="transition-all duration-300 group-hover:opacity-0 group-focus-visible:opacity-0">
          {dateStr && (
            <span className="inline-flex items-center rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur-md border border-white/10">
              {dateStr}
            </span>
          )}
        </div>
      </div>

      {/* Headline — lower portion of image */}
      <div className="absolute bottom-10 left-4 right-4 z-10 transition-transform duration-300 ease-out group-hover:-translate-y-3 group-focus-visible:-translate-y-3">
        <h2 className="line-clamp-3 text-[15px] font-semibold leading-[1.25] text-white md:text-[16px]">
          {article.title}
        </h2>
      </div>
    </Link>
  );
}

function CardFallback({ visible }: { visible: boolean }) {
  return (
    <div
      style={{ display: visible ? 'flex' : 'none' }}
      className="absolute inset-0 h-full w-full items-center justify-center bg-gradient-to-br from-secondary/60 to-secondary/20"
    >
      <svg
        viewBox="0 0 120 120"
        className="h-20 w-20 text-muted-foreground/25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <circle cx="60" cy="60" r="50" />
        <ellipse cx="60" cy="60" rx="50" ry="18" />
        <ellipse cx="60" cy="60" rx="50" ry="18" transform="rotate(60 60 60)" />
        <ellipse cx="60" cy="60" rx="50" ry="18" transform="rotate(120 60 60)" />
        <circle cx="60" cy="60" r="5" fill="currentColor" />
      </svg>
    </div>
  );
}