import { Router } from 'express';
import {
  getProducts,
  getProductFilters,
  getFeaturedProducts,
  getProductByIdentifier,
  getProductsForAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
} from '../controllers/product.controller.js';
import { protect, adminOnly, optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { uploadProductImages } from '../middleware/upload.middleware.js';
import {
  listProductsValidation,
  createProductValidation,
  updateProductValidation,
  objectIdParam,
} from '../validations/product.validation.js';

const router = Router();

/* Public */
router.get('/', validate(listProductsValidation), getProducts);
router.get('/filters', getProductFilters);
router.get('/featured', getFeaturedProducts);

/* Admin — declared before /:identifier so "admin" is not read as a slug */
router.get('/admin/all', protect, adminOnly, validate(listProductsValidation), getProductsForAdmin);
router.post('/', protect, adminOnly, uploadProductImages, validate(createProductValidation), createProduct);
router.put('/:id', protect, adminOnly, uploadProductImages, validate(updateProductValidation), updateProduct);
router.patch('/:id/stock', protect, adminOnly, validate(objectIdParam('id', 'product id')), updateStock);
router.delete('/:id', protect, adminOnly, validate(objectIdParam('id', 'product id')), deleteProduct);

/* Public catch-all by id or slug */
router.get('/:identifier', optionalAuth, getProductByIdentifier);

export default router;
