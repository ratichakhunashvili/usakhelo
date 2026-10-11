import SaveButton from './SaveButton';
import { CloseIcon, InfoIcon, StarIcon } from './Icons';
import { HIGHEST_PAYOUT_ID, distanceKm, formatRate, type Place } from '../data/places';
import { useApp } from '../lib/state';

interface Props {
  place: Place;
  onClose: () => void;
  onViewDetails: (id: string) => void;
}

/** Bottom sheet on mobile, side panel on wide screens (layout is pure CSS). */
export default function SelectedPlacePanel({ place, onClose, onViewDetails }: Props) {
  const { t } = useApp();
  const highest = place.id === HIGHEST_PAYOUT_ID;

  return (
    <section className="selected" aria-label={t('map.selected')} tabIndex={-1}>
      <div className="selected__top">
        <div className="selected__id">
          {highest && (
            <span className="badge badge--top badge--static">
              <StarIcon size={13} />
              {t('place.highest')}
            </span>
          )}
          <h2 className="selected__name">{place.name}</h2>
          <p className="selected__addr">
            {place.address} · {place.neighborhood}
          </p>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label={t('place.close')}>
          <CloseIcon />
        </button>
      </div>

      <div className="selected__stats">
        <p className="price price--lg">
          <span className="price__num">{formatRate(place.payoutPerKg)}</span>
          <span className="price__unit">{t('place.unit')}</span>
        </p>
        <div className="selected__meta">
          <span className="chip">{t('place.material.glass')}</span>
          <ul className="meta">
            <li className="meta__item">
              <StarIcon size={14} />
              <span className="sr-only">{t('place.rating')}: </span>
              {place.rating.toFixed(1)}
            </li>
            <li className="meta__item">
              <span className="sr-only">{t('place.distance')}: </span>
              {t('place.distanceValue', { n: distanceKm(place).toFixed(1) })}
            </li>
          </ul>
        </div>
      </div>

      <div className="selected__actions">
        <SaveButton place={place} variant="full" />
        <button type="button" className="btn btn--primary" onClick={() => onViewDetails(place.id)}>
          {t('place.viewDetails')}
        </button>
      </div>
      <p className="note note--tight">
        <InfoIcon size={14} />
        {t('place.note')}
      </p>
    </section>
  );
}
