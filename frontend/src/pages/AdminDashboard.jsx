import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import LoadingScreen from '../components/LoadingScreen';
import api from '../api/axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, activitiesRes, postsRes] = await Promise.all([
        api.get('/admin/stats'), 
        api.get('/admin/users'), 
        api.get('/admin/activities'), 
        api.get('/admin/posts')
      ]);
      setStats(statsRes.data); 
      setUsers(usersRes.data); 
      setActivities(activitiesRes.data); 
      setPosts(postsRes.data);
    } catch (err) { /* ignore */ }
    setLoading(false);
  };

  const getActivityIcon = (type) => ({ 
    signup: 'fa-user-plus', 
    login: 'fa-sign-in-alt', 
    logout: 'fa-sign-out-alt', 
    post: 'fa-image', 
    like: 'fa-heart', 
    comment: 'fa-comment', 
    follow: 'fa-user-plus', 
    unfollow: 'fa-user-minus', 
    message: 'fa-envelope', 
    share: 'fa-share', 
    delete_post: 'fa-trash' 
  }[type] || 'fa-circle');

  const getActivityColor = (type) => ({ 
    signup: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', 
    login: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400', 
    post: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400', 
    like: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', 
    comment: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', 
    follow: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400', 
    message: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' 
  }[type] || 'bg-slate-100 text-slate-600');

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <header className="glass border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold dark:text-white">
            <i className="fas fa-shield-alt text-indigo-500 mr-2"></i>Admin Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button onClick={logout} className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-sm font-semibold">
              <i className="fas fa-sign-out-alt mr-2"></i>Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Users', value: stats?.totalUsers, icon: 'fa-users', gradient: 'from-cyan-500 to-blue-500' }, 
            { label: 'Total Posts', value: stats?.totalPosts, icon: 'fa-image', gradient: 'from-pink-500 to-rose-500' }, 
            { label: 'Creators', value: stats?.totalCreators, icon: 'fa-camera', gradient: 'from-emerald-500 to-teal-500' }, 
            { label: 'Messages', value: stats?.totalMessages, icon: 'fa-envelope', gradient: 'from-violet-500 to-purple-500' }
          ].map((stat, i) => (
            <div key={i} className="card p-6 dark:bg-slate-800">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <i className={`fas ${stat.icon} text-white text-xl`}></i>
                </div>
                <div>
                  <p className="text-3xl font-bold dark:text-white">{stat.value || 0}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card overflow-hidden dark:bg-slate-800">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold dark:text-white">Users</h2>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Posts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <p className="font-medium text-sm dark:text-white">{u.username}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${u.role === 'creator' ? 'badge-creator' : 'badge-consumer'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-slate-300">{u.postCount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card overflow-hidden dark:bg-slate-800">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold dark:text-white">Activity Log</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {activities.map(a => (
                <div key={a._id} className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(a.type)}`}>
                      <i className={`fas ${getActivityIcon(a.type)} text-sm`}></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm dark:text-slate-200">
                        <strong>{a.user?.username}</strong> {a.type.replace('_', ' ')}
                        {a.targetUser && <span> → {a.targetUser.username}</span>}
                      </p>
                      <p className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card mt-6 overflow-hidden dark:bg-slate-800">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold dark:text-white">Recent Posts</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 p-4">
            {posts.slice(0, 12).map(p => (
              <div key={p._id} className="aspect-square relative group rounded-xl overflow-hidden">
                <img 
                  src={p.image} 
                  alt="" 
                  className="w-full h-full object-cover" 
                  onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Image'} 
                />
                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex flex-col items-center justify-center text-white text-xs">
                  <p className="font-semibold">{p.user?.username}</p>
                  <p><i className="fas fa-heart mr-1"></i>{p.likes?.length || 0}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
