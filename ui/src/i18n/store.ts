import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppLocale } from '../lib/intl'

/**
 * Locale preference store — the single source of truth for the UI language.
 *
 * This Japan-focused distribution defaults to Japanese. Users can still switch
 * languages from Settings; the explicit choice is persisted on this device.
 *
 * Persistence mirrors the workspace store's loud-fail contract (see
 * tabs/store.ts): a `version` bump clears stored state, NO migrate function.
 * Version 2 intentionally resets the previous English-by-default state so an
 * existing installation receives the new Japanese default after upgrading.
 *
 * This store stays pure (no i18next / intl imports) so the wiring is strictly
 * one-directional: i18n/index.ts subscribes here and applies the side effects.
 */

interface LocaleStore {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: 'ja',
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'openalice.locale.v1',
      version: 2,
    },
  ),
)

/** Persisted locale at boot (zustand persist rehydrates localStorage sync). */
export function readInitialLocale(): AppLocale {
  return useLocaleStore.getState().locale
}
