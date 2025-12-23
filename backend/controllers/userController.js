const User = require('../models/User');
const Activity = require('../models/Activity');

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      _id: { $ne: req.user._id },
      role: { $ne: 'admin' }
    })
    .select('username avatar role followers')
    .limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get suggested creators
// @route   GET /api/users/suggested
// @access  Private
exports.getSuggestedUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: 'creator',
      _id: { $ne: req.user._id, $nin: req.user.following }
    })
    .select('username avatar bio followers')
    .limit(5)
    .sort({ followers: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'username avatar role')
      .populate('following', 'username avatar role');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { bio, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { bio, avatar },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Follow/Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
exports.toggleFollow = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = await User.findById(req.user._id);
    const isFollowing = currentUser.following.includes(req.params.id);

    if (isFollowing) {
      currentUser.following.pull(req.params.id);
      targetUser.followers.pull(req.user._id);
      
      await Activity.create({
        user: req.user._id,
        type: 'unfollow',
        targetUser: req.params.id
      });
    } else {
      currentUser.following.push(req.params.id);
      targetUser.followers.push(req.user._id);
      
      await Activity.create({
        user: req.user._id,
        type: 'follow',
        targetUser: req.params.id
      });
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length,
      message: isFollowing ? 'Unfollowed successfully' : 'Following successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get user's followers
// @route   GET /api/users/:id/followers
// @access  Private
exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username avatar role bio');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.followers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get user's following
// @route   GET /api/users/:id/following
// @access  Private
exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'username avatar role bio');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.following);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
