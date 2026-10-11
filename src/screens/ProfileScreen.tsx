import { useState } from 'react';
import EarningsCalculator from '../components/EarningsCalculator';
import Sheet from '../components/Sheet';
import { CheckIcon, ChevronRightIcon, GlobeIcon, LogoutIcon, PinIcon, UserIcon } from '../components/Icons';
import { useApp } from '../lib/state';
import type { Lang } from '../lib/i18n';

type Dialog = null | 'language' | 'logout';

export default function ProfileScreen() {
  const { t, lang, setLang, signedIn, setSignedIn } = useApp();
  const [dialog, setDialog] = useState<Dialog>(null);

  if (!signedIn) {
    return (
      <div className="page page--user">
        <h1 className="sr-only">{t('user.title')}</h1>
        <div className="empty">
          <span className="empty__icon" aria-hidden="true">
            <UserIcon size={26} />
          </span>
          <h2>{t('out.title')}</h2>
          <p>{t('out.body')}</p>
          <button type="button" className="btn btn--primary" onClick={() => setSignedIn(true)}>
            {t('out.cta')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--user">
      <h1 className="sr-only">{t('user.title')}</h1>

      <header className="profile">
        <span className="avatar" aria-hidden="true">
          NB
        </span>
        <div>
          <p className="profile__name">Nino Beridze</p>
          <p className="location">
            <PinIcon size={15} />
            {t('user.location')}
          </p>
        </div>
      </header>

      <section className="balance" aria-label={t('user.balance')}>
        <p className="balance__label">{t('user.balance')}</p>
        <p className="price price--hero">
          <span className="price__num">25.00</span>
          <span className="price__unit">{t('currency')}</span>
        </p>
        <p className="balance__note">{t('user.balanceNote')}</p>
      </section>

      <EarningsCalculator />

      <section className="card settings" aria-labelledby="settings-title">
        <h2 id="settings-title" className="sr-only">
          {t('settings.title')}
        </h2>
        <button type="button" className="row" onClick={() => setDialog('language')}>
          <GlobeIcon size={20} />
          <span className="row__label">{t('settings.language')}</span>
          <span className="row__value">{t(lang === 'en' ? 'lang.en' : 'lang.ka')}</span>
          <ChevronRightIcon size={18} />
        </button>
        <button type="button" className="row" onClick={() => setDialog('logout')}>
          <LogoutIcon size={20} />
          <span className="row__label">{t('settings.logout')}</span>
          <ChevronRightIcon size={18} />
        </button>
      </section>

      {dialog === 'language' && (
        <Sheet titleId="lang-title" onClose={() => setDialog(null)} compact>
          <div className="dialog">
            <h2 id="lang-title" className="dialog__title">
              {t('lang.title')}
            </h2>
            <div role="radiogroup" aria-labelledby="lang-title" className="options">
              {(['en', 'ka'] as Lang[]).map((l, i) => (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={lang === l}
                  className={`option${lang === l ? ' is-selected' : ''}`}
                  data-autofocus={i === 0 ? '' : undefined}
                  lang={l}
                  onClick={() => {
                    setLang(l);
                    setDialog(null);
                  }}
                >
                  <span>{t(l === 'en' ? 'lang.en' : 'lang.ka')}</span>
                  {lang === l && <CheckIcon size={18} />}
                </button>
              ))}
            </div>
          </div>
        </Sheet>
      )}

      {dialog === 'logout' && (
        <Sheet titleId="logout-title" onClose={() => setDialog(null)} compact>
          <div className="dialog">
            <h2 id="logout-title" className="dialog__title">
              {t('logout.title')}
            </h2>
            <p className="dialog__body">{t('logout.body')}</p>
            <div className="dialog__actions">
              <button type="button" className="btn btn--ghost" data-autofocus onClick={() => setDialog(null)}>
                {t('logout.cancel')}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  setSignedIn(false);
                  setDialog(null);
                }}
              >
                {t('logout.confirm')}
              </button>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}
