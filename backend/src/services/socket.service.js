const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

let io;

const initialize = (socketIo) => {
  io = socketIo;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    // Join user's personal room
    socket.join(socket.user._id.toString());

    // Update user status to online
    updateUserStatus(socket.user._id, 'online');

    // Handle joining chat rooms
    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`${socket.user.username} joined chat: ${chatId}`);
    });

    // Handle leaving chat rooms
    socket.on('leave_chat', (chatId) => {
      socket.leave(chatId);
      console.log(`${socket.user.username} left chat: ${chatId}`);
    });

    // Handle typing indicator
    socket.on('typing', ({ chatId, isTyping }) => {
      socket.to(chatId).emit('user_typing', {
        userId: socket.user._id,
        username: socket.user.username,
        isTyping
      });
    });

    // Handle message delivery status
    socket.on('message_delivered', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (message) {
          const isDelivered = message.deliveredTo.some(
            d => d.user.toString() === socket.user._id.toString()
          );
          
          if (!isDelivered) {
            message.deliveredTo.push({
              user: socket.user._id,
              deliveredAt: new Date()
            });
            await message.save();
            
            io.to(message.sender.toString()).emit('message_delivered_status', {
              messageId,
              deliveredTo: socket.user._id
            });
          }
        }
      } catch (error) {
        console.error('Error updating message delivery:', error);
      }
    });

    socket.on('call_user', ({ targetUserId, offer, chatId }) => {
      if (!targetUserId || !offer) return;
      io.to(targetUserId.toString()).emit('incoming_call', {
        caller: {
          id: socket.user._id,
          username: socket.user.username,
          avatar: socket.user.avatar
        },
        offer,
        chatId
      });
    });

    socket.on('accept_call', ({ callerId, answer }) => {
      if (!callerId || !answer) return;
      io.to(callerId.toString()).emit('call_accepted', {
        answer
      });
    });

    socket.on('decline_call', ({ callerId }) => {
      if (!callerId) return;
      io.to(callerId.toString()).emit('call_declined');
    });

    socket.on('ice_candidate', ({ targetUserId, candidate }) => {
      if (!targetUserId || !candidate) return;
      io.to(targetUserId.toString()).emit('ice_candidate', {
        candidate,
        from: socket.user._id
      });
    });

    socket.on('end_call', ({ targetUserId }) => {
      if (!targetUserId) return;
      io.to(targetUserId.toString()).emit('call_ended');
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username}`);
      await updateUserStatus(socket.user._id, 'offline');
      
      // Broadcast offline status to all connected users
      io.emit('user_status_change', {
        userId: socket.user._id,
        status: 'offline',
        lastSeen: new Date()
      });
    });
  });
};

const updateUserStatus = async (userId, status) => {
  try {
    const user = await User.findById(userId);
    if (user) {
      user.status = status;
      if (status === 'offline') {
        user.lastSeen = new Date();
      }
      await user.save();

      // Broadcast status change
      io.emit('user_status_change', {
        userId,
        status,
        lastSeen: user.lastSeen
      });
    }
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = {
  initialize,
  getIO
};