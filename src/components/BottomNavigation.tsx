import { BottleIcon, MapIcon, UserIcon } from './Icons';
import { useApp } from '../lib/state';
import type { Screen } from '../lib/router';
import type { Key } from '../lib/i18n';

interface Props {
  current: Screen;
  onNavigate: (screen: Screen) => void;
  onPreloadMap: () => void;
}

const ITEMS: { screen: Screen; label: Key; Icon: typeof MapIcon }[] = [
  { screen: 'places', label: 'nav.places', Icon: BottleIcon },
  { screen: 'map', label: 'nav.map', Icon: MapIcon },
  { screen: 'user', label: 'nav.user', Icon: UserIcon },
];

export default function BottomNavigation({ current, onNavigate, onPreloadMap }: Props) {
  const { t } = useApp();
  return (
    <nav className="bottom-nav" aria-label={t('nav.label')}>
      <ul>
        {ITEMS.map(({ screen, label, Icon }) => {
          const active = current === screen;
          return (
            <li key={screen}>
              <button
                type="button"
                className={`nav-item${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => onNavigate(screen)}
                onPointerEnter={screen === 'map' ? onPreloadMap : undefined}
                onFocus={screen === 'map' ? onPreloadMap : undefined}
              >
                <Icon size={22} />
                <span>{t(label)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
