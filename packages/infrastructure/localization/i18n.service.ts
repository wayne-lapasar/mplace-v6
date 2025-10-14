// * Internationalization service

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { DEFAULT_LOCALE, type Locale, SUPPORTED_LOCALES, type TranslationParams } from './types';

interface TranslationTree {
  [key: string]: string | TranslationTree;
}

export class I18nService {
  private translations: Map<Locale, TranslationTree> = new Map();

  constructor(private readonly defaultLocale: Locale = DEFAULT_LOCALE) {}

  // * Load all translation files from the translations directory
  async loadTranslations(translationsPath: string): Promise<void> {
    for (const locale of Object.keys(SUPPORTED_LOCALES) as Locale[]) {
      const localePath = join(translationsPath, locale);

      try {
        const files = await readdir(localePath);
        const localeTranslations: TranslationTree = {};

        for (const file of files) {
          if (!file.endsWith('.json')) continue;

          const filePath = join(localePath, file);
          const content = await readFile(filePath, 'utf-8');
          const namespace = file.replace('.json', '');
          const translations = JSON.parse(content);

          localeTranslations[namespace] = translations;
        }

        this.translations.set(locale, localeTranslations);
      } catch (error) {
        console.warn(`Failed to load translations for locale ${locale}:`, error);
      }
    }
  }

  // * Load translations manually (for testing or custom use cases)
  loadTranslationsManually(locale: Locale, translations: TranslationTree): void {
    this.translations.set(locale, translations);
  }

  // * Translate a key with optional parameters and pluralization
  translate(key: string, locale: Locale = this.defaultLocale, params?: TranslationParams): string {
    let translation = this.getNestedTranslation(key, locale);

    // ? Fallback to default locale if translation not found
    if (translation === key && locale !== this.defaultLocale) {
      translation = this.getNestedTranslation(key, this.defaultLocale);
    }

    // * Handle pluralization
    if (params?.count !== undefined && typeof params.count === 'number') {
      translation = this.handlePluralization(translation, params.count, locale);
    }

    // * Replace parameters
    if (params) {
      translation = this.replaceParams(translation, params);
    }

    return translation;
  }

  // * Alias for translate method (shorter syntax)
  t(key: string, locale: Locale = this.defaultLocale, params?: TranslationParams): string {
    return this.translate(key, locale, params);
  }

  // * Check if a locale is supported
  isLocaleSupported(locale: string): locale is Locale {
    return locale in SUPPORTED_LOCALES;
  }

  // * Get locale metadata
  getLocaleMetadata(locale: Locale) {
    return SUPPORTED_LOCALES[locale];
  }

  // * Get all supported locales
  getSupportedLocales(): Locale[] {
    return Object.keys(SUPPORTED_LOCALES) as Locale[];
  }

  // * Get nested translation using dot notation (e.g., "users.errors.notFound")
  private getNestedTranslation(key: string, locale: Locale): string {
    const localeTranslations = this.translations.get(locale);
    if (!localeTranslations) return key;

    const keys = key.split('.');
    let current: TranslationTree | string = localeTranslations;

    for (const k of keys) {
      if (typeof current === 'string') return key;
      current = current[k];
      if (current === undefined) return key;
    }

    return typeof current === 'string' ? current : key;
  }

  // * Handle pluralization based on count
  private handlePluralization(translation: string, count: number, locale: Locale): string {
    // * For languages without pluralization (e.g., CJK languages), return as-is
    if (locale === 'ms') {
      // * Malay doesn't have complex pluralization
      return translation;
    }

    // * English pluralization rules
    if (count === 1) {
      return translation;
    }

    // ? Look for plural form (key_plural)
    // ? This is a simplified implementation; for production, consider ICU MessageFormat
    return translation;
  }

  // * Replace parameters in translation string
  private replaceParams(text: string, params: TranslationParams): string {
    return Object.entries(params).reduce((result, [key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      return result.replace(regex, String(value));
    }, text);
  }

  // * Format number according to locale
  formatNumber(value: number, locale: Locale = this.defaultLocale): string {
    return new Intl.NumberFormat(locale).format(value);
  }

  // * Format currency according to locale
  formatCurrency(value: number, currency: string = 'MYR', locale: Locale = this.defaultLocale): string {
    return new Intl.NumberFormat(locale, {
      currency,
      style: 'currency',
    }).format(value);
  }

  // * Format date according to locale
  formatDate(date: Date, locale: Locale = this.defaultLocale, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(locale, options).format(date);
  }

  // * Format relative time (e.g., "2 hours ago")
  formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, locale: Locale = this.defaultLocale): string {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, unit);
  }
}