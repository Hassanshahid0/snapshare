const Message = require('../models/Message');
const User = require('../models/User');
const Activity = require('../models/Activity');

// @desc    Get all conversations
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const sentMessages = await Message.distinct('receiver', { sender: req.user._id });
    const receivedMessages = await Message.distinct('sender', { receiver: req.user._id });
    
    const userIds = [...new Set([...sentMessages, ...receivedMessages])];
    
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
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      read: false
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get conversation with user
// @route   GET /api/messages/:userId
// @access  Private
exports.getMessages = async (req, res) => {
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

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Send message
// @route   POST /api/messages/:userId
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { text, sharedPost } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Validate receiver ID
    if (!req.params.userId || req.params.userId === 'undefined') {
      return res.status(400).json({ error: 'Invalid receiver ID' });
    }

    const receiver = await User.findById(req.params.userId);
    if (!receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Trim message to max 5000 chars
    const trimmedText = text.trim().substring(0, 5000);

    const messageData = {
      sender: req.user._id,
      receiver: req.params.userId,
      text: trimmedText
    };

    // Add shared post data if present
    if (sharedPost && sharedPost.postId) {
      messageData.sharedPost = {
        postId: sharedPost.postId,
        image: sharedPost.image,
        caption: sharedPost.caption,
        username: sharedPost.username
      };
    }

    const message = new Message(messageData);

    await message.save();
    await message.populate('sender', 'username avatar');
    await message.populate('receiver', 'username avatar');

    // Log activity (don't fail if this fails)
    try {
      await Activity.create({
        user: req.user._id,
        type: 'message',
        targetUser: req.params.userId
      });
    } catch (activityErr) {
      console.error('Activity log error:', activityErr);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:userId
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user._id, read: false },
      { read: true }
    );

    const unreadCount = await Message.countDocuments({
      receiver: req.user._id,
      read: false
    });

    res.json({ message: 'Messages marked as read', unreadCount });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
