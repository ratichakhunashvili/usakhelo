import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG } from '../config/map';
import { HIGHEST_PAYOUT_ID, formatRate, type Place } from '../data/places';
import { prefersReducedMotion, useLatest } from '../lib/hooks';

export interface MapFocus {
  lat: number;
  lng: number;
  /** Vertical pixel shift so the target sits above a bottom sheet. */
  offsetY?: number;
  zoom?: number;
  /** Changes on every request so repeating the same target still re-centres. */
  nonce: number;
}

interface Props {
  places: readonly Place[];
  selectedId: string | null;
  dimmedIds: ReadonlySet<string>;
  focus: MapFocus | null;
  userLocation: { lat: number; lng: number } | null;
  unitLabel: string;
  pinAriaLabel: (place: Place, selected: boolean, highest: boolean) => string;
  /** viaKeyboard lets the screen move focus to the opened panel. */
  onSelect: (id: string, viaKeyboard: boolean) => void;
  onTilesStatus: (failed: boolean) => void;
  mapLabel: string;
}

// Inline glyphs for the pin markers (Leaflet markers are plain DOM, not React).
const BOTTLE =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2.5h4M10.5 2.5v3.2L8.6 9a3 3 0 0 0-.6 1.8V19a2.5 2.5 0 0 0 2.5 2.5h3A2.5 2.5 0 0 0 16 19v-8.2a3 3 0 0 0-.6-1.8l-1.9-3.3V2.5M8 13.5h8"/></svg>';
const STAR =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="m12 3.4 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.7l6-.8L12 3.4z"/></svg>';

function buildIcon(place: Place, selected: boolean, unit: string): L.DivIcon {
  const top = place.id === HIGHEST_PAYOUT_ID;
  const html =
    `<div class="pin${selected ? ' pin--selected' : ''}${top ? ' pin--top' : ''}">` +
    `<span class="pin__glyph">${top ? STAR : BOTTLE}</span>` +
    `<span class="pin__price">${formatRate(place.payoutPerKg)}</span>` +
    `<span class="pin__unit">${unit}</span></div><span class="pin__tip"></span>`;
  return L.divIcon({
    className: 'pin-wrap',
    html,
    iconSize: [92, 44],
    iconAnchor: [46, 44],
  });
}

export default function LeafletMap(props: Props) {
  const { places, selectedId, dimmedIds, focus, userLocation, unitLabel, mapLabel } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userLayerRef = useRef<L.LayerGroup | null>(null);
  const initialisedRef = useRef(false);

  // Latest props for long-lived Leaflet callbacks, so the map is never recreated.
  const latest = useLatest(props);

  // 1. Create the map once.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const map = L.map(el, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 9,
      maxZoom: MAP_CONFIG.maxZoom,
      worldCopyJump: false,
    });
    map.attributionControl.setPrefix(false);
    // Added after the attribution control, so the zoom buttons stack above it.
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Detect a tile provider that is unreachable (offline, blocked, bad URL).
    let loaded = 0;
    let errors = 0;
    const tiles = L.tileLayer(MAP_CONFIG.tileUrl, {
      maxZoom: MAP_CONFIG.maxZoom,
      attribution: MAP_CONFIG.attribution,
      detectRetina: true,
      keepBuffer: 2,
    });
    tiles.on('tileload', () => {
      loaded += 1;
      errors = 0;
      latest.current.onTilesStatus(false);
    });
    tiles.on('tileerror', () => {
      errors += 1;
      if (loaded === 0 && errors >= 2) latest.current.onTilesStatus(true);
    });
    tiles.addTo(map);

    const bounds = L.latLngBounds(latest.current.places.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [64, 64], maxZoom: 13 });

    const userLayer = L.layerGroup().addTo(map);
    userLayerRef.current = userLayer;
    mapRef.current = map;
    initialisedRef.current = false;
    // Allow animated moves only after the first frame.
    const raf = requestAnimationFrame(() => {
      initialisedRef.current = true;
    });

    const markers = markersRef.current;
    return () => {
      cancelAnimationFrame(raf);
      markers.clear();
      map.remove();
      mapRef.current = null;
      userLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Create markers once (places are static data).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers = markersRef.current;
    markers.clear();
    for (const place of places) {
      const marker = L.marker([place.lat, place.lng], {
        icon: buildIcon(place, false, latest.current.unitLabel),
        title: place.name,
        keyboard: true,
        riseOnHover: true,
      });
      marker.on('click', () => latest.current.onSelect(place.id, false));
      // Leaflet 1.9 does not turn Enter into a click, so handle keyboard activation ourselves.
      marker.on('keydown', (e: L.LeafletKeyboardEvent) => {
        const key = e.originalEvent.key;
        if (key === 'Enter' || key === ' ') {
          e.originalEvent.preventDefault();
          latest.current.onSelect(place.id, true);
        }
      });
      marker.addTo(map);
      markers.set(place.id, marker);
    }
    return () => {
      markers.forEach((m) => m.remove());
      markers.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places]);

  // 3. Sync marker appearance (selected / dimmed by search / language). Cheap: four markers.
  const dimmedKey = Array.from(dimmedIds).sort().join('|');
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const place = latest.current.places.find((p) => p.id === id);
      if (!place) return;
      const selected = id === selectedId;
      const highest = id === HIGHEST_PAYOUT_ID;
      marker.setIcon(buildIcon(place, selected, unitLabel));
      marker.setZIndexOffset(selected ? 1000 : highest ? 500 : 0);
      marker.setOpacity(dimmedIds.has(id) ? 0.35 : 1);
      marker.getElement()?.setAttribute('aria-label', latest.current.pinAriaLabel(place, selected, highest));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, dimmedKey, unitLabel, places]);

  // 4. Move the map when asked to focus somewhere.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    const zoom = Math.max(map.getZoom(), focus.zoom ?? MAP_CONFIG.focusZoom);
    let center = L.latLng(focus.lat, focus.lng);
    if (focus.offsetY) {
      const p = map.project(center, zoom);
      center = map.unproject(L.point(p.x, p.y + focus.offsetY), zoom);
    }
    const animate = initialisedRef.current && !prefersReducedMotion();
    map.setView(center, zoom, { animate, duration: 0.5 });
  }, [focus]);

  // 5. "You are here" marker.
  useEffect(() => {
    const layer = userLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!userLocation) return;
    const at: [number, number] = [userLocation.lat, userLocation.lng];
    L.circleMarker(at, {
      radius: 16,
      stroke: false,
      fillColor: '#1C2B48',
      fillOpacity: 0.14,
      interactive: false,
    }).addTo(layer);
    L.circleMarker(at, {
      radius: 7,
      color: '#ffffff',
      weight: 3,
      fillColor: '#1C2B48',
      fillOpacity: 1,
      interactive: false,
    }).addTo(layer);
  }, [userLocation]);

  return <div ref={containerRef} className="leaflet-host" role="region" aria-label={mapLabel} />;
}
