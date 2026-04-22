import api from './config';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  notifySubscribers: (id) => api.post(`/products/${id}/notify`),
};

export const cartAPI = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart', data),
  update: (productId, data) => api.put(`/cart/${productId}`, data),
  remove: (productId) => api.delete(`/cart/${productId}`),
  clear: () => api.delete('/cart/clear'),
};

export const ordersAPI = {
  checkout: (data) => api.post('/orders/checkout', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getById: (id) => api.get(`/orders/${id}`),
  getAll: () => api.get('/orders'),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
};

export const salesAPI = {
  getActive: () => api.get('/sales/active'),
  getAll: () => api.get('/sales'),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  delete: (id) => api.delete(`/sales/${id}`),
};

export const promosAPI = {
  validate: (data) => api.post('/promos/validate', data),
  getAll: () => api.get('/promos'),
  create: (data) => api.post('/promos', data),
  update: (id, data) => api.put(`/promos/${id}`, data),
  delete: (id) => api.delete(`/promos/${id}`),
};

export const reviewsAPI = {
  getByProduct: (productId) => api.get(`/reviews/product/${productId}`),
  add: (productId, data) => api.post(`/reviews/product/${productId}`, data),
};

export const settingsAPI = {
  getPublic: () => api.get('/settings/public'),
  getAll: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  toggleSite: () => api.post('/settings/toggle-site'),
};

export const subscribersAPI = {
  getAll: () => api.get('/subscribers'),
  delete: (id) => api.delete(`/subscribers/${id}`),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  sendEmail: (id, data) => api.post(`/users/${id}/email`, data),
  bulkEmailSubscribers: (data) => api.post('/users/bulk-email/subscribers', data),
};

export const paymentAPI = {
  getMethods: () => api.get('/payments/methods'),
  initiate: (data) => api.post('/payments/initiate', data),
  verify: (data) => api.post('/payments/verify', data),
  getInvoice: (orderId) => api.get(`/payments/invoice/${orderId}`),
  emailInvoice: (orderId, data) => api.post(`/payments/invoice/${orderId}/email`, data),
};

export const bulkOrderAPI = {
  request: (data) => api.post('/bulk-orders/request', data),
  getMyRequests: () => api.get('/bulk-orders/my-requests'),
  getAll: () => api.get('/bulk-orders'),
  quote: (id, data) => api.put(`/bulk-orders/${id}/quote`, data),
  updateStatus: (id, data) => api.put(`/bulk-orders/${id}/status`, data),
  delete: (id) => api.delete(`/bulk-orders/${id}`),
};
