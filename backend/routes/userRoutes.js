const express = require('express');
const router = express.Router();
const { 
  searchUsers, 
  getSuggestedUsers, 
  getUserProfile, 
  updateProfile, 
  toggleFollow,
  getFollowers,
  getFollowing
} = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.get('/search', auth, searchUsers);
router.get('/suggested', auth, getSuggestedUsers);
router.get('/:id', auth, getUserProfile);
router.put('/profile', auth, updateProfile);
router.post('/:id/follow', auth, toggleFollow);
router.get('/:id/followers', auth, getFollowers);
router.get('/:id/following', auth, getFollowing);

module.exports = router;
