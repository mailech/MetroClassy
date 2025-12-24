import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false,
  isLoading: true,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token
    const storedToken = localStorage.getItem('admin_token');
    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      // Verify token and get user
      verifyAuth();
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyAuth = async () => {
    try {
      const response = await axios.get('/admin/auth/me');
      setUser(response.data.user);
      setIsLoading(false);
    } catch (error) {
      // Token invalid
      localStorage.removeItem('admin_token');
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  const login = async (email, password, name) => {
    try {
      const response = await axios.post('/admin/auth/login', { email, password, name });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('admin_token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/admin/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('admin_token');
      delete axios.defaults.headers.common['Authorization'];
      // Use window.location instead of navigate since Router might not be mounted yet
      window.location.href = '/admin/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user && !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

