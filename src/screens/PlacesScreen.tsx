import { useMemo, useState } from 'react';
import PlaceCard from '../components/PlaceCard';
import { BookmarkIcon, ChevronDownIcon, InfoIcon, PinIcon } from '../components/Icons';
import { PLACES, sortPlaces, type SortKey } from '../data/places';
import { useApp } from '../lib/state';
import type { Key } from '../lib/i18n';

interface Props {
  onOpen: (id: string) => void;
}

const SORTS: { key: SortKey; label: Key }[] = [
  { key: 'payout', label: 'sort.payout' },
  { key: 'distance', label: 'sort.distance' },
  { key: 'rating', label: 'sort.rating' },
];

type Filter = 'all' | 'saved';

export default function PlacesScreen({ onOpen }: Props) {
  const { t, savedIds } = useApp();
  const [sort, setSort] = useState<SortKey>('payout');
  const [filter, setFilter] = useState<Filter>('all');

  const savedCount = PLACES.filter((p) => savedIds.has(p.id)).length;

  const list = useMemo(
    () => sortPlaces(filter === 'saved' ? PLACES.filter((p) => savedIds.has(p.id)) : PLACES, sort),
    [filter, sort, savedIds],
  );

  return (
    <div className="page page--places">
      <header className="page-head">
        <div className="brand">
          <img className="brand__logo" src="/logo.png" alt="" width={36} height={36} />
          <p className="location">
            <PinIcon size={15} />
            {t('places.location')}
          </p>
        </div>
        <div className="page-head__row">
          <h1 className="page-title">{t('places.title')}</h1>
          <p className="count-pill" aria-live="polite">
            {t('places.count', { n: savedCount, total: PLACES.length })}
          </p>
        </div>
        <p className="page-sub">{t('places.subtitle')}</p>

        <div className="controls">
          <div className="segmented" role="group" aria-label={t('places.filter')}>
            {(['all', 'saved'] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={filter === f ? 'is-active' : ''}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {t(f === 'all' ? 'places.filter.all' : 'places.filter.saved')}
              </button>
            ))}
          </div>
          <label className="select">
            <span className="sr-only">{t('places.sort')}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {t(s.label)}
                </option>
              ))}
            </select>
            <ChevronDownIcon size={16} className="select__chev" />
          </label>
        </div>
      </header>

      {list.length > 0 ? (
        <ul className="card-grid">
          {list.map((p) => (
            <li key={p.id}>
              <PlaceCard place={p} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty">
          <span className="empty__icon" aria-hidden="true">
            <BookmarkIcon size={26} />
          </span>
          <h2>{t('places.empty.title')}</h2>
          <p>{t('places.empty.body')}</p>
          <button type="button" className="btn btn--primary" onClick={() => setFilter('all')}>
            {t('places.empty.cta')}
          </button>
        </div>
      )}

      <p className="note disclaimer">
        <InfoIcon size={16} />
        {t('places.disclaimer')}
      </p>
    </div>
  );
}
