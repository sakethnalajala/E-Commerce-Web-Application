import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCartItems,
  mergeCart,
} from '../controllers/cart.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  addToCartValidation,
  updateCartItemValidation,
  cartItemParamValidation,
} from '../validations/cart.validation.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

// The cart belongs to the shopping experience, so it is customer-scoped.
router.use(protect, authorize(ROLES.CUSTOMER, ROLES.ADMIN));

router.get('/', getCart);
router.post('/', validate(addToCartValidation), addToCart);
router.post('/merge', mergeCart);
router.put('/:productId', validate(updateCartItemValidation), updateCartItem);
router.delete('/:productId', validate(cartItemParamValidation), removeCartItem);
router.delete('/', clearCartItems);

export default router;
