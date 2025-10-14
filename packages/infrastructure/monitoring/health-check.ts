// * Health check service

import type { Logger } from '../logging/logger';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  checks: {
    [key: string]: {
      status: 'up' | 'down';
      message?: string;
      responseTime?: number;
    };
  };
  timestamp: string;
}

export type HealthChecker = () => Promise<{ status: 'up' | 'down'; message?: string }>;

export class HealthCheckService {
  private checkers: Map<string, HealthChecker> = new Map();

  constructor(private readonly logger: Logger) {}

  registerChecker(name: string, checker: HealthChecker): void {
    this.checkers.set(name, checker);
  }

  async check(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = {};
    let overallStatus: 'healthy' | 'unhealthy' = 'healthy';

    for (const [name, checker] of this.checkers) {
      const startTime = Date.now();

      try {
        const result = await checker();
        checks[name] = {
          ...result,
          responseTime: Date.now() - startTime,
        };

        if (result.status === 'down') {
          overallStatus = 'unhealthy';
        }
      } catch (error) {
        checks[name] = {
          status: 'down',
          message: error instanceof Error ? error.message : 'Unknown error',
          responseTime: Date.now() - startTime,
        };
        overallStatus = 'unhealthy';
      }
    }

    return {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}
