const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const storyRoutes = require('./routes/storyRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "http://4.251.118.253:5173",
    methods: ["GET", "POST"]
  }
});

// Store online users
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their ID
  socket.on('user_online', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log('User online:', userId);
  });

  // Join a chat room
  socket.on('join_chat', ({ senderId, receiverId }) => {
    const roomId = [senderId, receiverId].sort().join('_');
    socket.join(roomId);
    console.log(`User ${senderId} joined room ${roomId}`);
  });

  // Send message
  socket.on('send_message', (messageData) => {
    const roomId = [messageData.senderId, messageData.receiverId].sort().join('_');
    io.to(roomId).emit('receive_message', messageData);
    
    // Send notification to receiver
    const receiverSocketId = onlineUsers.get(messageData.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new_message_notification', {
        senderId: messageData.senderId,
        senderName: messageData.senderName
      });
    }
  });

  // Typing indicator
  socket.on('typing', ({ senderId, receiverId }) => {
    const roomId = [senderId, receiverId].sort().join('_');
    socket.to(roomId).emit('user_typing', { userId: senderId });
  });

  socket.on('stop_typing', ({ senderId, receiverId }) => {
    const roomId = [senderId, receiverId].sort().join('_');
    socket.to(roomId).emit('user_stop_typing', { userId: senderId });
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      console.log('User disconnected:', socket.userId);
    }
  });
});

// Middleware
app.use(cors({
  origin: "http://4.251.118.253:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
const connectDB = require('./config/db');
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stories', storyRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SnapShare API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready for connections`);
});
