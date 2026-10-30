'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useMemo, useState, useRef } from 'react';
import { fetchSatelliteChannels, fetchDirectory, parseOrbitalPosition, DataError } from '@/lib/data/channels';
import type { ChannelRow } from '@/types';
import {
  groupByFrequency,
  isServiceRow,
  countFrequencyGroups,
  hasEncryption,
  isHdUhd,
  extractLogoUrl,
  extractNameUrl,
} from '@/lib/normalization/channels';
import {
  formatFrequency,
  formatSymbolRate,
  formatFec,
  formatEncryption,
  getInitials,
} from '@/lib/formatting';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Download,
  Search,
  X,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock,
  ImageOff,
  Columns3,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type PageSize = 25 | 50 | 100;

interface ColumnDef {
  key: string;
  label: string;
  default: boolean;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Channel', default: true },
  { key: 'sid', label: 'SID', default: true },
  { key: 'compression_format', label: 'Format', default: true },
  { key: 'vpid', label: 'VPID', default: true },
  { key: 'audio', label: 'Audio', default: true },
  { key: 'encryption', label: 'Encryption', default: true },
  { key: 'onid_tid', label: 'ONID/TID', default: false },
  { key: 'transponder', label: 'Transponder', default: false },
  { key: 'source', label: 'Source', default: false },
  { key: 'cn_lock', label: 'CN Lock', default: false },
  { key: 'updated_yymmdd', label: 'Updated', default: false },
];

export default function SatelliteDetailPage() {
  const params = useParams();
  const gid = params.gid as string;

  const directoryQuery = useQuery({
    queryKey: ['directory'],
    queryFn: fetchDirectory,
  });

  const channelQuery = useQuery({
    queryKey: ['channels', gid],
    queryFn: () => fetchSatelliteChannels(gid, directoryQuery.data),
    enabled: !!gid && !!directoryQuery.data,
  });

  const [search, setSearch] = useState('');
  const [freqSearch, setFreqSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState<PageSize>(25);
  const [page, setPage] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedDetail, setExpandedDetail] = useState<Set<string>>(new Set());
  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    new Set(ALL_COLUMNS.filter((c) => c.default).map((c) => c.key)),
  );
  const [showColMenu, setShowColMenu] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);

  const data = channelQuery.data;

  const allRows = data?.rows ?? [];
  const serviceRows = useMemo(() => allRows.filter(isServiceRow), [allRows]);

  // Extract filter options from the dataset
  const filterOptions = useMemo(() => {
    const makeOpts = (field: keyof ChannelRow) => {
      const set = new Set<string>();
      for (const r of allRows) {
        const v = r[field]?.trim();
        if (v && v !== '-') set.add(v);
      }
      return Array.from(set).sort();
    };
    return {
      polarization: makeOpts('polarization'),
      beam: makeOpts('beam'),
      provider: makeOpts('provider'),
      compression_format: makeOpts('compression_format'),
      encryption: makeOpts('encryption'),
    };
  }, [allRows]);

  // Apply filters
  const filteredRows = useMemo(() => {
    return serviceRows.filter((row) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!row.name?.toLowerCase().includes(q)) return false;
      }
      if (freqSearch.trim()) {
        const q = freqSearch.trim();
        if (!row.frequency_mhz?.includes(q)) return false;
      }
      if (filters.polarization && row.polarization !== filters.polarization) return false;
      if (filters.beam && row.beam !== filters.beam) return false;
      if (filters.provider && row.provider !== filters.provider) return false;
      if (filters.compression_format && row.compression_format !== filters.compression_format) return false;
      if (filters.encryption && row.encryption !== filters.encryption) return false;
      return true;
    });
  }, [serviceRows, search, freqSearch, filters]);

  // Group filtered rows by frequency
  const groups = useMemo(() => groupByFrequency(filteredRows), [filteredRows]);

  // Flatten groups into page items
  const flatItems = useMemo(() => {
    const items: { type: 'header'; groupIdx: number; group: typeof groups[0]; subgroupLabel?: string }[] | { type: 'row'; row: ChannelRow; groupIdx: number }[] = [];
    const result: Array<{ type: 'header' | 'row'; [key: string]: unknown }> = [];

    groups.forEach((group, gIdx) => {
      const isExpanded = expandedGroups.size === 0 || expandedGroups.has(`g${gIdx}`);

      const subgroupLabels = Array.from(group.subgroups.keys());
      const hasMultipleSubgroups = subgroupLabels.length > 1;

      if (hasMultipleSubgroups) {
        subgroupLabels.forEach((sgLabel, sgIdx) => {
          const sgRows = group.subgroups.get(sgLabel) ?? [];
          if (sgRows.length === 0) return;
          result.push({ type: 'header', groupIdx: gIdx, group, subgroupLabel: sgLabel, subIdx: sgIdx });
          if (isExpanded) {
            for (const row of sgRows) {
              result.push({ type: 'row', row, groupIdx: gIdx });
            }
          }
        });
      } else {
        result.push({ type: 'header', groupIdx: gIdx, group, subgroupLabel: subgroupLabels[0] });
        if (isExpanded) {
          for (const row of group.services) {
            result.push({ type: 'row', row, groupIdx: gIdx });
          }
        }
      }
    });

    return result as Array<
      | { type: 'header'; groupIdx: number; group: typeof groups[0]; subgroupLabel?: string }
      | { type: 'row'; row: ChannelRow; groupIdx: number }
    >;
  }, [groups, expandedGroups]);

  // Pagination
  const totalServiceRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalServiceRows / pageSize));
  const currentPage = Math.min(page, totalPages - 1);

  const pageItems = useMemo(() => {
    // We need to paginate on the flat list of service rows, but we want to show
    // group headers. Approach: paginate the service rows, then re-attach headers.
    const start = currentPage * pageSize;
    const pageRows = filteredRows.slice(start, start + pageSize);

    // Build headers for the page
    const pageGroups = groupByFrequency(pageRows);
    const items: Array<
      | { type: 'header'; group: typeof pageGroups[0]; subgroupLabel?: string }
      | { type: 'row'; row: ChannelRow }
    > = [];

    for (const group of pageGroups) {
      const subgroupLabels = Array.from(group.subgroups.keys());
      const hasMultiple = subgroupLabels.length > 1;

      if (hasMultiple) {
        for (const sgLabel of subgroupLabels) {
          const sgRows = group.subgroups.get(sgLabel) ?? [];
          if (sgRows.length === 0) continue;
          items.push({ type: 'header', group, subgroupLabel: sgLabel });
          for (const row of sgRows) items.push({ type: 'row', row });
        }
      } else {
        items.push({ type: 'header', group, subgroupLabel: subgroupLabels[0] });
        for (const row of group.services) items.push({ type: 'row', row });
      }
    }

    return items;
  }, [filteredRows, currentPage, pageSize]);

  const resetFilters = () => {
    setSearch('');
    setFreqSearch('');
    setFilters({});
    setPage(0);
    setExpandedGroups(new Set());
    setExpandedDetail(new Set());
  };

  const hasActiveFilters =
    search || freqSearch || Object.values(filters).some(Boolean);

  // CSV export of filtered rows
  const exportCSV = () => {
    const headers = ['frequency_mhz', 'polarization', 'beam', 'system', 'modulation', 'symbol_rate', 'fec', 'name', 'sid', 'compression_format', 'vpid', 'audio', 'encryption', 'provider', 'source'];
    const lines = [headers.join(',')];
    for (const row of filteredRows) {
      const vals = headers.map((h) => {
        const v = row[h as keyof ChannelRow] ?? '';
        const s = String(v).replace(/"/g, '""');
        return `"${s}"`;
      });
      lines.push(vals.join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlasat-${gid}-channels.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const orbitalPos = parseOrbitalPosition(data?.rows?.[0]?.page_title) ?? parseOrbitalPosition(data?.satellite_name);
  const freqGroupCount = countFrequencyGroups(serviceRows);
  const providerRows = allRows.filter((r) => !isServiceRow(r));

  if (channelQuery.isLoading || (directoryQuery.isLoading && !directoryQuery.data)) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
        <div className="mb-4 h-6 w-40 skeleton-shimmer rounded" />
        <div className="mb-6 h-10 w-full skeleton-shimmer rounded" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 skeleton-shimmer rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (channelQuery.isError) {
    const err = channelQuery.error as Error;
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
        <Card className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div>
            <p className="font-medium text-[15px]">Could not load channels for this satellite</p>
            <p className="mt-1 text-[13px] text-muted-foreground">{err?.message}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => channelQuery.refetch()}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      {/* Header */}
      <Link
        href="/channels"
        className="mb-3 inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to directory
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[26px] tracking-tight md:text-[34px]">
            {data.satellite_name}
          </h1>
          {orbitalPos && (
            <p className="mt-1 text-[14px] tabular-nums text-muted-foreground">
              {orbitalPos}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[12px] tabular-nums">
            {serviceRows.length} service records
          </Badge>
          <Badge variant="outline" className="text-[12px] tabular-nums">
            {freqGroupCount} frequency groups
          </Badge>
          {providerRows.length > 0 && (
            <Badge variant="outline" className="text-[12px] tabular-nums">
              {providerRows.length} provider rows
            </Badge>
          )}
        </div>
      </div>

      {/* Source link */}
      {data.rows[0]?.page_url && (
        <div className="mb-4">
          <a
            href={data.rows[0].page_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] text-teal hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Original source
          </a>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Name search */}
          <div className="relative min-w-[180px] flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search channels on this satellite…"
              className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-4 text-[13px] outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
              aria-label="Search channels"
            />
          </div>
          {/* Freq search */}
          <div className="relative w-32">
            <input
              type="text"
              value={freqSearch}
              onChange={(e) => { setFreqSearch(e.target.value); setPage(0); }}
              placeholder="Frequency…"
              className="h-9 w-full rounded-lg border border-border bg-card px-3 text-[13px] tabular-nums outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
              aria-label="Search frequency"
            />
          </div>
          {/* Filter dropdowns */}
          {(['polarization', 'beam', 'provider', 'compression_format', 'encryption'] as const).map((field) => (
            <select
              key={field}
              value={filters[field] ?? ''}
              onChange={(e) => { setFilters((f) => ({ ...f, [field]: e.target.value })); setPage(0); }}
              className="h-9 rounded-lg border border-border bg-card px-2 text-[12px] outline-none focus:border-teal"
              aria-label={`Filter by ${field}`}
            >
              <option value="">{field.replace('_', ' ')}</option>
              {filterOptions[field].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          ))}
          {/* Column visibility */}
          <div className="relative" ref={colMenuRef}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => setShowColMenu(!showColMenu)}
            >
              <Columns3 className="h-3.5 w-3.5" />
              Columns
            </Button>
            {showColMenu && (
              <div className="absolute right-0 top-10 z-30 w-48 rounded-lg border border-border bg-popover p-2 shadow-lg">
                {ALL_COLUMNS.map((col) => (
                  <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 text-[12px] hover:bg-secondary rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.has(col.key)}
                      onChange={(e) => {
                        const next = new Set(visibleCols);
                        if (e.target.checked) next.add(col.key);
                        else next.delete(col.key);
                        setVisibleCols(next);
                      }}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-9 gap-1.5" onClick={resetFilters}>
              <X className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={exportCSV}>
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-[13px]">
          <thead className="sticky top-0 z-10 bg-secondary/90 backdrop-header">
            <tr className="border-b border-border">
              <th className="w-8 px-2 py-2 text-left"></th>
              {visibleCols.has('name') && (
                <th className="px-2 py-2 text-left font-semibold">Channel</th>
              )}
              {visibleCols.has('sid') && (
                <th className="px-2 py-2 text-left font-semibold">SID</th>
              )}
              {visibleCols.has('compression_format') && (
                <th className="px-2 py-2 text-left font-semibold">Format</th>
              )}
              {visibleCols.has('vpid') && (
                <th className="px-2 py-2 text-left font-semibold">VPID</th>
              )}
              {visibleCols.has('audio') && (
                <th className="px-2 py-2 text-left font-semibold">Audio</th>
              )}
              {visibleCols.has('encryption') && (
                <th className="px-2 py-2 text-left font-semibold">Encryption</th>
              )}
              {visibleCols.has('onid_tid') && (
                <th className="px-2 py-2 text-left font-semibold">ONID/TID</th>
              )}
              {visibleCols.has('transponder') && (
                <th className="px-2 py-2 text-left font-semibold">Transponder</th>
              )}
              {visibleCols.has('source') && (
                <th className="px-2 py-2 text-left font-semibold">Source</th>
              )}
              {visibleCols.has('cn_lock') && (
                <th className="px-2 py-2 text-left font-semibold">CN Lock</th>
              )}
              {visibleCols.has('updated_yymmdd') && (
                <th className="px-2 py-2 text-left font-semibold">Updated</th>
              )}
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={visibleCols.size + 1} className="px-4 py-8 text-center text-muted-foreground">
                  No services match the current filters.
                </td>
              </tr>
            )}
            {pageItems.map((item, idx) => {
              if (item.type === 'header') {
                const g = item.group;
                const label = [
                  g.key.frequency_mhz,
                  g.key.polarization,
                  g.key.beam,
                ].filter(Boolean).join(' · ');
                const techLabel = item.subgroupLabel ?? [g.system, g.modulation, formatSymbolRate(g.symbol_rate), formatFec(g.fec)]
                  .filter(Boolean).join(' · ');
                return (
                  <tr key={`header-${idx}`} className="border-b border-border bg-secondary/30">
                    <td colSpan={visibleCols.size + 1} className="px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-[13px] tabular-nums">
                          {label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {techLabel}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              }

              const row = item.row;
              const encrypted = hasEncryption(row);
              const hd = isHdUhd(row);
              const logoUrl = extractLogoUrl(row);
              const nameUrl = extractNameUrl(row);
              const rowId = `${idx}-${row.sid}-${row.name}`;
              const isExpanded = expandedDetail.has(rowId);

              return (
                <tr
                  key={`row-${idx}`}
                  className={cn(
                    'border-b border-border/50 transition-colors hover:bg-secondary/20',
                    encrypted ? 'bg-rose-50/40 dark:bg-rose-950/10' : 'bg-emerald-50/30 dark:bg-emerald-950/5',
                  )}
                >
                  <td className="px-2 py-1.5 text-center">
                    <button
                      onClick={() => {
                        const next = new Set(expandedDetail);
                        if (next.has(rowId)) next.delete(rowId);
                        else next.add(rowId);
                        setExpandedDetail(next);
                      }}
                      className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-secondary"
                      aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                    >
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                  </td>
                  {visibleCols.has('name') && (
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt=""
                            className="h-6 w-6 rounded object-contain flex-shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-[9px] font-semibold text-muted-foreground flex-shrink-0">
                            {getInitials(row.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          {nameUrl ? (
                            <a
                              href={nameUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate font-medium hover:text-teal hover:underline"
                            >
                              {row.name || '—'}
                            </a>
                          ) : (
                            <span className="truncate font-medium">{row.name || '—'}</span>
                          )}
                          {hd && (
                            <Badge variant="outline" className="ml-1 px-1 py-0 text-[9px] text-teal border-teal/40">
                              {/\bUHD\b|\b4K\b/.test((row.name ?? '').toUpperCase()) ? 'UHD' : 'HD'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                          {row.provider && <div>Provider: {row.provider}</div>}
                          {row.transponder && <div>Transponder: {row.transponder}</div>}
                          {row.source && <div>Source: {row.source}</div>}
                          {row.onid_tid && <div>ONID/TID: {row.onid_tid}</div>}
                          {row.cn_lock && <div>CN Lock: {row.cn_lock}</div>}
                          {row.updated_yymmdd && <div>Updated: {row.updated_yymmdd}</div>}
                        </div>
                      )}
                    </td>
                  )}
                  {visibleCols.has('sid') && (
                    <td className="px-2 py-1.5 tabular-nums text-muted-foreground">
                      {row.sid || '—'}
                    </td>
                  )}
                  {visibleCols.has('compression_format') && (
                    <td className="px-2 py-1.5">{row.compression_format || '—'}</td>
                  )}
                  {visibleCols.has('vpid') && (
                    <td className="px-2 py-1.5 tabular-nums text-muted-foreground">
                      {row.vpid || '—'}
                    </td>
                  )}
                  {visibleCols.has('audio') && (
                    <td className="px-2 py-1.5 text-muted-foreground">
                      {row.audio || '—'}
                    </td>
                  )}
                  {visibleCols.has('encryption') && (
                    <td className="px-2 py-1.5">
                      {encrypted ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                          <Lock className="h-3 w-3" />
                          {row.encryption}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Unlock className="h-3 w-3" />
                          No encryption listed
                        </span>
                      )}
                    </td>
                  )}
                  {visibleCols.has('onid_tid') && (
                    <td className="px-2 py-1.5 tabular-nums text-muted-foreground">{row.onid_tid || '—'}</td>
                  )}
                  {visibleCols.has('transponder') && (
                    <td className="px-2 py-1.5">{row.transponder || '—'}</td>
                  )}
                  {visibleCols.has('source') && (
                    <td className="px-2 py-1.5 text-muted-foreground">{row.source || '—'}</td>
                  )}
                  {visibleCols.has('cn_lock') && (
                    <td className="px-2 py-1.5 tabular-nums text-muted-foreground">{row.cn_lock || '—'}</td>
                  )}
                  {visibleCols.has('updated_yymmdd') && (
                    <td className="px-2 py-1.5 tabular-nums text-muted-foreground">{row.updated_yymmdd || '—'}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalServiceRows > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">
              Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, totalServiceRows)} of {totalServiceRows}
            </span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value) as PageSize); setPage(0); }}
              className="h-8 rounded border border-border bg-card px-1 text-[12px]"
              aria-label="Page size"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="px-2 text-[12px] tabular-nums text-muted-foreground">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Provider section */}
      {providerRows.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-semibold text-[14px]">
            Provider / package information ({providerRows.length})
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {providerRows.map((row, idx) => (
              <Card key={`prov-${idx}`} className="p-3">
                <div className="text-[12px] font-medium">{row.name || row.provider || 'Provider'}</div>
                {row.frequency_mhz && (
                  <div className="text-[11px] text-muted-foreground tabular-nums">
                    {formatFrequency(row.frequency_mhz)}
                  </div>
                )}
                {row.provider && row.provider !== row.name && (
                  <div className="text-[11px] text-muted-foreground">{row.provider}</div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}