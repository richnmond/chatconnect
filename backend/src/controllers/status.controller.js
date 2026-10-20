const Status = require('../models/Status');
const User = require('../models/User');

// Create a new status
exports.createStatus = async (req, res) => {
  try {
    const { content, visibility } = req.body;
    const userId = req.user._id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const status = new Status({
      author: userId,
      content: content.trim(),
      visibility: visibility || 'public',
      image: req.file ? `/uploads/${req.file.filename}` : null
    });

    await status.save();
    await status.populate('author', 'username avatar email');

    res.status(201).json(status);
  } catch (error) {
    res.status(500).json({ message: 'Error creating status', error: error.message });
  }
};

// Get all public statuses
exports.getAllStatuses = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const statuses = await Status.find({ visibility: 'public' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username avatar email')
      .populate('likes', 'username')
      .populate('comments.author', 'username avatar');

    const total = await Status.countDocuments({ visibility: 'public' });

    res.status(200).json({
      statuses,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statuses', error: error.message });
  }
};

// Get statuses by user
exports.getUserStatuses = async (req, res) => {
  try {
    const { userId } = req.params;

    const statuses = await Status.find({ 
      author: userId,
      visibility: 'public'
    })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar email')
      .populate('likes', 'username')
      .populate('comments.author', 'username avatar');

    res.status(200).json(statuses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user statuses', error: error.message });
  }
};

// Like a status
exports.likeStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user._id;

    const status = await Status.findById(statusId);

    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }

    const alreadyLiked = status.likes.includes(userId);

    if (alreadyLiked) {
      status.likes = status.likes.filter(id => !id.equals(userId));
    } else {
      status.likes.push(userId);
    }

    await status.save();
    await status.populate('author', 'username avatar email');
    await status.populate('likes', 'username');

    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
};

// Add comment to status
exports.addComment = async (req, res) => {
  try {
    const { statusId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const status = await Status.findById(statusId);

    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }

    status.comments.push({
      author: userId,
      content: content.trim()
    });

    await status.save();
    await status.populate('author', 'username avatar email');
    await status.populate('likes', 'username');
    await status.populate('comments.author', 'username avatar');

    res.status(201).json(status);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

// Delete status
exports.deleteStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user._id;

    const status = await Status.findById(statusId);

    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }

    if (!status.author.equals(userId)) {
      return res.status(403).json({ message: 'Not authorized to delete this status' });
    }

    await Status.findByIdAndDelete(statusId);

    res.status(200).json({ message: 'Status deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting status', error: error.message });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { statusId, commentId } = req.params;
    const userId = req.user._id;

    const status = await Status.findById(statusId);

    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }

    const comment = status.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (!comment.author.equals(userId) && !status.author.equals(userId)) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    status.comments.id(commentId).deleteOne();
    await status.save();

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};
