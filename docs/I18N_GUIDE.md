# Internationalization (i18n)

Modern internationalization implementation for the Lapasar B2B eCommerce Platform.

## Features

- ✅ **Nested Translation Keys**: Organize translations hierarchically (e.g., `users.errors.notFound`)
- ✅ **Parameter Interpolation**: Dynamic values in translations (e.g., `{name}`, `{count}`)
- ✅ **Locale Detection**: Automatic detection from headers, query params, or user preferences
- ✅ **Fallback Chain**: Graceful fallback from requested locale → default locale → key
- ✅ **Request Context**: AsyncLocalStorage for maintaining locale across async operations
- ✅ **Localized Errors**: Automatic error message translation based on request locale
- ✅ **Number/Date Formatting**: Built-in Intl API integration for locale-specific formatting
- ✅ **RTL Support**: Metadata for right-to-left language support

## Supported Locales

- `en` - English (default)
- `ms` - Bahasa Melayu (Malay)

## Quick Start

### 1. Configuration

Set default locale in `.env`:

```env
DEFAULT_LOCALE=en
```

### 2. Using in API Requests

#### Via Accept-Language Header
```bash
curl -H "Accept-Language: ms" http://localhost:3000/api/v1/users/login
```

#### Via Query Parameter
```bash
curl http://localhost:3000/api/v1/users/login?lang=ms
```

### 3. Translation File Structure

```
packages/infrastructure/localization/translations/
├── en/
│   ├── common.json      # Common translations
│   ├── errors.json      # Error messages
│   └── users.json       # User-specific translations
└── ms/
    ├── common.json
    ├── errors.json
    └── users.json
```

### 4. Translation Format

**English** (`en/users.json`):
```json
{
  "register": {
    "success": "User registered successfully"
  },
  "errors": {
    "userNotFound": "User with ID {userId} not found",
    "duplicateEmail": "Email {email} is already registered"
  }
}
```

**Malay** (`ms/users.json`):
```json
{
  "register": {
    "success": "Pengguna berjaya didaftarkan"
  },
  "errors": {
    "userNotFound": "Pengguna dengan ID {userId} tidak dijumpai",
    "duplicateEmail": "E-mel {email} sudah didaftarkan"
  }
}
```

## Usage Examples

### In Domain Errors

```typescript
import { LocalizedError } from '@lapasar/shared-kernel';

export class UserNotFoundError extends LocalizedError {
  constructor(userId: string) {
    super(
      `User with ID "${userId}" not found`,  // ! Fallback message
      'USER_NOT_FOUND',                       // * Error code
      404,                                    // * HTTP status
      'users.errors.userNotFound',            // * Translation key
      { userId }                              // * Parameters
    );
  }
}
```

### Direct Translation

```typescript
// * In a use case or service
const i18nService = container.i18nService;
const locale = I18nContextManager.getLocale() || 'en';

const message = i18nService.translate(
  'users.register.success',
  locale
);
```

### With Parameters

```typescript
const message = i18nService.translate(
  'users.errors.userNotFound',
  locale,
  { userId: '123' }
);
// * English: "User with ID 123 not found"
// * Malay: "Pengguna dengan ID 123 tidak dijumpai"
```

### Number Formatting

```typescript
const price = i18nService.formatNumber(1000.50, 'ms');
// * Output: "1,000.5"

const currency = i18nService.formatCurrency(1000.50, 'MYR', 'ms');
// * Output: "RM1,000.50"
```

### Date Formatting

```typescript
const date = new Date('2025-01-15');

const formatted = i18nService.formatDate(date, 'ms', {
  dateStyle: 'long'
});
// * Output: "15 Januari 2025"
```

### Relative Time

```typescript
const relativeTime = i18nService.formatRelativeTime(-2, 'hours', 'en');
// * Output: "2 hours ago"
```

## Locale Detection Priority

The middleware detects locale in the following order:

1. **Query Parameter**: `?lang=ms` (highest priority)
2. **Accept-Language Header**: Standard HTTP header
3. **User Preference**: From JWT token (future feature)
4. **Default Locale**: From environment configuration

## Adding New Locales

### 1. Update Types

Add new locale to `types.ts`:

```typescript
export type Locale = 'en' | 'ms' | 'zh' | 'ta';

export const SUPPORTED_LOCALES: Record<Locale, LocaleMetadata> = {
  // ... existing locales
  zh: {
    code: 'zh',
    direction: 'ltr',
    name: 'Chinese',
    nativeName: '中文',
  },
};
```

### 2. Create Translation Files

Create directory structure:
```
translations/zh/
├── common.json
├── errors.json
└── users.json
```

### 3. Update Environment

```env
DEFAULT_LOCALE=en
SUPPORTED_LOCALES=en,ms,zh,ta
```

## Best Practices

### ✅ DO
- Use nested keys for better organization (`users.errors.notFound`)
- Always provide fallback English translations
- Use `LocalizedError` for domain errors
- Keep translation keys descriptive
- Use parameters for dynamic values

### ❌ DON'T
- Don't hardcode translated strings in code
- Don't use long translation keys (keep under 50 chars)
- Don't duplicate translations across namespaces
- Don't forget to handle pluralization for languages that need it

## Testing Translations

### Unit Test Example

```typescript
import { I18nService } from '@lapasar/infrastructure';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    service = new I18nService('en');
    service.loadTranslationsManually('en', {
      users: {
        errors: {
          notFound: 'User {userId} not found',
        },
      },
    });
  });

  it('should translate with parameters', () => {
    const result = service.translate(
      'users.errors.notFound',
      'en',
      { userId: '123' }
    );
    expect(result).toBe('User 123 not found');
  });
});
```

## Architecture

```
┌─────────────────┐
│  HTTP Request   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ i18n Middleware │ ◄── Extract locale from headers/query
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AsyncLocalStorage│ ◄── Store locale in context
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Controller    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Use Case      │ ◄── Throw LocalizedError
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Error Middleware │ ◄── Translate error using I18nService
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ JSON Response   │ ◄── Translated message
└─────────────────┘
```

## Future Enhancements

- [ ] ICU MessageFormat for advanced pluralization
- [ ] Translation validation script
- [ ] Missing translation warnings in dev mode
- [ ] Hot-reload for translation files
- [ ] Type-safe translation keys (TypeScript)
- [ ] Translation management UI
- [ ] Export/import for external translation services

## Contributing

When adding new translations:
1. Update both `en` and `ms` files
2. Keep keys consistent across locales
3. Test with different locales
4. Update this documentation if needed