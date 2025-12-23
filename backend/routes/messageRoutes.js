const express = require('express');
const router = express.Router();
const { 
  getConversations, 
  getUnreadCount, 
  getMessages, 
  sendMessage, 
  markAsRead 
} = require('../controllers/messageController');
const { auth } = require('../middleware/auth');

router.get('/conversations', auth, getConversations);
router.get('/unread-count', auth, getUnreadCount);
router.get('/:userId', auth, getMessages);
router.post('/:userId', auth, sendMessage);
router.put('/read/:userId', auth, markAsRead);

module.exports = router;
