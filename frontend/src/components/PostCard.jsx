import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ShareModal from './ShareModal';
import api from '../api/axios';

const PostCard = ({ post, onLike, onDelete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isLiked = post.likes?.includes(user?._id);
  const isOwnPost = post.user?._id === user?._id;
  const lastTapRef = useRef(0);

  const handleLikeClick = () => {
    setIsLikeAnimating(true);
    onLike(post._id);
    setTimeout(() => setIsLikeAnimating(false), 300);
  };

  const handleDoubleTap = (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapRef.current;
    
    if (tapLength < 300 && tapLength > 0) {
      e.preventDefault();
      if (!isLiked) {
        onLike(post._id);
      }
      setShowDoubleTapHeart(true);
      setTimeout(() => setShowDoubleTapHeart(false), 1000);
    }
    lastTapRef.current = currentTime;
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/posts/${post._id}/comment`, { text: commentText });
      setComments(res.data);
      setCommentText('');
    } catch (err) { /* ignore */ }
  };

  const handleSave = async () => {
    try {
      const res = await api.post(`/posts/${post._id}/save`);
      setIsSaved(res.data.isSaved);
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/posts/${post._id}`);
      if (onDelete) {
        onDelete(post._id);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete post');
    }
    setIsDeleting(false);
    setShowMenu(false);
  };

  return (
    <div className="card mb-6 overflow-hidden dark:bg-zinc-900 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(`/profile/${post.user?._id}`)}>
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 p-0.5">
              <img src={post.user?.avatar} alt="" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-zinc-900" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900"></div>
          </div>
          <div>
            <span className="font-bold dark:text-white group-hover:text-red-500 transition-colors">{post.user?.username}</span>
            <p className={`text-xs px-2 py-0.5 rounded-full inline-block ml-2 ${post.user?.role === 'creator' ? 'badge-creator' : 'badge-consumer'}`}>
              {post.user?.role}
            </p>
          </div>
        </div>
        
        {/* Delete Menu */}
        {isOwnPost && (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <i className="fas fa-ellipsis-h text-zinc-500"></i>
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden z-10 min-w-[160px] animate-scale-in">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-colors"
                >
                  {isDeleting ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-trash"></i>
                  )}
                  <span className="font-medium">Delete Post</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image */}
      <div 
        className="bg-zinc-900 flex items-center justify-center relative cursor-pointer select-none img-zoom"
        onClick={handleDoubleTap}
        onDoubleClick={(e) => {
          e.preventDefault();
          if (!isLiked) {
            onLike(post._id);
          }
          setShowDoubleTapHeart(true);
          setTimeout(() => setShowDoubleTapHeart(false), 1000);
        }}
      >
        <img 
          src={post.image} 
          alt="" 
          className="w-full max-h-[600px] object-contain pointer-events-none" 
          onError={(e) => e.target.src = 'https://via.placeholder.com/500?text=Image'} 
          draggable="false"
        />
        {showDoubleTapHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <i className="fas fa-heart text-white text-8xl" style={{
              textShadow: '0 0 40px rgba(239, 68, 68, 0.8)',
              animation: 'doubleTapHeart 1s ease-out forwards'
            }}></i>
          </div>
        )}
      </div>

      {showShareModal && <ShareModal post={post} onClose={() => setShowShareModal(false)} />}

      {/* Actions */}
      <div className="p-4">
        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            <button 
              onClick={handleLikeClick} 
              className={`icon-btn ${isLiked ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-zinc-600 dark:text-zinc-300'} ${isLikeAnimating ? 'animate-like-pop' : ''}`}
            >
              <i className={`${isLiked ? 'fas' : 'far'} fa-heart text-xl`}></i>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="icon-btn text-zinc-600 dark:text-zinc-300">
              <i className="far fa-comment text-xl"></i>
            </button>
            <button onClick={() => setShowShareModal(true)} className="icon-btn text-zinc-600 dark:text-zinc-300">
              <i className="far fa-paper-plane text-xl"></i>
            </button>
          </div>
          <button 
            onClick={handleSave}
            className={`icon-btn ${isSaved ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-zinc-600 dark:text-zinc-300'}`}
          >
            <i className={`${isSaved ? 'fas' : 'far'} fa-bookmark text-xl`}></i>
          </button>
        </div>

        {/* Likes */}
        <p className="font-bold mb-2 dark:text-white">{post.likes?.length || 0} likes</p>
        
        {/* Caption */}
        <p className="text-zinc-800 dark:text-zinc-200">
          <span className="font-bold cursor-pointer hover:text-red-500 transition-colors" onClick={() => navigate(`/profile/${post.user?._id}`)}>{post.user?.username}</span>{' '}
          {post.caption}
        </p>
        
        {/* Comments Preview */}
        {comments.length > 0 && (
          <button onClick={() => setShowComments(!showComments)} className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 hover:text-red-500 transition-colors">
            View all {comments.length} comments
          </button>
        )}

        {/* Date */}
        <p className="text-zinc-400 text-xs mt-2 uppercase tracking-wide">{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="max-h-60 overflow-y-auto mb-4 space-y-4">
            {comments.map((c, i) => (
              <div key={i} className="flex gap-3 group">
                <img 
                  src={c.user?.avatar} 
                  alt="" 
                  className="w-9 h-9 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                  onClick={() => navigate(`/profile/${c.user?._id}`)}
                />
                <div className="flex-1">
                  <p className="text-sm dark:text-zinc-200">
                    <span className="font-bold cursor-pointer hover:text-red-500 transition-colors" onClick={() => navigate(`/profile/${c.user?._id}`)}>{c.user?.username}</span>{' '}
                    {c.text}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleComment} className="flex gap-3">
            <input 
              type="text" 
              placeholder="Add a comment..." 
              value={commentText} 
              onChange={(e) => setCommentText(e.target.value)} 
              className="flex-1 bg-white dark:bg-zinc-800 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white" 
            />
            <button 
              type="submit" 
              disabled={!commentText.trim()}
              className="px-5 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-500 text-white font-semibold text-sm rounded-full transition-colors"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostCard;
