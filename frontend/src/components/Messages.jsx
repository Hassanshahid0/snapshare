// components/Messages.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getConversations, getMessages, sendMessage, markMessagesRead, searchUsers } from '../api';

function Messages({ currentUser, socket }) {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [showConversationList, setShowConversationList] = useState(true);
  
  const messagesEndRef = useRef(null);
  const searchTimerRef = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser._id || selectedUser.id);
    }
  }, [selectedUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg) => {
      const oderId = msg.from === (currentUser.id || currentUser._id) ? msg.to : msg.from;
      
      // If this conversation is open, add message
      if (selectedUser && (selectedUser._id === oderId || selectedUser.id === oderId)) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        // Mark as read
        if (msg.from !== (currentUser.id || currentUser._id)) {
          markMessagesRead(oderId).catch(() => {});
        }
      } else if (msg.to === (currentUser.id || currentUser._id)) {
        // Increment unread count
        setUnreadCounts(prev => ({ ...prev, [msg.from]: (prev[msg.from] || 0) + 1 }));
      }
      
      loadConversations();
    };

    const handleTyping = (data) => {
      if (!data || !data.from) return;
      setTypingUsers(prev => ({ ...prev, [data.from]: !!data.typing }));
      setTimeout(() => {
        setTypingUsers(prev => ({ ...prev, [data.from]: false }));
      }, 3000);
    };

    const handleMessageRead = (data) => {
      if (!data || !data.from) return;
      setUnreadCounts(prev => ({ ...prev, [data.from]: 0 }));
      setMessages(prev => prev.map(m => 
        m.to === data.from ? { ...m, read: true } : m
      ));
    };

    socket.on('message:new', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('message:read', handleMessageRead);
    
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('message:read', handleMessageRead);
    };
  }, [socket, selectedUser, currentUser]);

  // Search users effect
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchUsers(searchTerm);
        // Filter out current user
        const filtered = (res.data || []).filter(
          u => (u._id || u.id) !== (currentUser.id || currentUser._id)
        );
        setSearchResults(filtered);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchTerm, currentUser]);

  const loadConversations = async () => {
    try {
      setLoadingConvos(true);
      const res = await getConversations();
      const convos = res.data || [];
      setConversations(convos);
      
      // Update unread counts
      const counts = {};
      convos.forEach(c => {
        const oderId = c.user._id || c.user.id;
        counts[oderId] = c.unreadCount || 0;
      });
      setUnreadCounts(counts);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setConversations([]);
    } finally {
      setLoadingConvos(false);
    }
  };

  const loadMessages = async (userId) => {
    try {
      setLoading(true);
      const res = await getMessages(userId);
      setMessages(res.data || []);
      await markMessagesRead(userId);
      setUnreadCounts(prev => ({ ...prev, [userId]: 0 }));
    } catch (err) {
      console.error('Failed to load messages:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (user) => {
    const userId = user._id || user.id;
    setSelectedUser(user);
    setShowConversationList(false);
    setSearchTerm('');
    setSearchResults([]);
    
    try {
      const res = await getMessages(userId);
      setMessages(res.data || []);
      await markMessagesRead(userId);
      setUnreadCounts(prev => ({ ...prev, [userId]: 0 }));
    } catch (err) {
      console.error('Failed to load messages:', err);
      setMessages([]);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const toId = selectedUser._id || selectedUser.id;
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const res = await sendMessage(toId, { text: messageText });
      setMessages(prev => [...prev, res.data]);
      loadConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
      setNewMessage(messageText); // Restore message on error
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'short' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + (n || 0), 0);
  const displayList = searchTerm.trim() ? searchResults : conversations;

  return (
    <div className="flex h-full bg-black/30 rounded-xl overflow-hidden">
      {/* Conversations List / Search */}
      <div className={`${selectedUser && !showConversationList ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-zinc-800 bg-zinc-900/50`}>
        {/* Header */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Messages
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
                  {totalUnread}
                </span>
              )}
            </h2>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search users to message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setSearchResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Search hint */}
          {!searchTerm && conversations.length === 0 && !loadingConvos && (
            <p className="text-xs text-zinc-500 mt-2 text-center">
              Search for users to start a conversation
            </p>
          )}
        </div>
        
        {/* Conversations / Search Results List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Loading state */}
          {(loadingConvos && !searchTerm) || isSearching ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            </div>
          ) : displayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600/20 to-orange-600/20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-400">
                {searchTerm ? 'No users found' : 'No conversations yet'}
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                {searchTerm ? 'Try a different search term' : 'Search for users to start chatting'}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {/* Search Results Header */}
              {searchTerm && searchResults.length > 0 && (
                <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Search Results ({searchResults.length})
                </div>
              )}
              
              {displayList.map((item) => {
                const user = item.user || item;
                const oderId = user._id || user.id;
                const isSelected = selectedUser && (selectedUser._id === oderId || selectedUser.id === oderId);
                const unread = unreadCounts[oderId] || item.unreadCount || 0;
                const isTyping = typingUsers[oderId];
                const lastMessage = item.lastMessage;
                const isFromSearch = searchTerm.trim() && !item.user;
                
                return (
                  <button
                    key={oderId}
                    onClick={() => openConversation(user)}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                      isSelected 
                        ? 'bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/30' 
                        : 'hover:bg-zinc-800/50 border border-transparent'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white font-bold overflow-hidden">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (user.username || '?')[0]?.toUpperCase()
                        )}
                      </div>
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-semibold truncate ${unread > 0 ? 'text-white' : 'text-zinc-200'}`}>
                          {user.username}
                        </span>
                        {lastMessage?.createdAt && (
                          <span className="text-[10px] text-zinc-500 flex-shrink-0">
                            {formatTime(lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'text-zinc-200 font-medium' : 'text-zinc-500'}`}>
                        {isTyping ? (
                          <span className="text-red-400 flex items-center gap-1">
                            <span className="flex gap-0.5">
                              <span className="w-1 h-1 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                              <span className="w-1 h-1 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                              <span className="w-1 h-1 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                            </span>
                            typing...
                          </span>
                        ) : isFromSearch ? (
                          <span className="capitalize text-zinc-400">
                            {user.role || 'User'} • Tap to message
                          </span>
                        ) : lastMessage ? (
                          <>
                            {lastMessage.mediaUrl ? (
                              <span>🖼️ Sent an image</span>
                            ) : (
                              <span className="truncate">{lastMessage.text}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-zinc-600">Start a conversation</span>
                        )}
                      </p>
                    </div>
                    
                    {/* Role Badge for Search Results */}
                    {isFromSearch && user.role && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        user.role === 'creator' 
                          ? 'bg-orange-500/20 text-orange-400' 
                          : user.role === 'admin'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-zinc-700 text-zinc-400'
                      }`}>
                        {user.role}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${selectedUser ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-black/30`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-4 p-4 border-b border-zinc-800 bg-zinc-900/50">
              <button
                onClick={() => { setSelectedUser(null); setShowConversationList(true); }}
                className="md:hidden w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white font-bold overflow-hidden">
                  {selectedUser.avatarUrl ? (
                    <img src={selectedUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    selectedUser.username?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">{selectedUser.username}</div>
                <div className="text-xs text-zinc-400">
                  {typingUsers[selectedUser._id || selectedUser.id] ? (
                    <span className="text-red-400 flex items-center gap-1">
                      <span className="flex gap-0.5">
                        <span className="w-1 h-1 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                        <span className="w-1 h-1 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                        <span className="w-1 h-1 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                      </span>
                      typing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      Online
                    </span>
                  )}
                </div>
              </div>
              
              {/* Header Actions */}
              <div className="flex items-center gap-1">
                <button className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600/20 to-orange-600/20 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">Start the conversation</h3>
                  <p className="text-sm text-zinc-500">Say hello to {selectedUser.username}! 🔥</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isOwn = (msg.from === currentUser._id || msg.from === currentUser.id || msg.from?._id === currentUser._id);
                  const showAvatar = idx === 0 || messages[idx - 1]?.from !== msg.from;
                  
                  return (
                    <div key={msg._id || idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {/* Avatar for received messages */}
                      {!isOwn && showAvatar && (
                        <div className="flex-shrink-0 mr-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                            {selectedUser.avatarUrl ? (
                              <img src={selectedUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              selectedUser.username?.[0]?.toUpperCase()
                            )}
                          </div>
                        </div>
                      )}
                      {!isOwn && !showAvatar && <div className="w-10" />}
                      
                      <div className="max-w-[75%]">
                        {/* Media */}
                        {msg.mediaUrl && (
                          <div className={`mb-2 rounded-2xl overflow-hidden ${isOwn ? 'rounded-br-md' : 'rounded-bl-md'}`}>
                            <img src={msg.mediaUrl} alt="" className="max-h-64 w-auto object-cover" />
                          </div>
                        )}
                        
                        {/* Text */}
                        {msg.text && (
                          <div className={`px-4 py-3 rounded-2xl ${
                            isOwn 
                              ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-br-md' 
                              : 'bg-zinc-800 text-zinc-200 rounded-bl-md'
                          }`}>
                            <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        )}
                        
                        {/* Time */}
                        <div className={`flex items-center gap-1.5 mt-1 text-[10px] text-zinc-600 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span>{formatTime(msg.createdAt)}</span>
                          {isOwn && (
                            <span className={msg.read ? 'text-red-400' : 'text-zinc-600'}>
                              {msg.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-3">
                {/* Emoji Button */}
                <button 
                  type="button" 
                  className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                
                {/* Attachment Button */}
                <button 
                  type="button" 
                  className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                
                {/* Input */}
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-all"
                />
                
                {/* Send Button */}
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 flex items-center justify-center text-white hover:from-red-500 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/25"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </>
        ) : (
          /* No conversation selected */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-red-600/20 to-orange-600/20 flex items-center justify-center">
                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Your Messages</h2>
              <p className="text-zinc-400 mb-6">
                Select a conversation or search for someone to start chatting
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 text-zinc-400 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search for users to message
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(39, 39, 42, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #ef4444, #f97316);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #dc2626, #ea580c);
        }
      `}</style>
    </div>
  );
}

export default Messages;