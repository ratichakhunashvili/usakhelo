import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './Icons';
import { useApp } from '../lib/state';

interface SheetProps {
  titleId: string;
  onClose: () => void;
  children: ReactNode;
  /** Centered dialog on wide screens is automatic; "compact" makes it narrower. */
  compact?: boolean;
  hideClose?: boolean;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Modal bottom sheet (mobile) / centered dialog (wide). Traps focus, closes on Esc or backdrop. */
export default function Sheet({ titleId, onClose, children, compact, hideClose }: SheetProps) {
  const { t } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const root = document.getElementById('root');
    root?.setAttribute('inert', '');

    const first = dialog.querySelector<HTMLElement>('[data-autofocus]') ?? dialog;
    first.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === firstEl || active === dialog)) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      root?.removeAttribute('inert');
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <div className="sheet-layer">
      <div className="sheet-backdrop" onClick={() => onClose()} aria-hidden="true" />
      <div
        ref={ref}
        className={`sheet${compact ? ' sheet--compact' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <span className="sheet-grabber" aria-hidden="true" />
        {!hideClose && (
          <button type="button" className="icon-btn sheet-close" onClick={() => onClose()} aria-label={t('place.close')}>
            <CloseIcon />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
