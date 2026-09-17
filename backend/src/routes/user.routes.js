import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getUsers,
  getUserById,
  updateUserByAdmin,
  deleteUser,
} from '../controllers/user.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { uploadSingleImage } from '../middleware/upload.middleware.js';
import {
  updateProfileValidation,
  addressValidation,
  listUsersValidation,
  updateUserByAdminValidation,
} from '../validations/user.validation.js';
import { objectIdParam } from '../validations/product.validation.js';

const router = Router();

router.use(protect);

/* Own profile — any authenticated user */
router.get('/profile', getProfile);
router.put('/profile', uploadSingleImage('avatar'), validate(updateProfileValidation), updateProfile);

/* Own addresses */
router.get('/addresses', getAddresses);
router.post('/addresses', validate(addressValidation), addAddress);
router.put('/addresses/:addressId', validate(addressValidation), updateAddress);
router.delete('/addresses/:addressId', deleteAddress);

/* Admin user management */
router.get('/', adminOnly, validate(listUsersValidation), getUsers);
router.get('/:id', adminOnly, validate(objectIdParam('id', 'user id')), getUserById);
router.patch('/:id', adminOnly, validate(updateUserByAdminValidation), updateUserByAdmin);
router.delete('/:id', adminOnly, validate(objectIdParam('id', 'user id')), deleteUser);

export default router;
