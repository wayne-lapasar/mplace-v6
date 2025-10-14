// * Middleware to extract and set locale from request

import type { Context, MiddlewareHandler } from 'hono';

import { DEFAULT_LOCALE, I18nContextManager, I18nService, Locale } from '@lapasar/infrastructure/localization';


export function i18nMiddleware(i18nService: I18nService): MiddlewareHandler {
  return async (c, next) => {
    // * Extract locale from multiple sources (in order of priority)
    const locale = extractLocale(c, i18nService);

    // * Set locale in async context
    await I18nContextManager.run(locale, async () => {
      // * Make locale available in context
      c.set('locale', locale);
      c.set('i18n', i18nService);
      await next();
    });
  };
}

// * Extract locale from request headers, query params, or use default
function extractLocale(c: Context, i18nService: I18nService): Locale {
  // ! Priority 1: Query parameter (?lang=ms)
  const queryLocale = c.req.query('lang');
  if (queryLocale && i18nService.isLocaleSupported(queryLocale)) {
    return queryLocale as Locale;
  }

  // ! Priority 2: Accept-Language header
  const acceptLanguage = c.req.header('Accept-Language');
  if (acceptLanguage) {
    const locale = parseAcceptLanguage(acceptLanguage, i18nService);
    if (locale) return locale;
  }

  // ! Priority 3: User preference from JWT (if authenticated)
  // ? This can be implemented later when user preferences are stored

  // ! Priority 4: Default locale
  return DEFAULT_LOCALE;
}

// * Parse Accept-Language header and return best match
function parseAcceptLanguage(header: string, i18nService: I18nService): Locale | null {
  // * Parse: "en-US,en;q=0.9,ms;q=0.8" -> [{locale: 'en-US', q: 1}, ...]
  const locales = header
    .split(',')
    .map((item) => {
      const [locale, qValue] = item.trim().split(';');
      const q = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;
      return { locale: locale.toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q); // * Sort by quality value (highest first)

  // * Find first supported locale
  for (const { locale } of locales) {
    // * Extract language code (en-US -> en)
    const langCode = locale.split('-')[0];
    if (i18nService.isLocaleSupported(langCode)) {
      return langCode as Locale;
    }
  }

  return null;
}
