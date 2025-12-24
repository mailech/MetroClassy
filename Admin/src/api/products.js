import axios from 'axios';

const API_BASE_URL = '/api/products';

export const productsApi = {
  // Get all products
  getAll: async () => {
    const response = await axios.get(API_BASE_URL);
    return response.data;
  },

  // Get single product
  getById: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
  },

  // Create product
  create: async (productData) => {
    const response = await axios.post(API_BASE_URL, productData);
    return response.data;
  },

  // Update product
  update: async (id, productData) => {
    const response = await axios.put(`${API_BASE_URL}/${id}`, productData);
    return response.data;
  },

  // Delete product
  delete: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/${id}`);
    return response.data;
  },
};

