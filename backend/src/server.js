import app from './app.js';
import { env, assertRequiredEnv } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { allowedOrigins } from './config/corsOptions.js';
import logger from './utils/logger.js';

let server;

const start = async () => {
  assertRequiredEnv();
  await connectDatabase();

  // The in-memory database starts empty and is thrown away on exit, so it seeds
  // itself here. A real database is only ever seeded explicitly via `npm run seed`.
  if (env.useMemoryDb) {
    const { seedDatabase } = await import('./seed/seedDatabase.js');
    await seedDatabase();
  }

  server = app.listen(env.port, () => {
    logger.info(`API listening on http://localhost:${env.port}${env.apiPrefix} (${env.nodeEnv})`);
    logger.info(`CORS allow-list: ${allowedOrigins.join(', ') || '(none)'}`);
  });
};

/** Drains connections before exiting so in-flight requests are not cut off. */
const shutdown = async (signal, exitCode = 0) => {
  logger.warn(`${signal} received — shutting down gracefully.`);

  const forceExit = setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000).unref();

  try {
    if (server) await new Promise((resolve) => server.close(resolve));
    await disconnectDatabase();
    clearTimeout(forceExit);
    process.exit(exitCode);
  } catch (error) {
    logger.error(`Error during shutdown: ${error.message}`);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled promise rejection: ${reason instanceof Error ? reason.stack : reason}`);
  shutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error.stack || error.message}`);
  shutdown('uncaughtException', 1);
});

['SIGINT', 'SIGTERM'].forEach((signal) => process.on(signal, () => shutdown(signal)));

start().catch((error) => {
  logger.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});
