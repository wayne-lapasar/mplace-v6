// * MongoDB transaction wrapper

import { ClientSession, Db } from 'mongodb';

import type { Logger } from '../logging/logger';

export class TransactionHelper {
  constructor(
    private readonly db: Db,
    private readonly logger: Logger
  ) {}

  async withTransaction<T>(
    fn: (session: ClientSession) => Promise<T>
  ): Promise<T> {
    const session = this.db.client.startSession();

    try {
      let result: T;

      await session.withTransaction(async () => {
        result = await fn(session);
      });

      return result!;
    } catch (error) {
      this.logger.error('Transaction failed', { error });
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
