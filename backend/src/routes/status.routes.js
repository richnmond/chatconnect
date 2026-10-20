const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const statusController = require('../controllers/status.controller');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/statuses'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Create status
router.post('/', protect, upload.single('image'), statusController.createStatus);

// Get all public statuses
router.get('/', statusController.getAllStatuses);

// Get user statuses
router.get('/user/:userId', statusController.getUserStatuses);

// Like status
router.put('/:statusId/like', protect, statusController.likeStatus);

// Add comment
router.post('/:statusId/comment', protect, statusController.addComment);

// Delete status
router.delete('/:statusId', protect, statusController.deleteStatus);

// Delete comment
router.delete('/:statusId/comment/:commentId', protect, statusController.deleteComment);

module.exports = router;
