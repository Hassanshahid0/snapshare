import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api/axios';

const CreatePostPage = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.role !== 'creator') return <Navigate to="/" />;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { 
        alert('File size must be less than 10MB'); 
        return; 
      }
      const reader = new FileReader();
      reader.onloadend = () => { 
        setImage(reader.result); 
        setPreview(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) { alert('Please select an image'); return; }
    setLoading(true);
    try {
      await api.post('/posts', { image, caption });
      navigate('/');
    } catch (err) { 
      alert(err.response?.data?.error || 'Error creating post'); 
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="card p-6 dark:bg-slate-800">
          <h2 className="text-2xl font-bold text-center mb-6 gradient-text">Create New Post</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Upload Photo</label>
              <div 
                className="relative w-full aspect-square bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl flex items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all overflow-hidden" 
                onClick={() => document.getElementById('imageInput').click()}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setImage(null); setPreview(null); }} 
                      className="absolute top-3 right-3 w-10 h-10 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 gradient-primary rounded-2xl flex items-center justify-center">
                      <i className="fas fa-cloud-upload-alt text-2xl text-white"></i>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-medium">Click to upload a photo</p>
                    <p className="text-slate-400 text-sm mt-1">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
              </div>
              <input type="file" id="imageInput" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Caption</label>
              <textarea 
                placeholder="Write a caption..." 
                value={caption} 
                onChange={(e) => setCaption(e.target.value)} 
                rows={4} 
                maxLength={2200} 
                className="w-full p-4 input-modern focus:outline-none resize-none dark:text-white" 
              />
              <div className="flex justify-between mt-2">
                <div className="flex gap-2">
                  {['😍', '🔥', '❤️', '✨', '🎉'].map(emoji => (
                    <button 
                      key={emoji} 
                      type="button" 
                      onClick={() => setCaption(caption + emoji)} 
                      className="text-xl hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <span className="text-slate-400 text-sm">{caption.length}/2200</span>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !image} 
              className="w-full btn-primary text-white py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> 
                  Posting...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i> Share Post
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreatePostPage;
