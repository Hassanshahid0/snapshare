const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ error: 'Authorization failed' });
  }
};

const creatorAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'creator') {
        return res.status(403).json({ error: 'Creator access required' });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ error: 'Authorization failed' });
  }
};

module.exports = { auth, adminAuth, creatorAuth };
