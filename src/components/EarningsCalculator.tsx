import { useId, useState, type FormEvent } from 'react';
import { ChevronDownIcon } from './Icons';
import { useApp } from '../lib/state';
import type { Key } from '../lib/i18n';

interface MaterialOption {
  id: string;
  label: Key;
  /** Illustrative GEL per kg. */
  rate: number;
}

// Glass is the real focus of the prototype; the others are illustrative extras so the selector is meaningful.
const MATERIALS: MaterialOption[] = [
  { id: 'glass', label: 'mat.glass', rate: 5 },
  { id: 'plastic', label: 'mat.plastic', rate: 1.2 },
  { id: 'metal', label: 'mat.metal', rate: 3 },
  { id: 'paper', label: 'mat.paper', rate: 0.4 },
];

const MAX_KG = 10000;

type Parsed = { ok: true; kg: number } | { ok: false; error: Key };

/** Accepts "2", "2.5", "2,5", ".5". Rejects empty, text, zero, negative and absurd values. */
export function parseWeight(raw: string): Parsed {
  let s = raw.trim().replace(/\s+/g, '');
  if (s === '') return { ok: false, error: 'err.empty' };
  if (!s.includes('.')) s = s.replace(',', '.');
  if (/^-\d*\.?\d+$/.test(s)) return { ok: false, error: 'err.negative' };
  if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return { ok: false, error: 'err.nan' };
  const kg = Number(s);
  if (!Number.isFinite(kg)) return { ok: false, error: 'err.nan' };
  if (kg === 0) return { ok: false, error: 'err.zero' };
  if (kg > MAX_KG) return { ok: false, error: 'err.max' };
  return { ok: true, kg };
}

const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const weight = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });

export default function EarningsCalculator() {
  const { t } = useApp();
  const ids = useId();
  const [materialId, setMaterialId] = useState('glass');
  const [text, setText] = useState('1');
  const [checkedKg, setCheckedKg] = useState<number | null>(1);
  const [error, setError] = useState<Key | null>(null);

  const material = MATERIALS.find((m) => m.id === materialId) ?? MATERIALS[0];
  // Work in cents to avoid floating point surprises like 0.1 × 3.
  const cents = checkedKg === null ? null : Math.round(checkedKg * material.rate * 100);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseWeight(text);
    if (parsed.ok) {
      setError(null);
      setCheckedKg(parsed.kg);
    } else {
      setError(parsed.error);
      setCheckedKg(null);
    }
  };

  return (
    <section className="card calc" aria-labelledby={`${ids}-title`}>
      <h2 id={`${ids}-title`} className="card-title">
        {t('user.calc.title')}
      </h2>

      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor={`${ids}-material`}>{t('user.calc.material')}</label>
          <div className="select select--field">
            <select id={`${ids}-material`} value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
              {MATERIALS.map((m) => (
                <option key={m.id} value={m.id}>
                  {t(m.label)}
                </option>
              ))}
            </select>
            <ChevronDownIcon size={16} className="select__chev" />
          </div>
        </div>

        <p className="rate-row">
          <span>{t('user.calc.rate')}</span>
          <strong>
            {money.format(material.rate)} {t('currency')}/kg
          </strong>
        </p>

        <div className="field">
          <label htmlFor={`${ids}-weight`}>{t('user.calc.weight')}</label>
          <div className={`input-wrap${error ? ' has-error' : ''}`}>
            <input
              id={`${ids}-weight`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={text}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${ids}-error` : undefined}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError(null);
              }}
            />
            <span className="input-unit" aria-hidden="true">
              kg
            </span>
          </div>
          {error && (
            <p id={`${ids}-error`} className="field-error" role="alert">
              {t(error)}
            </p>
          )}
        </div>

        <button type="submit" className="btn btn--primary btn--block">
          {t('user.calc.check')}
        </button>
      </form>

      <div className="calc-result" aria-live="polite">
        {cents !== null && checkedKg !== null && (
          <>
            <p className="label">{t('user.calc.result', { kg: weight.format(checkedKg) })}</p>
            <p className="price price--xl">
              <span className="price__num">{money.format(cents / 100)}</span>
              <span className="price__unit">{t('currency')}</span>
            </p>
            <p className="calc-result__note">{t('user.calc.resultNote')}</p>
          </>
        )}
      </div>
    </section>
  );
}
