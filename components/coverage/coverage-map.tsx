'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { BeamRecord } from '@/types';
import { isTemplateVerified, normalizeTileTemplate } from '@/lib/data/beams';

interface ActiveLayer {
  beam: BeamRecord;
  opacity: number;
}

interface CoverageMapProps {
  layers: ActiveLayer[];
  mode: '2d' | '3d';
  onModeChange: (mode: '2d' | '3d') => void;
  basemap: 'dark' | 'light' | 'satellite';
  onBasemapChange: (b: 'dark' | 'light' | 'satellite') => void;
  mapKey: number;
  onReset: () => void;
  selectedBeam: BeamRecord | null;
  onGeolocate: () => void;
}

const BASEMAP_STYLES: Record<string, string> = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  satellite: 'https://tiles.openaerialmap.org/0.6.0/0.6.0.json',
};

const FALLBACK_STYLE = 'https://demotiles.maplibre.org/style.json';

export default function CoverageMap({
  layers,
  mode,
  onModeChange,
  basemap,
  onBasemapChange,
  mapKey,
  onReset,
  selectedBeam,
  onGeolocate,
}: CoverageMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [webglOk, setWebglOk] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Check WebGL
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebglOk(false);
    } catch {
      setWebglOk(false);
    }
  }, []);

  // Init map
  useEffect(() => {
    if (!webglOk || !containerRef.current) return;

    let map: maplibregl.Map;

    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: BASEMAP_STYLES[basemap] ?? BASEMAP_STYLES.dark,
        center: [0, 20],
        zoom: 1.5,
        maxZoom: 18,
        minZoom: 1,
        attributionControl: { compact: true },
      });

      mapRef.current = map;

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');

      map.on('load', () => {
        setLoading(false);
      });

      map.on('error', (e) => {
        // Don't crash on tile load errors — they are expected for blocked tiles
        console.warn('MapLibre error:', e);
      });

      map.on('styleerror', () => {
        setLoadError('Could not load basemap. Using fallback.');
        map.setStyle(FALLBACK_STYLE);
      });
    } catch (e) {
      setWebglOk(false);
      return;
    }

    return () => {
      map?.remove();
      mapRef.current = null;
    };
  }, [basemap, mapKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2D/3D mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (mode === '3d') {
      map.easeTo({ pitch: 45, duration: 500 });
    } else {
      map.easeTo({ pitch: 0, duration: 500 });
    }
  }, [mode]);

  // Update layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const style = map.getStyle();
    if (!style) return;

    // Remove all beam tile layers and sources
    const existingLayers = style.layers.filter((l) => l.id.startsWith('beam-'));
    for (const layer of existingLayers) {
      if (map.getLayer(layer.id)) map.removeLayer(layer.id);
    }
    const existingSources = Object.keys(style.sources).filter((s) => s.startsWith('beam-'));
    for (const source of existingSources) {
      if (map.getSource(source)) map.removeSource(source);
    }

    // Add active layers
    for (const layer of layers) {
      const beam = layer.beam;
      const tileUrl = normalizeTileTemplate(beam.coverage_tile_url);
      if (!isTemplateVerified(tileUrl)) continue;

      const sourceId = `beam-${beam.beam_id}`;
      const layerId = `beam-${beam.beam_id}`;

      if (map.getSource(sourceId)) continue;

      try {
        map.addSource(sourceId, {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256,
          maxzoom: 8,
          attribution: 'Satbeams',
        });

        map.addLayer({
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: {
            'raster-opacity': layer.opacity,
          },
        });
      } catch (e) {
        console.warn(`Failed to add layer for beam ${beam.beam_id}:`, e);
      }
    }
  }, [layers]);

  // Update opacity for changed layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    for (const layer of layers) {
      const layerId = `beam-${layer.beam.beam_id}`;
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, 'raster-opacity', layer.opacity);
      }
    }
  }, [layers]);

  if (!webglOk) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-coverage gap-4 p-8 text-center">
        <div className="text-coverage-foreground">
          <h3 className="font-serif text-[22px]">3D map unavailable</h3>
          <p className="mt-2 text-[14px] text-coverage-foreground/70 max-w-sm">
            Your browser or device does not support WebGL, which is required for
            the interactive map. You can still browse beam information in the layer list.
          </p>
        </div>
        <div className="max-h-64 overflow-y-auto rounded-lg border border-coverage-foreground/20 p-3 text-left text-[12px] text-coverage-foreground/80 max-w-sm">
          {layers.length > 0 ? (
            layers.map((l) => (
              <div key={l.beam.beam_id} className="py-1">
                {l.beam.fullname || l.beam.name}
              </div>
            ))
          ) : (
            <div className="py-2">No beams selected.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-coverage">
      <div ref={containerRef} className="h-full w-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-coverage/50">
          <div className="text-coverage-foreground/70 text-[14px]">Loading map…</div>
        </div>
      )}
      {loadError && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-lg bg-destructive/15 px-3 py-1.5 text-[12px] text-destructive">
          {loadError}
        </div>
      )}
    </div>
  );
}