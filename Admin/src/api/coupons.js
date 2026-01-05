import axios from 'axios';

const API_BASE_URL = '/admin/coupons';

export const couponsApi = {
    // Get all coupons with pagination and search
    getAll: async (params) => {
        const response = await axios.get(API_BASE_URL, { params });
        return response.data;
    },

    // Get single coupon
    getById: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/${id}`);
        return response.data;
    },

    // Create new coupon
    create: async (couponData) => {
        const response = await axios.post(API_BASE_URL, couponData);
        return response.data;
    },

    // Update coupon
    update: async (id, couponData) => {
        const response = await axios.put(`${API_BASE_URL}/${id}`, couponData);
        return response.data;
    },

    // Delete coupon
    delete: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/${id}`);
        return response.data;
    },
};
