/**
 * P15: the locale provider.
 *
 * ADR-006: no user-visible string is written inline in a component. Every one is fetched through
 * `t`, which resolves against the generated catalogues first and the hand-authored interface
 * catalogue second.
 *
 * A missing key is returned as the key itself rather than as an empty string. A blank label hides
 * the fault; a visible key names it, and the completeness test then fails loudly.
 */

import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react';
import { idCatalogue } from './generated/id.ts';
import { enCatalogue, UNTRANSLATED } from './generated/en.ts';
import { uiCatalogue, type UiKey } from './ui.ts';

export type Locale = 'id' | 'en';

export { UNTRANSLATED };

function buildCatalogue(locale: Locale): Readonly<Record<string, string>> {
  const generated = locale === 'id' ? idCatalogue : enCatalogue;
  const chrome: Record<string, string> = {};
  for (const [key, value] of Object.entries(uiCatalogue)) chrome[key] = value[locale];
  return Object.freeze({ ...generated, ...chrome });
}

export const CATALOGUES: Readonly<Record<Locale, Readonly<Record<string, string>>>> = Object.freeze(
  {
    id: buildCatalogue('id'),
    en: buildCatalogue('en'),
  },
);

export interface LocaleContextValue {
  readonly locale: Locale;
  readonly t: (key: string) => string;
  readonly has: (key: string) => boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  readonly locale: Locale;
  readonly children: ReactNode;
}): ReactNode {
  const value = useMemo<LocaleContextValue>(() => {
    const catalogue = CATALOGUES[locale];
    return {
      locale,
      t: (key: string) => catalogue[key] ?? key,
      has: (key: string) => key in catalogue,
    };
  }, [locale]);

  return createElement(LocaleContext.Provider, { value }, children);
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (value === null) {
    throw new Error('useLocale was called outside a LocaleProvider.');
  }
  return value;
}

/** Look a key up without a React context, for tests and for non-component code. */
export function translate(locale: Locale, key: string): string {
  return CATALOGUES[locale][key] ?? key;
}

export type { UiKey };
