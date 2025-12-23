import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('snapshare_token');
    const savedUser = localStorage.getItem('snapshare_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/messages/unread-count');
      setUnreadMessages(res.data.count);
    } catch (err) {
      console.error('Error fetching unread count');
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('snapshare_token', res.data.token);
    localStorage.setItem('snapshare_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const signup = async (username, email, password, role) => {
    const res = await api.post('/auth/signup', { username, email, password, role });
    localStorage.setItem('snapshare_token', res.data.token);
    localStorage.setItem('snapshare_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch (err) { /* ignore */ }
    localStorage.removeItem('snapshare_token');
    localStorage.removeItem('snapshare_user');
    setUser(null);
    setUnreadMessages(0);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup, 
      logout, 
      loading, 
      unreadMessages, 
      setUnreadMessages, 
      fetchUnreadCount 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
