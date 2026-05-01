
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import EmojiPicker from 'emoji-picker-react'
import { 
  FiSend, 
  FiPaperclip, 
  FiSmile, 
  FiMoreVertical,
  FiArrowLeft,
  FiTrash2,
  FiX
} from 'react-icons/fi'
import MessageBubble from './MessageBubble'

export default function ChatWindow({ chat, onBack }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  
  const { user } = useAuth()
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return

    if (chat) {
      fetchMessages()
      socket.emit('join_chat', chat._id)
    }

    return () => {
      if (chat) {
        socket.emit('leave_chat', chat._id)
      }
    }
  }, [chat, socket])

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (data) => {
      if (data.chatId === chat?._id) {
        setMessages(prev => [...prev, data.message])

        socket.emit('message_delivered', { messageId: data.message._id })

        if (data.message.sender._id !== user._id) {
          markMessageAsRead(data.message._id)
        }
      }
    }

    const handleUserTyping = (data) => {
      if (data.userId !== user._id) {
        if (data.isTyping) {
          setTypingUsers(prev => [...new Set([...prev, data.username])])
        } else {
          setTypingUsers(prev => prev.filter(u => u !== data.username))
        }
      }
    }

    const handleMessageDeleted = (data) => {
      if (data.chatId === chat?._id) {
        if (data.deletedForEveryone) {
          setMessages(prev => prev.map(msg => 
            msg._id === data.messageId
              ? { ...msg, isDeletedForEveryone: true, content: 'This message was deleted' }
              : msg
          ))
        }
      }
    }

    const handleMessageRead = (data) => {
      if (data.chatId === chat?._id) {
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId
            ? { ...msg, readBy: [...(msg.readBy || []), { user: data.readBy }] }
            : msg
        ))
      }
    }

    socket.on('new_message', handleNewMessage)
    socket.on('user_typing', handleUserTyping)
    socket.on('message_deleted', handleMessageDeleted)
    socket.on('message_read', handleMessageRead)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('user_typing', handleUserTyping)
      socket.off('message_deleted', handleMessageDeleted)
      socket.off('message_read', handleMessageRead)
    }
  }, [socket, chat, user._id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(`/api/chats/${chat._id}/messages`)
      setMessages(data.messages)
    } catch (error) {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const handleNewMessage = (data) => {
    if (data.chatId === chat._id) {
      setMessages(prev => [...prev, data.message])
      
      // Mark message as delivered
      socket.emit('message_delivered', { messageId: data.message._id })
      
      // Mark as read if chat is open
      if (data.message.sender._id !== user._id) {
        markMessageAsRead(data.message._id)
      }
    }
  }

  const handleUserTyping = (data) => {
    if (data.userId !== user._id) {
      if (data.isTyping) {
        setTypingUsers(prev => [...new Set([...prev, data.username])])
      } else {
        setTypingUsers(prev => prev.filter(u => u !== data.username))
      }
    }
  }

  const handleMessageDeleted = (data) => {
    if (data.chatId === chat._id) {
      if (data.deletedForEveryone) {
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId
            ? { ...msg, isDeletedForEveryone: true, content: 'This message was deleted' }
            : msg
        ))
      }
    }
  }

  const handleMessageRead = (data) => {
    if (data.chatId === chat._id) {
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId
          ? { ...msg, readBy: [...(msg.readBy || []), { user: data.readBy }] }
          : msg
      ))
    }
  }

  const markMessageAsRead = async (messageId) => {
    try {
      await axios.put(`/api/messages/${messageId}/read`)
    } catch (error) {
      console.error('Failed to mark message as read:', error)
    }
  }

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true)
      socket.emit('typing', { chatId: chat._id, isTyping: true })
    }

    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socket.emit('typing', { chatId: chat._id, isTyping: false })
    }, 1000)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim() && !selectedFile) return

    setSending(true)
    const formData = new FormData()
    formData.append('chatId', chat._id)
    formData.append('content', inputMessage.trim())
    
    if (selectedFile) {
      formData.append('file', selectedFile)
    }

    try {
      const { data } = await axios.post('/api/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setMessages(prev => [...prev, data])
      setInputMessage('')
      setSelectedFile(null)
      setFilePreview(null)
      setShowEmojiPicker(false)
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => setFilePreview(e.target.result)
        reader.readAsDataURL(file)
      } else {
        setFilePreview(null)
      }
    }
  }

  const handleDeleteMessage = async (messageId, forEveryone = false) => {
    try {
      await axios.delete(`/api/messages/${messageId}?deleteForEveryone=${forEveryone}`)
      
      if (!forEveryone) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId))
      }
      
      toast.success('Message deleted')
    } catch (error) {
      toast.error('Failed to delete message')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleEmojiSelect = (emoji) => {
    setInputMessage(prev => prev + emoji.emoji)
    setShowEmojiPicker(false)
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          
          {chat.avatar ? (
            <img 
              src={chat.avatar} 
              alt={chat.name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white">
              {chat.name?.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div>
            <h2 className="font-semibold">{chat.name}</h2>
            {!chat.isGroup && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {chat.isOnline ? 'Online' : 'Offline'}
              </p>
            )}
            {typingUsers.length > 0 && (
              <p className="text-sm text-primary-500 animate-pulse">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </p>
            )}
          </div>
        </div>
        
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <FiMoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={message.sender._id === user._id}
                showAvatar={index === 0 || messages[index - 1]?.sender._id !== message.sender._id}
                onDelete={(forEveryone) => handleDeleteMessage(message._id, forEveryone)}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* File preview */}
      {selectedFile && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
            <div className="flex items-center space-x-3">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
              ) : (
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                  <FiPaperclip className="w-6 h-6" />
                </div>
              )}
              <div>
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null)
                setFilePreview(null)
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value)
                handleTyping()
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e)
                }
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="1"
              style={{ maxHeight: '120px' }}
            />
            
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2">
                <EmojiPicker onEmojiClick={handleEmojiSelect} />
              </div>
            )}
          </div>
          
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <FiSmile className="w-5 h-5" />
            </button>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <FiPaperclip className="w-5 h-5" />
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
            </button>
            
            <button
              type="submit"
              disabled={(!inputMessage.trim() && !selectedFile) || sending}
              className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSend className="w-5 h-5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
