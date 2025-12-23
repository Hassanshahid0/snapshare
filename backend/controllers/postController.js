const Post = require('../models/Post');
const Activity = require('../models/Activity');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
exports.getPosts = async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};

    if (type === 'following') {
      query.user = { $in: [...req.user.following, req.user._id] };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get user's posts
// @route   GET /api/posts/user/:userId
// @access  Private
exports.getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Create post
// @route   POST /api/posts
// @access  Private (Creator)
exports.createPost = async (req, res) => {
  try {
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
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);

    await Activity.create({
      user: req.user._id,
      type: 'delete_post',
      targetPost: req.params.id
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Like/Unlike post
// @route   POST /api/posts/:id/like
// @access  Private
exports.toggleLike = async (req, res) => {
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
};

// @desc    Comment on post
// @route   POST /api/posts/:id/comment
// @access  Private
exports.addComment = async (req, res) => {
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

    const updatedPost = await Post.findById(req.params.id);

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
};

// @desc    Share post
// @route   POST /api/posts/:id/share
// @access  Private
exports.sharePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.shares += 1;
    await post.save();

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
};

// @desc    Get post comments
// @route   GET /api/posts/:id/comments
// @access  Private
exports.getComments = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post.comments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Save/Unsave post
// @route   POST /api/posts/:id/save
// @access  Private
const User = require('../models/User');

exports.savePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const user = await User.findById(req.user._id);
    const isSaved = user.savedPosts.includes(req.params.id);

    if (isSaved) {
      user.savedPosts.pull(req.params.id);
    } else {
      user.savedPosts.push(req.params.id);
    }

    await user.save();

    res.json({
      isSaved: !isSaved,
      savedCount: user.savedPosts.length
    });
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get saved posts
// @route   GET /api/posts/saved
// @access  Private
exports.getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedPosts',
      populate: { path: 'user', select: 'username avatar role' }
    });

    res.json(user.savedPosts || []);
  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
