import axiosInstance from '../utils/axios';

export const couponsApi = {
    validate: async (code, cartTotal) => {
        const response = await axiosInstance.post('/coupons/validate', { code, cartTotal });
        return response.data;
    },
};
