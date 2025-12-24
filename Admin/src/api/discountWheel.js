import axios from 'axios';

const API_BASE_URL = '/api/discount-wheel';

export const discountWheelApi = {
  // Get current wheel configuration
  get: async () => {
    const response = await axios.get(API_BASE_URL);
    return response.data;
  },

  // Update wheel configuration
  update: async (wheelData) => {
    const response = await axios.put(API_BASE_URL, {
      ...wheelData,
      updatedBy: 'admin',
    });
    return response.data;
  },
};

