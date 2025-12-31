import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Connect to socket server
      const newSocket = io('http://4.251.118.253:5000', {
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        // Emit user online status
        newSocket.emit('user_online', user._id);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  // Join a chat room
  const joinChat = (senderId, receiverId) => {
    if (socket) {
      socket.emit('join_chat', { senderId, receiverId });
    }
  };

  // Send a message
  const sendMessage = (messageData) => {
    if (socket) {
      socket.emit('send_message', messageData);
    }
  };

  // Typing indicators
  const startTyping = (senderId, receiverId) => {
    if (socket) {
      socket.emit('typing', { senderId, receiverId });
    }
  };

  const stopTyping = (senderId, receiverId) => {
    if (socket) {
      socket.emit('stop_typing', { senderId, receiverId });
    }
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected, 
      joinChat, 
      sendMessage,
      startTyping,
      stopTyping
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
