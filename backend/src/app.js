import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

import routes from './routes/index.js';
import { env } from './config/env.js';
import logger from './utils/logger.js';
import corsOptions from './config/corsOptions.js';
import { apiLimiter } from './middleware/rateLimit.middleware.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

const app = express();

// Render terminates TLS at its proxy — required for correct client IPs and
// therefore for rate limiting.
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(compression());

// Strip $ / . operators from user input before it reaches Mongoose.
app.use(mongoSanitize());
// Block HTTP parameter pollution, while keeping the repeatable filter params.
app.use(hpp({ whitelist: ['category', 'brand', 'sort', 'status', 'removeImages'] }));

app.use(morgan(env.isProduction ? 'combined' : 'dev'));

// Flag slow responses so latency problems show up in the logs, not just in
// the browser. Two seconds is well above any normal request here.
app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
    if (ms > 2000) logger.warn(`Slow request: ${req.method} ${req.originalUrl} took ${Math.round(ms)} ms (${res.statusCode})`);
  });
  next();
});

app.use(env.apiPrefix, apiLimiter, routes);

// Root ping so a bare Render URL shows something useful.
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'E-Commerce API is running',
    data: { docs: `${env.apiPrefix}`, health: `${env.apiPrefix}/health` },
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
