const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get user chats
// @route   GET /api/chats
// @access  Private
const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'username email avatar status lastSeen')
      .populate('lastMessage')
      .sort('-updatedAt');

    // Format chat data for frontend
    const formattedChats = await Promise.all(chats.map(async (chat) => {
      const chatObj = chat.toObject();
      
      // For private chats, set chat name as other user's name
      if (!chat.isGroup) {
        const otherUser = chat.participants.find(
          p => p._id.toString() !== req.user._id.toString()
        );
        chatObj.name = otherUser?.username || 'Unknown User';
        chatObj.avatar = otherUser?.avatar || '';
        chatObj.isOnline = otherUser?.status === 'online';
      } else {
        chatObj.name = chat.groupName;
        chatObj.avatar = chat.groupAvatar;
      }

      // Get unread count
      if (chat.lastMessage) {
        const lastMessage = await Message.findById(chat.lastMessage);
        if (lastMessage) {
          const isRead = lastMessage.readBy.some(
            r => r.user.toString() === req.user._id.toString()
          );
          chatObj.unreadCount = isRead ? 0 : 1;
        }
      }

      return chatObj;
    }));

    res.json(formattedChats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create or get private chat
// @route   POST /api/chats/private
// @access  Private
const createOrGetPrivateChat = async (req, res) => {
  try {
    const { userId } = req.body;

    // Check if user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, userId] }
    }).populate('participants', 'username email avatar status lastSeen');

    if (!chat) {
      // Create new chat
      chat = await Chat.create({
        participants: [req.user._id, userId],
        isGroup: false
      });
      await chat.populate('participants', 'username email avatar status lastSeen');
    }

    // Format response to match /api/chats output
    const chatObj = chat.toObject();
    const otherUserPopulated = chat.participants.find(
      p => p._id.toString() !== req.user._id.toString()
    );
    chatObj.name = otherUserPopulated?.username || 'Unknown User';
    chatObj.avatar = otherUserPopulated?.avatar || '';
    chatObj.isOnline = otherUserPopulated?.status === 'online';

    res.json(chatObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create group chat
// @route   POST /api/chats/group
// @access  Private
const createGroupChat = async (req, res) => {
  try {
    const { name, participants } = req.body;

    if (!name || !participants || participants.length < 2) {
      return res.status(400).json({ 
        message: 'Group name and at least 2 participants are required' 
      });
    }

    // Add current user to participants if not included
    if (!participants.includes(req.user._id.toString())) {
      participants.push(req.user._id);
    }

    const chat = await Chat.create({
      groupName: name,
      participants,
      isGroup: true,
      groupAdmin: req.user._id
    });

    await chat.populate('participants', 'username email avatar status');
    await chat.populate('groupAdmin', 'username email avatar');

    const chatObj = chat.toObject();
    chatObj.name = chat.groupName;
    chatObj.avatar = chat.groupAvatar;

    res.status(201).json(chatObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get chat messages
// @route   GET /api/chats/:chatId/messages
// @access  Private
const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Check if user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this chat' });
    }

    // Get messages
    const messages = await Message.find({
      chat: chatId,
      deletedFor: { $ne: req.user._id },
      isDeletedForEveryone: false
    })
      .populate('sender', 'username avatar')
      .populate('replyTo')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    // Mark messages as read
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id }
      },
      {
        $push: {
          readBy: {
            user: req.user._id,
            readAt: new Date()
          }
        }
      }
    );

    res.json({
      messages: messages.reverse(),
      page,
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete chat
// @route   DELETE /api/chats/:chatId
// @access  Private
const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // For group chats, only admin can delete
    if (chat.isGroup && chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only group admin can delete group' });
    }

    // Delete all messages in chat
    await Message.deleteMany({ chat: chatId });
    
    // Delete chat
    await chat.deleteOne();

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserChats,
  createOrGetPrivateChat,
  createGroupChat,
  getChatMessages,
  deleteChat
};
