import { useState } from 'react'
import { FiX, FiImage } from 'react-icons/fi'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function CreateStatusModal({ isOpen, onClose, onStatusCreated }) {
  const [content, setContent] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [visibility, setVisibility] = useState('public')
  const [loading, setLoading] = useState(false)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setFilePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!content.trim()) {
      toast.error('Please enter some content')
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('content', content)
      formData.append('visibility', visibility)
      if (selectedFile) {
        formData.append('image', selectedFile)
      }

      const { data } = await axios.post('/api/statuses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setContent('')
      setSelectedFile(null)
      setFilePreview(null)
      setVisibility('public')
      onStatusCreated(data)
      onClose()
      toast.success('Status posted!')
    } catch (error) {
      toast.error('Failed to create status')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Create Status
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content Textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="4"
          />

          {/* Image Preview */}
          {filePreview && (
            <div className="relative">
              <img
                src={filePreview}
                alt="Preview"
                className="w-full rounded-lg max-h-48 object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null)
                  setFilePreview(null)
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg focus:outline-none"
            >
              <option value="public">Public</option>
              <option value="friends">Friends Only</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <label className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer">
              <FiImage className="w-5 h-5 mr-2" />
              <span className="text-sm">Add Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
