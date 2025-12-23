const express = require('express');
const Post = require('../models/Post');
const Activity = require('../models/Activity');
const { auth, creatorAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/posts
// @desc    Get all posts (feed)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};

    if (type === 'following') {
      // Get posts from users the current user follows + own posts
      query.user = { $in: [...req.user.following, req.user._id] };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/posts/user/:userId
// @desc    Get posts by user
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/posts
// @desc    Create a new post (creators only)
// @access  Private (Creator)
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is a creator
    if (req.user.role !== 'creator') {
      return res.status(403).json({ error: 'Only creators can create posts' });
    }

    const { image, caption } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const post = new Post({
      user: req.user._id,
      image,
      caption
    });

    await post.save();
    await post.populate('user', 'username avatar role');

    // Log activity
    await Activity.create({
      user: req.user._id,
      type: 'post',
      targetPost: post._id
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check ownership
    if (post.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);

    // Log activity
    await Activity.create({
      user: req.user._id,
      type: 'delete_post',
      targetPost: req.params.id
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/posts/:id/like
// @desc    Like/Unlike a post
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.push(req.user._id);
      
      // Log activity only for likes, not unlikes
      await Activity.create({
        user: req.user._id,
        type: 'like',
        targetPost: post._id,
        targetUser: post.user._id
      });
    }

    await post.save();

    res.json({
      isLiked: !isLiked,
      likesCount: post.likes.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/posts/:id/comment
// @desc    Comment on a post
// @access  Private
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = {
      user: req.user._id,
      text: text.trim()
    };

    post.comments.push(comment);
    await post.save();

    // Get the updated post with populated comments
    const updatedPost = await Post.findById(req.params.id);

    // Log activity
    await Activity.create({
      user: req.user._id,
      type: 'comment',
      targetPost: post._id,
      targetUser: post.user._id
    });

    res.json(updatedPost.comments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/posts/:id/share
// @desc    Share a post
// @access  Private
router.post('/:id/share', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.shares += 1;
    await post.save();

    // Log activity
    await Activity.create({
      user: req.user._id,
      type: 'share',
      targetPost: post._id,
      targetUser: post.user._id
    });

    res.json({ shares: post.shares });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/posts/:id/comments
// @desc    Get comments for a post
// @access  Private
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post.comments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
