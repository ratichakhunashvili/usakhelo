import Sheet from './Sheet';
import SaveButton from './SaveButton';
import { BottleIcon, InfoIcon, PinIcon, StarIcon } from './Icons';
import { DISTANCE_ORIGIN, HIGHEST_PAYOUT_ID, distanceKm, formatRate, type Place } from '../data/places';
import { useApp } from '../lib/state';

interface Props {
  place: Place;
  onClose: () => void;
  onViewOnMap: (id: string) => void;
}

/** The single place-detail view, opened from both the Places and Map screens. */
export default function PlaceDetail({ place, onClose, onViewOnMap }: Props) {
  const { t } = useApp();
  const titleId = 'place-detail-title';
  const highest = place.id === HIGHEST_PAYOUT_ID;

  return (
    <Sheet titleId={titleId} onClose={onClose}>
      <div className="detail">
        <div className="detail__head">
          <span className="tile tile--lg" aria-hidden="true">
            <BottleIcon size={26} />
          </span>
          <div>
            <h2 id={titleId} className="detail__name">
              {place.name}
            </h2>
            <p className="detail__addr">
              <PinIcon size={15} />
              {place.address}, {place.neighborhood}
            </p>
          </div>
        </div>

        <div className="detail__payout">
          <div>
            <p className="label">{t('place.payout')}</p>
            <p className="price price--xl">
              <span className="price__num">{formatRate(place.payoutPerKg)}</span>
              <span className="price__unit">{t('place.unit')}</span>
            </p>
          </div>
          {highest && (
            <span className="badge badge--top badge--static">
              <StarIcon size={13} />
              {t('place.highest')}
            </span>
          )}
        </div>

        <dl className="facts">
          <div>
            <dt>{t('place.material')}</dt>
            <dd>{t('place.material.glass')}</dd>
          </div>
          <div>
            <dt>{t('place.rating')}</dt>
            <dd>
              <StarIcon size={14} /> {t('place.ratingValue', { n: place.rating.toFixed(1) })}
            </dd>
          </div>
          <div>
            <dt>{t('place.distance')}</dt>
            <dd>
              {t('place.distanceValue', { n: distanceKm(place).toFixed(1) })}
              <span className="facts__note">{t('place.distanceNote', { origin: DISTANCE_ORIGIN.name })}</span>
            </dd>
          </div>
        </dl>

        <p className="note">
          <InfoIcon size={16} />
          {t('place.note')}
        </p>

        <div className="detail__actions">
          <SaveButton place={place} variant="full" />
          <button type="button" className="btn btn--primary" data-autofocus onClick={() => onViewOnMap(place.id)}>
            <PinIcon size={18} />
            {t('place.viewMap')}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
