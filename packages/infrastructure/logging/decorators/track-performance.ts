// * Performance tracking decorator

import type { SmartLogger } from '../smart-logger.service';

export interface TrackPerformanceOptions {
  metadata?: Record<string, unknown>;
  threshold?: number; // * Warn if operation takes longer than this (ms)
  type?: 'cache' | 'computation' | 'database' | 'http';
}

interface LoggableClass {
  logger?: SmartLogger;
}

/**
 * * Decorator to track method performance
 * @example
 * ```typescript
 * class UserRepository {
 *   @TrackPerformance({ threshold: 100, type: 'database' })
 *   async findById(id: string) {
 *     // ...
 *   }
 * }
 * ```
 */
export function TrackPerformance(options: TrackPerformanceOptions = {}) {
  return function <T extends LoggableClass>(
    target: T,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (this: T, ...args: unknown[]): Promise<unknown> {
      const start = Date.now();
      const className = target.constructor.name;
      const methodName = `${className}.${propertyKey}`;

      try {
        // * Execute original method
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;

        // * Log performance if logger is available
        const logger = this.logger;
        if (logger && typeof logger.logPerformance === 'function') {
          await logger.logPerformance({
            alert:
              options.threshold && duration > options.threshold
                ? {
                    level: 'warning' as const,
                    reason: `Operation exceeded threshold of ${options.threshold}ms`,
                    recommendations: ['Consider optimizing this operation', 'Add caching if applicable'],
                  }
                : undefined,
            metadata: options.metadata,
            operation: {
              duration,
              name: methodName,
              threshold: options.threshold,
              type: options.type || 'computation',
            },
          });
        }

        return result;
      } catch (error) {
        const duration = Date.now() - start;

        // * Log error with performance info
        const logger = this.logger;
        if (logger && typeof logger.logError === 'function') {
          await logger.logError(error as Error, {
            duration,
            method: methodName,
          });
        }

        throw error;
      }
    };

    return descriptor;
  };
}