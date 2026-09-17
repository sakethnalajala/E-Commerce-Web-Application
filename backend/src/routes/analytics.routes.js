import { Router } from 'express';
import {
  getDashboard,
  getSales,
  getOrders,
  getProducts,
  getUsers,
  getInventory,
  getOverview,
} from '../controllers/analytics.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = Router();

// Every analytics figure is derived from live MongoDB data. Admin only.
router.use(protect, adminOnly);

router.get('/dashboard', getDashboard);
router.get('/overview', getOverview);
router.get('/sales', getSales);
router.get('/orders', getOrders);
router.get('/products', getProducts);
router.get('/users', getUsers);
router.get('/inventory', getInventory);

export default router;
