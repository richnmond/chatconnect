const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getUserChats,
  createOrGetPrivateChat,
  createGroupChat,
  getChatMessages,
  deleteChat
} = require('../controllers/chat.controller');

router.use(protect);

router.route('/')
  .get(getUserChats);

router.post('/private', createOrGetPrivateChat);
router.post('/group', createGroupChat);
router.get('/:chatId/messages', getChatMessages);
router.delete('/:chatId', deleteChat);

module.exports = router;