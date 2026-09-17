import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { getDashboard } from '../controllers/analytics.controller.js';
import { getProductsForAdmin } from '../controllers/product.controller.js';
import { getAllOrders } from '../controllers/order.controller.js';
import { getUsers } from '../controllers/user.controller.js';
import { getStoreSettings, getAllReviews } from '../controllers/admin.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { listProductsValidation } from '../validations/product.validation.js';
import { listOrdersValidation } from '../validations/order.validation.js';
import { listUsersValidation } from '../validations/user.validation.js';

/**
 * Convenience surface that groups the admin reads under one prefix for Postman
 * and for the dashboard. Writes stay on their own resource routers.
 */
const router = Router();

router.use(protect, adminOnly);

router.get('/dashboard', getDashboard);
router.get('/products', validate(listProductsValidation), getProductsForAdmin);
router.get('/orders', validate(listOrdersValidation), getAllOrders);
router.get('/users', validate(listUsersValidation), getUsers);
router.get('/settings', getStoreSettings);
router.get('/reviews', getAllReviews);

export default router;
