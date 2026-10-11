import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { PLACES } from '../data/places';
import { translate, type Key, type Lang } from './i18n';
import { readStorage, writeStorage } from './storage';

const SAVED_KEY = 'akakis-samushao:saved:v1';
const LANG_KEY = 'akakis-samushao:lang:v1';
/** Seed state so the first visit shows what "saved" looks like. */
const DEFAULT_SAVED = ['didube-glass-yard', 'vake-bottle-point'];

const validIds = new Set(PLACES.map((p) => p.id));

function loadSaved(): string[] {
  const raw = readStorage(SAVED_KEY);
  if (raw === null) return DEFAULT_SAVED;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === 'string' && validIds.has(id));
    }
  } catch {
    /* fall through */
  }
  return DEFAULT_SAVED;
}

function loadLang(): Lang {
  const raw = readStorage(LANG_KEY);
  return raw === 'ka' || raw === 'en' ? raw : 'en';
}

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key, vars?: Record<string, string | number>) => string;
  savedIds: ReadonlySet<string>;
  toggleSaved: (id: string) => void;
  signedIn: boolean;
  setSignedIn: (v: boolean) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadLang);
  const [saved, setSaved] = useState<string[]>(loadSaved);
  const [signedIn, setSignedIn] = useState(true);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    writeStorage(LANG_KEY, l);
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeStorage(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Keep <html lang> in sync with the chosen language.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Keep several tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SAVED_KEY) setSaved(loadSaved());
      if (e.key === LANG_KEY) setLangState(loadLang());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const savedIds = useMemo(() => new Set(saved), [saved]);
  const t = useCallback<AppState['t']>((key, vars) => translate(lang, key, vars), [lang]);

  const value = useMemo<AppState>(
    () => ({ lang, setLang, t, savedIds, toggleSaved, signedIn, setSignedIn }),
    [lang, setLang, t, savedIds, toggleSaved, signedIn],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppStateProvider');
  return v;
}
