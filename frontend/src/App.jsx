import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  signup,
  login,
  getMe,
  getFeed,
  createPost,
  likePost,
  commentOnPost,
  sharePost,
  searchUsers,
  getUserProfile,
  getMessages,
  sendMessage,
  updateMe,
  getAdminStats,
  toggleFollow,
  deletePost,
  markMessagesRead,
  getConversations
} from './api';
import Messages from './components/Messages';

const MUSIC_LIBRARY = [
  { 
    id: 1, 
    title: 'Faded', 
    artist: 'Alan Walker', 
    duration: '3:32',
    audioUrl: '/music/Alon_Walker_-_Faded_KI3MIR_Remake_(mp3.pm).mp3'
  },
  { 
    id: 2, 
    title: 'Alone Pt. 2', 
    artist: 'Alan Walker & Ava Max', 
    duration: '2:57',
    audioUrl: '/music/Alone_walker_and_Ava_Max_-_Alone_pt_2_(mp3.pm).mp3'
  },
  { id: 3, title: 'Darkside', artist: 'Alan Walker', duration: '3:31', audioUrl: '/music/Alone_walker_and_Ava_Max_-_Alone_pt_2_(mp3.pm).mp3' },
  { id: 4, title: 'On My Way', artist: 'Alan Walker', duration: '3:13', audioUrl: '/music/Alone_walker_and_Ava_Max_-_Alone_pt_2_(mp3.pm).mp3' },
  { id: 5, title: 'The Spectre', artist: 'Alan Walker', duration: '3:13', audioUrl: '/music/Alone_walker_and_Ava_Max_-_Alone_pt_2_(mp3.pm).mp3' },
  { id: 6, title: 'Sing Me To Sleep', artist: 'Alan Walker', duration: '3:11', audioUrl: '/music/Alone_walker_and_Ava_Max_-_Alone_pt_2_(mp3.pm).mp3' },
  { id: 7, title: 'All Falls Down', artist: 'Alan Walker', duration: '3:19', audioUrl: '/music/Alon_Walker_-_Faded_KI3MIR_Remake_(mp3.pm).mp3' },
  { id: 8, title: 'Diamond Heart', artist: 'Alan Walker', duration: '4:02', audioUrl: '/music/Alon_Walker_-_Faded_KI3MIR_Remake_(mp3.pm).mp3' },
  { id: 9, title: 'Different World', artist: 'Alan Walker', duration: '3:04', audioUrl: '/music/Alon_Walker_-_Faded_KI3MIR_Remake_(mp3.pm).mp3' },
  { id: 10, title: 'Lily', artist: 'Alan Walker', duration: '3:16', audioUrl: '/music/Alon_Walker_-_Faded_KI3MIR_Remake_(mp3.pm).mp3' },
];

const VIEW_HOME = 'home';
const VIEW_CREATE = 'create';
const VIEW_SAVED = 'saved';
const VIEW_MESSAGES = 'messages';
const VIEW_PROFILE = 'profile';
const VIEW_ADMIN = 'admin';
const VIEW_MUSIC = 'music';

// ==================== FIRE PARTICLES ====================
function FireParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: '-10px',
            background: `radial-gradient(circle, ${['#ff4500', '#ff6b35', '#ff8c00', '#ffa500'][Math.floor(Math.random() * 4)]}, transparent)`,
            animation: `float ${3 + Math.random() * 4}s linear infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-100vh) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function MiniMusicPlayer({ song, isPlaying, onToggle }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current || !song?.audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, song]);

  if (!song) return null;

  const hasAudio = !!song.audioUrl;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 border border-zinc-700/50">
      {hasAudio && <audio ref={audioRef} src={song.audioUrl} loop />}
      <button
        onClick={onToggle}
        disabled={!hasAudio}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          !hasAudio 
            ? 'bg-zinc-700 cursor-not-allowed opacity-50'
            : isPlaying 
              ? 'bg-gradient-to-r from-red-600 to-orange-500 shadow-lg shadow-red-500/30' 
              : 'bg-zinc-700 hover:bg-zinc-600'
        }`}
      >
        {isPlaying ? (
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white text-sm truncate">{song.title}</div>
        <div className="text-xs text-zinc-400">
          {song.artist}
          {!hasAudio && <span className="ml-2 text-zinc-600">(No audio)</span>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {isPlaying && hasAudio && (
          <div className="flex items-center gap-0.5 h-4">
            <div className="w-1 bg-red-500 rounded-full animate-pulse" style={{ height: '60%', animationDelay: '0ms' }} />
            <div className="w-1 bg-orange-500 rounded-full animate-pulse" style={{ height: '100%', animationDelay: '150ms' }} />
            <div className="w-1 bg-yellow-500 rounded-full animate-pulse" style={{ height: '40%', animationDelay: '300ms' }} />
            <div className="w-1 bg-orange-500 rounded-full animate-pulse" style={{ height: '80%', animationDelay: '450ms' }} />
          </div>
        )}
        <span className="text-xs text-zinc-500 ml-2">{song.duration}</span>
      </div>
    </div>
  );
}
// ==================== AUTH VIEW ====================
function AuthView({ onAuth }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'consumer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!form.email || !form.password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }
    if (isSignup && !form.username) {
      setError('Username is required for signup');
      setLoading(false);
      return;
    }

    try {
      const fn = isSignup ? signup : login;
      const payload = isSignup
        ? { username: form.username, email: form.email, password: form.password, role: form.role }
        : { email: form.email, password: form.password };

      const res = await fn(payload);
      const { token, user } = res.data;
      if (!token || !user) {
        setError('Invalid auth response from server');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onAuth(token, user);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex relative overflow-hidden">
      <FireParticles />
      
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/50 via-black to-orange-900/30" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 30% 70%, rgba(255, 69, 0, 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 70% 30%, rgba(255, 140, 0, 0.2) 0%, transparent 50%)`
        }} />
        
        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 via-orange-500 to-yellow-500 flex items-center justify-center shadow-2xl shadow-red-500/50">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div>
              <span className="text-4xl font-black bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent tracking-tight">
                INFERNO
              </span>
              <div className="text-xs text-orange-400/60 font-bold tracking-[0.3em] uppercase">Social Network</div>
            </div>
          </div>
          
          <div className="space-y-8">
            <h1 className="text-7xl font-black text-white leading-[0.9] tracking-tight">
              IGNITE<br/>
              <span className="bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                YOUR
              </span><br/>
              <span className="text-zinc-400">WORLD</span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-md leading-relaxed font-medium">
              Share your fire. Connect with creators. Discover content that burns bright.
            </p>
            
            <div className="flex items-center gap-12 pt-8">
              <div className="group">
                <div className="text-5xl font-black text-transparent bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text">2M+</div>
                <div className="text-zinc-500 font-bold text-sm uppercase tracking-wider mt-1">Flames</div>
              </div>
              <div className="w-px h-16 bg-gradient-to-b from-transparent via-red-500 to-transparent" />
              <div className="group">
                <div className="text-5xl font-black text-transparent bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text">50K+</div>
                <div className="text-zinc-500 font-bold text-sm uppercase tracking-wider mt-1">Creators</div>
              </div>
              <div className="w-px h-16 bg-gradient-to-b from-transparent via-orange-500 to-transparent" />
              <div className="group">
                <div className="text-5xl font-black text-transparent bg-gradient-to-r from-yellow-500 to-red-400 bg-clip-text">10M+</div>
                <div className="text-zinc-500 font-bold text-sm uppercase tracking-wider mt-1">Posts</div>
              </div>
            </div>
          </div>
          
          <div className="text-zinc-600 text-sm font-medium">
            © {new Date().getFullYear()} INFERNO. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 via-orange-500 to-yellow-500 flex items-center justify-center shadow-xl shadow-red-500/40">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              </svg>
            </div>
            <span className="text-3xl font-black bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              INFERNO
            </span>
          </div>

          <div className="mb-10">
            <h2 className="text-4xl font-black text-white tracking-tight">
              {isSignup ? 'Join the Fire' : 'Welcome Back'}
            </h2>
            <p className="text-zinc-500 mt-3 font-medium text-lg">
              {isSignup ? 'Create your account and start burning' : 'Sign in to continue your journey'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignup && (
              <div className="group">
                <label className="block text-sm font-bold text-orange-400 mb-2">Username</label>
                <input 
                  name="username" 
                  value={form.username} 
                  onChange={handleChange} 
                  placeholder="your_name" 
                  className="w-full rounded-xl bg-zinc-900/80 border-2 border-zinc-700 px-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:bg-zinc-900 transition-all duration-300 font-medium"
                />
              </div>
            )}

            <div className="group">
              <label className="block text-sm font-bold text-orange-400 mb-2">Email Address</label>
              <input 
                type="email" 
                name="email" 
                value={form.email} 
                onChange={handleChange} 
                placeholder="you@example.com" 
                className="w-full rounded-xl bg-zinc-900/80 border-2 border-zinc-700 px-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:bg-zinc-900 transition-all duration-300 font-medium"
              />
            </div>

            <div className="group">
              <label className="block text-sm font-bold text-orange-400 mb-2">Password</label>
              <input 
                type="password" 
                name="password" 
                value={form.password} 
                onChange={handleChange} 
                placeholder="••••••••" 
                className="w-full rounded-xl bg-zinc-900/80 border-2 border-zinc-700 px-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:bg-zinc-900 transition-all duration-300 font-medium"
              />
            </div>

            {isSignup && (
              <div>
                <label className="block text-sm font-bold text-orange-400 mb-3">Account Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button" 
                    onClick={() => setForm(p => ({ ...p, role: 'consumer' }))} 
                    className={`p-5 rounded-xl border-2 text-left transition-all duration-300 ${
                      form.role === 'consumer' 
                        ? 'bg-gradient-to-br from-red-600/20 to-orange-600/20 border-red-500 shadow-lg shadow-red-500/20' 
                        : 'bg-zinc-900/50 border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${form.role === 'consumer' ? 'bg-red-500/30' : 'bg-zinc-800'}`}>
                        <svg className={`w-5 h-5 ${form.role === 'consumer' ? 'text-red-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <span className={`font-bold ${form.role === 'consumer' ? 'text-white' : 'text-zinc-400'}`}>Explorer</span>
                    </div>
                    <div className={`text-xs font-medium ${form.role === 'consumer' ? 'text-orange-300' : 'text-zinc-600'}`}>Discover & engage</div>
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => setForm(p => ({ ...p, role: 'creator' }))} 
                    className={`p-5 rounded-xl border-2 text-left transition-all duration-300 ${
                      form.role === 'creator' 
                        ? 'bg-gradient-to-br from-orange-600/20 to-yellow-600/20 border-orange-500 shadow-lg shadow-orange-500/20' 
                        : 'bg-zinc-900/50 border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${form.role === 'creator' ? 'bg-orange-500/30' : 'bg-zinc-800'}`}>
                        <svg className={`w-5 h-5 ${form.role === 'creator' ? 'text-orange-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                      <span className={`font-bold ${form.role === 'creator' ? 'text-white' : 'text-zinc-400'}`}>Creator</span>
                    </div>
                    <div className={`text-xs font-medium ${form.role === 'creator' ? 'text-yellow-300' : 'text-zinc-600'}`}>Share your fire</div>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-red-300 font-medium">{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 hover:from-red-500 hover:via-orange-400 hover:to-yellow-400 shadow-xl shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                <span>🔥 {isSignup ? 'Create Account' : 'Sign In'}</span>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-4">
            <span className="text-zinc-500 font-medium">
              {isSignup ? 'Already burning?' : "New to the fire?"}
            </span>
            <button 
              type="button" 
              onClick={() => { setIsSignup(!isSignup); setError(''); }} 
              className="font-bold text-transparent bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text hover:from-red-300 hover:to-orange-300 transition-all"
            >
              {isSignup ? 'Sign In' : 'Join Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== SEARCH USERS ====================
function SearchUsers({ onSelect, me, onToggleFollow }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    let active = true;
    if (q.trim()) {
      searchUsers(q).then(res => { if (active) setResults(res.data || []); }).catch(() => { if (active) setResults([]); });
    } else {
      setResults([]);
    }
    return () => { active = false; };
  }, [q]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          value={q} 
          onChange={e => setQ(e.target.value)} 
          placeholder="Search users..." 
          className="w-full rounded-xl bg-zinc-800/50 border border-zinc-700 pl-12 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-all"
        />
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
        {results.map(u => (
          <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/50 hover:border-red-500/50 hover:bg-zinc-800/50 transition-all group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ring-2 ring-black">
              {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : u.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-sm truncate group-hover:text-red-400 transition-colors">{u.username}</div>
              <div className="text-xs text-zinc-500 capitalize">{u.role}</div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={e => { e.stopPropagation(); onToggleFollow?.(u._id); }} 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  me?.following?.includes(u._id) 
                    ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' 
                    : 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-500 hover:to-orange-400'
                }`}
              >
                {me?.following?.includes(u._id) ? 'Following' : 'Follow'}
              </button>
              <button 
                type="button" 
                onClick={e => { e.stopPropagation(); onSelect?.(u); }} 
                className="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {results.length === 0 && q && (
          <div className="text-center py-8 text-zinc-500">No users found</div>
        )}
      </div>
    </div>
  );
}

// ==================== APP SHELL ====================
function AppShell({ user, onLogout, socket }) {
  const [view, setView] = useState(VIEW_HOME);
  const [feed, setFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [me, setMe] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ username: user.username, email: user.email, password: '', bio: '' });
  const [savedIds, setSavedIds] = useState(() => { try { return JSON.parse(localStorage.getItem('inferno_saved') || '[]'); } catch { return []; } });
  const [createImageDataUrl, setCreateImageDataUrl] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [headerQ, setHeaderQ] = useState('');
  const [headerResults, setHeaderResults] = useState([]);
  const [headerLoading, setHeaderLoading] = useState(false);
  const [showHeaderResults, setShowHeaderResults] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [stats, setStats] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Music state - track which post's song is playing
  const [playingPostId, setPlayingPostId] = useState(null);

  useEffect(() => {
    getMe().then(res => {
      const normalized = { ...res.data, followers: (res.data.followers || []).map(id => id.toString()), following: (res.data.following || []).map(id => id.toString()) };
      setMe(normalized);
      setProfileForm(p => ({ ...p, username: normalized.username, email: normalized.email, bio: normalized.bio || '' }));
    }).catch(() => {});
  }, []);

  const refreshFeed = async () => {
    try { setLoadingFeed(true); const res = await getFeed(); setFeed(res.data || []); }
    catch { setFeed([]); }
    finally { setLoadingFeed(false); }
  };

  useEffect(() => { if ([VIEW_HOME, VIEW_SAVED, VIEW_PROFILE].includes(view)) refreshFeed(); }, [view]);

  useEffect(() => {
    let active = true, timer = setTimeout(async () => {
      if (!headerQ?.trim()) { setHeaderResults([]); setHeaderLoading(false); return; }
      try { setHeaderLoading(true); const res = await searchUsers(headerQ.trim()); if (active) setHeaderResults(res.data || []); }
      catch { if (active) setHeaderResults([]); }
      finally { if (active) setHeaderLoading(false); }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [headerQ]);

  useEffect(() => { if (view === VIEW_ADMIN && user.role === 'admin') getAdminStats().then(res => setStats(res.data)).catch(() => setStats(null)); }, [view, user.role]);

  useEffect(() => {
    getConversations().then(res => {
      const counts = {};
      (res.data || []).forEach(c => { counts[c.user._id || c.user.id] = c.unreadCount || 0; });
      setUnreadCounts(counts);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = msg => {
      if (msg.to === user.id) setUnreadCounts(p => ({ ...p, [msg.from]: (p[msg.from] || 0) + 1 }));
    };
    const readHandler = p => { if (p?.from) setUnreadCounts(prev => ({ ...prev, [p.from]: 0 })); };
    socket.on('message:new', handler);
    socket.on('message:read', readHandler);
    return () => { socket.off('message:new', handler); socket.off('message:read', readHandler); };
  }, [socket, user.id]);

  // Toggle music for a specific post
  const togglePostMusic = (postId) => {
    if (playingPostId === postId) {
      setPlayingPostId(null); // Stop playing
    } else {
      setPlayingPostId(postId); // Start playing this post's song
    }
  };

  const openProfile = async u => {
    try { const res = await getUserProfile(u._id || u.id); setProfileUser(res.data); setView(VIEW_PROFILE); }
    catch { alert('Failed to load profile'); }
  };

  const openChat = async u => {
    setUnreadCounts(p => ({ ...p, [u._id]: 0 }));
    try { await markMessagesRead(u._id || u.id); } catch {}
    setView(VIEW_MESSAGES);
  };

  const handleLike = async postId => { try { await likePost(postId); refreshFeed(); } catch {} };

  const handleToggleFollow = async targetId => {
    try { const res = await toggleFollow(targetId); setMe(p => p ? { ...p, following: res.data.following } : p); }
    catch {}
  };

  const handleShare = async post => {
    try {
      const full = me || (await getMe().then(r => r.data));
      if (!full?.following?.length) { alert('You are not following anyone yet.'); return; }
      if (!window.confirm(`Share with ${full.following.length} followers?`)) return;
      await Promise.all(full.following.map(id => sendMessage(id, { text: post.caption ? `Check this out: "${post.caption.slice(0, 50)}..."` : 'Shared a post', postId: post._id })));
      await sharePost(post._id);
      refreshFeed();
      alert('Shared successfully!');
    } catch { alert('Failed to share.'); }
  };

  const handleToggleSave = postId => {
    setSavedIds(prev => {
      const set = new Set(prev);
      set.has(postId) ? set.delete(postId) : set.add(postId);
      const arr = Array.from(set);
      localStorage.setItem('inferno_saved', JSON.stringify(arr));
      return arr;
    });
  };

  const handleCreatePost = async e => {
    e.preventDefault();
    const caption = new FormData(e.target).get('caption');
    if (!caption && !createImageDataUrl) return;
    try {
      const postData = { 
        caption, 
        imageUrl: createImageDataUrl || '',
        song: selectedSong ? { id: selectedSong.id, title: selectedSong.title, artist: selectedSong.artist, duration: selectedSong.duration } : null
      };
      const res = await createPost(postData);
      setFeed(p => [res.data, ...p]);
      e.target.reset();
      setCreateImageDataUrl(null);
      setSelectedSong(null);
      alert('Post created!');
      setView(VIEW_HOME);
    } catch {}
  };

  const handleProfileSave = async e => {
    e.preventDefault();
    try {
      const payload = { username: profileForm.username, email: profileForm.email, bio: profileForm.bio };
      if (profileForm.password?.trim()) payload.password = profileForm.password.trim();
      const res = await updateMe(payload);
      setMe(res.data);
      localStorage.setItem('user', JSON.stringify({ ...user, username: res.data.username, email: res.data.email }));
      setIsEditingProfile(false);
    } catch { alert('Failed to update profile'); }
  };

  const handleAvatarChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => { try { const res = await updateMe({ avatarUrl: reader.result }); setMe(res.data); } catch { alert('Failed to update avatar'); } };
    reader.readAsDataURL(file);
  };

  const handleDeletePost = async postId => {
    if (!window.confirm('Delete this post?')) return;
    try { await deletePost(postId); setFeed(p => p.filter(x => x._id !== postId)); } catch {}
  };

  const currentUser = me || user;
  const safeFeed = (feed || []).filter(p => p?.author?._id);
  const savedPosts = safeFeed.filter(p => savedIds.includes(p._id));
  const displayedUser = profileUser?.user || me || user;
  const displayedFollowers = profileUser?.user?.followers || me?.followers || [];
  const displayedFollowing = profileUser?.user?.following || me?.following || [];
  const profilePosts = profileUser?.posts || safeFeed.filter(p => {
    const aid = p.author?._id || p.author;
    return aid && displayedUser && (aid.toString?.() === (displayedUser._id || displayedUser.id)?.toString());
  });
  const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + (n || 0), 0);

  const navItems = [
    { id: VIEW_HOME, label: 'Feed', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    )},
    { id: VIEW_CREATE, label: 'Create', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    )},
    { id: VIEW_SAVED, label: 'Saved', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    )},
    { id: VIEW_MESSAGES, label: 'DMs', badge: totalUnread, icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )},
    { id: VIEW_PROFILE, label: 'Profile', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )}
  ];
  
  if (user.role === 'admin') navItems.push({ 
    id: VIEW_ADMIN, 
    label: 'Admin', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  });

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      <FireParticles />
      
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <button 
              onClick={() => { setProfileUser(null); setView(VIEW_HOME); }} 
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-600 via-orange-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-all group-hover:scale-105">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                </svg>
              </div>
              <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent hidden sm:block tracking-tight">
                INFERNO
              </span>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setProfileUser(null); setView(item.id); }}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    view === item.id 
                      ? 'text-white bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/50 shadow-lg shadow-red-500/20' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  <span className={view === item.id ? 'text-red-400' : ''}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={headerQ}
                  onChange={e => { setHeaderQ(e.target.value); setShowHeaderResults(true); }}
                  onFocus={() => setShowHeaderResults(true)}
                  onBlur={() => setTimeout(() => setShowHeaderResults(false), 200)}
                  placeholder="Search..."
                  className="w-40 lg:w-56 rounded-xl bg-zinc-900/50 border border-zinc-700/50 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 focus:bg-zinc-900 transition-all"
                />
                {showHeaderResults && (headerLoading || headerResults.length > 0 || headerQ) && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl shadow-black/50 z-50 max-h-80 overflow-hidden">
                    <div className="p-3">
                      {headerLoading && (
                        <div className="flex items-center justify-center py-6">
                          <svg className="animate-spin h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        </div>
                      )}
                      {!headerLoading && headerResults.length === 0 && headerQ && (
                        <div className="text-center py-6 text-zinc-500">No results found</div>
                      )}
                      {!headerLoading && headerResults.map(u => (
                        <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800 transition-all cursor-pointer">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white font-bold">
                            {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : u.username?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white truncate">{u.username}</div>
                            <div className="text-xs text-zinc-500 capitalize">{u.role}</div>
                          </div>
                          <button
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => { setShowHeaderResults(false); openProfile(u); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-700 text-white hover:bg-zinc-600 transition-all"
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { setProfileUser(null); setView(VIEW_PROFILE); }}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white font-bold ring-2 ring-black hover:ring-red-500/50 transition-all"
                >
                  {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : currentUser.username?.[0]?.toUpperCase()}
                </button>
                <button 
                  onClick={onLogout} 
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
              >
                {mobileMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-800 bg-black/95 backdrop-blur-xl">
            <div className="p-4 space-y-2">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setProfileUser(null); setView(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    view === item.id 
                      ? 'text-white bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/50' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        
        {/* ==================== HOME VIEW ==================== */}
        {view === VIEW_HOME && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Feed */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 bg-clip-text">
                    Your Feed
                  </h1>
                  <p className="text-zinc-500 text-sm mt-1">See what's burning 🔥</p>
                </div>
                <button 
                  onClick={refreshFeed} 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-zinc-400 border border-zinc-700 hover:border-red-500/50 hover:text-white hover:bg-zinc-800/50 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>

              {loadingFeed ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-600 to-orange-500 animate-pulse flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                  <p className="text-zinc-500 font-medium">Loading the fire...</p>
                </div>
              ) : safeFeed.length === 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 sm:p-16 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600/20 to-orange-600/20 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No posts yet</h3>
                  <p className="text-zinc-500">Follow some creators to see their fire content!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {safeFeed.map((post, idx) => {
                    const isSaved = savedIds.includes(post._id);
                    // Assign a song to each post (from post data or random from library)
                    const postSong = post.song || MUSIC_LIBRARY[idx % MUSIC_LIBRARY.length];
                    const isThisPostPlaying = playingPostId === post._id;
                    
                    return (
                      <article 
                        key={post._id} 
                        className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-red-500/30 transition-all duration-300 group"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 sm:p-5">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white font-bold text-lg ring-2 ring-black">
                              {post.author?.avatarUrl ? <img src={post.author.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : post.author?.username?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-white group-hover:text-red-400 transition-colors">{post.author?.username}</div>
                              <div className="text-xs text-zinc-500 capitalize">{post.author?.role}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {(post.author?._id === currentUser.id || currentUser.role === 'admin') && (
                              <button 
                                onClick={() => handleDeletePost(post._id)} 
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all"
                              >
                                Delete
                              </button>
                            )}
                            {post.author?._id && post.author._id !== currentUser.id && (
                              <button 
                                onClick={() => handleToggleFollow(post.author._id)} 
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                                  me?.following?.includes(post.author._id) 
                                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' 
                                    : 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-500 hover:to-orange-400 shadow-lg shadow-red-500/25'
                                }`}
                              >
                                {me?.following?.includes(post.author._id) ? 'Following' : 'Follow'}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Song - Inline Player (Click to Play) */}
                        {postSong && (
                          <div className="mx-4 sm:mx-5 mb-3">
                            <MiniMusicPlayer 
                              song={postSong}
                              isPlaying={isThisPostPlaying}
                              onToggle={() => togglePostMusic(post._id)}
                            />
                          </div>
                        )}
                        
                        {/* Image */}
                        {post.imageUrl && (
                          <div className="relative bg-black">
                            <img src={post.imageUrl} alt="" className="w-full max-h-[500px] object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                        
                        {/* Content */}
                        <div className="p-4 sm:p-5">
                          {/* Actions */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <button 
                                onClick={() => handleLike(post._id)} 
                                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all group/btn"
                              >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span className="font-bold text-sm">{post.likes?.length || 0}</span>
                              </button>
                              <button className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-zinc-400 hover:text-orange-400 hover:bg-orange-500/10 transition-all group/btn">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span className="font-bold text-sm">{post.comments?.length || 0}</span>
                              </button>
                              <button 
                                onClick={() => handleShare(post)} 
                                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-zinc-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all group/btn"
                              >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                <span className="font-bold text-sm">{post.shares || 0}</span>
                              </button>
                            </div>
                            <button 
                              onClick={() => handleToggleSave(post._id)} 
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                isSaved 
                                  ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/30' 
                                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                              }`}
                            >
                              <svg className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Caption */}
                          {post.caption && (
                            <p className="text-zinc-300 mb-4">
                              <span className="font-bold text-red-400 mr-2">{post.author?.username}</span>
                              <span>{post.caption}</span>
                            </p>
                          )}
                          
                          {/* Comments */}
                          {post.comments?.length > 0 && (
                            <div className="space-y-2 mb-4 max-h-32 overflow-y-auto custom-scrollbar">
                              {post.comments.slice(-3).map(c => (
                                <div key={c._id || c.createdAt} className="text-sm">
                                  <span className="font-bold text-orange-400 mr-2">{c.user?.username}</span>
                                  <span className="text-zinc-400">{c.text}</span>
                                </div>
                              ))}
                              {post.comments.length > 3 && (
                                <button className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors">
                                  View all {post.comments.length} comments
                                </button>
                              )}
                            </div>
                          )}
                          
                          {/* Comment Form */}
                          <form 
                            className="flex items-center gap-3 pt-4 border-t border-zinc-800" 
                            onSubmit={async e => {
                              e.preventDefault();
                              const text = new FormData(e.target).get('text');
                              if (!text) return;
                              try { 
                                const res = await commentOnPost(post._id, text); 
                                setFeed(p => p.map(x => x._id === post._id ? { ...x, comments: [...(x.comments || []), res.data] } : x)); 
                                e.target.reset(); 
                              } catch {}
                            }}
                          >
                            <input 
                              name="text" 
                              placeholder="Add a comment..." 
                              className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-all" 
                            />
                            <button 
                              type="submit" 
                              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-500 hover:to-orange-400 transition-all"
                            >
                              Post
                            </button>
                          </form>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block lg:col-span-4 space-y-6">
              {/* Profile Card */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="h-20 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500" />
                <div className="p-6 -mt-10">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white font-bold text-2xl ring-4 ring-zinc-900 mb-4">
                    {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : currentUser.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="font-bold text-white text-lg">{currentUser.username}</div>
                  <div className="text-sm text-zinc-500 capitalize mb-4">{currentUser.role}</div>
                  
                  <div className="grid grid-cols-3 gap-4 py-4 border-y border-zinc-800">
                    <div className="text-center">
                      <div className="font-black text-xl text-transparent bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text">
                        {safeFeed.filter(p => (p.author?._id || p.author)?.toString() === (currentUser._id || currentUser.id)?.toString()).length}
                      </div>
                      <div className="text-xs text-zinc-500 uppercase tracking-wide">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="font-black text-xl text-transparent bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text">
                        {me?.followers?.length || 0}
                      </div>
                      <div className="text-xs text-zinc-500 uppercase tracking-wide">Flames</div>
                    </div>
                    <div className="text-center">
                      <div className="font-black text-xl text-transparent bg-gradient-to-r from-yellow-500 to-red-400 bg-clip-text">
                        {me?.following?.length || 0}
                      </div>
                      <div className="text-xs text-zinc-500 uppercase tracking-wide">Following</div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setView(VIEW_PROFILE)} 
                    className="w-full mt-4 py-3 rounded-xl font-semibold text-zinc-300 border border-zinc-700 hover:border-red-500/50 hover:text-white hover:bg-zinc-800/50 transition-all"
                  >
                    View Profile
                  </button>
                </div>
              </div>

                            {/* Search */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Find Creators
                </h3>
                <SearchUsers onSelect={openChat} me={me} onToggleFollow={handleToggleFollow} />
              </div>

              {/* Trending Songs */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                  Trending Tracks
                </h3>
                <div className="space-y-2">
                  {MUSIC_LIBRARY.slice(0, 5).map((song, idx) => (
                    <div 
                      key={song.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-all group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600/50 to-orange-600/50 flex items-center justify-center text-white text-xs font-bold group-hover:from-red-600 group-hover:to-orange-500 transition-all">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-zinc-300 group-hover:text-white truncate">{song.title}</div>
                        <div className="text-xs text-zinc-500">{song.artist}</div>
                      </div>
                      <span className="text-xs text-zinc-600">{song.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== CREATE VIEW ==================== */}
        {view === VIEW_CREATE && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-transparent bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 bg-clip-text">
                Create Post
              </h1>
              <p className="text-zinc-500 mt-2">Share something fire with the world 🔥</p>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
              {user.role !== 'creator' && user.role !== 'admin' ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600/20 to-orange-600/20 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Creator Access Only</h3>
                  <p className="text-zinc-500">Upgrade to a creator account to start posting fire content</p>
                </div>
              ) : (
                <form onSubmit={handleCreatePost} className="p-6 sm:p-8 space-y-6">
                  {/* Caption */}
                  <div>
                    <label className="block text-sm font-bold text-orange-400 mb-2">Caption</label>
                    <textarea 
                      name="caption" 
                      rows={4} 
                      placeholder="What's on your mind? 🔥" 
                      className="w-full rounded-xl bg-zinc-800/50 border border-zinc-700 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 resize-none transition-all"
                    />
                  </div>
                  
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-bold text-orange-400 mb-2">Image</label>
                    <div className="mt-2">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-red-600 file:to-orange-500 file:text-white hover:file:from-red-500 hover:file:to-orange-400 cursor-pointer"
                        onChange={e => {
                          const f = e.target.files?.[0]; 
                          if (!f) { setCreateImageDataUrl(null); return; }
                          const r = new FileReader(); 
                          r.onload = () => setCreateImageDataUrl(r.result); 
                          r.readAsDataURL(f);
                        }} 
                      />
                      {createImageDataUrl && (
                        <div className="mt-4 relative group">
                          <img src={createImageDataUrl} alt="Preview" className="w-full max-h-72 object-cover rounded-xl border border-zinc-700" />
                          <button 
                            type="button" 
                            onClick={() => setCreateImageDataUrl(null)} 
                            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/80 text-red-400 hover:text-red-300 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Music Selection */}
                  <div>
                    <label className="block text-sm font-bold text-orange-400 mb-3">Add Music (Alan Walker)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                      {MUSIC_LIBRARY.map(song => (
                        <div 
                          key={song.id}
                          onClick={() => setSelectedSong(selectedSong?.id === song.id ? null : song)}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedSong?.id === song.id 
                              ? 'bg-gradient-to-r from-red-600/20 to-orange-600/20 border-red-500/50' 
                              : 'bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            selectedSong?.id === song.id 
                              ? 'bg-gradient-to-br from-red-600 to-orange-500' 
                              : 'bg-zinc-700'
                          }`}>
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-semibold truncate ${selectedSong?.id === song.id ? 'text-white' : 'text-zinc-300'}`}>
                              {song.title}
                            </div>
                            <div className="text-xs text-zinc-500">{song.artist} • {song.duration}</div>
                          </div>
                          {selectedSong?.id === song.id && (
                            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {selectedSong && (
                      <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-red-600/10 to-orange-600/10 border border-red-500/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-white">Selected: {selectedSong.title}</div>
                            <div className="text-xs text-zinc-400">{selectedSong.artist}</div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setSelectedSong(null)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setView(VIEW_HOME)} 
                      className="flex-1 py-3 rounded-xl font-semibold text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 shadow-lg shadow-red-500/25 transition-all"
                    >
                      🔥 Publish Post
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ==================== SAVED VIEW ==================== */}
        {view === VIEW_SAVED && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-black text-transparent bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 bg-clip-text">
                Saved Posts
              </h1>
              <p className="text-zinc-500 mt-2">Your collection of fire content 🔖</p>
            </div>
            
            {savedPosts.length === 0 ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 sm:p-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600/20 to-orange-600/20 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No saved posts</h3>
                <p className="text-zinc-500">Save posts to view them here later</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {savedPosts.map(post => (
                  <article 
                    key={post._id} 
                    className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-red-500/30 transition-all group"
                  >
                    {post.imageUrl ? (
                      <div className="relative aspect-square">
                        <img src={post.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                              {post.author?.username?.[0]?.toUpperCase()}
                            </div>
                            <span className="text-sm font-bold text-white">{post.author?.username}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                            {post.author?.username?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-white">{post.author?.username}</span>
                        </div>
                        <p className="text-zinc-400 text-sm line-clamp-4">{post.caption}</p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== MESSAGES VIEW ==================== */}
        {view === VIEW_MESSAGES && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-black text-transparent bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 bg-clip-text">
                Messages
              </h1>
              <p className="text-zinc-500 mt-2">Your conversations 💬</p>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl h-[calc(100vh-300px)] sm:h-[600px] overflow-hidden">
              <Messages 
                currentUser={{ id: user.id || user._id, _id: user.id || user._id, username: user.username, avatarUrl: user.avatarUrl || me?.avatarUrl }} 
                socket={socket} 
              />
            </div>
          </div>
        )}

        {/* ==================== PROFILE VIEW ==================== */}
        {view === VIEW_PROFILE && (
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            {/* Profile Header */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
              {/* Cover */}
              <div className="h-32 sm:h-48 bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 relative">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 30% 50%, rgba(255, 69, 0, 0.4) 0%, transparent 50%),
                                   radial-gradient(circle at 70% 80%, rgba(255, 140, 0, 0.3) 0%, transparent 50%)`
                }} />
              </div>
              
              <div className="p-6 sm:p-8 -mt-12 sm:-mt-16">

                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white font-black text-4xl sm:text-5xl ring-4 ring-zinc-900 shadow-xl shadow-red-500/30">
                      {displayedUser?.avatarUrl 
                        ? <img src={displayedUser.avatarUrl} alt="" className="w-full h-full rounded-2xl object-cover" /> 
                        : displayedUser?.username?.[0]?.toUpperCase()
                      }
                    </div>
                    {me && displayedUser && (me._id || me.id)?.toString() === (displayedUser._id || displayedUser.id)?.toString() && (
                      <label className="absolute bottom-2 right-2 w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-all hover:border-red-500/50">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                      </label>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <h1 className="text-2xl sm:text-3xl font-black text-white">{displayedUser?.username}</h1>
                      <span className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wide">
                        {displayedUser?.role}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-6 mb-4">
                      <div>
                        <span className="font-black text-xl text-transparent bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text">
                          {profilePosts?.length || 0}
                        </span>
                        <span className="text-zinc-500 ml-2">posts</span>
                      </div>
                      <div>
                        <span className="font-black text-xl text-transparent bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text">
                          {displayedFollowers?.length || 0}
                        </span>
                        <span className="text-zinc-500 ml-2">flames</span>
                      </div>
                      <div>
                        <span className="font-black text-xl text-transparent bg-gradient-to-r from-yellow-500 to-red-400 bg-clip-text">
                          {displayedFollowing?.length || 0}
                        </span>
                        <span className="text-zinc-500 ml-2">following</span>
                      </div>
                    </div>
                    
                    {!isEditingProfile && (
                      <p className="text-zinc-400">{me?.bio || 'No bio yet.'}</p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-3">
                    {me && displayedUser && (me._id || me.id)?.toString() === (displayedUser._id || displayedUser.id)?.toString() ? (
                      <button 
                        onClick={() => setIsEditingProfile(v => !v)} 
                        className="px-5 py-2.5 rounded-xl font-semibold text-zinc-300 border border-zinc-700 hover:border-red-500/50 hover:text-white transition-all"
                      >
                        {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleToggleFollow(displayedUser._id || displayedUser.id)} 
                          className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                            me?.following?.includes((displayedUser._id || displayedUser.id)?.toString()) 
                              ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' 
                              : 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-500 hover:to-orange-400 shadow-lg shadow-red-500/25'
                          }`}
                        >
                          {me?.following?.includes((displayedUser._id || displayedUser.id)?.toString()) ? 'Following' : 'Follow'}
                        </button>
                        <button 
                          onClick={() => openChat(displayedUser)} 
                          className="px-5 py-2.5 rounded-xl font-semibold text-zinc-300 border border-zinc-700 hover:border-red-500/50 hover:text-white transition-all"
                        >
                          Message
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Edit Form */}
                {isEditingProfile && (
                  <form onSubmit={handleProfileSave} className="mt-8 pt-8 border-t border-zinc-800 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-orange-400 mb-2">Username</label>
                        <input 
                          value={profileForm.username} 
                          onChange={e => setProfileForm(p => ({ ...p, username: e.target.value }))} 
                          className="w-full rounded-xl bg-zinc-800/50 border border-zinc-700 px-4 py-3 text-white focus:outline-none focus:border-red-500/50 transition-all" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-orange-400 mb-2">Email</label>
                        <input 
                          type="email" 
                          value={profileForm.email} 
                          onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} 
                          className="w-full rounded-xl bg-zinc-800/50 border border-zinc-700 px-4 py-3 text-white focus:outline-none focus:border-red-500/50 transition-all" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-orange-400 mb-2">New Password</label>
                      <input 
                        type="password" 
                        value={profileForm.password} 
                        onChange={e => setProfileForm(p => ({ ...p, password: e.target.value }))} 
                        placeholder="Leave blank to keep current" 
                        className="w-full rounded-xl bg-zinc-800/50 border border-zinc-700 px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-orange-400 mb-2">Bio</label>
                      <textarea 
                        rows={3} 
                        value={profileForm.bio} 
                        onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} 
                        className="w-full rounded-xl bg-zinc-800/50 border border-zinc-700 px-4 py-3 text-white focus:outline-none focus:border-red-500/50 resize-none transition-all" 
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 shadow-lg shadow-red-500/25 transition-all"
                    >
                      Save Changes
                    </button>
                  </form>
                )}
              </div>
            </div>
            
            {/* Profile Posts */}
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Posts
              </h2>
              
              {!profilePosts?.length ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 sm:p-16 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600/20 to-orange-600/20 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No posts yet</h3>
                  <p className="text-zinc-500">Posts will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 sm:gap-2">
                  {profilePosts.map(p => (
                    <div 
                      key={p._id} 
                      className="aspect-square bg-zinc-800 rounded-lg sm:rounded-xl overflow-hidden group cursor-pointer"
                    >
                      {p.imageUrl ? (
                        <img 
                          src={p.imageUrl} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-zinc-800 to-zinc-900">
                          <p className="text-xs text-zinc-500 text-center line-clamp-3">{p.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== ADMIN VIEW ==================== */}
        {view === VIEW_ADMIN && user.role === 'admin' && (
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h1 className="text-3xl font-black text-transparent bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 bg-clip-text">
                Admin Dashboard
              </h1>
              <p className="text-zinc-500 mt-2">Monitor and manage the platform 🛡️</p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {stats ? (
                <>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-red-500/30 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600/20 to-orange-600/20 flex items-center justify-center mb-4 group-hover:from-red-600/30 group-hover:to-orange-600/30 transition-all">
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-transparent bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text">
                      {stats.users}
                    </div>
                    <div className="text-sm text-zinc-500 font-medium uppercase tracking-wide mt-1">Users</div>
                  </div>
                  
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/30 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-600/20 to-yellow-600/20 flex items-center justify-center mb-4 group-hover:from-orange-600/30 group-hover:to-yellow-600/30 transition-all">
                      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-transparent bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text">
                      {stats.posts}
                    </div>
                    <div className="text-sm text-zinc-500 font-medium uppercase tracking-wide mt-1">Posts</div>
                  </div>
                  
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-yellow-500/30 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-600/20 to-red-600/20 flex items-center justify-center mb-4 group-hover:from-yellow-600/30 group-hover:to-red-600/30 transition-all">
                      <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-transparent bg-gradient-to-r from-yellow-500 to-red-400 bg-clip-text">
                      {stats.likes}
                    </div>
                    <div className="text-sm text-zinc-500 font-medium uppercase tracking-wide mt-1">Likes</div>
                  </div>
                  
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-red-500/30 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600/20 to-orange-600/20 flex items-center justify-center mb-4 group-hover:from-red-600/30 group-hover:to-orange-600/30 transition-all">
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-transparent bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text">
                      {stats.messages}
                    </div>
                    <div className="text-sm text-zinc-500 font-medium uppercase tracking-wide mt-1">Messages</div>
                  </div>
                </>
              ) : (
                <div className="col-span-4 flex items-center justify-center py-16">
                  <svg className="animate-spin h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
            </div>
            
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Users by Role */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                  <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Users by Role
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-zinc-400 font-medium">Explorers</span>
                        <span className="font-bold text-white">{stats.roles?.consumer || 0}</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-600 to-orange-500 rounded-full transition-all duration-500" 
                          style={{width: `${stats.users ? ((stats.roles?.consumer || 0) / stats.users * 100) : 0}%`}}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-zinc-400 font-medium">Creators</span>
                        <span className="font-bold text-white">{stats.roles?.creator || 0}</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full transition-all duration-500" 
                          style={{width: `${stats.users ? ((stats.roles?.creator || 0) / stats.users * 100) : 0}%`}}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-zinc-400 font-medium">Admins</span>
                        <span className="font-bold text-white">{stats.roles?.admin || 0}</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-500 to-red-500 rounded-full transition-all duration-500" 
                          style={{width: `${stats.users ? ((stats.roles?.admin || 0) / stats.users * 100) : 0}%`}}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                  <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:border-red-500/30 hover:bg-zinc-800 transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600/20 to-orange-600/20 flex items-center justify-center group-hover:from-red-600/30 group-hover:to-orange-600/30 transition-all">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-zinc-300">Manage Users</span>
                    </button>
                    
                    <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:border-orange-500/30 hover:bg-zinc-800 transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600/20 to-yellow-600/20 flex items-center justify-center group-hover:from-orange-600/30 group-hover:to-yellow-600/30 transition-all">
                        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-zinc-300">View Reports</span>
                    </button>
                    
                    <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:border-yellow-500/30 hover:bg-zinc-800 transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-600/20 to-red-600/20 flex items-center justify-center group-hover:from-yellow-600/30 group-hover:to-red-600/30 transition-all">
                        <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-zinc-300">Settings</span>
                    </button>
                    
                    <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:border-red-500/30 hover:bg-zinc-800 transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600/20 to-orange-600/20 flex items-center justify-center group-hover:from-red-600/30 group-hover:to-orange-600/30 transition-all">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-zinc-300">Export Data</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-black/80 backdrop-blur-xl mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                </svg>
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                INFERNO
              </span>
            </div>
            
            {/* Links */}
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
              <button className="px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-all">
                About
              </button>
              <button className="px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-all">
                Help
              </button>
              <button className="px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-all">
                Privacy
              </button>
              <button className="px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-all">
                Terms
              </button>
            </div>
            
            {/* Copyright */}
            <div className="text-sm text-zinc-600 font-medium">
              © {new Date().getFullYear()} INFERNO
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(39, 39, 42, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #ef4444, #f97316);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #dc2626, #ea580c);
        }
      `}</style>
    </div>
  );
}

// ==================== MAIN APP COMPONENT ====================
function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => { 
    try { 
      return JSON.parse(localStorage.getItem('user') || 'null'); 
    } catch { 
      localStorage.clear(); 
      return null; 
    } 
  });
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) { 
      socket?.disconnect(); 
      setSocket(null); 
      return; 
    }
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
    const s = io(base, { auth: { token } });
    setSocket(s);
    return () => s.disconnect();
  }, [token]);

  const handleAuth = (tok, u) => { 
    setToken(tok); 
    setUser(u); 
  };
  
  const handleLogout = () => { 
    localStorage.clear(); 
    setToken(null); 
    setUser(null); 
  };

  if (!token || !user) return <AuthView onAuth={handleAuth} />;
  return <AppShell user={user} onLogout={handleLogout} socket={socket} />;
}

export default App;