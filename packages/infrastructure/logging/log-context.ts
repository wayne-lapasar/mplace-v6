// * Request-scoped logging context

import { AsyncLocalStorage } from 'async_hooks';

export interface RequestLogContext {
  correlationId: string;
  userId?: string;
  requestId: string;
  path?: string;
  method?: string;
}

export class LogContextHolder {
  private static context: AsyncLocalStorage<RequestLogContext> =
    new AsyncLocalStorage();

  static run<T>(context: RequestLogContext, fn: () => T): T {
    return this.context.run(context, fn);
  }

  static get(): RequestLogContext | undefined {
    return this.context.getStore();
  }

  static getCorrelationId(): string | undefined {
    return this.get()?.correlationId;
  }
}
