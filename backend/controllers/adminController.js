const User = require('../models/User');
const Post = require('../models/Post');
const Message = require('../models/Message');
const Activity = require('../models/Activity');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalCreators = await User.countDocuments({ role: 'creator' });
    const totalConsumers = await User.countDocuments({ role: 'consumer' });
    const totalPosts = await Post.countDocuments();
    const totalMessages = await Message.countDocuments();
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const newUsersThisWeek = await User.countDocuments({ 
      createdAt: { $gte: weekAgo },
      role: { $ne: 'admin' }
    });

    const newPostsThisWeek = await Post.countDocuments({ 
      createdAt: { $gte: weekAgo } 
    });

    const totalLikes = await Post.aggregate([
      { $project: { likesCount: { $size: '$likes' } } },
      { $group: { _id: null, total: { $sum: '$likesCount' } } }
    ]);

    const totalComments = await Post.aggregate([
      { $project: { commentsCount: { $size: '$comments' } } },
      { $group: { _id: null, total: { $sum: '$commentsCount' } } }
    ]);

    res.json({
      totalUsers,
      totalCreators,
      totalConsumers,
      totalPosts,
      totalMessages,
      newUsersThisWeek,
      newPostsThisWeek,
      totalLikes: totalLikes[0]?.total || 0,
      totalComments: totalComments[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password')
      .sort({ createdAt: -1 });

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const postCount = await Post.countDocuments({ user: user._id });
        return {
          ...user.toObject(),
          postCount
        };
      })
    );

    res.json(usersWithStats);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get all posts
// @route   GET /api/admin/posts
// @access  Admin
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get activities
// @route   GET /api/admin/activities
// @access  Admin
exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('user', 'username avatar')
      .populate('targetUser', 'username')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin user' });
    }

    await Post.deleteMany({ user: req.params.id });
    await Message.deleteMany({ 
      $or: [{ sender: req.params.id }, { receiver: req.params.id }] 
    });

    await User.updateMany(
      { followers: req.params.id },
      { $pull: { followers: req.params.id } }
    );
    await User.updateMany(
      { following: req.params.id },
      { $pull: { following: req.params.id } }
    );

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Delete post
// @route   DELETE /api/admin/posts/:id
// @access  Admin
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
