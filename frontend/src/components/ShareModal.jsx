import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const ShareModal = ({ post, onClose }) => {
  const { user } = useAuth();
  const [following, setFollowing] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => { 
    fetchFollowing(); 
    fetchSuggested();
  }, []);

  const fetchFollowing = async () => {
    try {
      const res = await api.get(`/users/${user._id}/following`);
      setFollowing(res.data);
    } catch (err) {
      console.error('Error fetching following:', err);
    }
    setLoading(false);
  };

  const fetchSuggested = async () => {
    try {
      const res = await api.get('/users/suggested');
      setSuggested(res.data);
    } catch (err) {
      console.error('Error fetching suggested:', err);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) { 
      setSearchResults([]); 
      return; 
    }
    try {
      const res = await api.get(`/users/search?q=${query}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error('Error searching:', err);
    }
  };

  const handleShare = async (targetUserId, targetUsername) => {
    if (!targetUserId) {
      alert('Invalid user selected');
      return;
    }
    
    setSharing(targetUserId);
    setSuccessMessage('');
    
    try {
      // Send message with shared post data
      const shareText = `📸 Shared a post`;
      
      await api.post(`/messages/${targetUserId}`, { 
        text: shareText,
        sharedPost: {
          postId: post._id,
          image: post.image,
          caption: post.caption || '',
          username: post.user?.username || 'user'
        }
      });
      
      // Update share count
      try {
        await api.post(`/posts/${post._id}/share`);
      } catch (e) {
        // Ignore share count error
      }
      
      setSuccessMessage(`Sent to ${targetUsername}!`);
      setTimeout(() => {
        setSuccessMessage('');
      }, 2000);
      
    } catch (err) {
      console.error('Share error:', err.response?.data || err.message);
      alert(err.response?.data?.error || 'Failed to share. Please try again.');
    }
    setSharing(null);
  };

  const displayUsers = searchQuery.length >= 2 ? searchResults : following;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold dark:text-white">Share Post</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xl">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Post Preview */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50">
          <img src={post.image} alt="" className="w-16 h-16 rounded-lg object-cover" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm dark:text-white">{post.user?.username}</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs truncate">{post.caption || 'No caption'}</p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mx-4 mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-center text-sm font-medium">
            <i className="fas fa-check-circle mr-2"></i>{successMessage}
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-3 pl-11 text-sm focus:outline-none dark:text-white"
            />
          </div>
        </div>

        {/* Suggested Users */}
        {!searchQuery && suggested.length > 0 && (
          <div className="p-3 border-b border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1">SUGGESTED</p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {suggested.map(u => (
                <div key={u._id} className="flex flex-col items-center min-w-[70px]">
                  <img src={u.avatar} alt="" className="w-12 h-12 rounded-full object-cover mb-1" />
                  <p className="text-xs dark:text-white truncate w-full text-center">{u.username}</p>
                  <button
                    onClick={() => handleShare(u._id, u.username)}
                    disabled={sharing === u._id}
                    className="mt-1 px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    {sharing === u._id ? <i className="fas fa-spinner fa-spin"></i> : 'Send'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User List */}
        <div className="overflow-y-auto max-h-60">
          {!searchQuery && (
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 pt-3">
              {following.length > 0 ? 'FOLLOWING' : ''}
            </p>
          )}
          {searchQuery.length >= 2 && (
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 pt-3">SEARCH RESULTS</p>
          )}

          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <i className="fas fa-users text-4xl mb-2"></i>
              <p>{searchQuery ? 'No users found' : 'You are not following anyone yet'}</p>
              {!searchQuery && <p className="text-sm mt-1">Search for users above to share with them</p>}
            </div>
          ) : (
            displayUsers.map(u => (
              <div key={u._id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <img src={u.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold dark:text-white">{u.username}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm capitalize">{u.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleShare(u._id, u.username)}
                  disabled={sharing === u._id}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {sharing === u._id ? <i className="fas fa-spinner fa-spin"></i> : 'Send'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
