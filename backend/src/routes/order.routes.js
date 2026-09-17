import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelMyOrder,
  getAllOrders,
  updateOrderStatus,
  getOrdersByUser,
} from '../controllers/order.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createOrderValidation,
  updateOrderStatusValidation,
  cancelOrderValidation,
  listOrdersValidation,
} from '../validations/order.validation.js';
import { objectIdParam } from '../validations/product.validation.js';

const router = Router();

router.use(protect);

/* Customer */
router.post('/', validate(createOrderValidation), createOrder);
router.get('/my', validate(listOrdersValidation), getMyOrders);
router.patch('/:id/cancel', validate(cancelOrderValidation), cancelMyOrder);

/* Admin */
router.get('/', adminOnly, validate(listOrdersValidation), getAllOrders);
router.get('/user/:userId', adminOnly, validate(objectIdParam('userId', 'user id')), getOrdersByUser);
router.patch('/:id/status', adminOnly, validate(updateOrderStatusValidation), updateOrderStatus);

/* Shared — ownership is enforced inside the controller */
router.get('/:id', validate(objectIdParam('id', 'order id')), getOrderById);

export default router;
