import { useState } from 'react'
import { FiHeart, FiMessageCircle, FiTrash2, FiMoreVertical } from 'react-icons/fi'
import { format } from 'date-fns'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

export default function StatusCard({ status, onUpdate, onDelete }) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(status.likes.some(like => like._id === user._id))
  const [likes, setLikes] = useState(status.likes.length)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleLike = async () => {
    try {
      setLoading(true)
      const { data } = await axios.put(`/api/statuses/${status._id}/like`)
      setIsLiked(!isLiked)
      setLikes(data.likes.length)
      onUpdate(data)
    } catch (error) {
      toast.error('Failed to like status')
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return

    try {
      setLoading(true)
      const { data } = await axios.post(`/api/statuses/${status._id}/comment`, {
        content: commentText
      })
      setCommentText('')
      onUpdate(data)
      toast.success('Comment added')
    } catch (error) {
      toast.error('Failed to add comment')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStatus = async () => {
    if (window.confirm('Are you sure you want to delete this status?')) {
      try {
        await axios.delete(`/api/statuses/${status._id}`)
        onDelete(status._id)
        toast.success('Status deleted')
      } catch (error) {
        toast.error('Failed to delete status')
      }
    }
  }

  const isOwn = status.author._id === user._id

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <img
            src={status.author.avatar || 'https://via.placeholder.com/40'}
            alt={status.author.username}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {status.author.username}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {format(new Date(status.createdAt), 'MMM d, yyyy HH:mm')}
            </p>
          </div>
        </div>
        {isOwn && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <FiMoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <button
                onClick={handleDeleteStatus}
                className="absolute right-0 mt-1 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <p className="text-gray-900 dark:text-gray-100 mb-3 break-words">
        {status.content}
      </p>

      {/* Image */}
      {status.image && (
        <img
          src={status.image}
          alt="Status"
          className="w-full rounded-lg mb-3 max-h-96 object-cover"
        />
      )}

      {/* Stats */}
      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-3 pb-3 border-b dark:border-gray-700">
        <span>{likes} likes</span>
        <span>{status.comments.length} comments</span>
      </div>

      {/* Actions */}
      <div className="flex space-x-4 mb-3">
        <button
          onClick={handleLike}
          disabled={loading}
          className={`flex items-center space-x-2 ${
            isLiked ? 'text-red-500' : 'text-gray-500'
          } hover:text-red-500 transition`}
        >
          <FiHeart className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} />
          <span>Like</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition"
        >
          <FiMessageCircle className="w-5 h-5" />
          <span>Comment</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t dark:border-gray-700 pt-3">
          {/* Existing Comments */}
          <div className="mb-3 max-h-64 overflow-y-auto">
            {status.comments.length > 0 ? (
              status.comments.map((comment) => (
                <div key={comment._id} className="mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex justify-between">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {comment.author.username}
                    </p>
                    {comment.author._id === user._id && (
                      <button
                        onClick={async () => {
                          try {
                            await axios.delete(`/api/statuses/${status._id}/comment/${comment._id}`)
                            onUpdate({ ...status, comments: status.comments.filter(c => c._id !== comment._id) })
                          } catch (error) {
                            toast.error('Failed to delete comment')
                          }
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {comment.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No comments yet</p>
            )}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="flex space-x-2">
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border dark:border-gray-600 rounded-lg text-sm focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !commentText.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
