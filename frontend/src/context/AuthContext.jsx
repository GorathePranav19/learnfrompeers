import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      const storedUser = localStorage.getItem('lfp_user');
      const token = localStorage.getItem('lfp_token');

      if (storedUser && token) {
        try {
          // Validate token by calling /auth/me
          const res = await api.get('/auth/me');
          const validatedUser = {
            id: res.data._id,
            name: res.data.name,
            email: res.data.email,
            role: res.data.role,
            linkedStudentId: res.data.linkedStudentId
          };
          localStorage.setItem('lfp_user', JSON.stringify(validatedUser));
          setUser(validatedUser);
        } catch (err) {
          // Token expired or invalid — clear storage
          localStorage.removeItem('lfp_token');
          localStorage.removeItem('lfp_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    validateSession();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('lfp_token', token);
    localStorage.setItem('lfp_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('lfp_token');
    localStorage.removeItem('lfp_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
