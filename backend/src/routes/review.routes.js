import { Router } from 'express';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
} from '../controllers/review.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createReviewValidation, updateReviewValidation } from '../validations/review.validation.js';
import { objectIdParam } from '../validations/product.validation.js';

const router = Router();

/* Public */
router.get('/product/:productId', validate(objectIdParam('productId', 'product id')), getProductReviews);

/* Authenticated */
router.get('/my', protect, getMyReviews);
router.post('/product/:productId', protect, validate(createReviewValidation), createReview);
router.put('/:id', protect, validate(updateReviewValidation), updateReview);
router.delete('/:id', protect, validate(objectIdParam('id', 'review id')), deleteReview);

export default router;
