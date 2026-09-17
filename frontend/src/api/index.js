/**
 * Thin, typed-by-convention wrappers around the REST API. Every call returns
 * the parsed `{ success, message, data, meta }` envelope from the server.
 * Components never talk to axios directly.
 */
import client from './client';

/* ----------------------------- Authentication ---------------------------- */
export const authApi = {
  register: (payload) => client.post('/auth/register', payload),
  login: (payload) => client.post('/auth/login', payload),
  logout: () => client.post('/auth/logout'),
  me: () => client.get('/auth/me'),
  providers: () => client.get('/auth/providers'),
  google: (payload) => client.post('/auth/google', payload),
  apple: (payload) => client.post('/auth/apple', payload),
  forgotPassword: (payload) => client.post('/auth/forgot-password', payload),
  resetPassword: (token, payload) => client.post(`/auth/reset-password/${token}`, payload),
  changePassword: (payload) => client.patch('/auth/change-password', payload),
};

/* -------------------------------- Products ------------------------------- */
export const productApi = {
  list: (params) => client.get('/products', { params }),
  filters: (params) => client.get('/products/filters', { params }),
  featured: (limit = 8) => client.get('/products/featured', { params: { limit } }),
  detail: (identifier) => client.get(`/products/${identifier}`),

  // Admin
  adminList: (params) => client.get('/products/admin/all', { params }),
  create: (formData) => client.post('/products', formData),
  update: (id, formData) => client.put(`/products/${id}`, formData),
  updateStock: (id, stock) => client.patch(`/products/${id}/stock`, { stock }),
  remove: (id, force = false) => client.delete(`/products/${id}`, { params: { force } }),
};

/* ------------------------------- Categories ------------------------------ */
export const categoryApi = {
  list: (params) => client.get('/categories', { params }),
  detail: (id) => client.get(`/categories/${id}`),
  create: (payload) => client.post('/categories', payload),
  update: (id, payload) => client.put(`/categories/${id}`, payload),
  remove: (id) => client.delete(`/categories/${id}`),
};

/* ---------------------------------- Cart --------------------------------- */
export const cartApi = {
  get: () => client.get('/cart'),
  add: (productId, quantity = 1) => client.post('/cart', { productId, quantity }),
  update: (productId, quantity) => client.put(`/cart/${productId}`, { quantity }),
  remove: (productId) => client.delete(`/cart/${productId}`),
  clear: () => client.delete('/cart'),
  merge: (items) => client.post('/cart/merge', { items }),
};

/* --------------------------------- Orders -------------------------------- */
export const orderApi = {
  create: (payload) => client.post('/orders', payload),
  myOrders: (params) => client.get('/orders/my', { params }),
  detail: (id) => client.get(`/orders/${id}`),
  cancel: (id, reason) => client.patch(`/orders/${id}/cancel`, { reason }),

  // Admin
  listAll: (params) => client.get('/orders', { params }),
  updateStatus: (id, status, note) => client.patch(`/orders/${id}/status`, { status, note }),
  byUser: (userId, params) => client.get(`/orders/user/${userId}`, { params }),
};

/* -------------------------------- Reviews -------------------------------- */
export const reviewApi = {
  forProduct: (productId, params) => client.get(`/reviews/product/${productId}`, { params }),
  create: (productId, payload) => client.post(`/reviews/product/${productId}`, payload),
  update: (id, payload) => client.put(`/reviews/${id}`, payload),
  remove: (id) => client.delete(`/reviews/${id}`),
  mine: (params) => client.get('/reviews/my', { params }),
};

/* --------------------------------- Users --------------------------------- */
export const userApi = {
  profile: () => client.get('/users/profile'),
  updateProfile: (payload) => client.put('/users/profile', payload),
  addresses: () => client.get('/users/addresses'),
  addAddress: (payload) => client.post('/users/addresses', payload),
  updateAddress: (addressId, payload) => client.put(`/users/addresses/${addressId}`, payload),
  removeAddress: (addressId) => client.delete(`/users/addresses/${addressId}`),

  // Admin
  list: (params) => client.get('/users', { params }),
  detail: (id) => client.get(`/users/${id}`),
  update: (id, payload) => client.patch(`/users/${id}`, payload),
  remove: (id) => client.delete(`/users/${id}`),
};

/* ------------------------------- Analytics ------------------------------- */
export const analyticsApi = {
  dashboard: () => client.get('/analytics/dashboard'),
  overview: (days = 30) => client.get('/analytics/overview', { params: { days } }),
  sales: (days = 30) => client.get('/analytics/sales', { params: { days } }),
  orders: () => client.get('/analytics/orders'),
  products: (limit = 10) => client.get('/analytics/products', { params: { limit } }),
  users: (months = 6) => client.get('/analytics/users', { params: { months } }),
  inventory: (lowStockThreshold) =>
    client.get('/analytics/inventory', { params: { lowStockThreshold } }),
};

/* ---------------------------------- Admin -------------------------------- */
export const adminApi = {
  settings: () => client.get('/admin/settings'),
  reviews: (params) => client.get('/admin/reviews', { params }),
};

export { default as client } from './client';
