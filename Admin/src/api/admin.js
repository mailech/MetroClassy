import axios from 'axios';

// Admin Products API
export const adminProductsApi = {
  getAll: async (params = {}) => {
    const response = await axios.get('/admin/products', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/admin/products/${id}`);
    return response.data;
  },

  create: async (productData) => {
    const response = await axios.post('/admin/products', productData);
    return response.data;
  },

  update: async (id, productData) => {
    const response = await axios.put(`/admin/products/${id}`, productData);
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`/admin/products/${id}`);
    return response.data;
  },

  // Variants
  addVariant: async (productId, variantData) => {
    const response = await axios.post(`/admin/products/${productId}/variants`, variantData);
    return response.data;
  },

  updateVariant: async (variantId, variantData) => {
    const response = await axios.put(`/admin/products/variants/${variantId}`, variantData);
    return response.data;
  },

  deleteVariant: async (variantId) => {
    const response = await axios.delete(`/admin/products/variants/${variantId}`);
    return response.data;
  },

  // Images
  uploadImages: async (productId, formData) => {
    const response = await axios.post(`/admin/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteImage: async (imageId) => {
    const response = await axios.delete(`/admin/products/images/${imageId}`);
    return response.data;
  },
};

// Admin Categories API
export const adminCategoriesApi = {
  getAll: async (params = {}) => {
    const response = await axios.get('/admin/categories', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/admin/categories/${id}`);
    return response.data;
  },

  create: async (categoryData) => {
    const response = await axios.post('/admin/categories', categoryData);
    return response.data;
  },

  update: async (id, categoryData) => {
    const response = await axios.put(`/admin/categories/${id}`, categoryData);
    return response.data;
  },

  delete: async (id) => {
    const response = await axios.delete(`/admin/categories/${id}`);
    return response.data;
  },
};

// Admin Orders API
export const adminOrdersApi = {
  getAll: async (params = {}) => {
    const response = await axios.get('/admin/orders', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await axios.get(`/admin/orders/${id}`);
    return response.data;
  },

  updateStatus: async (id, status, trackingNumber) => {
    const response = await axios.put(`/admin/orders/${id}/status`, {
      status,
      trackingNumber,
    });
    return response.data;
  },

  updatePayment: async (id, isPaid, paymentResult) => {
    const response = await axios.put(`/admin/orders/${id}/payment`, {
      isPaid,
      paymentResult,
    });
    return response.data;
  },
};

// Admin Metrics API
export const adminMetricsApi = {
  getDashboard: async () => {
    const response = await axios.get('/admin/metrics/dashboard');
    return response.data;
  },

  getLowStock: async (threshold = 10) => {
    const response = await axios.get('/admin/metrics/low-stock', {
      params: { threshold },
    });
    return response.data;
  },

  getRevenue: async (period = '7d') => {
    const response = await axios.get('/admin/metrics/revenue', {
      params: { period },
    });
    return response.data;
  },
};

// Admin Auth API
export const adminAuthApi = {
  login: async (email, password) => {
    const response = await axios.post('/admin/auth/login', { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await axios.post('/admin/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await axios.get('/admin/auth/me');
    return response.data;
  },
};

