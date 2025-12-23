const express = require('express');
const router = express.Router();
const { 
  getStats, 
  getUsers, 
  getPosts, 
  getActivities, 
  deleteUser, 
  deletePost 
} = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');

router.get('/stats', adminAuth, getStats);
router.get('/users', adminAuth, getUsers);
router.get('/posts', adminAuth, getPosts);
router.get('/activities', adminAuth, getActivities);
router.delete('/users/:id', adminAuth, deleteUser);
router.delete('/posts/:id', adminAuth, deletePost);

module.exports = router;
