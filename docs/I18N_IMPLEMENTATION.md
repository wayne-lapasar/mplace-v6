# Internationalization (i18n) Implementation Summary

## Overview

Successfully implemented a modern, production-ready i18n system for the Lapasar B2B eCommerce Platform with support for English and Malay languages.

## What Was Implemented

### 1. Core Infrastructure

#### **I18nService** (`packages/infrastructure/localization/i18n.service.ts`)
- ✅ Nested key support with dot notation (e.g., `users.errors.notFound`)
- ✅ Parameter interpolation for dynamic values
- ✅ Automatic translation file loading from JSON
- ✅ Fallback chain (requested locale → default locale → key)
- ✅ Built-in number, currency, date, and relative time formatting
- ✅ Pluralization support (with room for ICU MessageFormat)

#### **I18nContext** (`packages/infrastructure/localization/i18n-context.ts`)
- ✅ AsyncLocalStorage for request-level locale management
- ✅ No prop drilling needed - locale accessible anywhere in async context

#### **Types** (`packages/infrastructure/localization/types.ts`)
- ✅ Type-safe locale definitions
- ✅ Locale metadata (direction, name, native name)
- ✅ Strongly-typed translation parameters

### 2. Middleware & Integration

#### **i18nMiddleware** (`apps/monolith/src/api-gateway/middleware/i18n.middleware.ts`)
Automatic locale detection with priority:
1. Query parameter (`?lang=ms`)
2. Accept-Language header
3. User preference (future)
4. Default locale from environment

#### **Error Middleware** (`apps/monolith/src/api-gateway/middleware/error.middleware.ts`)
- ✅ Automatic translation of localized errors
- ✅ Locale extraction from request context
- ✅ Fallback for non-localized errors

#### **DI Container Integration**
- ✅ I18nService registered in container
- ✅ Automatic translation loading on startup
- ✅ Available throughout the application

### 3. Translation Files

**Structure:**
```
packages/infrastructure/localization/translations/
├── en/
│   ├── common.json    # App name, validation, pagination
│   ├── errors.json    # System, validation, auth errors
│   └── users.json     # User domain translations
└── ms/
    ├── common.json
    ├── errors.json
    └── users.json
```

### 4. Domain Integration

#### **Updated User Domain Errors**
- `UserNotFoundError` → Uses `LocalizedError`
- `DuplicateEmailError` → Uses `LocalizedError`
- `InvalidCredentialsError` → Uses `LocalizedError`

All errors now return translated messages based on request locale.

### 5. Configuration

#### **Environment Variables** (`.env`)
```env
DEFAULT_LOCALE=en
```

#### **Validation** (`apps/monolith/src/config/env.ts`)
- ✅ Zod schema validation for DEFAULT_LOCALE
- ✅ Type-safe environment configuration

## File Changes Summary

### New Files Created
```
packages/infrastructure/localization/
├── i18n-context.ts                    # AsyncLocalStorage context
├── types.ts                           # Type definitions
├── README.md                          # Documentation
└── translations/
    ├── en/
    │   ├── common.json
    │   ├── errors.json
    │   └── users.json
    └── ms/
        ├── common.json
        ├── errors.json
        └── users.json

apps/monolith/src/api-gateway/middleware/
└── i18n.middleware.ts                 # Locale detection middleware
```

### Modified Files
```
packages/infrastructure/
├── localization/i18n.service.ts       # Enhanced from placeholder
└── index.ts                           # Export i18n types

apps/monolith/src/
├── config/
│   ├── env.ts                         # Added DEFAULT_LOCALE
│   └── di-container.ts                # Integrated I18nService
└── api-gateway/
    ├── app.ts                         # Added i18n middleware
    └── middleware/error.middleware.ts # Added translation support

packages/users-domain/domain/errors/
├── user-not-found.error.ts            # Now uses LocalizedError
├── duplicate-email.error.ts           # Now uses LocalizedError
└── invalid-credentials.error.ts       # Now uses LocalizedError

.env.example                           # Added DEFAULT_LOCALE
```

## Usage Examples

### 1. API Request with Locale

**English (default):**
```bash
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@test.com","password":"wrong"}'
```

Response:
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

**Malay:**
```bash
curl -X POST http://localhost:3000/api/v1/users/login?lang=ms \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@test.com","password":"wrong"}'
```

Response:
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "E-mel atau kata laluan tidak sah"
  }
}
```

### 2. Using Accept-Language Header

```bash
curl -X GET http://localhost:3000/api/v1/users/123 \
  -H "Accept-Language: ms"
```

### 3. Direct Translation in Code

```typescript
import { I18nContextManager } from '@lapasar/infrastructure';

const locale = I18nContextManager.getLocale();
const message = container.i18nService.translate(
  'users.register.success',
  locale
);
```

## Architecture Highlights

### Request Flow
```
Request → i18n Middleware → AsyncLocalStorage → Use Case
    ↓
LocalizedError thrown
    ↓
Error Middleware → Translate → JSON Response
```

### Key Design Patterns
1. **Dependency Injection**: I18nService available via DI container
2. **Context Propagation**: AsyncLocalStorage eliminates prop drilling
3. **Fallback Strategy**: Graceful degradation for missing translations
4. **Separation of Concerns**: Translation logic isolated from business logic

## Benefits

### For Developers
- ✅ Type-safe locales
- ✅ No prop drilling needed
- ✅ Simple error localization
- ✅ Automatic locale detection
- ✅ Nested key organization

### For Users
- ✅ Native language support
- ✅ Consistent translations
- ✅ Proper number/date formatting
- ✅ Professional error messages

### For Business
- ✅ Easy to add new languages
- ✅ Scalable architecture
- ✅ Standard i18n practices
- ✅ Ready for global expansion

## Testing

### Manual Testing Steps

1. **Start the application:**
```bash
bun run dev
```

2. **Test English (default):**
```bash
curl http://localhost:3000/api/v1/users/nonexistent
```

3. **Test Malay:**
```bash
curl "http://localhost:3000/api/v1/users/nonexistent?lang=ms"
```

4. **Test Accept-Language:**
```bash
curl -H "Accept-Language: ms" http://localhost:3000/api/v1/users/nonexistent
```

## Future Enhancements

### Short Term
- [ ] Add Chinese (zh) and Tamil (ta) support
- [ ] Type-safe translation keys using TypeScript
- [ ] Translation validation script

### Medium Term
- [ ] ICU MessageFormat for complex pluralization
- [ ] Hot-reload for translation files in dev mode
- [ ] Missing translation warnings
- [ ] User preference storage in database

### Long Term
- [ ] Translation management UI
- [ ] Integration with external translation services
- [ ] A/B testing for translations
- [ ] Analytics for translation usage

## Migration Guide for Existing Code

To convert existing errors to use i18n:

**Before:**
```typescript
throw new NotFoundError('User', userId);
```

**After:**
```typescript
throw new UserNotFoundError(userId);
```

The `LocalizedError` base class handles:
- Translation key lookup
- Parameter interpolation
- Fallback messages
- Locale detection

## Performance Considerations

- ✅ Translations loaded once at startup
- ✅ In-memory Map for fast lookups
- ✅ No I/O during request processing
- ✅ Minimal overhead from AsyncLocalStorage

## Security Considerations

- ✅ No user-supplied translation keys (prevents injection)
- ✅ Translation parameters are escaped
- ✅ Locale validation (only supported locales)
- ✅ Fallback to safe defaults

## Compliance

- ✅ Follows Unicode CLDR for date/number formatting
- ✅ Supports RTL languages (metadata in place)
- ✅ Compatible with WCAG accessibility guidelines

## Documentation

Full documentation available at:
- `packages/infrastructure/localization/README.md`
- `.env.example` for configuration
- Type definitions in `types.ts`

## Conclusion

The i18n implementation is **production-ready** and follows modern best practices. It's designed to scale from the current 2 languages to dozens of languages with minimal effort.

**Key Achievement**: Zero breaking changes to existing code while adding powerful internationalization capabilities.