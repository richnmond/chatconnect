import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useSocket } from '../contexts/SocketContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { 
  FiSearch, 
  FiPlus, 
  FiLogOut, 
  FiSun, 
  FiMoon,
  FiUser,
  FiUsers
} from 'react-icons/fi'
import NewChatModal from './NewChatModal'

export default function Sidebar({ selectedChat, onSelectChat }) {
  const [view, setView] = useState('chats') // chats | people
  const [chats, setChats] = useState([])
  const [filteredChats, setFilteredChats] = useState([])
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { socket } = useSocket()

  useEffect(() => {
    fetchChats()
    fetchUsers()
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on('new_message', handleNewMessage)
    socket.on('user_status_change', handleUserStatusChange)

    return () => {
      socket.off('new_message')
      socket.off('user_status_change')
    }
  }, [socket, user?._id])

  useEffect(() => {
    if (view === 'chats') {
      filterChats()
    } else {
      filterUsers()
    }
  }, [searchQuery, chats, users, view])

  const fetchChats = async () => {
    try {
      const { data } = await axios.get('/api/chats')
      setChats(data)
      setFilteredChats(data)
    } catch (error) {
      toast.error('Failed to load chats')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('/api/users')
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setUsersLoading(false)
    }
  }

  const handleNewMessage = (data) => {
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat._id === data.chatId) {
          return {
            ...chat,
            lastMessage: data.message,
            updatedAt: new Date()
          }
        }
        return chat
      })

      return updatedChats.sort((a, b) =>
        new Date(b.updatedAt) - new Date(a.updatedAt)
      )
    })
  }

  const handleUserStatusChange = (data) => {
    setChats(prevChats =>
      prevChats.map(chat => {
        if (!chat.isGroup) {
          const otherUser = chat.participants.find(p => p._id !== user._id)
          if (otherUser && otherUser._id === data.userId) {
            return {
              ...chat,
              isOnline: data.status === 'online'
            }
          }
        }
        return chat
      })
    )

    setUsers(prevUsers =>
      prevUsers.map(u =>
        u._id === data.userId
          ? { ...u, status: data.status, lastSeen: data.lastSeen }
          : u
      )
    )
  }

  const filterChats = () => {
    if (!searchQuery.trim()) {
      setFilteredChats(chats)
      return
    }

    const filtered = chats.filter(chat =>
      chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredChats(filtered)
  }

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users)
      return
    }

    const filtered = users.filter(u =>
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredUsers(filtered)
  }

  const startPrivateChat = async (otherUser) => {
    try {
      const { data } = await axios.post('/api/chats/private', { userId: otherUser._id })
      setChats(prev => {
        const existing = prev.find(c => c._id === data._id)
        if (existing) return prev
        return [data, ...prev]
      })
      onSelectChat(data)
    } catch (error) {
      toast.error('Failed to start chat')
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
              ConnectChat
            </h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
              >
                <FiLogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User info */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.username}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                user?.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
            <div className="flex-1">
              <p className="font-medium">{user?.username}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {user?.status || 'offline'}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={view === 'chats' ? 'Search chats...' : 'Search people...'}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1 mt-3">
            <button
              onClick={() => setView('chats')}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'chats'
                  ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <FiUsers className="w-4 h-4" />
              <span>Chats</span>
            </button>
            <button
              onClick={() => setView('people')}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'people'
                  ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <FiUser className="w-4 h-4" />
              <span>People</span>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto chat-scrollbar">
          <div className="p-2">
            {view === 'chats' ? (
              <>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="w-full mb-2 p-3 text-left bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg transition-colors"
                >
                  <div className="flex items-center text-primary-600 dark:text-primary-400">
                    <FiPlus className="w-5 h-5 mr-2" />
                    <span className="font-medium">New Chat</span>
                  </div>
                </button>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No chats found' : 'No chats yet'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredChats.map(chat => (
                      <button
                        key={chat._id}
                        onClick={() => onSelectChat(chat)}
                        className={`w-full p-3 rounded-lg transition-colors ${
                          selectedChat?._id === chat._id
                            ? 'bg-primary-100 dark:bg-primary-900/40'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-shrink-0">
                            {chat.avatar ? (
                              <img 
                                src={chat.avatar} 
                                alt={chat.name}
                                className="w-12 h-12 rounded-full"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-lg font-medium">
                                {chat.isGroup ? <FiUsers /> : chat.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {!chat.isGroup && chat.isOnline && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <p className="font-medium truncate">{chat.name}</p>
                              {chat.lastMessage && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                  {format(new Date(chat.lastMessage.createdAt), 'HH:mm')}
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {chat.lastMessage?.type === 'image' ? '📷 Image' :
                                 chat.lastMessage?.type === 'file' ? '📎 File' :
                                 chat.lastMessage?.content || 'No messages yet'}
                              </p>
                              {chat.unreadCount > 0 && (
                                <span className="ml-2 bg-primary-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                                  {chat.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No people found' : 'No users found'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredUsers.map(u => (
                      <button
                        key={u._id}
                        onClick={() => startPrivateChat(u)}
                        className="w-full p-3 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-shrink-0">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.username} className="w-12 h-12 rounded-full" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-lg font-medium">
                                {u.username?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {u.status === 'online' && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="font-medium truncate">{u.username}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {u.status === 'online'
                                ? 'Online'
                                : u.lastSeen
                                  ? `Last seen ${format(new Date(u.lastSeen), 'HH:mm')}`
                                  : 'Offline'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showNewChatModal && (
        <NewChatModal 
          onClose={() => setShowNewChatModal(false)}
          onChatCreated={(chat) => {
            setChats(prev => [chat, ...prev])
            onSelectChat(chat)
            setShowNewChatModal(false)
          }}
        />
      )}
    </>
  )
}
