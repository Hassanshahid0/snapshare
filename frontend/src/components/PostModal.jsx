import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const PostModal = ({ post, onClose, onLike }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [likes, setLikes] = useState(post.likes || []);
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?._id));
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  const handleLike = async () => {
    try {
      const res = await api.post(`/posts/${post._id}/like`);
      setIsLiked(res.data.isLiked);
      if (res.data.isLiked) {
        setLikes([...likes, user._id]);
      } else {
        setLikes(likes.filter(id => id !== user._id));
      }
      setIsLikeAnimating(true);
      setTimeout(() => setIsLikeAnimating(false), 300);
      if (onLike) onLike(post._id);
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/posts/${post._id}/comment`, { text: commentText });
      setComments(res.data);
      setCommentText('');
    } catch (err) {
      console.error('Error commenting:', err);
    }
  };

  const goToProfile = (userId) => {
    onClose();
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
        
        {/* Image Section */}
        <div className="md:w-1/2 bg-black flex items-center justify-center">
          <img 
            src={post.image} 
            alt="" 
            className="max-h-[50vh] md:max-h-[90vh] w-full object-contain"
          />
        </div>

        {/* Details Section */}
        <div className="md:w-1/2 flex flex-col max-h-[40vh] md:max-h-[90vh]">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => goToProfile(post.user?._id)}>
              <img src={post.user?.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="font-semibold dark:text-white">{post.user?.username}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{post.user?.role}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl">
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Caption */}
          {post.caption && (
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <p className="dark:text-slate-200">
                <span className="font-semibold cursor-pointer hover:text-red-500" onClick={() => goToProfile(post.user?._id)}>
                  {post.user?.username}
                </span>{' '}
                {post.caption}
              </p>
            </div>
          )}

          {/* Comments Section */}
          <div className="flex-1 overflow-y-auto p-4">
            {comments.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-center py-4">No comments yet</p>
            ) : (
              comments.map((c, i) => (
                <div key={i} className="flex gap-3 mb-4">
                  <img 
                    src={c.user?.avatar} 
                    alt="" 
                    className="w-8 h-8 rounded-full object-cover cursor-pointer" 
                    onClick={() => goToProfile(c.user?._id)}
                  />
                  <div>
                    <p className="text-sm dark:text-slate-200">
                      <span 
                        className="font-semibold cursor-pointer hover:text-red-500" 
                        onClick={() => goToProfile(c.user?._id)}
                      >
                        {c.user?.username}
                      </span>{' '}
                      {c.text}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-4 mb-3">
              <button 
                onClick={handleLike} 
                className={`text-2xl transition-all ${isLiked ? 'text-red-500' : 'text-slate-600 dark:text-slate-300 hover:text-red-500'} ${isLikeAnimating ? 'animate-like-pop' : ''}`}
              >
                <i className={`${isLiked ? 'fas' : 'far'} fa-heart`}></i>
              </button>
              <button className="text-2xl text-slate-600 dark:text-slate-300">
                <i className="far fa-comment"></i>
              </button>
            </div>
            <p className="font-semibold dark:text-white mb-2">{likes.length} likes</p>
            <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</p>
          </div>

          {/* Add Comment */}
          <form onSubmit={handleComment} className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-2 text-sm focus:outline-none dark:text-white"
            />
            <button 
              type="submit" 
              disabled={!commentText.trim()}
              className="text-red-500 font-semibold text-sm disabled:opacity-50"
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostModal;
