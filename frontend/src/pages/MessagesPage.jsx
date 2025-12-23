import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api/axios';

const MessagesPage = () => {
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, setUnreadMessages } = useAuth();

  useEffect(() => { 
    fetchConversations(); 
    
    // Check if navigated from profile with directChatUser
    if (location.state?.directChatUser) {
      setSelectedUser(location.state.directChatUser);
      // Clear the state after using it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => { 
    if (selectedUser) fetchMessages(selectedUser._id); 
  }, [selectedUser]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      // Filter out duplicates
      const uniqueConversations = [];
      const seenUserIds = new Set();
      
      for (const conv of res.data) {
        if (conv.user && conv.user._id && !seenUserIds.has(conv.user._id)) {
          seenUserIds.add(conv.user._id);
          uniqueConversations.push(conv);
        }
      }
      
      setConversations(uniqueConversations);
    } catch (err) { /* ignore */ }
    setLoading(false);
  };

  const fetchMessages = async (userId) => {
    try {
      const res = await api.get(`/messages/${userId}`);
      setMessages(res.data);
      const unreadRes = await api.get('/messages/unread-count');
      setUnreadMessages(unreadRes.data.count);
      fetchConversations();
    } catch (err) { /* ignore */ }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/users/search?q=${query}`);
      setSearchResults(res.data);
    } catch (err) { /* ignore */ }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    try {
      const res = await api.post(`/messages/${selectedUser._id}`, { text: newMessage });
      setMessages([...messages, res.data]);
      setNewMessage('');
      fetchConversations();
    } catch (err) { /* ignore */ }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="card overflow-hidden h-[calc(100vh-180px)] dark:bg-slate-800">
          <div className="flex h-full">
            <div className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-700 flex flex-col ${selectedUser ? 'hidden md:flex' : ''}`}>
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold mb-4 dark:text-white">Messages</h2>
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={searchQuery} 
                  onChange={(e) => handleSearch(e.target.value)} 
                  className="w-full input-modern px-4 py-2 text-sm focus:outline-none dark:text-white" 
                />
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map(u => (
                    <div 
                      key={u._id} 
                      onClick={() => { setSelectedUser(u); setSearchQuery(''); setSearchResults([]); }} 
                      className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-3 border-b border-slate-100 dark:border-slate-700"
                    >
                      <img src={u.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold dark:text-white">{u.username}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm capitalize">{u.role}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  conversations.map(conv => (
                    <div 
                      key={conv.user?._id} 
                      onClick={() => setSelectedUser(conv.user)} 
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 ${selectedUser?._id === conv.user?._id ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                    >
                      <div className="relative">
                        <img src={conv.user?.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                        {conv.unreadCount > 0 && (
                          <>
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                              {conv.unreadCount}
                            </span>
                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                          </>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`dark:text-white ${conv.unreadCount > 0 ? 'font-bold' : 'font-semibold'}`}>
                          {conv.user?.username}
                        </p>
                        <div className="flex items-center gap-1">
                          <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                            {conv.lastMessage?.text}
                          </p>
                          {conv.lastMessage?.sender === user._id && conv.lastMessage?.read && (
                            <span className="text-xs text-red-500">✓✓</span>
                          )}
                          {conv.lastMessage?.sender === user._id && !conv.lastMessage?.read && (
                            <span className="text-xs text-slate-400">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {conversations.length === 0 && searchResults.length === 0 && !loading && (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <i className="fas fa-inbox text-4xl mb-2"></i>
                    <p>No conversations yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className={`flex-1 flex flex-col ${!selectedUser ? 'hidden md:flex' : ''}`}>
              {selectedUser ? (
                <>
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <button onClick={() => setSelectedUser(null)} className="md:hidden text-xl mr-2 dark:text-white">
                      <i className="fas fa-arrow-left"></i>
                    </button>
                    <img src={selectedUser.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    <span className="font-semibold dark:text-white">{selectedUser.username}</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/50">
                    {messages.map(msg => (
                      <div key={msg._id} className={`mb-4 ${msg.sender?._id === user._id ? 'text-right' : ''}`}>
                        {/* Shared Post Card */}
                        {msg.sharedPost && msg.sharedPost.image && (
                          <div className={`inline-block max-w-xs lg:max-w-sm mb-2 ${msg.sender?._id === user._id ? 'ml-auto' : 'mr-auto'}`}>
                            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                              <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  <i className="fas fa-share mr-1"></i>
                                  Shared post from @{msg.sharedPost.username}
                                </p>
                              </div>
                              <img 
                                src={msg.sharedPost.image} 
                                alt="Shared post" 
                                className="w-full max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              />
                              {msg.sharedPost.caption && (
                                <div className="p-2">
                                  <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                                    {msg.sharedPost.caption}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Message Text */}
                        {(!msg.sharedPost || !msg.sharedPost.image) && (
                          <span className={`inline-block px-4 py-2 max-w-xs lg:max-w-md ${
                            msg.sender?._id === user._id ? 'message-sent' : 'message-received dark:bg-slate-700 dark:text-white'
                          }`}>
                            {msg.text}
                          </span>
                        )}
                        <div className={`flex items-center gap-1 mt-1 ${msg.sender?._id === user._id ? 'justify-end' : 'justify-start'}`}>
                          <p className="text-xs text-slate-400">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {msg.sender?._id === user._id && (
                            <span className={`text-xs ${msg.read ? 'text-red-500' : 'text-slate-400'}`}>
                              {msg.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={sendMessage} className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Message..." 
                      value={newMessage} 
                      onChange={(e) => setNewMessage(e.target.value)} 
                      className="flex-1 input-modern px-4 py-2 focus:outline-none dark:text-white" 
                    />
                    <button type="submit" className="btn-primary text-white px-6 py-2 rounded-xl font-semibold">
                      Send
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                      <i className="fas fa-comments text-4xl text-slate-400"></i>
                    </div>
                    <p className="text-xl font-medium dark:text-white">Select a conversation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MessagesPage;
