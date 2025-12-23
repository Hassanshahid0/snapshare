import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams, Link } from 'react-router-dom';
import api from './api';

// Context for Auth
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Theme Context
const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);

// Theme Provider
const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('snapshare_theme') === 'dark' ||
      (!localStorage.getItem('snapshare_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('snapshare_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('snapshare_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Auth Provider
const AuthProvider = ({ children }) => {
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

  // Separate useEffect for fetching unread count when user is set
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('snapshare_token');
      if (!token) return;
      const res = await api.get('/messages/unread-count');
      console.log('Unread count:', res.data.count); // Debug log
      setUnreadMessages(res.data.count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('snapshare_token', res.data.token);
    localStorage.setItem('snapshare_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    fetchUnreadCount();
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
    try { await api.post('/auth/logout'); } catch (err) {}
    localStorage.removeItem('snapshare_token');
    localStorage.removeItem('snapshare_user');
    setUser(null);
    setUnreadMessages(0);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('snapshare_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, updateUser, unreadMessages, setUnreadMessages, fetchUnreadCount }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

// Loading Screen
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center auth-bg">
    <div className="text-center text-white">
      <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-xl font-medium">Loading SnapShare...</p>
    </div>
  </div>
);

// Theme Toggle Button
const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme" />
  );
};

// Auth Page
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const data = await login(email, password);
        navigate(data.user.role === 'admin' ? '/admin' : '/');
      } else {
        if (!role) { setError('Please select a role'); setLoading(false); return; }
        await signup(username, email, password, role);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSubmit(e); };

  return (
    <div className="min-h-screen flex items-center justify-center auth-bg p-4 relative">
      {/* Floating Shapes */}
      <div className="floating-shape w-72 h-72 bg-indigo-500 top-10 left-10" style={{animationDelay: '0s'}}></div>
      <div className="floating-shape w-96 h-96 bg-pink-500 bottom-10 right-10" style={{animationDelay: '2s'}}></div>
      <div className="floating-shape w-64 h-64 bg-purple-500 top-1/2 left-1/3" style={{animationDelay: '4s'}}></div>
      
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>
      
      <div className="card p-8 w-full max-w-md relative z-10 opacity-0 slide-up dark:bg-slate-800/90 backdrop-blur-xl" style={{animationFillMode: 'forwards'}}>
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-5 gradient-primary rounded-3xl flex items-center justify-center float-animation glow-animation shadow-2xl">
            <i className="fas fa-camera-retro text-4xl text-white"></i>
          </div>
          <h1 className="text-5xl font-black gradient-text mb-3 tracking-tight">SnapShare</h1>
          <p className="text-slate-400 dark:text-slate-500 text-lg">Share your moments with the world</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex mb-8 bg-slate-100 dark:bg-slate-700/50 rounded-2xl p-1.5">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3.5 rounded-xl font-bold transition-all duration-300 ${isLogin ? 'bg-white dark:bg-slate-600 shadow-lg text-indigo-600 dark:text-indigo-400 scale-[1.02]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
          >
            <i className="fas fa-sign-in-alt mr-2"></i>Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3.5 rounded-xl font-bold transition-all duration-300 ${!isLogin ? 'bg-white dark:bg-slate-600 shadow-lg text-indigo-600 dark:text-indigo-400 scale-[1.02]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
          >
            <i className="fas fa-user-plus mr-2"></i>Sign Up
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3 slide-in">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-red-500"></i>
            </div>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="opacity-0 slide-up stagger-1" style={{animationFillMode: 'forwards'}}>
              <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                <i className="fas fa-user mr-2 text-indigo-500"></i>Username
              </label>
              <input
                type="text"
                placeholder="Choose a unique username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full p-4 input-modern focus:outline-none dark:text-white dark:placeholder-slate-500 text-lg"
                required
              />
            </div>
          )}

          <div className={`opacity-0 slide-up ${!isLogin ? 'stagger-2' : 'stagger-1'}`} style={{animationFillMode: 'forwards'}}>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
              <i className="fas fa-envelope mr-2 text-indigo-500"></i>Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full p-4 input-modern focus:outline-none dark:text-white dark:placeholder-slate-500 text-lg"
              required
            />
          </div>

          <div className={`opacity-0 slide-up ${!isLogin ? 'stagger-3' : 'stagger-2'}`} style={{animationFillMode: 'forwards'}}>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
              <i className="fas fa-lock mr-2 text-indigo-500"></i>Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full p-4 input-modern focus:outline-none dark:text-white dark:placeholder-slate-500 text-lg"
              required
            />
          </div>

          {!isLogin && (
            <div className="opacity-0 slide-up stagger-4" style={{animationFillMode: 'forwards'}}>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">
                <i className="fas fa-user-tag mr-2 text-indigo-500"></i>I want to be a:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <label className="cursor-pointer group">
                  <input type="radio" name="role" value="creator" checked={role === 'creator'} onChange={(e) => setRole(e.target.value)} className="hidden" />
                  <div className={`p-5 border-2 rounded-2xl text-center transition-all duration-300 ${role === 'creator' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 scale-[1.02] shadow-lg shadow-indigo-500/20' : 'border-slate-200 dark:border-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10'}`}>
                    <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center transition-all duration-300 ${role === 'creator' ? 'gradient-primary shadow-lg' : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-100'}`}>
                      <i className={`fas fa-camera text-2xl ${role === 'creator' ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`}></i>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-white text-lg">Creator</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Post & share content</p>
                  </div>
                </label>
                <label className="cursor-pointer group">
                  <input type="radio" name="role" value="consumer" checked={role === 'consumer'} onChange={(e) => setRole(e.target.value)} className="hidden" />
                  <div className={`p-5 border-2 rounded-2xl text-center transition-all duration-300 ${role === 'consumer' ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/30 scale-[1.02] shadow-lg shadow-pink-500/20' : 'border-slate-200 dark:border-slate-600 hover:border-pink-300 hover:bg-pink-50/50 dark:hover:bg-pink-900/10'}`}>
                    <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center transition-all duration-300 ${role === 'consumer' ? 'gradient-secondary shadow-lg' : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-pink-100'}`}>
                      <i className={`fas fa-eye text-2xl ${role === 'consumer' ? 'text-white' : 'text-slate-400 group-hover:text-pink-500'}`}></i>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-white text-lg">Consumer</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">View & interact</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full btn-primary text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-3 ripple opacity-0 slide-up ${!isLogin ? 'stagger-5' : 'stagger-3'}`}
            style={{animationFillMode: 'forwards'}}
          >
            {loading ? (
              <><div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div> Please wait...</>
            ) : (
              <><i className={`fas ${isLogin ? 'fa-arrow-right' : 'fa-rocket'}`}></i> {isLogin ? 'Login to Account' : 'Create Account'}</>
            )}
          </button>
        </form>

        {isLogin && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-center text-slate-400 text-sm">
              <i className="fas fa-shield-alt mr-2"></i>Admin: admin@snapshare.com / admin123
            </p>
          </div>
        )}

        {/* Social Login Divider */}
        <div className="mt-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
          <span className="text-slate-400 text-sm font-medium">or continue with</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
        </div>

        {/* Social Buttons */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <button className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-300 hover:scale-105">
            <i className="fab fa-google text-xl text-red-500"></i>
          </button>
          <button className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-300 hover:scale-105">
            <i className="fab fa-apple text-xl text-slate-800 dark:text-white"></i>
          </button>
          <button className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-300 hover:scale-105">
            <i className="fab fa-facebook text-xl text-blue-600"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

// Layout Component
const Layout = ({ children }) => {
  const { user, logout, unreadMessages } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/users/search?q=${query}`);
      setSearchResults(res.data);
    } catch (err) { console.error('Search error'); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Header */}
      <header className="glass fixed top-0 left-0 right-0 z-50 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold gradient-text">SnapShare</Link>
          
          <div className="hidden md:block relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              className="input-modern px-4 py-2 pl-10 text-sm w-64 focus:outline-none dark:text-white dark:placeholder-slate-400"
            />
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 shadow-xl rounded-xl mt-2 max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700">
                {searchResults.map(u => (
                  <div
                    key={u._id}
                    onClick={() => navigate(`/profile/${u._id}`)}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-3"
                  >
                    <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-sm dark:text-white">{u.username}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs capitalize">{u.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/" className="nav-icon text-2xl text-slate-600 dark:text-slate-300">
              <i className="fas fa-home"></i>
            </Link>
            <Link to="/messages" className="nav-icon text-2xl text-slate-600 dark:text-slate-300 relative">
              <i className="fas fa-paper-plane"></i>
              {unreadMessages > 0 && (
                <>
                  <span className="notification-dot"></span>
                  <span className="notification-badge">{unreadMessages > 9 ? '9+' : unreadMessages}</span>
                </>
              )}
            </Link>
            {user?.role === 'creator' && (
              <Link to="/create" className="nav-icon text-2xl text-slate-600 dark:text-slate-300">
                <i className="fas fa-plus-square"></i>
              </Link>
            )}
            <Link to="/profile" className="nav-icon text-2xl text-slate-600 dark:text-slate-300">
              <i className="fas fa-user-circle"></i>
            </Link>
            <button onClick={logout} className="nav-icon text-2xl text-slate-600 dark:text-slate-300 hover:text-red-500">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-24 md:pb-8">{children}</main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-slate-200 dark:border-slate-700 md:hidden z-50">
        <div className="flex justify-around py-3">
          <Link to="/" className="nav-icon text-2xl text-slate-600 dark:text-slate-300"><i className="fas fa-home"></i></Link>
          <Link to="/messages" className="nav-icon text-2xl text-slate-600 dark:text-slate-300 relative">
            <i className="fas fa-paper-plane"></i>
            {unreadMessages > 0 && (
              <>
                <span className="notification-dot"></span>
                <span className="notification-badge">{unreadMessages > 9 ? '9+' : unreadMessages}</span>
              </>
            )}
          </Link>
          {user?.role === 'creator' && (
            <Link to="/create" className="nav-icon text-2xl text-slate-600 dark:text-slate-300"><i className="fas fa-plus-square"></i></Link>
          )}
          <Link to="/profile" className="nav-icon text-2xl text-slate-600 dark:text-slate-300"><i className="fas fa-user-circle"></i></Link>
        </div>
      </nav>
    </div>
  );
};

// Share Modal Component
const ShareModal = ({ post, onClose }) => {
  const { user } = useAuth();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchFollowing(); }, []);

  const fetchFollowing = async () => {
    try {
      const res = await api.get(`/users/${user._id}/following`);
      setFollowing(res.data);
    } catch (err) { console.error('Error fetching following'); }
    setLoading(false);
  };

  const handleShare = async (targetUserId) => {
    setSharing(targetUserId);
    try {
      await api.post(`/messages/${targetUserId}`, { 
        text: `📸 Shared a post: "${post.caption || 'Check out this post!'}" - ${post.image}`
      });
      await api.post(`/posts/${post._id}/share`);
      alert('Post shared successfully!');
      onClose();
    } catch (err) {
      console.error('Error sharing');
      alert('Failed to share post');
    }
    setSharing(null);
  };

  const filteredFollowing = following.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in" onClick={onClose}>
      <div className="card w-full max-w-md max-h-[80vh] overflow-hidden dark:bg-slate-800 slide-in" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold dark:text-white">Share Post</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xl">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Search following..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full input-modern px-4 py-3 pl-10 text-sm focus:outline-none dark:text-white dark:placeholder-slate-400"
            />
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          </div>
        </div>

        <div className="overflow-y-auto max-h-80">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredFollowing.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <i className="fas fa-users text-4xl mb-2"></i>
              <p>{searchQuery ? 'No users found' : 'You are not following anyone yet'}</p>
            </div>
          ) : (
            filteredFollowing.map(u => (
              <div key={u._id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <img src={u.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold dark:text-white">{u.username}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm capitalize">{u.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleShare(u._id)}
                  disabled={sharing === u._id}
                  className="px-4 py-2 btn-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {sharing === u._id ? <i className="fas fa-circle-notch fa-spin"></i> : 'Send'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Feed Page
const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => { fetchPosts(); fetchSuggested(); }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data);
    } catch (err) { console.error('Error fetching posts'); }
    setLoading(false);
  };

  const fetchSuggested = async () => {
    try {
      const res = await api.get('/users/suggested');
      setSuggested(res.data);
    } catch (err) { console.error('Error fetching suggested'); }
  };

  const handleLike = async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/like`);
      setPosts(posts.map(p => 
        p._id === postId 
          ? { ...p, likes: res.data.isLiked ? [...p.likes, user._id] : p.likes.filter(id => id !== user._id) }
          : p
      ));
    } catch (err) { console.error('Error liking post'); }
  };

  const handleFollow = async (userId) => {
    try {
      await api.post(`/users/${userId}/follow`);
      setSuggested(suggested.filter(u => u._id !== userId));
    } catch (err) { console.error('Error following'); }
  };

  if (loading) return <Layout><LoadingScreen /></Layout>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Posts Feed */}
          <div className="flex-1 max-w-lg mx-auto lg:mx-0">
            {posts.length === 0 ? (
              <div className="card p-8 text-center dark:bg-slate-800">
                <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <i className="fas fa-camera text-4xl text-slate-400"></i>
                </div>
                <h3 className="text-xl font-semibold text-slate-700 dark:text-white mb-2">No posts yet</h3>
                <p className="text-slate-500 dark:text-slate-400">Follow some creators to see their posts!</p>
              </div>
            ) : (
              posts.map(post => <PostCard key={post._id} post={post} onLike={handleLike} />)
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-80">
            <div className="card p-4 mb-4 dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <div className="avatar-ring p-0.5">
                  <img src={user?.avatar} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-800" />
                </div>
                <div>
                  <p className="font-semibold dark:text-white">{user?.username}</p>
                  <p className={`text-sm px-2 py-0.5 rounded-full inline-block ${user?.role === 'creator' ? 'badge-creator' : 'badge-consumer'}`}>
                    {user?.role}
                  </p>
                </div>
              </div>
            </div>

            {suggested.length > 0 && (
              <div className="card p-4 dark:bg-slate-800">
                <h4 className="font-semibold text-slate-500 dark:text-slate-400 text-sm mb-4">Suggested Creators</h4>
                {suggested.map(u => (
                  <div key={u._id} className="flex items-center justify-between mb-4 last:mb-0">
                    <Link to={`/profile/${u._id}`} className="flex items-center gap-3">
                      <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-sm dark:text-white">{u.username}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">{u.followers?.length || 0} followers</p>
                      </div>
                    </Link>
                    <button onClick={() => handleFollow(u._id)} className="text-emerald-500 text-sm font-semibold hover:text-emerald-600">
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Post Card Component
const PostCard = ({ post, onLike }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const isLiked = post.likes?.includes(user?._id);

  const handleLikeClick = () => {
    setIsLikeAnimating(true);
    onLike(post._id);
    setTimeout(() => setIsLikeAnimating(false), 300);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/posts/${post._id}/comment`, { text: commentText });
      setComments(res.data);
      setCommentText('');
    } catch (err) { console.error('Error commenting'); }
  };

  return (
    <div className="card mb-4 overflow-hidden dark:bg-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${post.user?._id}`)}>
          <div className="avatar-ring p-0.5">
            <img src={post.user?.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-800" />
          </div>
          <div>
            <span className="font-semibold dark:text-white">{post.user?.username}</span>
            <p className={`text-xs px-2 py-0.5 rounded-full inline-block ml-2 ${post.user?.role === 'creator' ? 'badge-creator' : 'badge-consumer'}`}>
              {post.user?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Image */}
      <img src={post.image} alt="" className="w-full aspect-square object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/500?text=Image'} />

      {showShareModal && <ShareModal post={post} onClose={() => setShowShareModal(false)} />}

      {/* Actions */}
      <div className="p-4">
        <div className="flex justify-between mb-3">
          <div className="flex gap-4">
            <button onClick={handleLikeClick} className={`text-2xl transition-all ${isLiked ? 'text-red-500' : 'text-slate-600 dark:text-slate-300 hover:text-red-500'} ${isLikeAnimating ? 'like-animation' : ''}`}>
              <i className={`${isLiked ? 'fas' : 'far'} fa-heart`}></i>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="text-2xl text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors">
              <i className="far fa-comment"></i>
            </button>
            <button onClick={() => setShowShareModal(true)} className="text-2xl text-slate-600 dark:text-slate-300 hover:text-cyan-500 transition-colors">
              <i className="far fa-paper-plane"></i>
            </button>
          </div>
          <button className="text-2xl text-slate-600 dark:text-slate-300 hover:text-amber-500 transition-colors">
            <i className="far fa-bookmark"></i>
          </button>
        </div>

        <p className="font-semibold mb-1 dark:text-white">{post.likes?.length || 0} likes</p>
        <p className="text-slate-800 dark:text-slate-200">
          <span className="font-semibold">{post.user?.username}</span> {post.caption}
        </p>
        
        {comments.length > 0 && (
          <button onClick={() => setShowComments(!showComments)} className="text-slate-500 dark:text-slate-400 text-sm mt-1 hover:text-emerald-500">
            View all {comments.length} comments
          </button>
        )}

        <p className="text-slate-400 text-xs mt-2">{new Date(post.createdAt).toLocaleDateString()}</p>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          <div className="max-h-48 overflow-y-auto mb-4">
            {comments.map((c, i) => (
              <div key={i} className="flex gap-3 mb-3">
                <img src={c.user?.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <p className="text-sm dark:text-slate-200"><span className="font-semibold">{c.user?.username}</span> {c.text}</p>
                  <p className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 input-modern px-4 py-2 text-sm focus:outline-none dark:text-white dark:placeholder-slate-400"
            />
            <button type="submit" className="text-emerald-500 font-semibold text-sm hover:text-emerald-600">Post</button>
          </form>
        </div>
      )}
    </div>
  );
};

// Create Post Page
const CreatePostPage = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.role !== 'creator') return <Navigate to="/" />;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { alert('File size must be less than 10MB'); return; }
      const reader = new FileReader();
      reader.onloadend = () => { setImage(reader.result); setPreview(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) { alert('Please select an image'); return; }
    setLoading(true);
    try {
      await api.post('/posts', { image, caption });
      navigate('/');
    } catch (err) { alert(err.response?.data?.error || 'Error creating post'); }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="card p-6 dark:bg-slate-800">
          <h2 className="text-2xl font-bold text-center mb-6 gradient-text">Create New Post</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Upload Photo</label>
              <div 
                className="relative w-full aspect-square bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl flex items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all overflow-hidden"
                onClick={() => document.getElementById('imageInput').click()}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setImage(null); setPreview(null); }}
                      className="absolute top-3 right-3 w-10 h-10 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 gradient-primary rounded-2xl flex items-center justify-center">
                      <i className="fas fa-cloud-upload-alt text-2xl text-white"></i>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-medium">Click to upload a photo</p>
                    <p className="text-slate-400 text-sm mt-1">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
              </div>
              <input type="file" id="imageInput" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Caption</label>
              <textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                maxLength={2200}
                className="w-full p-4 input-modern focus:outline-none resize-none dark:text-white dark:placeholder-slate-400"
              />
              <div className="flex justify-between mt-2">
                <div className="flex gap-2">
                  {['😍', '🔥', '❤️', '✨', '🎉'].map(emoji => (
                    <button key={emoji} type="button" onClick={() => setCaption(caption + emoji)} className="text-xl hover:scale-125 transition-transform">
                      {emoji}
                    </button>
                  ))}
                </div>
                <span className="text-slate-400 text-sm">{caption.length}/2200</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !image}
              className="w-full btn-primary text-white py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Posting...</>
              ) : (
                <><i className="fas fa-paper-plane"></i> Share Post</>
              )}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

// Messages Page
const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, setUnreadMessages } = useAuth();

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { if (selectedUser) fetchMessages(selectedUser._id); }, [selectedUser]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
    } catch (err) { console.error('Error fetching conversations'); }
    setLoading(false);
  };

  const fetchMessages = async (userId) => {
    try {
      const res = await api.get(`/messages/${userId}`);
      setMessages(res.data);
      const unreadRes = await api.get('/messages/unread-count');
      setUnreadMessages(unreadRes.data.count);
      fetchConversations();
    } catch (err) { console.error('Error fetching messages'); }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/users/search?q=${query}`);
      setSearchResults(res.data);
    } catch (err) { console.error('Search error'); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    try {
      const res = await api.post(`/messages/${selectedUser._id}`, { text: newMessage });
      setMessages([...messages, res.data]);
      setNewMessage('');
      fetchConversations();
    } catch (err) { console.error('Error sending message'); }
  };

  const startConversation = (u) => { setSelectedUser(u); setSearchQuery(''); setSearchResults([]); };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="card overflow-hidden h-[calc(100vh-180px)] dark:bg-slate-800">
          <div className="flex h-full">
            {/* Conversations List */}
            <div className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-700 flex flex-col ${selectedUser ? 'hidden md:flex' : ''}`}>
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold mb-4 dark:text-white">Messages</h2>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full input-modern px-4 py-2 text-sm focus:outline-none dark:text-white dark:placeholder-slate-400"
                />
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map(u => (
                    <div key={u._id} onClick={() => startConversation(u)} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-3 border-b border-slate-100 dark:border-slate-700">
                      <img src={u.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold dark:text-white">{u.username}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm capitalize">{u.role}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  conversations.map(conv => (
                    <div
                      key={conv.user?._id}
                      onClick={() => setSelectedUser(conv.user)}
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 ${selectedUser?._id === conv.user?._id ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                    >
                      <div className="relative">
                        <img src={conv.user?.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold dark:text-white">{conv.user?.username}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm truncate">{conv.lastMessage?.text}</p>
                      </div>
                    </div>
                  ))
                )}
                
                {conversations.length === 0 && searchResults.length === 0 && !loading && (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <i className="fas fa-inbox text-4xl mb-2"></i>
                    <p>No conversations yet</p>
                    <p className="text-sm">Search for users to start chatting</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${!selectedUser ? 'hidden md:flex' : ''}`}>
              {selectedUser ? (
                <>
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <button onClick={() => setSelectedUser(null)} className="md:hidden text-xl mr-2 dark:text-white">
                      <i className="fas fa-arrow-left"></i>
                    </button>
                    <img src={selectedUser.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    <span className="font-semibold dark:text-white">{selectedUser.username}</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/50">
                    {messages.map(msg => (
                      <div key={msg._id} className={`mb-4 ${msg.sender?._id === user._id ? 'text-right' : ''}`}>
                        <span className={`inline-block px-4 py-2 max-w-xs lg:max-w-md ${
                          msg.sender?._id === user._id ? 'message-sent' : 'message-received dark:bg-slate-700 dark:text-white'
                        }`}>
                          {msg.text}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={sendMessage} className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                    <input
                      type="text"
                      placeholder="Message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 input-modern px-4 py-2 focus:outline-none dark:text-white dark:placeholder-slate-400"
                    />
                    <button type="submit" className="btn-primary text-white px-6 py-2 rounded-xl font-semibold">
                      Send
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                      <i className="fas fa-comments text-4xl text-slate-400"></i>
                    </div>
                    <p className="text-xl font-medium dark:text-white">Select a conversation</p>
                    <p className="text-sm">Choose from your existing conversations or search for someone new</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Profile Page
const ProfilePage = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = !id || id === user?._id;

  useEffect(() => { fetchProfile(); fetchPosts(); }, [id]);

  const fetchProfile = async () => {
    try {
      const targetId = id || user._id;
      const res = await api.get(`/users/${targetId}`);
      setProfile(res.data);
      setIsFollowing(res.data.followers?.some(f => f._id === user._id || f === user._id));
    } catch (err) { console.error('Error fetching profile'); }
  };

  const fetchPosts = async () => {
    try {
      const targetId = id || user._id;
      const res = await api.get(`/posts/user/${targetId}`);
      setPosts(res.data);
    } catch (err) { console.error('Error fetching posts'); }
    setLoading(false);
  };

  const handleFollow = async () => {
    try {
      const res = await api.post(`/users/${id}/follow`);
      setIsFollowing(res.data.isFollowing);
      fetchProfile();
    } catch (err) { console.error('Error following'); }
  };

  if (loading) return <Layout><LoadingScreen /></Layout>;
  if (!profile) return <Layout><div className="text-center py-10 dark:text-white">User not found</div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="card p-6 mb-6 dark:bg-slate-800">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="avatar-ring p-1">
              <img src={profile.avatar} alt="" className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-800" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                <h2 className="text-2xl font-bold dark:text-white">{profile.username}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${profile.role === 'creator' ? 'badge-creator' : 'badge-consumer'}`}>
                  {profile.role}
                </span>
                {!isOwnProfile && (
                  <>
                    <button onClick={handleFollow} className={`px-6 py-2 rounded-xl font-semibold transition-all ${isFollowing ? 'border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700' : 'btn-primary text-white'}`}>
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                    <button onClick={() => navigate('/messages')} className="px-6 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                      Message
                    </button>
                  </>
                )}
              </div>
              <div className="flex justify-center md:justify-start gap-8 mb-4 text-slate-700 dark:text-slate-300">
                <span><strong className="dark:text-white">{posts.length}</strong> posts</span>
                <span><strong className="dark:text-white">{profile.followers?.length || 0}</strong> followers</span>
                <span><strong className="dark:text-white">{profile.following?.length || 0}</strong> following</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">{profile.bio}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {posts.map(post => (
            <div key={post._id} className="aspect-square relative group cursor-pointer rounded-xl overflow-hidden">
              <img src={post.image} alt="" className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/300?text=Image'} />
              <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center gap-4 text-white">
                <span><i className="fas fa-heart mr-1"></i>{post.likes?.length || 0}</span>
                <span><i className="fas fa-comment mr-1"></i>{post.comments?.length || 0}</span>
              </div>
            </div>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <i className="fas fa-camera text-4xl text-slate-400"></i>
            </div>
            <p className="text-xl font-medium">No posts yet</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Admin Dashboard
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, activitiesRes, postsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/activities'),
        api.get('/admin/posts')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setActivities(activitiesRes.data);
      setPosts(postsRes.data);
    } catch (err) { console.error('Error fetching admin data'); }
    setLoading(false);
  };

  const getActivityIcon = (type) => {
    const icons = { signup: 'fa-user-plus', login: 'fa-sign-in-alt', logout: 'fa-sign-out-alt', post: 'fa-image', like: 'fa-heart', comment: 'fa-comment', follow: 'fa-user-plus', unfollow: 'fa-user-minus', message: 'fa-envelope', share: 'fa-share', delete_post: 'fa-trash' };
    return icons[type] || 'fa-circle';
  };

  const getActivityColor = (type) => {
    const colors = { signup: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', login: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400', logout: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400', post: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400', like: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', comment: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', follow: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400', unfollow: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', message: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' };
    return colors[type] || 'bg-slate-100 text-slate-600';
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <header className="glass border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold dark:text-white">
            <i className="fas fa-shield-alt text-emerald-500 mr-2"></i>
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button onClick={logout} className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all">
              <i className="fas fa-sign-out-alt mr-2"></i>Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Users', value: stats?.totalUsers, icon: 'fa-users', gradient: 'from-cyan-500 to-blue-500' },
            { label: 'Total Posts', value: stats?.totalPosts, icon: 'fa-image', gradient: 'from-pink-500 to-rose-500' },
            { label: 'Creators', value: stats?.totalCreators, icon: 'fa-camera', gradient: 'from-emerald-500 to-teal-500' },
            { label: 'Messages', value: stats?.totalMessages, icon: 'fa-envelope', gradient: 'from-violet-500 to-purple-500' }
          ].map((stat, i) => (
            <div key={i} className="card p-6 dark:bg-slate-800">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <i className={`fas ${stat.icon} text-white text-xl`}></i>
                </div>
                <div>
                  <p className="text-3xl font-bold dark:text-white">{stat.value || 0}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card overflow-hidden dark:bg-slate-800">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold dark:text-white">Users</h2>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Posts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <p className="font-medium text-sm dark:text-white">{u.username}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${u.role === 'creator' ? 'badge-creator' : 'badge-consumer'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-slate-300">{u.postCount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card overflow-hidden dark:bg-slate-800">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold dark:text-white">Activity Log</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {activities.map(a => (
                <div key={a._id} className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(a.type)}`}>
                      <i className={`fas ${getActivityIcon(a.type)} text-sm`}></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm dark:text-slate-200">
                        <strong>{a.user?.username}</strong> {a.type.replace('_', ' ')}
                        {a.targetUser && <span> → {a.targetUser.username}</span>}
                      </p>
                      <p className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card mt-6 overflow-hidden dark:bg-slate-800">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold dark:text-white">Recent Posts</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 p-4">
            {posts.slice(0, 12).map(p => (
              <div key={p._id} className="aspect-square relative group rounded-xl overflow-hidden">
                <img src={p.image} alt="" className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Image'} />
                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex flex-col items-center justify-center text-white text-xs">
                  <p className="font-semibold">{p.user?.username}</p>
                  <p><i className="fas fa-heart mr-1"></i>{p.likes?.length || 0}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

// Main App
function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
            <Route path="/create" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
