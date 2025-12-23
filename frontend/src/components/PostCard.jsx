import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ShareModal from './ShareModal';
import api from '../api/axios';

const PostCard = ({ post, onLike }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const isLiked = post.likes?.includes(user?._id);
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

  return (
    <div className="card mb-4 overflow-hidden dark:bg-slate-800">
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

      <div 
        className="bg-black flex items-center justify-center relative cursor-pointer select-none"
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
            <i className="fas fa-heart text-white text-8xl animate-like-pop" style={{
              textShadow: '0 0 20px rgba(255,255,255,0.8)',
              animation: 'doubleTapHeart 1s ease-out forwards'
            }}></i>
          </div>
        )}
      </div>

      {showShareModal && <ShareModal post={post} onClose={() => setShowShareModal(false)} />}

      <div className="p-4">
        <div className="flex justify-between mb-3">
          <div className="flex gap-4">
            <button 
              onClick={handleLikeClick} 
              className={`text-2xl transition-all ${isLiked ? 'text-red-500' : 'text-slate-600 dark:text-slate-300 hover:text-red-500'} ${isLikeAnimating ? 'animate-like-pop' : ''}`}
            >
              <i className={`${isLiked ? 'fas' : 'far'} fa-heart`}></i>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="text-2xl text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition-colors">
              <i className="far fa-comment"></i>
            </button>
            <button onClick={() => setShowShareModal(true)} className="text-2xl text-slate-600 dark:text-slate-300 hover:text-cyan-500 transition-colors">
              <i className="far fa-paper-plane"></i>
            </button>
          </div>
          <button 
            onClick={handleSave}
            className={`text-2xl transition-colors ${isSaved ? 'text-amber-500' : 'text-slate-600 dark:text-slate-300 hover:text-amber-500'}`}
          >
            <i className={`${isSaved ? 'fas' : 'far'} fa-bookmark`}></i>
          </button>
        </div>

        <p className="font-semibold mb-1 dark:text-white">{post.likes?.length || 0} likes</p>
        <p className="text-slate-800 dark:text-slate-200">
          <span className="font-semibold">{post.user?.username}</span> {post.caption}
        </p>
        
        {comments.length > 0 && (
          <button onClick={() => setShowComments(!showComments)} className="text-slate-500 dark:text-slate-400 text-sm mt-1 hover:text-indigo-500">
            View all {comments.length} comments
          </button>
        )}

        <p className="text-slate-400 text-xs mt-2">{new Date(post.createdAt).toLocaleDateString()}</p>
      </div>

      {showComments && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          <div className="max-h-48 overflow-y-auto mb-4">
            {comments.map((c, i) => (
              <div key={i} className="flex gap-3 mb-3">
                <img src={c.user?.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <p className="text-sm dark:text-slate-200">
                    <span className="font-semibold">{c.user?.username}</span> {c.text}
                  </p>
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
              className="flex-1 input-modern px-4 py-2 text-sm focus:outline-none dark:text-white" 
            />
            <button type="submit" className="text-indigo-500 font-semibold text-sm hover:text-indigo-600">Post</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostCard;
