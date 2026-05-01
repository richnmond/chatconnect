export const APP_NAME = 'ConnectChat'

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  EMOJI: 'emoji'
}

export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away'
}

export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read'
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export const SUPPORTED_FILE_TYPES = [
  ...SUPPORTED_IMAGE_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MESSAGES_PER_PAGE: 50
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me'
  },
  USERS: {
    BASE: '/api/users',
    STATUS: '/api/users/status',
    PROFILE: '/api/users/profile'
  },
  CHATS: {
    BASE: '/api/chats',
    PRIVATE: '/api/chats/private',
    GROUP: '/api/chats/group',
    MESSAGES: (chatId) => `/api/chats/${chatId}/messages`
  },
  MESSAGES: {
    BASE: '/api/messages',
    READ: (messageId) => `/api/messages/${messageId}/read`,
    REACTIONS: (messageId) => `/api/messages/${messageId}/reactions`
  }
}

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_CHAT: 'join_chat',
  LEAVE_CHAT: 'leave_chat',
  NEW_MESSAGE: 'new_message',
  TYPING: 'typing',
  USER_TYPING: 'user_typing',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_DELIVERED_STATUS: 'message_delivered_status',
  MESSAGE_READ: 'message_read',
  MESSAGE_DELETED: 'message_deleted',
  MESSAGE_REACTION: 'message_reaction',
  USER_STATUS_CHANGE: 'user_status_change'
}