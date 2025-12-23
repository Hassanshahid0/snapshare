import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import LoadingScreen from '../components/LoadingScreen';
import FollowersModal from '../components/FollowersModal';
import FollowingModal from '../components/FollowingModal';
import PostModal from '../components/PostModal';
import api from '../api/axios';

const ProfilePage = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [storyImage, setStoryImage] = useState('');
  const [storyCaption, setStoryCaption] = useState('');
  const [saving, setSaving] = useState(false);

  const isOwnProfile = !id || id === user?._id;

  useEffect(() => { 
    fetchProfile(); 
    fetchPosts(); 
    if (isOwnProfile) {
      fetchSavedPosts();
    }
    fetchStories();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/${id || user._id}`);
      setProfile(res.data);
      setEditBio(res.data.bio || '');
      setEditAvatar(res.data.avatar || '');
      setIsFollowing(res.data.followers?.some(f => f._id === user._id || f === user._id));
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await api.get(`/posts/user/${id || user._id}`);
      setPosts(res.data);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
    setLoading(false);
  };

  const fetchSavedPosts = async () => {
    try {
      const res = await api.get('/posts/saved');
      setSavedPosts(res.data);
    } catch (err) {
      console.error('Error fetching saved posts:', err);
    }
  };

  const fetchStories = async () => {
    try {
      const res = await api.get(`/stories/user/${id || user._id}`);
      setStories(res.data);
    } catch (err) {
      console.error('Error fetching stories:', err);
    }
  };

  const handleFollow = async () => {
    try {
      const res = await api.post(`/users/${id}/follow`);
      setIsFollowing(res.data.isFollowing);
      fetchProfile();
    } catch (err) {
      console.error('Error following:', err);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/users/profile', { bio: editBio, avatar: editAvatar });
      setShowEditModal(false);
      fetchProfile();
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to update profile');
    }
    setSaving(false);
  };

  const handleAddStory = async () => {
    if (!storyImage) {
      alert('Please add an image');
      return;
    }
    setSaving(true);
    try {
      await api.post('/stories', { image: storyImage, caption: storyCaption });
      setShowStoryModal(false);
      setStoryImage('');
      setStoryCaption('');
      fetchStories();
    } catch (err) {
      console.error('Error adding story:', err);
      alert('Failed to add story');
    }
    setSaving(false);
  };

  const handleStoryImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setStoryImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleMessageUser = () => {
    navigate('/messages', { state: { directChatUser: profile } });
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handlePostLike = async (postId) => {
    fetchPosts();
  };

  if (loading) return <Layout><LoadingScreen /></Layout>;
  if (!profile) return <Layout><div className="text-center py-10 dark:text-white">User not found</div></Layout>;

  return (
    <Layout>
      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold dark:text-white">Edit Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xl">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Profile Picture URL</label>
              <input
                type="text"
                placeholder="Enter image URL"
                value={editAvatar}
                onChange={(e) => setEditAvatar(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none dark:text-white"
              />
              {editAvatar && (
                <div className="mt-3 flex justify-center">
                  <img
                    src={editAvatar}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover"
                    onError={(e) => e.target.src = 'https://via.placeholder.com/80?text=Error'}
                  />
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bio</label>
              <textarea
                placeholder="Write something about yourself..."
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={4}
                maxLength={150}
                className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none dark:text-white resize-none"
              />
              <p className="text-xs text-slate-400 mt-1 text-right">{editBio.length}/150</p>
            </div>
            
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {saving ? (
                <><i className="fas fa-spinner fa-spin"></i> Saving...</>
              ) : (
                <><i className="fas fa-check"></i> Save Changes</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Add Story Modal */}
      {showStoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowStoryModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold dark:text-white">Add Story</h3>
              <button onClick={() => setShowStoryModal(false)} className="text-slate-500 text-xl">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Story Image</label>
              <div 
                onClick={() => document.getElementById('storyImageInput').click()}
                className="w-full h-48 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-red-500"
              >
                {storyImage ? (
                  <img src={storyImage} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="text-center">
                    <i className="fas fa-camera text-3xl text-slate-400 mb-2"></i>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Click to upload</p>
                  </div>
                )}
              </div>
              <input type="file" id="storyImageInput" accept="image/*" onChange={handleStoryImageUpload} className="hidden" />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Caption (optional)</label>
              <input
                type="text"
                placeholder="Add a caption..."
                value={storyCaption}
                onChange={(e) => setStoryCaption(e.target.value)}
                maxLength={500}
                className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none dark:text-white"
              />
            </div>
            
            <button
              onClick={handleAddStory}
              disabled={saving || !storyImage}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              {saving ? <><i className="fas fa-spinner fa-spin"></i> Adding...</> : 'Add Story'}
            </button>
          </div>
        </div>
      )}

      {/* Followers Modal */}
      {showFollowersModal && (
        <FollowersModal userId={id || user._id} onClose={() => setShowFollowersModal(false)} />
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <FollowingModal userId={id || user._id} onClose={() => setShowFollowingModal(false)} />
      )}

      {/* Post Modal */}
      {selectedPost && (
        <PostModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
          onLike={handlePostLike}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Profile Picture with Story Ring */}
            <div className="relative">
              <div className={`p-1 rounded-full ${stories.length > 0 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <img src={profile.avatar} alt="" className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-800" />
              </div>
              {isOwnProfile && (
                <button 
                  onClick={() => setShowStoryModal(true)}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
                >
                  <i className="fas fa-plus"></i>
                </button>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                <h2 className="text-2xl font-bold dark:text-white">{profile.username}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${profile.role === 'creator' ? 'bg-slate-900 text-white' : 'bg-red-500 text-white'}`}>
                  {profile.role}
                </span>
                {isOwnProfile ? (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="px-6 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  >
                    <i className="fas fa-edit mr-2"></i>Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleFollow}
                      className={`px-6 py-2 rounded-xl font-semibold transition-all ${isFollowing ? 'border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                    <button
                      onClick={handleMessageUser}
                      className="px-6 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    >
                      Message
                    </button>
                  </>
                )}
              </div>
              <div className="flex justify-center md:justify-start gap-8 mb-4 text-slate-700 dark:text-slate-300">
                <span><strong className="dark:text-white">{posts.length}</strong> posts</span>
                <button
                  onClick={() => setShowFollowersModal(true)}
                  className="hover:text-red-500 transition-colors"
                >
                  <strong className="dark:text-white">{profile.followers?.length || 0}</strong> followers
                </button>
                <button
                  onClick={() => setShowFollowingModal(true)}
                  className="hover:text-red-500 transition-colors"
                >
                  <strong className="dark:text-white">{profile.following?.length || 0}</strong> following
                </button>
              </div>
              <p className="text-slate-600 dark:text-slate-400">{profile.bio}</p>
            </div>
          </div>
        </div>

        {/* Stories Section */}
        {stories.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-6 shadow-sm">
            <h3 className="font-semibold mb-3 dark:text-white">Stories</h3>
            <div className="flex gap-4 overflow-x-auto">
              {stories.map((story) => (
                <div key={story._id} className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-orange-500 p-0.5">
                    <img src={story.image} alt="" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        {isOwnProfile && (
          <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-3 font-semibold text-center transition-colors ${activeTab === 'posts' ? 'text-red-500 border-b-2 border-red-500' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <i className="fas fa-th mr-2"></i>Posts
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-3 font-semibold text-center transition-colors ${activeTab === 'saved' ? 'text-red-500 border-b-2 border-red-500' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <i className="fas fa-bookmark mr-2"></i>Saved
            </button>
          </div>
        )}

        {/* Posts Grid */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {(activeTab === 'posts' ? posts : savedPosts).map(post => (
            <div 
              key={post._id} 
              className="aspect-square relative group cursor-pointer rounded-xl overflow-hidden"
              onClick={() => handlePostClick(post)}
            >
              <img
                src={post.image}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => e.target.src = 'https://via.placeholder.com/300?text=Image'}
              />
              <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center gap-4 text-white">
                <span><i className="fas fa-heart mr-1"></i>{post.likes?.length || 0}</span>
                <span><i className="fas fa-comment mr-1"></i>{post.comments?.length || 0}</span>
              </div>
            </div>
          ))}
        </div>

        {(activeTab === 'posts' ? posts : savedPosts).length === 0 && (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <i className={`fas ${activeTab === 'posts' ? 'fa-camera' : 'fa-bookmark'} text-4xl text-slate-400`}></i>
            </div>
            <p className="text-xl font-medium">{activeTab === 'posts' ? 'No posts yet' : 'No saved posts'}</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage;
