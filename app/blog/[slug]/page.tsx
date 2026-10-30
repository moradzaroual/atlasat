'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchBlogArticles, formatBlogDate } from '@/lib/data/blog';
import type { BlogArticle } from '@/types';
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Calendar,
  User,
} from 'lucide-react';

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const blogQuery = useQuery({
    queryKey: ['blog-articles'],
    queryFn: fetchBlogArticles,
    staleTime: 10 * 60 * 1000,
  });

  const articles = blogQuery.data ?? [];

  const article = articles.find((a) => a.slug === slug);
  const related = article
    ? articles
        .filter((a) => a.slug !== slug && a.category === article.category)
        .slice(0, 3)
    : [];

  if (blogQuery.isLoading) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-12">
        <div className="mb-6 h-4 w-24 skeleton-shimmer rounded" />
        <div className="mb-4 h-8 w-full skeleton-shimmer rounded" />
        <div className="mb-4 h-4 w-32 skeleton-shimmer rounded" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 w-full skeleton-shimmer rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (blogQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div>
          <p className="font-medium text-[15px]">Could not load this article</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {(blogQuery.error as Error)?.message}
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
    );
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="text-[16px] font-medium">Article not found</div>
        <p className="text-[13px] text-muted-foreground">
          This article may have been removed or is not yet published.
        </p>
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-[13px] font-medium transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to blog
        </Link>
      </div>
    );
  }

  const paragraphs = article.body.split(/\n{2,}/).filter((p) => p.trim());
  const dateStr = formatBlogDate(article.published_at);

  return (
    <div>
      {/* Cover image */}
      {article.image_url && (
        <div className="relative h-[280px] w-full overflow-hidden md:h-[420px]">
          <img
            src={article.image_url}
            alt={article.image_alt || article.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>
      )}

      <article className="mx-auto max-w-[720px] px-4 py-8 md:py-10">
        {/* Back link */}
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to blog
        </Link>

        {/* Category */}
        {article.category && (
          <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-gold">
            {article.category}
          </div>
        )}

        {/* Title */}
        <h1 className="font-serif text-[28px] leading-[1.15] tracking-tight md:text-[38px] text-balance">
          {article.title}
        </h1>

        {/* Alt title */}
        {article.alt_title && (
          <p className="mt-3 text-[17px] leading-relaxed text-muted-foreground">
            {article.alt_title}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
          {article.author && (
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {article.author}
            </span>
          )}
          {dateStr && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {dateStr}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="mt-6 mb-8 h-px w-full bg-border" />

        {/* Body */}
        <div className="space-y-5">
          {paragraphs.map((para, i) => (
            <p key={i} className="text-[18px] leading-[1.75] text-foreground/90">
              {para}
            </p>
          ))}
        </div>

        {/* Source attribution */}
        {(article.source_url || article.source_date) && (
          <div className="mt-10 rounded-xl border border-border bg-secondary/30 p-4">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Source
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px]">
              {article.source_url && (
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-teal hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {article.source_url.length > 60
                    ? article.source_url.slice(0, 60) + '...'
                    : article.source_url}
                </a>
              )}
              {article.source_date && (
                <span className="text-muted-foreground tabular-nums">
                  {formatBlogDate(article.source_date)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Related articles */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 font-serif text-[20px] tracking-tight">
              More from {article.category}
            </h2>
            <div className="space-y-3">
              {related.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/blog/${rel.slug}`}
                  className="block rounded-xl border border-border bg-card p-4 transition-all hover:border-teal/40 hover:shadow-sm"
                >
                  <div className="text-[14px] font-medium leading-snug">
                    {rel.title}
                  </div>
                  <div className="mt-1 text-[12px] text-muted-foreground tabular-nums">
                    {formatBlogDate(rel.published_at)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}