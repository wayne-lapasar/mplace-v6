// * Dependency injection container

import type { Db } from 'mongodb';
import { join } from 'node:path';

import {
  BunRedisCache,
  ConsoleTransport,
  FileTransport,
  HealthCheckService,
  I18nService,
  type ICache,
  type IEventBus,
  InMemoryCache,
  InMemoryEventBus,
  JWTService,
  type LoggerConfig,
  MongoDBClient,
  MongoDBTransport,
  PasswordService,
  RateLimiterService,
  SmartLogger,
} from '@lapasar/infrastructure';
import {
  createUserServices,
  type GetUserUseCase,
  type IUserRepository,
  type LoginUserUseCase,
  type RegisterUserUseCase,
  type UpdateUserProfileUseCase,
} from '@lapasar/users-domain';
import type { Env } from './env';

export class DIContainer {
  // * Infrastructure
  readonly logger: SmartLogger;
  readonly mongoClient: MongoDBClient;
  readonly eventBus: IEventBus;
  readonly cache: ICache;
  readonly rateLimiter: RateLimiterService;
  readonly passwordService: PasswordService;
  readonly jwtService: JWTService;
  readonly healthCheckService: HealthCheckService;
  readonly i18nService: I18nService;
  private env: Env;

  // * Repositories (initialized after DB connection)
  readonly userRepository!: IUserRepository;

  // * Use cases (initialized after repositories)
  readonly registerUserUseCase!: RegisterUserUseCase;
  readonly loginUserUseCase!: LoginUserUseCase;
  readonly updateUserProfileUseCase!: UpdateUserProfileUseCase;
  readonly getUserUseCase!: GetUserUseCase;

  constructor(env: Env) {
    this.env = env;
    // * Initialize smart logger with transports
    const loggerConfig: LoggerConfig = {
      environment: env.NODE_ENV,
      level: env.LOG_LEVEL,
      service: 'lapasar-api',
      transports: {
        console: {
          enabled: true,
          level: env.LOG_LEVEL,
        },
        file: env.LOG_TO_FILE
          ? {
              compress: true,
              enabled: true,
              level: env.LOG_LEVEL,
              maxFiles: env.LOG_FILE_MAX_FILES,
              maxSize: env.LOG_FILE_MAX_SIZE,
              path: env.LOG_FILE_PATH,
            }
          : undefined,
        mongodb: env.LOG_TO_DB
          ? {
              collection: 'logs',
              enabled: true,
              level: 'warn',
              ttl: 2592000, // * 30 days
            }
          : undefined,
      },
      version: '1.0.0',
    };
    this.logger = new SmartLogger(loggerConfig);

    // * Add console transport
    this.logger.addTransport(new ConsoleTransport({ enabled: true, level: env.LOG_LEVEL }));

    // * Initialize MongoDB
    this.mongoClient = new MongoDBClient(
      env.MONGODB_URI,
      env.MONGODB_DB_NAME,
      this.logger
    );

    // * Initialize event bus
    this.eventBus = new InMemoryEventBus(this.logger);

    // * Initialize auth services
    this.passwordService = new PasswordService(
      {
        memoryCost: env.ARGON2_MEMORY_SIZE,
        timeCost: env.ARGON2_ITERATIONS,
        parallelism: env.ARGON2_PARALLELISM,
      },
      this.logger
    );

    this.jwtService = new JWTService(
      env.JWT_SECRET,
      env.JWT_EXPIRES_IN,
      this.logger
    );

    // * Initialize health check service
    this.healthCheckService = new HealthCheckService(this.logger);

    // * Initialize i18n service
    this.i18nService = new I18nService(env.DEFAULT_LOCALE);

    // * Initialize cache (BunRedisCache if REDIS_URL provided, otherwise InMemoryCache)
    if (env.REDIS_URL) {
      this.logger.info('Using BunRedisCache for caching and rate limiting');
      this.cache = new BunRedisCache(env.REDIS_URL);
    } else {
      this.logger.info('Using InMemoryCache for caching and rate limiting (development only)');
      this.cache = new InMemoryCache();
    }

    // * Initialize rate limiter
    this.rateLimiter = new RateLimiterService(this.cache, {
      maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
      windowMs: env.RATE_LIMIT_WINDOW_MS,
    });
  }

  async initialize(): Promise<void> {
    // * Connect to MongoDB
    await this.mongoClient.connect();
    const db = this.mongoClient.getDatabase();

    // * Add file transport if enabled
    if (this.env.LOG_TO_FILE) {
      this.logger.addTransport(
        new FileTransport({
          compress: true,
          enabled: true,
          level: this.env.LOG_LEVEL,
          maxFiles: this.env.LOG_FILE_MAX_FILES,
          maxSize: this.env.LOG_FILE_MAX_SIZE,
          path: this.env.LOG_FILE_PATH,
        })
      );
    }

    // * Add MongoDB transport if enabled
    if (this.env.LOG_TO_DB) {
      this.logger.addTransport(
        new MongoDBTransport(db, {
          collection: 'logs',
          enabled: true,
          level: 'warn',
          ttl: 2592000, // * 30 days
        })
      );
    }

    // * Load i18n translations
    const translationsPath = join(__dirname, '../../../../packages/infrastructure/localization/translations');
    await this.i18nService.loadTranslations(translationsPath);

    // * Initialize domain services using factories
    this.initializeDomainServices(db);

    // * Register health checks
    this.registerHealthChecks();

    await this.logger.info('DI Container initialized successfully');
  }

  async shutdown(): Promise<void> {
    await this.mongoClient.disconnect();
    await this.logger.info('DI Container shut down');
    await this.logger.close();
  }

  private initializeDomainServices(db: Db): void {
    // * Initialize users domain
    const userServices = createUserServices({
      db,
      logger: this.logger,
      passwordService: this.passwordService,
      jwtService: this.jwtService,
      eventBus: this.eventBus,
    });

    // * Assign domain services to container (cast to Record for assignment)
    this.assignServices(userServices as unknown as Record<string, unknown>);

    // * Add more domains here as they are created:
    // * const productServices = createProductServices({ db, logger: this.logger, eventBus: this.eventBus });
    // * this.assignServices(productServices as unknown as Record<string, unknown>);
  }

  private assignServices(services: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(services)) {
      Object.defineProperty(this, key, {
        value,
        writable: false,
        configurable: false,
      });
    }
  }

  private registerHealthChecks(): void {
    // * MongoDB health check
    this.healthCheckService.registerChecker('mongodb', async () => {
      const isHealthy = await this.mongoClient.ping();
      return {
        status: isHealthy ? 'up' : 'down',
        message: isHealthy ? 'MongoDB is connected' : 'MongoDB is disconnected',
      };
    });
  }
}
