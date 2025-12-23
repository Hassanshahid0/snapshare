import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import api from '../api/axios';

const Layout = ({ children }) => {
  const { user, logout, unreadMessages } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/users/search?q=${query}`);
      setSearchResults(res.data);
    } catch (err) { /* ignore */ }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Header */}
      <header className="glass fixed top-0 left-0 right-0 z-50 border-b border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-red-500/30 transition-all">
              <i className="fas fa-camera-retro text-white text-lg"></i>
            </div>
            <span className="text-2xl font-bold gradient-text hidden sm:block">SnapShare</span>
          </Link>
          
          {/* Search */}
          <div className="hidden md:block relative">
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery} 
              onChange={(e) => handleSearch(e.target.value)} 
              onFocus={() => setShowSearch(true)} 
              onBlur={() => setTimeout(() => setShowSearch(false), 200)} 
              className="input-modern px-4 py-2.5 pl-11 text-sm w-72 focus:outline-none dark:text-white rounded-full" 
            />
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white dark:bg-zinc-800 shadow-2xl rounded-2xl mt-2 max-h-80 overflow-y-auto border border-zinc-200 dark:border-zinc-700 animate-scale-in">
                {searchResults.map(u => (
                  <div 
                    key={u._id} 
                    onClick={() => navigate(`/profile/${u._id}`)} 
                    className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 cursor-pointer flex items-center gap-3 transition-colors"
                  >
                    <img src={u.avatar} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-600" />
                    <div>
                      <p className="font-semibold text-sm dark:text-white">{u.username}</p>
                      <p className="text-zinc-500 dark:text-zinc-400 text-xs capitalize">{u.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Nav Icons */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/" className={`icon-btn hidden md:flex ${isActive('/') ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'text-zinc-600 dark:text-zinc-300'}`}>
              <i className="fas fa-home text-xl"></i>
            </Link>
            <Link to="/messages" className={`icon-btn hidden md:flex relative ${isActive('/messages') ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'text-zinc-600 dark:text-zinc-300'}`}>
              <i className="fas fa-paper-plane text-xl"></i>
              {unreadMessages > 0 && (
                <>
                  <span className="notification-dot"></span>
                  <span className="notification-badge">{unreadMessages > 9 ? '9+' : unreadMessages}</span>
                </>
              )}
            </Link>
            {user?.role === 'creator' && (
              <Link to="/create" className={`icon-btn hidden md:flex ${isActive('/create') ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'text-zinc-600 dark:text-zinc-300'}`}>
                <i className="fas fa-plus-square text-xl"></i>
              </Link>
            )}
            <Link to="/profile" className={`icon-btn hidden md:flex ${isActive('/profile') ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'text-zinc-600 dark:text-zinc-300'}`}>
              <i className="fas fa-user-circle text-xl"></i>
            </Link>
            <button onClick={logout} className="icon-btn hidden md:flex text-zinc-600 dark:text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
              <i className="fas fa-sign-out-alt text-xl"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-24 md:pb-8">{children}</main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-zinc-200/50 dark:border-zinc-800/50 md:hidden z-50 shadow-lg">
        <div className="flex justify-around py-2">
          <Link to="/" className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${isActive('/') ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
            <i className={`fas fa-home text-2xl ${isActive('/') ? 'animate-bounce-slow' : ''}`}></i>
            <span className="text-xs mt-1 font-medium">Home</span>
          </Link>
          <Link to="/messages" className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all relative ${isActive('/messages') ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
            <i className={`fas fa-paper-plane text-2xl ${isActive('/messages') ? 'animate-bounce-slow' : ''}`}></i>
            <span className="text-xs mt-1 font-medium">Messages</span>
            {unreadMessages > 0 && (
              <>
                <span className="notification-dot" style={{top: '0', right: '12px'}}></span>
                <span className="notification-badge" style={{top: '-4px', right: '8px'}}>{unreadMessages > 9 ? '9+' : unreadMessages}</span>
              </>
            )}
          </Link>
          {user?.role === 'creator' && (
            <Link to="/create" className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${isActive('/create') ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
              <div className={`w-12 h-12 -mt-6 rounded-full flex items-center justify-center shadow-lg ${isActive('/create') ? 'bg-red-500' : 'bg-gradient-to-br from-red-500 to-orange-500'}`}>
                <i className="fas fa-plus text-white text-xl"></i>
              </div>
              <span className="text-xs mt-1 font-medium">Create</span>
            </Link>
          )}
          <Link to="/profile" className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${isActive('/profile') ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
            <i className={`fas fa-user-circle text-2xl ${isActive('/profile') ? 'animate-bounce-slow' : ''}`}></i>
            <span className="text-xs mt-1 font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
