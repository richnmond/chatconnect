import { useEffect } from 'react'
import { useSocket } from '../contexts/SocketContext'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export const useMessageNotifications = (currentChatId) => {
  const { socket } = useSocket()
  const { user } = useAuth()

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (data) => {
      // Only show notification if:
      // 1. Message is not from current user
      // 2. Chat is not currently open OR browser tab is not focused
      if (data.message.sender._id !== user._id) {
        if (data.chatId !== currentChatId || !document.hasFocus()) {
          // Show toast notification
          toast.success(`New message from ${data.message.sender.username}`, {
            icon: '💬',
            duration: 4000
          })

          // Play notification sound
          const audio = new Audio('/notification.mp3')
          audio.play().catch(() => {
            // Browser might block autoplay
            console.log('Notification sound blocked')
          })

          // Show browser notification if permitted
          if (Notification.permission === 'granted') {
            new Notification('New Message', {
              body: `${data.message.sender.username}: ${data.message.content}`,
              icon: '/vite.svg'
            })
          }
        }
      }
    }

    socket.on('new_message', handleNewMessage)

    return () => {
      socket.off('new_message', handleNewMessage)
    }
  }, [socket, user, currentChatId])

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])
}