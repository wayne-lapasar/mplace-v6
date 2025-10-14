// * I18n context for request-level locale management

import { AsyncLocalStorage } from 'node:async_hooks';

import type { Locale } from './types';

interface I18nContext {
  locale: Locale;
}

// * AsyncLocalStorage for maintaining locale across async operations
const i18nStorage = new AsyncLocalStorage<I18nContext>();

export class I18nContextManager {
  // * Run code with a specific locale context
  static run<T>(locale: Locale, callback: () => T): T {
    return i18nStorage.run({ locale }, callback);
  }

  // * Get current locale from context
  static getLocale(): Locale | undefined {
    return i18nStorage.getStore()?.locale;
  }

  // * Set locale in current context
  static setLocale(locale: Locale): void {
    const store = i18nStorage.getStore();
    if (store) {
      store.locale = locale;
    }
  }
}