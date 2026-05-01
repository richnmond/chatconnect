import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { FiX, FiSearch, FiUsers } from 'react-icons/fi'

export default function NewChatModal({ onClose, onChatCreated }) {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [isGroup, setIsGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [searchQuery, users])

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('/api/users')
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      toast.error('Failed to load users')
    }
  }

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users)
      return
    }

    const filtered = users.filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredUsers(filtered)
  }

  const handleUserSelect = (user) => {
    if (isGroup) {
      if (!selectedUsers.find(u => u._id === user._id)) {
        setSelectedUsers([...selectedUsers, user])
      }
    } else {
      setSelectedUsers([user])
    }
    setSearchQuery('')
  }

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId))
  }

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user')
      return
    }

    if (isGroup && !groupName.trim()) {
      toast.error('Please enter a group name')
      return
    }

    setLoading(true)
    
    try {
      let response
      
      if (isGroup) {
        response = await axios.post('/api/chats/group', {
          name: groupName,
          participants: selectedUsers.map(u => u._id)
        })
      } else {
        response = await axios.post('/api/chats/private', {
          userId: selectedUsers[0]._id
        })
      }

      onChatCreated(response.data)
      toast.success(`${isGroup ? 'Group' : 'Chat'} created successfully`)
    } catch (error) {
      toast.error('Failed to create chat')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">New Chat</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isGroup}
                onChange={(e) => {
                  setIsGroup(e.target.checked)
                  setSelectedUsers([])
                }}
                className="rounded text-primary-500"
              />
              <span>Create group chat</span>
            </label>
          </div>

          {isGroup && (
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full px-4 py-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            />
          )}

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedUsers.map(user => (
                <div
                  key={user._id}
                  className="flex items-center space-x-2 px-3 py-1 bg-primary-100 dark:bg-primary-900/20 rounded-full"
                >
                  <span className="text-sm">{user.username}</span>
                  <button
                    onClick={() => handleRemoveUser(user._id)}
                    className="hover:text-red-500"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative mb-4">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filteredUsers.map(user => (
              <button
                key={user._id}
                onClick={() => handleUserSelect(user)}
                disabled={!isGroup && selectedUsers.length > 0}
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 text-left">
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                }`} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateChat}
            disabled={loading || selectedUsers.length === 0}
            className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Chat'}
          </button>
        </div>
      </div>
    </div>
  )
}