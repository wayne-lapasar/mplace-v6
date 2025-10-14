// * Application entry point

import process from 'node:process';

import { createApp } from './api-gateway/app';
import { DIContainer } from './config/di-container';
import { loadEnv } from './config/env';
import { registerUsersConsumers } from './services/users/consumers';

async function bootstrap() {
  try {
    // * Load and validate environment variables
    const env = loadEnv();

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Lapasar B2B eCommerce Platform                       ║
║   📦 Monolith Mode                                        ║
║   🌍 Environment: ${env.NODE_ENV.padEnd(42)}║
║   🔌 Port: ${String(env.PORT).padEnd(47)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);

    // * Initialize dependency injection container
    const container = new DIContainer(env);
    await container.initialize();

    // * Register event consumers
    registerUsersConsumers(container);

    // * Create Hono app (framework handles routing/middleware)
    const app = createApp(container);

    // * Start HTTP server using Bun runtime's built-in server
    // * Hono provides the app.fetch handler that Bun.serve uses
    const server = Bun.serve({
      port: env.PORT,
      hostname: env.HOST,
      fetch: app.fetch, // * Hono's request handler
    });

    container.logger.info('🎉 Server started successfully', {
      url: `http://${server.hostname}:${server.port}`,
      environment: env.NODE_ENV,
    });

    console.log(`
✅ Server is running at http://${server.hostname}:${server.port}
📚 API Docs: http://${server.hostname}:${server.port}/api/v1
🏥 Health Check: http://${server.hostname}:${server.port}/health
    `);

    // * Graceful shutdown
    process.on('SIGINT', async () => {
      container.logger.info('Shutting down gracefully...');
      await container.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      container.logger.info('Shutting down gracefully...');
      await container.shutdown();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
