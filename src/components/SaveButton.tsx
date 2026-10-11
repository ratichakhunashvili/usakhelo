import { BookmarkIcon } from './Icons';
import { useApp } from '../lib/state';
import type { Place } from '../data/places';

interface Props {
  place: Place;
  /** "icon": round icon-only control. "full": icon + text label. */
  variant?: 'icon' | 'full';
  className?: string;
}

/** One save control used everywhere, so state and labels can never disagree. */
export default function SaveButton({ place, variant = 'icon', className = '' }: Props) {
  const { t, savedIds, toggleSaved } = useApp();
  const saved = savedIds.has(place.id);
  const label = saved
    ? t('place.unsaveLabel', { name: place.name })
    : t('place.saveLabel', { name: place.name });

  if (variant === 'full') {
    return (
      <button
        type="button"
        className={`btn btn--ghost ${className}`}
        aria-pressed={saved}
        aria-label={label}
        onClick={() => toggleSaved(place.id)}
      >
        <BookmarkIcon filled={saved} size={18} />
        <span>{saved ? t('place.saved') : t('place.save')}</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`icon-btn save-btn ${saved ? 'is-saved' : ''} ${className}`}
      aria-pressed={saved}
      aria-label={label}
      onClick={() => toggleSaved(place.id)}
    >
      <BookmarkIcon filled={saved} />
    </button>
  );
}
