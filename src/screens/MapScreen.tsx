import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LeafletMap, { type MapFocus } from '../components/LeafletMap';
import SelectedPlacePanel from '../components/SelectedPlacePanel';
import { AlertIcon, ArrowLeftIcon, CloseIcon, LocateIcon, SearchIcon } from '../components/Icons';
import {
  HIGHEST_PAYOUT_ID,
  PLACES,
  formatRate,
  getPlace,
  matchesQuery,
  sortPlaces,
  type Place,
} from '../data/places';
import { useApp } from '../lib/state';
import { useMediaQuery } from '../lib/hooks';

interface Props {
  selectedId: string | null;
  details: boolean;
  onSelect: (id: string | null) => void;
  onOpenDetails: (id: string) => void;
  onBrowseList: () => void;
}

type LocateStatus = 'idle' | 'locating' | 'located' | 'denied' | 'unavailable';

const NO_IDS: ReadonlySet<string> = new Set();
/** Roughly half the mobile bottom sheet, so a selected pin lands in the visible map area. */
const SHEET_OFFSET_PX = 130;

export default function MapScreen({ selectedId, details, onSelect, onOpenDetails, onBrowseList }: Props) {
  const { t } = useApp();
  const isWide = useMediaQuery('(min-width: 900px)');
  const screenRef = useRef<HTMLDivElement>(null);
  const sheetObserver = useRef<ResizeObserver | null>(null);
  const focusNonce = useRef(0);
  const wantPanelFocus = useRef(false);

  const [query, setQuery] = useState('');
  const [tilesFailed, setTilesFailed] = useState(false);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locateStatus, setLocateStatus] = useState<LocateStatus>('idle');
  const [panelFocusNonce, setPanelFocusNonce] = useState(0);

  const selected = getPlace(selectedId);
  const searching = query.trim().length > 0;

  const results = useMemo(
    () => sortPlaces(PLACES.filter((p) => matchesQuery(p, query)), 'payout'),
    [query],
  );
  const dimmedIds = useMemo<ReadonlySet<string>>(
    () => (searching ? new Set(PLACES.filter((p) => !matchesQuery(p, query)).map((p) => p.id)) : NO_IDS),
    [query, searching],
  );

  // Centre on the selected place whenever it changes (or the details sheet closes).
  useEffect(() => {
    if (!selected || details) return;
    focusNonce.current += 1;
    setFocus({
      lat: selected.lat,
      lng: selected.lng,
      offsetY: isWide ? 0 : SHEET_OFFSET_PX,
      nonce: focusNonce.current,
    });
    // isWide intentionally omitted: resizing the window should not move the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, details]);

  // After a keyboard selection, move focus into the opened panel so it is reachable.
  useEffect(() => {
    if (!wantPanelFocus.current) return;
    const panel = screenRef.current?.querySelector<HTMLElement>('.selected');
    if (panel) {
      wantPanelFocus.current = false;
      panel.focus();
    }
  }, [panelFocusNonce, selectedId]);

  // Tell CSS how tall the mobile bottom sheet is, so the map attribution stays visible above it.
  const sheetRef = useCallback((node: HTMLDivElement | null) => {
    sheetObserver.current?.disconnect();
    sheetObserver.current = null;
    const screen = screenRef.current;
    if (!screen) return;
    if (!node) {
      screen.style.setProperty('--sheet-h', '0px');
      return;
    }
    const update = () => screen.style.setProperty('--sheet-h', `${node.offsetHeight + 12}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    sheetObserver.current = ro;
  }, []);

  // Location status messages disappear on their own (except while locating).
  useEffect(() => {
    if (locateStatus === 'idle' || locateStatus === 'locating') return;
    const id = window.setTimeout(() => setLocateStatus('idle'), 6000);
    return () => window.clearTimeout(id);
  }, [locateStatus]);

  const selectPlace = (id: string) => {
    setQuery('');
    onSelect(id);
  };

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setLocateStatus('unavailable');
      return;
    }
    setLocateStatus('locating');
    // Permission is requested only now, in response to the tap.
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(here);
        focusNonce.current += 1;
        setFocus({ ...here, zoom: 14, nonce: focusNonce.current });
        setLocateStatus('located');
      },
      (err) => setLocateStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  const pinAriaLabel = useCallback(
    (place: Place, isSelected: boolean, highest: boolean) =>
      [
        t('map.pinLabel', { name: place.name, price: formatRate(place.payoutPerKg) }),
        t('place.material.glass'),
        highest ? t('map.pinTop') : '',
        isSelected ? t('map.pinSelected') : '',
      ]
        .filter(Boolean)
        .join(', '),
    [t],
  );

  const showList = searching || (isWide && !selected);
  const showPanel = !!selected && !searching;

  const statusMessage =
    locateStatus === 'locating'
      ? t('map.locating')
      : locateStatus === 'located'
        ? t('map.located')
        : locateStatus === 'denied'
          ? t('map.denied')
          : locateStatus === 'unavailable'
            ? t('map.unavailable')
            : '';

  return (
    <div className="map-screen" ref={screenRef}>
      <aside className="map-side">
        <div className="map-search" role="search">
          <SearchIcon size={20} className="map-search__icon" />
          <label htmlFor="map-q" className="sr-only">
            {t('map.search')}
          </label>
          <input
            id="map-q"
            type="search"
            value={query}
            placeholder={t('map.searchPlaceholder')}
            autoComplete="off"
            enterKeyHint="search"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0]) {
                e.preventDefault();
                selectPlace(results[0].id);
                (e.target as HTMLInputElement).blur();
              }
              if (e.key === 'Escape') setQuery('');
            }}
          />
          {query && (
            <button type="button" className="icon-btn icon-btn--sm" aria-label={t('map.clear')} onClick={() => setQuery('')}>
              <CloseIcon size={16} />
            </button>
          )}
        </div>

        {showList &&
          (results.length > 0 ? (
            <ul className="results" aria-label={t('map.results')}>
              {results.map((p) => (
                <li key={p.id}>
                  <button type="button" className="result" onClick={() => selectPlace(p.id)}>
                    <span className="result__text">
                      <span className="result__name">{p.name}</span>
                      <span className="result__addr">
                        {p.address} · {p.neighborhood}
                      </span>
                    </span>
                    <span className="price price--sm">
                      <span className="price__num">{formatRate(p.payoutPerKg)}</span>
                      <span className="price__unit">{t('place.unit')}</span>
                    </span>
                    {p.id === HIGHEST_PAYOUT_ID && <span className="sr-only">{t('place.highest')}</span>}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="results results--empty" role="status">
              {t('map.noResults', { q: query.trim() })}
            </p>
          ))}

        {isWide && selected && !searching && (
          <button type="button" className="back-link" onClick={() => onSelect(null)}>
            <ArrowLeftIcon size={16} />
            {t('map.back')}
          </button>
        )}

        {showPanel && selected && (
          <div className="map-sheet" ref={sheetRef}>
            <SelectedPlacePanel place={selected} onClose={() => onSelect(null)} onViewDetails={onOpenDetails} />
          </div>
        )}
      </aside>

      <div className="map-canvas">
        <LeafletMap
          places={PLACES}
          selectedId={selectedId}
          dimmedIds={dimmedIds}
          focus={focus}
          userLocation={userLocation}
          unitLabel={t('place.unit')}
          pinAriaLabel={pinAriaLabel}
          onSelect={(id, viaKeyboard) => {
            if (viaKeyboard) {
              wantPanelFocus.current = true;
              setPanelFocusNonce((n) => n + 1);
            }
            onSelect(id);
          }}
          onTilesStatus={setTilesFailed}
          mapLabel={t('map.region')}
        />

        {'geolocation' in navigator && (
          <button
            type="button"
            className="locate-btn"
            onClick={locate}
            aria-label={t('map.locate')}
            title={t('map.locate')}
            aria-busy={locateStatus === 'locating'}
          >
            <LocateIcon size={22} />
          </button>
        )}

        <div className="map-notices">
          {tilesFailed && (
            <div className="tiles-failed" role="alert">
              <AlertIcon size={20} />
              <div>
                <p className="tiles-failed__title">{t('map.tilesFailed')}</p>
                <p>{t('map.tilesFailedBody')}</p>
                <button type="button" className="link-btn" onClick={onBrowseList}>
                  {t('map.tilesFailedCta')}
                </button>
              </div>
            </div>
          )}
          <p className={`toast${statusMessage ? ' is-visible' : ''}`} role="status" aria-live="polite">
            {statusMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
