const Story = require('../models/Story');
const Activity = require('../models/Activity');

// @desc    Get all stories from followed users
// @route   GET /api/stories
// @access  Private
exports.getStories = async (req, res) => {
  try {
    const stories = await Story.find({
      $or: [
        { user: { $in: req.user.following } },
        { user: req.user._id }
      ]
    }).sort({ createdAt: -1 });

    // Group stories by user
    const groupedStories = {};
    stories.forEach(story => {
      const odId = story.user._id.toString();
      if (!groupedStories[odId]) {
        groupedStories[odId] = {
          user: story.user,
          stories: []
        };
      }
      groupedStories[odId].stories.push(story);
    });

    res.json(Object.values(groupedStories));
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get user's stories
// @route   GET /api/stories/user/:userId
// @access  Private
exports.getUserStories = async (req, res) => {
  try {
    const stories = await Story.find({ user: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Create a story
// @route   POST /api/stories
// @access  Private
exports.createStory = async (req, res) => {
  try {
    const { image, caption } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const story = new Story({
      user: req.user._id,
      image,
      caption
    });

    await story.save();
    await story.populate('user', 'username avatar role');

    await Activity.create({
      user: req.user._id,
      type: 'post',
      details: 'Added a story'
    });

    res.status(201).json(story);
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    View a story
// @route   POST /api/stories/:id/view
// @access  Private
exports.viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (!story.viewers.includes(req.user._id)) {
      story.viewers.push(req.user._id);
      await story.save();
    }

    res.json({ viewersCount: story.viewers.length });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Delete a story
// @route   DELETE /api/stories/:id
// @access  Private
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (story.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Story.findByIdAndDelete(req.params.id);
    res.json({ message: 'Story deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
