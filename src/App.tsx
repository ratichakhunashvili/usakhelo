import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import BottomNavigation from './components/BottomNavigation';
import PlaceDetail from './components/PlaceDetail';
import PlacesScreen from './screens/PlacesScreen';
import ProfileScreen from './screens/ProfileScreen';
import { getPlace } from './data/places';
import { useApp } from './lib/state';
import { useDocumentTitle } from './lib/hooks';
import { useRoute, type Screen } from './lib/router';

// The map (Leaflet + its CSS) lives in its own chunk so Places/User render fast.
const loadMapScreen = () => import('./screens/MapScreen');
const MapScreen = lazy(loadMapScreen);

export default function App() {
  const { t } = useApp();
  const { route, navigate, closeDetails } = useRoute();
  const [announcement, setAnnouncement] = useState('');
  const firstRender = useRef(true);

  const screenTitle = t(route.screen === 'places' ? 'nav.places' : route.screen === 'map' ? 'nav.map' : 'nav.user');
  useDocumentTitle(`${screenTitle} · Glass recycling Tbilisi`);

  // Normalise an empty hash to #/places without adding a history entry.
  useEffect(() => {
    if (!window.location.hash) navigate({ screen: 'places', placeId: null, details: false }, { replace: true });
  }, [navigate]);

  // Warm up the map chunk once the browser is idle.
  useEffect(() => {
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const id = idle ? idle(() => void loadMapScreen()) : window.setTimeout(() => void loadMapScreen(), 1500);
    return () => {
      if (!idle) window.clearTimeout(id);
    };
  }, []);

  // Announce screen changes to assistive tech without stealing focus from the navigation.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setAnnouncement(screenTitle);
  }, [route.screen, screenTitle]);

  const goTo = useCallback(
    (screen: Screen) => navigate({ screen, placeId: null, details: false }),
    [navigate],
  );

  const detailPlace = route.details ? getPlace(route.placeId) : undefined;

  const viewOnMap = (id: string) => {
    if (route.screen === 'map') closeDetails();
    else navigate({ screen: 'map', placeId: id, details: false });
  };

  return (
    <div className="app">
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        {t('skip')}
      </a>

      <main id="main" className="screen" data-screen={route.screen} tabIndex={-1}>
        <div className="screen__inner" key={route.screen}>
          {route.screen === 'places' && (
            <PlacesScreen onOpen={(id) => navigate({ screen: 'places', placeId: id, details: true })} />
          )}
          {route.screen === 'map' && (
            <Suspense fallback={<div className="map-loading" role="status">{t('map.loading')}</div>}>
              <MapScreen
                selectedId={route.placeId}
                details={route.details}
                onSelect={(id) => navigate({ screen: 'map', placeId: id, details: false }, { replace: true })}
                onOpenDetails={(id) => navigate({ screen: 'map', placeId: id, details: true })}
                onBrowseList={() => goTo('places')}
              />
            </Suspense>
          )}
          {route.screen === 'user' && <ProfileScreen />}
        </div>
      </main>

      <BottomNavigation current={route.screen} onNavigate={goTo} onPreloadMap={() => void loadMapScreen()} />

      {detailPlace && <PlaceDetail place={detailPlace} onClose={closeDetails} onViewOnMap={viewOnMap} />}

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
