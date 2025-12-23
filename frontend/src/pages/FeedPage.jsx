import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import LoadingScreen from '../components/LoadingScreen';
import api from '../api/axios';

const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);
  const { user } = useAuth();

  useEffect(() => { 
    fetchPosts(); 
    fetchSuggested();
    fetchStories();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data);
    } catch (err) { /* ignore */ }
    setLoading(false);
  };

  const fetchSuggested = async () => {
    try {
      const res = await api.get('/users/suggested');
      setSuggested(res.data);
    } catch (err) { /* ignore */ }
  };

  const fetchStories = async () => {
    try {
      const res = await api.get('/stories');
      setStories(res.data);
    } catch (err) { /* ignore */ }
  };

  const handleLike = async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/like`);
      setPosts(posts.map(p => 
        p._id === postId 
          ? { ...p, likes: res.data.isLiked ? [...p.likes, user._id] : p.likes.filter(id => id !== user._id) } 
          : p
      ));
    } catch (err) { /* ignore */ }
  };

  const handleFollow = async (userId) => {
    try {
      await api.post(`/users/${userId}/follow`);
      setSuggested(suggested.filter(u => u._id !== userId));
    } catch (err) { /* ignore */ }
  };

  const viewStory = async (storyGroup) => {
    setSelectedStory(storyGroup);
    // Mark stories as viewed
    for (const story of storyGroup.stories) {
      try {
        await api.post(`/stories/${story._id}/view`);
      } catch (err) { /* ignore */ }
    }
  };

  if (loading) return <Layout><LoadingScreen /></Layout>;

  return (
    <Layout>
      {/* Story Viewer Modal */}
      {selectedStory && (
        <div 
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={() => setSelectedStory(null)}
        >
          <button 
            onClick={() => setSelectedStory(null)}
            className="absolute top-4 right-4 text-white text-3xl z-10"
          >
            <i className="fas fa-times"></i>
          </button>
          <div className="absolute top-4 left-4 flex items-center gap-3 z-10">
            <img src={selectedStory.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
            <span className="text-white font-semibold">{selectedStory.user.username}</span>
          </div>
          <img 
            src={selectedStory.stories[0]?.image} 
            alt="" 
            className="max-h-screen max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {selectedStory.stories[0]?.caption && (
            <div className="absolute bottom-10 left-0 right-0 text-center text-white px-4">
              <p className="bg-black/50 inline-block px-4 py-2 rounded-lg">{selectedStory.stories[0].caption}</p>
            </div>
          )}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Stories Section */}
        {stories.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-6 shadow-sm overflow-hidden">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {stories.map((storyGroup) => (
                <div 
                  key={storyGroup.user._id} 
                  className="flex-shrink-0 cursor-pointer"
                  onClick={() => viewStory(storyGroup)}
                >
                  {storyGroup.stories && storyGroup.stories.length > 0 ? (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-orange-500 p-0.5 mb-1">
                      <img 
                        src={storyGroup.user.avatar} 
                        alt="" 
                        className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-800" 
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full mb-1">
                      <img 
                        src={storyGroup.user.avatar} 
                        alt="" 
                        className="w-full h-full rounded-full object-cover" 
                      />
                    </div>
                  )}
                  <p className="text-xs text-center dark:text-slate-300 truncate w-16">{storyGroup.user.username}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-8">
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
              posts.map(post => <PostCard key={post._id} post={post} onLike={handleLike} onDelete={(postId) => setPosts(posts.filter(p => p._id !== postId))} />)
            )}
          </div>

          <div className="hidden lg:block w-80">
            <div className="card p-4 mb-4 dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <img src={user?.avatar} alt="" className="w-14 h-14 rounded-full object-cover" />
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
                      <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-transparent" />
                      <div>
                        <p className="font-semibold text-sm dark:text-white">{u.username}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">{u.followers?.length || 0} followers</p>
                      </div>
                    </Link>
                    <button onClick={() => handleFollow(u._id)} className="text-red-500 text-sm font-semibold hover:text-red-600">
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

export default FeedPage;
