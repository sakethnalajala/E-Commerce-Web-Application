/**
 * Seed CLI.
 *
 *   npm run seed            # wipe and reseed MONGODB_DB_NAME on MongoDB Atlas
 *   npm run seed:destroy    # wipe only
 *
 * The seed only ever touches the database named by MONGODB_DB_NAME (default
 * `ecommerce_db`) — never any other database on the cluster. Against a
 * production environment it additionally requires `--yes`.
 */
import mongoose from 'mongoose';
import { env, assertRequiredEnv } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import logger from '../utils/logger.js';
import { seedDatabase, wipeDatabase } from './seedDatabase.js';

const run = async () => {
  try {
    assertRequiredEnv();

    if (env.useMemoryDb) {
      throw new Error(
        'Seeding an in-memory database from the CLI has no effect — the data is discarded when this ' +
          'process exits. Set USE_MEMORY_DB=false and MONGODB_URI to your MongoDB Atlas connection ' +
          'string, then run the seed again. (`npm run dev:memory` seeds its own in-process database.)'
      );
    }

    if (env.isProduction && !process.argv.includes('--yes')) {
      throw new Error(
        `Refusing to wipe the production database "${env.mongoDbName}". ` +
          'Re-run with --yes if that is really what you want.'
      );
    }

    await connectDatabase();

    const { name } = mongoose.connection;
    logger.warn(`Target database: "${name}" — every collection in it will be cleared.`);

    if (process.argv.includes('--destroy')) {
      await wipeDatabase();
      logger.info(`Database "${name}" wiped.`);
    } else {
      await seedDatabase();
      logger.info(`Database "${name}" seeded.`);
    }

    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
};

run();
