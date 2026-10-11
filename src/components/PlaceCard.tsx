import { BottleIcon, StarIcon } from './Icons';
import SaveButton from './SaveButton';
import { HIGHEST_PAYOUT_ID, distanceKm, formatRate, type Place } from '../data/places';
import { useApp } from '../lib/state';

interface Props {
  place: Place;
  onOpen: (id: string) => void;
}

export default function PlaceCard({ place, onOpen }: Props) {
  const { t } = useApp();
  const highest = place.id === HIGHEST_PAYOUT_ID;

  return (
    <article className={`card place-card${highest ? ' is-highest' : ''}`}>
      {highest && (
        <span className="badge badge--top">
          <StarIcon size={13} />
          {t('place.highest')}
        </span>
      )}
      <div className="place-card__head">
        <span className="tile" aria-hidden="true">
          <BottleIcon size={22} />
        </span>
        <div className="place-card__id">
          <h3 className="place-card__name">
            {/* The button's ::after stretches over the whole card, so the card is one big tap target. */}
            <button type="button" className="card-open" onClick={() => onOpen(place.id)}>
              {place.name}
            </button>
          </h3>
          <p className="place-card__addr">
            {place.address} · {place.neighborhood}
          </p>
        </div>
        <SaveButton place={place} />
      </div>

      <div className="place-card__foot">
        <ul className="meta" aria-label={place.name}>
          <li className="chip">{t('place.material.glass')}</li>
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
        <p className="price">
          <span className="price__num">{formatRate(place.payoutPerKg)}</span>
          <span className="price__unit">{t('place.unit')}</span>
        </p>
      </div>
    </article>
  );
}
