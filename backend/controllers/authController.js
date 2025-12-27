const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate required fields
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate role
    if (!['creator', 'consumer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be creator or consumer' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'You already have an account! Please go to Login tab to sign in.' });
      }
      return res.status(400).json({ error: 'Username already taken. Try a different one.' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role,
      bio: role === 'creator' ? 'Content Creator ✨' : 'SnapShare User 📱'
    });

    await user.save();

    // Log activity (don't fail if this fails)
    try {
      await Activity.create({
        user: user._id,
        type: 'signup',
        details: `Signed up as ${role}`
      });
    } catch (actErr) {
      console.log('Activity log error:', actErr);
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        followers: user.followers,
        following: user.following
      }
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ error: error.message || 'Server error during signup' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Log activity (don't fail if this fails)
    try {
      await Activity.create({
        user: user._id,
        type: 'login'
      });
    } catch (actErr) {
      console.log('Activity log error:', actErr);
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        followers: user.followers,
        following: user.following
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: error.message || 'Server error during login' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    await Activity.create({
      user: req.user._id,
      type: 'logout'
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
