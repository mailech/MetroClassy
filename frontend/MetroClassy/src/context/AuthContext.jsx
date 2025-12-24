import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from '../utils/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMe = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/auth/me');
      setUser(data.user);
      setError(null);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (payload) => {
    const { email, password } = payload;
    const { data } = await axios.post('/auth/login', { email, password });
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { name, email, password } = payload;
    const { data } = await axios.post('/auth/register', { name, email, password });
    setUser(data.user);
    return data.user;
  };

  const socialLogin = async (userData) => {
    const { data } = await axios.post('/auth/google', userData);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await axios.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        socialLogin,
        logout,
        refresh: fetchMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

