const Message = require('../models/Message');
const Chat = require('../models/Chat');
const { getIO } = require('../services/socket.service');
const fs = require('fs').promises;
const path = require('path');

// @desc    Send message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { chatId, content, type = 'text', replyTo } = req.body;

    // Check if chat exists and user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to send message in this chat' });
    }

    // Create message
    const messageData = {
      chat: chatId,
      sender: req.user._id,
      content,
      type,
      deliveredTo: [{
        user: req.user._id,
        deliveredAt: new Date()
      }]
    };

    if (replyTo) {
      const replyMessage = await Message.findById(replyTo);
      if (replyMessage) {
        messageData.replyTo = replyTo;
      }
    }

    // Handle file upload
    if (req.file) {
      messageData.type = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
      messageData.fileUrl = `/uploads/${req.file.filename}`;
      messageData.fileName = req.file.originalname;
      messageData.fileSize = req.file.size;
    }

    const message = await Message.create(messageData);
    await message.populate('sender', 'username avatar');
    await message.populate('replyTo');

    // Update chat's last message
    chat.lastMessage = message._id;
    await chat.save();

    // Emit socket event
    const io = getIO();
    chat.participants.forEach(participantId => {
      if (participantId.toString() !== req.user._id.toString()) {
        io.to(participantId.toString()).emit('new_message', {
          chatId,
          message
        });
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:messageId
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteForEveryone } = req.query;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is message sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    if (deleteForEveryone === 'true') {
      // Delete for everyone
      message.isDeletedForEveryone = true;
      
      // Delete uploaded file if exists
      if (message.fileUrl) {
        const filePath = path.join(__dirname, '../../', message.fileUrl);
        try {
          await fs.unlink(filePath);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
    } else {
      // Delete only for current user
      if (!message.deletedFor.includes(req.user._id)) {
        message.deletedFor.push(req.user._id);
      }
    }

    await message.save();

    // Emit socket event
    const io = getIO();
    const chat = await Chat.findById(message.chat);
    chat.participants.forEach(participantId => {
      io.to(participantId.toString()).emit('message_deleted', {
        messageId,
        chatId: message.chat,
        deletedForEveryone: deleteForEveryone === 'true'
      });
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:messageId/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if already read
    const alreadyRead = message.readBy.some(
      r => r.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({
        user: req.user._id,
        readAt: new Date()
      });
      await message.save();

      // Emit socket event
      const io = getIO();
      io.to(message.sender.toString()).emit('message_read', {
        messageId,
        chatId: message.chat,
        readBy: req.user._id
      });
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add reaction to message
// @route   POST /api/messages/:messageId/reactions
// @access  Private
const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Add or update reaction
    const existingReaction = message.reactions?.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingReaction) {
      existingReaction.emoji = emoji;
    } else {
      if (!message.reactions) message.reactions = [];
      message.reactions.push({
        user: req.user._id,
        emoji
      });
    }

    await message.save();

    // Emit socket event
    const io = getIO();
    const chat = await Chat.findById(message.chat);
    chat.participants.forEach(participantId => {
      io.to(participantId.toString()).emit('message_reaction', {
        messageId,
        chatId: message.chat,
        reactions: message.reactions
      });
    });

    res.json(message.reactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  sendMessage,
  deleteMessage,
  markAsRead,
  addReaction
};