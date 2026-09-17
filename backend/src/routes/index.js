import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import cartRoutes from './cart.routes.js';
import orderRoutes from './order.routes.js';
import reviewRoutes from './review.routes.js';
import adminRoutes from './admin.routes.js';
import analyticsRoutes from './analytics.routes.js';
import { isCloudinaryConfigured } from '../services/cloudinary.service.js';
import { getDatabaseInfo } from '../config/db.js';
import { env } from '../config/env.js';

const router = Router();

/** Service health — used by Render and for a quick Postman smoke test. */
router.get('/health', (_req, res) => {
  const dbStateMap = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const database = getDatabaseInfo();

  res.json({
    success: true,
    message: 'API is healthy',
    data: {
      status: 'ok',
      environment: env.nodeEnv,
      uptimeSeconds: Math.round(process.uptime()),
      database: dbStateMap[mongoose.connection.readyState] ?? 'unknown',
      // 'atlas' = real MongoDB Atlas via MONGODB_URI, 'memory' = dev-only fallback.
      databaseMode: database.mode,
      databaseName: database.name,
      cloudinary: isCloudinaryConfigured ? 'configured' : 'not-configured',
      timestamp: new Date().toISOString(),
    },
  });
});

/** Endpoint index, handy when exploring the API in Postman or a browser. */
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'E-Commerce REST API',
    data: {
      version: '1.0.0',
      resources: {
        auth: `${env.apiPrefix}/auth`,
        users: `${env.apiPrefix}/users`,
        products: `${env.apiPrefix}/products`,
        categories: `${env.apiPrefix}/categories`,
        cart: `${env.apiPrefix}/cart`,
        orders: `${env.apiPrefix}/orders`,
        reviews: `${env.apiPrefix}/reviews`,
        admin: `${env.apiPrefix}/admin`,
        analytics: `${env.apiPrefix}/analytics`,
      },
    },
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
