import { useState } from 'react'
import { format } from 'date-fns'
import { FiCheck, FiCheckCircle, FiMoreVertical, FiTrash2 } from 'react-icons/fi'

export default function MessageBubble({ message, isOwn, showAvatar, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const getMessageStatus = () => {
    if (!isOwn) return null
    
    if (message.readBy?.length > 0) {
      return <FiCheckCircle className="w-4 h-4 text-blue-500" />
    } else if (message.deliveredTo?.length > 0) {
      return <FiCheckCircle className="w-4 h-4 text-gray-400" />
    } else {
      return <FiCheck className="w-4 h-4 text-gray-400" />
    }
  }

  const handleDelete = (forEveryone) => {
    onDelete(forEveryone)
    setShowMenu(false)
    setShowDeleteConfirm(false)
  }

  if (message.isDeletedForEveryone) {
    return (
      <div className="flex justify-center px-4 py-2">
        <span className="text-sm text-gray-500 italic">This message was deleted</span>
      </div>
    )
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-4 py-1`}> 
      <div className={`flex items-end ${isOwn ? 'flex-row-reverse' : 'flex-row'} max-w-[70%] min-w-[20%] gap-2`}>
        {showAvatar && !isOwn && (
          <div className="flex-shrink-0">
            {message.sender.avatar ? (
              <img 
                src={message.sender.avatar} 
                alt={message.sender.username}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm">
                {message.sender.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}

        <div className="relative group w-full">
          <div className={
            `px-4 py-3 rounded-3xl break-words min-w-[120px] w-fit ${isOwn ? 'bg-primary-500 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'}`
          }>
            {message.type === 'text' && (
              <p>{message.content}</p>
            )}

            {message.type === 'image' && (
              <img 
                src={message.fileUrl} 
                alt="Shared image"
                className="max-w-full rounded-lg cursor-pointer"
                onClick={() => window.open(message.fileUrl, '_blank')}
              />
            )}

            {message.type === 'file' && (
              <a 
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 hover:underline"
              >
                <span>📎</span>
                <span>{message.fileName}</span>
              </a>
            )}

            <div className={`flex items-center justify-end space-x-1 mt-2 ${isOwn ? 'text-primary-100' : 'text-gray-500'}`}>
              <span className="text-[11px] leading-none">
                {format(new Date(message.createdAt), 'HH:mm')}
              </span>
              {getMessageStatus()}
            </div>
          </div>

          {isOwn && (
            <div className="absolute top-0 right-0 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-lg"
              >
                <FiMoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Message</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleDelete(false)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Delete for me
              </button>
              <button
                onClick={() => handleDelete(true)}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Delete for everyone
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}