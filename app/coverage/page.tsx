'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useMemo, useCallback, useRef } from 'react';
import { fetchBeams, isTemplateVerified, normalizeTileTemplate, defaultOpacity } from '@/lib/data/beams';
import type { BeamRecord } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  AlertCircle,
  RefreshCw,
  PanelLeftClose,
  PanelLeftOpen,
  Eye,
  EyeOff,
  X,
  Layers,
  Loader2,
  Maximize,
  Minimize,
  RotateCcw,
  Map as MapIcon,
  Box,
  MapPin,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import beamPositionsData from '@/lib/data/beam-positions.json';

const CoverageMap = dynamic(() => import('@/components/coverage/coverage-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-coverage text-coverage-foreground">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
});

interface ActiveLayer {
  beam: BeamRecord;
  opacity: number;
}

export default function CoveragePage() {
  const beamsQuery = useQuery({
    queryKey: ['beams'],
    queryFn: fetchBeams,
  });

  const [search, setSearch] = useState('');
  const [bandFilter, setBandFilter] = useState<string | null>(null);
  const [expandedSats, setExpandedSats] = useState<Set<string>>(new Set());
  const [activeLayers, setActiveLayers] = useState<ActiveLayer[]>([]);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mapMode, setMapMode] = useState<'2d' | '3d'>('2d');
  const [mapKey, setMapKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [basemap, setBasemap] = useState<'dark' | 'light' | 'satellite'>('dark');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedBeam, setSelectedBeam] = useState<BeamRecord | null>(null);

  const satellites = beamsQuery.data ?? [];
  const allBands = useMemo(
    () => Array.from(new Set(satellites.flatMap((s) => s.bands))).sort(),
    [satellites],
  );

  const satNameToOrbital = useMemo(() => {
    const positions = beamPositionsData as Record<string, string>;
    const map = new Map<string, string>();
    for (const sat of satellites) {
      const pos = positions[sat.satellite_name];
      if (pos) map.set(sat.satellite_name, pos);
    }
    return map;
  }, [satellites]);

  const filteredSats = useMemo(() => {
    if (!search.trim() && !bandFilter) return satellites;
    const q = search.toLowerCase();
    return satellites
      .map((sat) => {
        if (bandFilter && !sat.bands.includes(bandFilter)) return null;
        if (search.trim()) {
          const matchName = sat.satellite_name.toLowerCase().includes(q);
          const matchBeams = sat.beams.some(
            (b) =>
              b.fullname.toLowerCase().includes(q) ||
              b.name.toLowerCase().includes(q),
          );
          if (!matchName && !matchBeams) return null;
        }
        return sat;
      })
      .filter(Boolean) as typeof satellites;
  }, [satellites, search, bandFilter]);

  const selectedBeamIds = new Set(activeLayers.map((l) => l.beam.beam_id));

  const toggleSatellite = useCallback((satId: string) => {
    setExpandedSats((prev) => {
      const next = new Set(prev);
      if (next.has(satId)) next.delete(satId);
      else next.add(satId);
      return next;
    });
  }, []);

  const toggleBeam = useCallback(
    (beam: BeamRecord) => {
      if (beam.visible !== '' && beam.visible.toLowerCase() === 'false') return;

      setActiveLayers((prev) => {
        if (prev.length > 0 && prev[0].beam.beam_id === beam.beam_id) {
          return [];
        }
        return [{ beam, opacity: defaultOpacity(beam) }];
      });
    },
    [],
  );

  const setLayerOpacity = useCallback((beamId: string, opacity: number) => {
    setActiveLayers((prev) =>
      prev.map((l) =>
        l.beam.beam_id === beamId ? { ...l, opacity: opacity / 100 } : l,
      ),
    );
  }, []);

  const clearSelection = useCallback(() => setActiveLayers([]), []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch {
      setFullscreen(false);
    }
  }, []);

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not available on this device.');
      return;
    }
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      () => {
        setMapKey((k) => k + 1);
      },
      (err) => {
        setLocationError(err.message || 'Could not get your location.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  if (beamsQuery.isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal" />
      </div>
    );
  }

  if (beamsQuery.isError) {
    const err = beamsQuery.error as Error;
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div>
            <p className="font-medium text-[15px]">Could not load beam coverage data</p>
            <p className="mt-1 text-[13px] text-muted-foreground">{err?.message}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => beamsQuery.refetch()}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Mobile beam sheet trigger */}
      <div className="md:hidden flex items-center gap-2 border-b border-border bg-card px-4 py-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Layers className="h-3.5 w-3.5" />
          {activeLayers.length} layers
        </Button>
        <div className="flex-1" />
        <span className="text-[11px] text-muted-foreground">{satellites.length} satellites</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — Desktop */}
        <aside
          className={cn(
            'hidden md:flex flex-col border-r border-border bg-card transition-all duration-200',
            sidebarOpen ? 'w-[300px]' : 'w-0',
          )}
        >
          {sidebarOpen && (
            <CoverageSidebar
              satellites={filteredSats}
              allBands={allBands}
              search={search}
              setSearch={setSearch}
              bandFilter={bandFilter}
              setBandFilter={setBandFilter}
              expandedSats={expandedSats}
              toggleSatellite={toggleSatellite}
              selectedBeamIds={selectedBeamIds}
              toggleBeam={toggleBeam}
              activeLayers={activeLayers}
              setLayerOpacity={setLayerOpacity}
              clearSelection={clearSelection}
              showSelectedOnly={showSelectedOnly}
              setShowSelectedOnly={setShowSelectedOnly}
              onCollapse={() => setSidebarOpen(false)}
              selectedBeam={selectedBeam}
              setSelectedBeam={setSelectedBeam}
              satNameToOrbital={satNameToOrbital}
            />
          )}
        </aside>

        {!sidebarOpen && (
          <button
            className="hidden md:flex absolute left-2 top-[4.5rem] z-20 h-8 w-8 items-center justify-center rounded-lg border border-border bg-card shadow-sm"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}

        {/* Map area */}
        <div className="relative flex-1">
          <CoverageMap
            layers={activeLayers}
            mode={mapMode}
            onModeChange={setMapMode}
            basemap={basemap}
            onBasemapChange={setBasemap}
            mapKey={mapKey}
            onReset={() => setMapKey((k) => k + 1)}
            selectedBeam={selectedBeam}
            onGeolocate={handleGeolocate}
          />

          {/* Floating controls — top right */}
          <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
            <div className="flex gap-1 rounded-lg border border-border bg-card/80 backdrop-control p-1 shadow-sm">
              <Button
                variant={mapMode === '2d' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 gap-1"
                onClick={() => setMapMode('2d')}
              >
                <MapIcon className="h-3.5 w-3.5" />
                2D
              </Button>
              <Button
                variant={mapMode === '3d' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 gap-1"
                onClick={() => setMapMode('3d')}
              >
                <Box className="h-3.5 w-3.5" />
                3D
              </Button>
            </div>

            <div className="flex gap-1 rounded-lg border border-border bg-card/80 backdrop-control p-1 shadow-sm">
              <Button
                variant={basemap === 'dark' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setBasemap('dark')}
                title="Dark basemap"
              >
                Dark
              </Button>
              <Button
                variant={basemap === 'light' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setBasemap('light')}
                title="Light basemap"
              >
                Light
              </Button>
              <Button
                variant={basemap === 'satellite' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setBasemap('satellite')}
                title="Satellite basemap"
              >
                Sat
              </Button>
            </div>
          </div>

          {/* Floating controls — bottom right */}
          <div className="absolute right-3 bottom-3 z-20 flex flex-col gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg border border-border bg-card/80 backdrop-control shadow-sm"
              onClick={handleGeolocate}
              aria-label="Find my location"
              title="Find my location"
            >
              <MapPin className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg border border-border bg-card/80 backdrop-control shadow-sm"
              onClick={() => setMapKey((k) => k + 1)}
              aria-label="Reset view"
              title="Reset view"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg border border-border bg-card/80 backdrop-control shadow-sm"
              onClick={toggleFullscreen}
              aria-label="Toggle fullscreen"
              title="Fullscreen"
            >
              {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>

          {/* Attribution */}
          <div className="absolute left-2 bottom-1 z-10 text-[10px] text-coverage-foreground/60">
            <span className="bg-coverage/40 px-1.5 py-0.5 rounded backdrop-control">
              Map: OpenStreetMap · Beam data: Satbeams
            </span>
          </div>

          {/* Selected beam info */}
          {selectedBeam && (
            <div className="absolute left-3 top-3 z-20 w-72 rounded-lg border border-border bg-card/90 backdrop-control p-3 shadow-lg">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate">{selectedBeam.fullname || selectedBeam.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                    {selectedBeam.satellite_name}
                    {satNameToOrbital.get(selectedBeam.satellite_name) && (
                      <span className="text-teal/70 tabular-nums">
                        {satNameToOrbital.get(selectedBeam.satellite_name)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBeam(null)}
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Close info"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedBeam.band && (
                  <Badge variant="outline" className="text-[10px]">{selectedBeam.band}</Badge>
                )}
                {selectedBeam.status && (
                  <Badge variant="outline" className="text-[10px]">{selectedBeam.status}</Badge>
                )}
                {selectedBeam.coverage_type && (
                  <Badge variant="outline" className="text-[10px]">{selectedBeam.coverage_type}</Badge>
                )}
              </div>
              {isTemplateVerified(selectedBeam.coverage_tile_url) ? (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Coverage layer template available.
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Coverage layer unavailable (no verified tile template).
                </p>
              )}
              {selectedBeam.source_url && (
                <a
                  href={selectedBeam.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-teal hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Source
                </a>
              )}
            </div>
          )}

          {locationError && (
            <div className="absolute left-3 top-3 z-20 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
              {locationError}
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom sheet for layers */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-card border-t border-border safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-border p-3 flex items-center justify-between">
              <span className="text-[14px] font-semibold">Beams & layers</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-3">
              <CoverageSidebar
                satellites={filteredSats}
                allBands={allBands}
                search={search}
                setSearch={setSearch}
                bandFilter={bandFilter}
                setBandFilter={setBandFilter}
                expandedSats={expandedSats}
                toggleSatellite={toggleSatellite}
                selectedBeamIds={selectedBeamIds}
                toggleBeam={toggleBeam}
                activeLayers={activeLayers}
                setLayerOpacity={setLayerOpacity}
                clearSelection={clearSelection}
                showSelectedOnly={showSelectedOnly}
                setShowSelectedOnly={setShowSelectedOnly}
                onCollapse={() => setSidebarOpen(false)}
                selectedBeam={selectedBeam}
                setSelectedBeam={setSelectedBeam}
                satNameToOrbital={satNameToOrbital}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Sidebar component (shared between desktop and mobile) */
function CoverageSidebar({
  satellites,
  allBands,
  search,
  setSearch,
  bandFilter,
  setBandFilter,
  expandedSats,
  toggleSatellite,
  selectedBeamIds,
  toggleBeam,
  activeLayers,
  setLayerOpacity,
  clearSelection,
  showSelectedOnly,
  setShowSelectedOnly,
  onCollapse,
  selectedBeam,
  setSelectedBeam,
  satNameToOrbital,
}: {
  satellites: ReturnType<typeof fetchBeams> extends Promise<infer T> ? T : never;
  allBands: string[];
  search: string;
  setSearch: (s: string) => void;
  bandFilter: string | null;
  setBandFilter: (b: string | null) => void;
  expandedSats: Set<string>;
  toggleSatellite: (id: string) => void;
  selectedBeamIds: Set<string>;
  toggleBeam: (beam: BeamRecord) => void;
  activeLayers: ActiveLayer[];
  setLayerOpacity: (beamId: string, opacity: number) => void;
  clearSelection: () => void;
  showSelectedOnly: boolean;
  setShowSelectedOnly: (v: boolean) => void;
  onCollapse: () => void;
  selectedBeam: BeamRecord | null;
  setSelectedBeam: (b: BeamRecord | null) => void;
  satNameToOrbital: Map<string, string>;
}) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={sidebarRef} className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-3">
        <h2 className="text-[14px] font-semibold">Beams</h2>
        <button
          onClick={onCollapse}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search satellites or beams…"
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-4 text-[13px] outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
          />
        </div>
      </div>

      {/* Band filters */}
      {allBands.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pb-2">
          <button
            onClick={() => setBandFilter(null)}
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
              !bandFilter
                ? 'bg-teal text-teal-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground',
            )}
          >
            All
          </button>
          {allBands.map((band) => (
            <button
              key={band}
              onClick={() => setBandFilter(band === bandFilter ? null : band)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                bandFilter === band
                  ? 'bg-teal text-teal-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground',
              )}
            >
              {band}
            </button>
          ))}
        </div>
      )}

      {/* Active layers */}
      {activeLayers.length > 0 && (
        <div className="border-b border-border px-3 pb-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              {activeLayers.length} selected layer{activeLayers.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={clearSelection}
              className="text-[11px] text-destructive hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1.5">
            {activeLayers.map((layer) => (
              <div
                key={layer.beam.beam_id}
                className="rounded-lg border border-border bg-background px-2.5 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[12px] font-medium">
                    {layer.beam.fullname || layer.beam.name}
                  </span>
                  <button
                    onClick={() => toggleBeam(layer.beam)}
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${layer.beam.fullname}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Opacity</span>
                  <Slider
                    value={[Math.round(layer.opacity * 100)]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(v) => setLayerOpacity(layer.beam.beam_id, v[0])}
                    className="flex-1"
                  />
                  <span className="w-8 text-right text-[10px] tabular-nums text-muted-foreground">
                    {Math.round(layer.opacity * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show selected only toggle */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <label className="flex items-center gap-2 text-[12px] cursor-pointer">
          <input
            type="checkbox"
            checked={showSelectedOnly}
            onChange={(e) => setShowSelectedOnly(e.target.checked)}
            className="rounded"
          />
          Show selected only
        </label>
      </div>

      {/* Satellite / beam list */}
      <div className="flex-1 overflow-y-auto p-2">
        {satellites.length === 0 ? (
          <div className="p-4 text-center text-[13px] text-muted-foreground">
            No beams match your filters.
          </div>
        ) : (
          (showSelectedOnly
            ? satellites
                .map((sat) => ({
                  ...sat,
                  beams: sat.beams.filter((b) => selectedBeamIds.has(b.beam_id)),
                }))
                .filter((sat) => sat.beams.length > 0)
            : satellites
          ).map((sat) => {
            const isExpanded = expandedSats.has(sat.satellite_id);
            const selectedCount = sat.beams.filter((b) => selectedBeamIds.has(b.beam_id)).length;

            return (
              <div key={sat.satellite_id} className="mb-1">
                <button
                  onClick={() => toggleSatellite(sat.satellite_id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-secondary/50 transition-colors"
                >
                  <span className="flex-shrink-0 text-muted-foreground">
                    {isExpanded ? (
                      <ChevronDownRotate className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="flex-1 truncate text-[12px] font-medium">
                    {sat.satellite_name}
                  </span>
                  {satNameToOrbital.get(sat.satellite_name) && (
                    <span className="flex-shrink-0 text-[10px] tabular-nums text-teal/70">
                      {satNameToOrbital.get(sat.satellite_name)}
                    </span>
                  )}
                  {selectedCount > 0 && (
                    <span className="rounded-full bg-teal/15 px-1.5 py-0.5 text-[10px] font-medium text-teal tabular-nums">
                      {selectedCount}
                    </span>
                  )}
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {sat.beams.length}
                  </span>
                </button>

                {isExpanded && (
                  <div className="ml-4 border-l border-border pl-2">
                    {sat.beams.map((beam) => {
                      const isSelected = selectedBeamIds.has(beam.beam_id);
                      const isVisible = beam.visible !== '' && beam.visible.toLowerCase() !== 'false';
                      const hasTile = isTemplateVerified(beam.coverage_tile_url);

                      return (
                        <div
                          key={beam.beam_id}
                          className={cn(
                            'flex items-center gap-2 rounded px-2 py-1.5',
                            isSelected && 'bg-teal/5',
                          )}
                        >
                          <button
                            onClick={() => toggleBeam(beam)}
                            disabled={!hasTile && !isSelected}
                            className={cn(
                              'flex-shrink-0 transition-colors',
                              !hasTile && 'cursor-not-allowed opacity-40',
                            )}
                            aria-label={`${isSelected ? 'Hide' : 'Show'} beam ${beam.fullname}`}
                          >
                            {isSelected ? (
                              <Eye className="h-4 w-4 text-green-500" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-muted-foreground/50" />
                            )}
                          </button>
                          <button
                            onClick={() => setSelectedBeam(beam)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="truncate text-[11px] font-medium">
                              {beam.fullname || beam.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              {beam.band && <span>{beam.band}</span>}
                              {beam.status && <span>· {beam.status}</span>}
                              {!hasTile && <span className="text-destructive/60">· no tiles</span>}
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ChevronDownRotate({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}