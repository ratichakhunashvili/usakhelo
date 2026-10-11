import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { getPlace } from '../data/places';

export type Screen = 'places' | 'map' | 'user';

export interface Route {
  screen: Screen;
  /** Place selected on the map, or whose details are open. */
  placeId: string | null;
  details: boolean;
}

const SCREENS: Screen[] = ['places', 'map', 'user'];

/** Hash routes: #/places, #/places/<id>/details, #/map, #/map/<id>, #/map/<id>/details, #/user */
export function parseHash(hash: string): Route {
  const [, screen, id, tail] = hash.replace(/^#/, '').split('/');
  const s = (SCREENS as string[]).includes(screen) ? (screen as Screen) : 'places';
  const known = s !== 'user' && getPlace(id) ? id : null;
  const details = known !== null && tail === 'details';
  // On Places a place id only exists to open details.
  const placeId = s === 'places' && !details ? null : known;
  return { screen: s, placeId, details };
}

export function formatRoute(r: Route): string {
  let path = `#/${r.screen}`;
  if (r.placeId) path += `/${r.placeId}`;
  if (r.placeId && r.details) path += '/details';
  return path;
}

const EVENT = 'app:routechange';

function subscribe(cb: () => void) {
  window.addEventListener('popstate', cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener('popstate', cb);
    window.removeEventListener(EVENT, cb);
  };
}

const getSnapshot = () => window.location.hash;

export interface NavigateOptions {
  replace?: boolean;
}

export function useRoute() {
  const hash = useSyncExternalStore(subscribe, getSnapshot, () => '');
  const route = useMemo(() => parseHash(hash), [hash]);

  const navigate = useCallback((next: Route, opts: NavigateOptions = {}) => {
    const target = formatRoute(next);
    if (target === window.location.hash) return;
    if (opts.replace) {
      window.history.replaceState({ app: true, from: null }, '', target);
    } else {
      window.history.pushState({ app: true, from: window.location.hash }, '', target);
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  /** Close the details sheet. If we pushed it, go Back so the Close button and browser Back agree. */
  const closeDetails = useCallback(() => {
    const target = formatRoute({
      ...route,
      details: false,
      placeId: route.screen === 'places' ? null : route.placeId,
    });
    const state = window.history.state as { from?: string | null } | null;
    if (state?.from === target || (state?.from === '' && target === '#/places')) {
      window.history.back();
    } else {
      window.history.replaceState({ app: true, from: null }, '', target);
      window.dispatchEvent(new Event(EVENT));
    }
  }, [route]);

  return { route, navigate, closeDetails };
}
