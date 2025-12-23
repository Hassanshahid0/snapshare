import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const FollowingModal = ({ userId, onClose }) => {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        const res = await api.get(`/users/${userId}/following`);
        setFollowing(res.data);
      } catch (err) { 
        console.error('Error fetching following'); 
      }
      setLoading(false);
    };
    fetchFollowing();
  }, [userId]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-md max-h-[70vh] overflow-hidden dark:bg-slate-800 animate-slide-in" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold dark:text-white">Following</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xl">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : following.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <i className="fas fa-users text-4xl mb-2"></i>
              <p>Not following anyone yet</p>
            </div>
          ) : (
            following.map(u => (
              <div 
                key={u._id} 
                onClick={() => { onClose(); navigate(`/profile/${u._id}`); }} 
                className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
              >
                <img src={u.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="font-semibold dark:text-white">{u.username}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm capitalize">{u.role}</p>
                </div>
                <i className="fas fa-chevron-right text-slate-400"></i>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowingModal;
