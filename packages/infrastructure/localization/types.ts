// * Type definitions for i18n

export type Locale = 'en' | 'ms';

export interface TranslationParams {
  [key: string]: string | number;
}

export interface LocaleMetadata {
  code: Locale;
  direction: 'ltr' | 'rtl';
  name: string;
  nativeName: string;
}

export interface PluralRules {
  count: number;
}

export const SUPPORTED_LOCALES: Record<Locale, LocaleMetadata> = {
  en: {
    code: 'en',
    direction: 'ltr',
    name: 'English',
    nativeName: 'English',
  },
  ms: {
    code: 'ms',
    direction: 'ltr',
    name: 'Malay',
    nativeName: 'Bahasa Melayu',
  },
};

export const DEFAULT_LOCALE: Locale = 'en';