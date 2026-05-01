import { useState, useRef, useCallback } from 'react'
import { useSocket } from '../contexts/SocketContext'

export const useTypingIndicator = (chatId) => {
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const typingTimeoutRef = useRef(null)
  const { socket } = useSocket()

  const startTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      socket?.emit('typing', { chatId, isTyping: true })
    }

    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socket?.emit('typing', { chatId, isTyping: false })
    }, 1000)
  }, [chatId, isTyping, socket])

  const addTypingUser = useCallback((username) => {
    setTypingUsers(prev => {
      if (prev.includes(username)) return prev
      return [...prev, username]
    })
  }, [])

  const removeTypingUser = useCallback((username) => {
    setTypingUsers(prev => prev.filter(u => u !== username))
  }, [])

  return {
    isTyping,
    typingUsers,
    startTyping,
    addTypingUser,
    removeTypingUser,
    clearTypingUsers: () => setTypingUsers([])
  }
}