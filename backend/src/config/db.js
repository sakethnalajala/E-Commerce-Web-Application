import mongoose from 'mongoose';
import { env } from './env.js';
import logger from '../utils/logger.js';

let memoryServer = null;

/** 'atlas' once connected through MONGODB_URI, 'memory' for the dev fallback. */
export let databaseMode = 'disconnected';

/**
 * Connects to MongoDB Atlas through MONGODB_URI, always scoped to
 * MONGODB_DB_NAME (default `ecommerce_db`) so the app never reads from or
 * writes to another database that happens to live on the same cluster.
 *
 * USE_MEMORY_DB=true starts a throwaway in-memory MongoDB instead. That switch
 * exists only so the stack can be demoed locally without Atlas credentials; it
 * is rejected in production and never used when USE_MEMORY_DB is false.
 */
export const connectDatabase = async () => {
  mongoose.set('strictQuery', true);

  let uri = env.mongoUri;

  if (env.useMemoryDb) {
    if (env.isProduction) {
      throw new Error('USE_MEMORY_DB cannot be enabled in production. Provide a MONGODB_URI.');
    }
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri(env.mongoDbName);
    databaseMode = 'memory';
    logger.warn('Using in-memory MongoDB (development only). Data is NOT persisted.');
  } else {
    databaseMode = 'atlas';
  }

  const connection = await mongoose.connect(uri, {
    // Explicit dbName wins over any path in the URI, so the target database is
    // always the configured one.
    dbName: env.mongoDbName,
    serverSelectionTimeoutMS: 15000,
    // Atlas (especially shared tiers) silently drops idle sockets; without
    // these a request landing on a dead socket waits tens of seconds for the
    // OS to give up. A small pool with short idle/socket limits and frequent
    // heartbeats makes the driver notice and replace bad connections quickly,
    // and retryable reads/writes transparently re-run the operation on a
    // healthy one. No request in this API legitimately takes anywhere near 10 s.
    maxPoolSize: 10,
    socketTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    maxIdleTimeMS: 20000,
    heartbeatFrequencyMS: 10000,
    retryReads: true,
    retryWrites: true,
    autoIndex: !env.isProduction,
  });

  const { host, name } = connection.connection;
  logger.info(
    `MongoDB connected — mode: ${databaseMode === 'atlas' ? 'MongoDB Atlas' : 'in-memory'}, ` +
      `database: "${name}", host: ${host}`
  );

  if (databaseMode === 'atlas' && name !== env.mongoDbName) {
    // Should be impossible with dbName set, but fail loudly rather than run
    // against the wrong database.
    throw new Error(`Connected to database "${name}" but expected "${env.mongoDbName}".`);
  }

  mongoose.connection.on('error', (error) => logger.error(`MongoDB error: ${error.message}`));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

  return connection;
};

export const disconnectDatabase = async () => {
  await mongoose.connection.close();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
  databaseMode = 'disconnected';
};

export const getDatabaseInfo = () => ({
  mode: databaseMode,
  name: mongoose.connection?.name ?? null,
  readyState: mongoose.connection?.readyState ?? 0,
});

export default connectDatabase;
