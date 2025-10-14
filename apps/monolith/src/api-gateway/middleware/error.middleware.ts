// * Global error handler

import { Context } from 'hono';

import type { I18nService, SmartLogger } from '@lapasar/infrastructure';
import { I18nContextManager } from '@lapasar/infrastructure';
import { ApplicationError, LocalizedError, ValidationError } from '@lapasar/shared-kernel';

export function errorHandler(logger: SmartLogger, i18nService: I18nService) {
  return async (error: Error, c: Context) => {
    // * Log error with SmartLogger
    await logger.logError(error, {
      correlationId: c.get('correlationId'),
      locale: c.get('locale'),
      path: c.req.path,
      method: c.req.method,
      user: c.get('user')
        ? {
            id: c.get('user').id,
            email: c.get('user').email,
          }
        : undefined,
    });

    // * Get locale from context
    const locale = c.get('locale') || I18nContextManager.getLocale();

    // * Handle localized errors
    if (error instanceof LocalizedError) {
      const translatedMessage = i18nService.translate(
        error.translationKey,
        locale,
        error.translationParams
      );

      return c.json(
        {
          error: {
            code: error.code,
            message: translatedMessage,
            ...(error instanceof ValidationError && {
              details: error.errors,
            }),
          },
        },
        error.statusCode
      );
    }

    // * Handle known application errors
    if (error instanceof ApplicationError) {
      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error instanceof ValidationError && {
              details: error.errors,
            }),
          },
        },
        error.statusCode
      );
    }

    // * Handle unknown errors
    const genericErrorMessage = i18nService.translate('errors.system.internalError', locale);
    return c.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: genericErrorMessage,
        },
      },
      500
    );
  };
}
