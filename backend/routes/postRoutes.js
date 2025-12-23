const express = require('express');
const router = express.Router();
const { 
  getPosts, 
  getUserPosts, 
  createPost, 
  deletePost, 
  toggleLike, 
  addComment, 
  sharePost,
  getComments,
  savePost,
  getSavedPosts
} = require('../controllers/postController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getPosts);
router.get('/saved', auth, getSavedPosts);
router.get('/user/:userId', auth, getUserPosts);
router.post('/', auth, createPost);
router.delete('/:id', auth, deletePost);
router.post('/:id/like', auth, toggleLike);
router.post('/:id/comment', auth, addComment);
router.post('/:id/share', auth, sharePost);
router.post('/:id/save', auth, savePost);
router.get('/:id/comments', auth, getComments);

module.exports = router;
