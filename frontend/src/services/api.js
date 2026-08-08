import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const url = String(config.url || '');
  const isAdminRoute = url.includes('/admin');
  const isAdminLogin = url.includes('/admin/login');

  // Never attach tokens to admin login
  if (!isAdminLogin) {
    const adminToken = localStorage.getItem('adminToken');
    const token = localStorage.getItem('token');
    if (isAdminRoute && adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (!isAdminRoute && token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // Let the browser set multipart boundary for FormData uploads
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = String(error.config?.url || '');
    const isAdminRoute = url.includes('/admin');
    const isAdminLogin = url.includes('/admin/login');

    // Only kick out of admin area on protected-route 401s (not login failures)
    if (error.response?.status === 401 && isAdminRoute && !isAdminLogin) {
      localStorage.removeItem('adminToken');
      if (!window.location.pathname.startsWith('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  sendOTP: (data) => api.post('/auth/send-otp', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  googleLogin: (data) => api.post('/auth/google', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  addAddress: (data) => api.post('/auth/addresses', data),
  updateAddress: (id, data) => api.put(`/auth/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/auth/addresses/${id}`),
  logout: () => api.post('/auth/logout'),
};

// Products
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getBySlug: (slug) => api.get(`/products/${encodeURIComponent(slug)}`),
  search: (q) => api.get('/products/search', { params: { q } }),
  getHome: () => api.get('/products/home'),
  getCategories: () => api.get('/categories'),
};

// Cart
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart', data),
  update: (itemId, data) => api.put(`/cart/${itemId}`, data),
  remove: (itemId) => api.delete(`/cart/${itemId}`),
  saveForLater: (itemId) => api.post(`/cart/${itemId}/save-later`),
  applyCoupon: (code) => api.post('/cart/apply-coupon', { code }),
  clear: () => api.delete('/cart'),
};

// Wishlist
export const wishlistAPI = {
  get: () => api.get('/wishlist'),
  add: (productId) => api.post('/wishlist', { productId }),
  toggle: (productId) => api.post('/wishlist/toggle', { productId }),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
};

// Orders
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  confirmUpiPayment: (data) => api.post('/orders/confirm-upi', data),
  getUpiQr: (id) => api.get(`/orders/${id}/upi-qr`),
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  track: (orderNumber) => api.get(`/orders/track/${orderNumber}`),
  cancel: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
};

// Reviews
export const reviewAPI = {
  create: (data) => api.post('/reviews', data),
  getByProduct: (productId, params) => api.get(`/reviews/${productId}`, { params }),
};

// Admin
export const adminAPI = {
  login: (data) => api.post('/admin/login', data),
  getDashboard: () => api.get('/admin/dashboard'),
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  getProducts: (params) => api.get('/admin/products', { params }),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  toggleStatus: (id, status) => api.patch(`/admin/products/${id}/status`, { status }),
  getOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
  verifyUpiPayment: (id, data) => api.put(`/admin/orders/${id}/verify-upi`, data),
  getCategories: () => api.get('/categories'),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};

export const siteAPI = {
  contact: (data) => api.post('/contact', data),
  subscribe: (email) => api.post('/newsletter/subscribe', { email }),
};
