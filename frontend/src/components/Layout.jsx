import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import api from '../api/axios';

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
    } catch (err) { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
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
              className="input-modern px-4 py-2 pl-10 text-sm w-64 focus:outline-none dark:text-white" 
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
            {/* Hide these icons on mobile - only show on md and up */}
            <Link to="/" className="nav-icon text-2xl text-slate-600 dark:text-slate-300 hidden md:block">
              <i className="fas fa-home"></i>
            </Link>
            <Link to="/messages" className="nav-icon text-2xl text-slate-600 dark:text-slate-300 relative hidden md:block">
              <i className="fas fa-paper-plane"></i>
              {unreadMessages > 0 && (
                <>
                  <span className="notification-dot"></span>
                  <span className="notification-badge">{unreadMessages > 9 ? '9+' : unreadMessages}</span>
                </>
              )}
            </Link>
            {user?.role === 'creator' && (
              <Link to="/create" className="nav-icon text-2xl text-slate-600 dark:text-slate-300 hidden md:block">
                <i className="fas fa-plus-square"></i>
              </Link>
            )}
            <Link to="/profile" className="nav-icon text-2xl text-slate-600 dark:text-slate-300 hidden md:block">
              <i className="fas fa-user-circle"></i>
            </Link>
            <button onClick={logout} className="nav-icon text-2xl text-slate-600 dark:text-slate-300 hover:text-red-500 hidden md:block">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-24 md:pb-8">{children}</main>

      {/* Mobile Bottom Nav - only visible on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-slate-200 dark:border-slate-700 md:hidden z-50">
        <div className="flex justify-around py-3">
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
        </div>
      </nav>
    </div>
  );
};

export default Layout;
