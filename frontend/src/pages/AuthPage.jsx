import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

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
    <div className="min-h-screen flex items-center justify-center auth-bg p-4 relative overflow-hidden">
      {/* Animated Background Shapes */}
      <div className="floating-shape w-72 h-72 bg-red-600 top-10 left-10" style={{animationDelay: '0s'}}></div>
      <div className="floating-shape w-96 h-96 bg-red-500 bottom-10 right-10" style={{animationDelay: '2s'}}></div>
      <div className="floating-shape w-64 h-64 bg-orange-500 top-1/2 left-1/3" style={{animationDelay: '4s'}}></div>
      <div className="floating-shape w-48 h-48 bg-zinc-700 bottom-1/3 right-1/4" style={{animationDelay: '1s'}}></div>
      
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10"><ThemeToggle /></div>
      
      {/* Auth Card */}
      <div className="glass-card p-8 w-full max-w-md relative z-10 opacity-0 animate-slide-up" style={{animationFillMode: 'forwards'}}>
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-5 gradient-secondary rounded-3xl flex items-center justify-center animate-float shadow-2xl pulse-ring">
            <i className="fas fa-camera-retro text-4xl text-white"></i>
          </div>
          <h1 className="text-5xl font-black text-gradient-animated mb-3 tracking-tight">SnapShare</h1>
          <p className="text-slate-400 dark:text-slate-500 text-lg">Share your moments with the world</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex mb-8 bg-slate-100/80 dark:bg-slate-700/50 rounded-2xl p-1.5 backdrop-blur-sm">
          <button 
            onClick={() => setIsLogin(true)} 
            className={`flex-1 py-3.5 rounded-xl font-bold transition-all duration-300 ${isLogin ? 'bg-white dark:bg-slate-600 shadow-lg text-red-500 dark:text-red-400 scale-[1.02]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
          >
            <i className="fas fa-sign-in-alt mr-2"></i>Login
          </button>
          <button 
            onClick={() => setIsLogin(false)} 
            className={`flex-1 py-3.5 rounded-xl font-bold transition-all duration-300 ${!isLogin ? 'bg-white dark:bg-slate-600 shadow-lg text-red-500 dark:text-red-400 scale-[1.02]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
          >
            <i className="fas fa-user-plus mr-2"></i>Sign Up
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3 animate-slide-in">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-red-500"></i>
            </div>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="opacity-0 animate-slide-up stagger-1" style={{animationFillMode: 'forwards'}}>
              <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                <i className="fas fa-user mr-2 text-red-500"></i>Username
              </label>
              <input 
                type="text" 
                placeholder="Choose a unique username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                onKeyPress={handleKeyPress} 
                className="w-full p-4 input-modern focus:outline-none dark:text-white text-lg focus-ring" 
                required 
              />
            </div>
          )}

          <div className={`opacity-0 animate-slide-up ${!isLogin ? 'stagger-2' : 'stagger-1'}`} style={{animationFillMode: 'forwards'}}>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
              <i className="fas fa-envelope mr-2 text-red-500"></i>Email
            </label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              onKeyPress={handleKeyPress} 
              className="w-full p-4 input-modern focus:outline-none dark:text-white text-lg focus-ring" 
              required 
            />
          </div>

          <div className={`opacity-0 animate-slide-up ${!isLogin ? 'stagger-3' : 'stagger-2'}`} style={{animationFillMode: 'forwards'}}>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
              <i className="fas fa-lock mr-2 text-red-500"></i>Password
            </label>
            <input 
              type="password" 
              placeholder="Enter your password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              onKeyPress={handleKeyPress} 
              className="w-full p-4 input-modern focus:outline-none dark:text-white text-lg focus-ring" 
              required 
            />
          </div>

          {!isLogin && (
            <div className="opacity-0 animate-slide-up stagger-4" style={{animationFillMode: 'forwards'}}>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">
                <i className="fas fa-user-tag mr-2 text-red-500"></i>I want to be a:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <label className="cursor-pointer group">
                  <input type="radio" name="role" value="creator" checked={role === 'creator'} onChange={(e) => setRole(e.target.value)} className="hidden" />
                  <div className={`p-5 border-2 rounded-2xl text-center transition-all duration-300 hover-lift ${role === 'creator' ? 'border-red-500 bg-red-50 dark:bg-red-900/30 scale-[1.02] shadow-lg shadow-red-500/20' : 'border-slate-200 dark:border-slate-600 hover:border-red-300'}`}>
                    <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center transition-all duration-300 ${role === 'creator' ? 'bg-gradient-to-br from-red-500 to-orange-500 shadow-lg' : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-red-100 dark:group-hover:bg-red-900/20'}`}>
                      <i className={`fas fa-camera text-2xl ${role === 'creator' ? 'text-white' : 'text-slate-400 group-hover:text-red-500'}`}></i>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-white text-lg">Creator</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Post & share content</p>
                  </div>
                </label>
                <label className="cursor-pointer group">
                  <input type="radio" name="role" value="consumer" checked={role === 'consumer'} onChange={(e) => setRole(e.target.value)} className="hidden" />
                  <div className={`p-5 border-2 rounded-2xl text-center transition-all duration-300 hover-lift ${role === 'consumer' ? 'border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 scale-[1.02] shadow-lg shadow-zinc-500/20' : 'border-slate-200 dark:border-slate-600 hover:border-zinc-400'}`}>
                    <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center transition-all duration-300 ${role === 'consumer' ? 'bg-gradient-to-br from-zinc-700 to-zinc-900 shadow-lg' : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800'}`}>
                      <i className={`fas fa-eye text-2xl ${role === 'consumer' ? 'text-white' : 'text-slate-400 group-hover:text-zinc-600'}`}></i>
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
            className={`w-full btn-primary text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-3 ripple opacity-0 animate-slide-up ${!isLogin ? 'stagger-5' : 'stagger-3'}`} 
            style={{animationFillMode: 'forwards'}}
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div> 
                Please wait...
              </>
            ) : (
              <>
                <i className={`fas ${isLogin ? 'fa-arrow-right' : 'fa-rocket'}`}></i> 
                {isLogin ? 'Login to Account' : 'Create Account'}
              </>
            )}
          </button>
        </form>

        {/* Admin Hint */}
        {isLogin && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-center text-slate-400 text-sm">
              <i className="fas fa-shield-alt mr-2"></i>Admin: admin@snapshare.com / admin123
            </p>
          </div>
        )}
        
        {/* Features Preview */}
        <div className="mt-6 flex justify-center gap-6 text-slate-400">
          <div className="text-center">
            <i className="fas fa-heart text-red-400 text-xl mb-1"></i>
            <p className="text-xs">Like</p>
          </div>
          <div className="text-center">
            <i className="fas fa-comment text-blue-400 text-xl mb-1"></i>
            <p className="text-xs">Comment</p>
          </div>
          <div className="text-center">
            <i className="fas fa-share text-green-400 text-xl mb-1"></i>
            <p className="text-xs">Share</p>
          </div>
          <div className="text-center">
            <i className="fas fa-bookmark text-yellow-400 text-xl mb-1"></i>
            <p className="text-xs">Save</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
