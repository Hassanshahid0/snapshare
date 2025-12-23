const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/messages/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    // Get all unique users the current user has messaged with
    const sentMessages = await Message.distinct('receiver', { sender: req.user._id });
    const receivedMessages = await Message.distinct('sender', { receiver: req.user._id });
    
    const userIds = [...new Set([...sentMessages, ...receivedMessages])];
    
    // Get user details and last message for each conversation
    const conversations = await Promise.all(
      userIds.map(async (userId) => {
        const user = await User.findById(userId).select('username avatar role');
        
        const lastMessage = await Message.findOne({
          $or: [
            { sender: req.user._id, receiver: userId },
            { sender: userId, receiver: req.user._id }
          ]
        }).sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          sender: userId,
          receiver: req.user._id,
          read: false
        });

        return {
          user,
          lastMessage,
          unreadCount
        };
      })
    );

    // Sort by last message time
    conversations.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/messages/unread-count
// @desc    Get total unread message count
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      read: false
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/messages/:userId
// @desc    Get conversation with specific user
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'username avatar')
    .populate('receiver', 'username avatar');

    // Mark messages as read
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user._id, read: false },
      { read: true }
    );

    // Update unread count for user
    const unreadCount = await Message.countDocuments({
      receiver: req.user._id,
      read: false
    });

    await User.findByIdAndUpdate(req.user._id, { unreadMessages: unreadCount });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/messages/:userId
// @desc    Send a message
// @access  Private
router.post('/:userId', auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const receiver = await User.findById(req.params.userId);
    if (!receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    const message = new Message({
      sender: req.user._id,
      receiver: req.params.userId,
      text: text.trim()
    });

    await message.save();
    await message.populate('sender', 'username avatar');
    await message.populate('receiver', 'username avatar');

    // Update receiver's unread count
    await User.findByIdAndUpdate(req.params.userId, { $inc: { unreadMessages: 1 } });

    // Log activity
    await Activity.create({
      user: req.user._id,
      type: 'message',
      targetUser: req.params.userId
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/messages/read/:userId
// @desc    Mark all messages from user as read
// @access  Private
router.put('/read/:userId', auth, async (req, res) => {
  try {
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user._id, read: false },
      { read: true }
    );

    // Update unread count
    const unreadCount = await Message.countDocuments({
      receiver: req.user._id,
      read: false
    });

    await User.findByIdAndUpdate(req.user._id, { unreadMessages: unreadCount });

    res.json({ message: 'Messages marked as read', unreadCount });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
