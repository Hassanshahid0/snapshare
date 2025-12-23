const express = require('express');
const router = express.Router();
const {
  getStories,
  getUserStories,
  createStory,
  viewStory,
  deleteStory
} = require('../controllers/storyController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getStories);
router.get('/user/:userId', auth, getUserStories);
router.post('/', auth, createStory);
router.post('/:id/view', auth, viewStory);
router.delete('/:id', auth, deleteStory);

module.exports = router;
