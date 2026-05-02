import { useState, useEffect } from 'react'
import { FiPlus } from 'react-icons/fi'
import axios from 'axios'
import toast from 'react-hot-toast'
import StatusCard from '../components/StatusCard'
import CreateStatusModal from '../components/CreateStatusModal'

export default function Community() {
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchStatuses()
  }, [page])

  const fetchStatuses = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(`/api/statuses?page=${page}`)
      setStatuses(data.statuses)
      setTotalPages(data.totalPages)
    } catch (error) {
      toast.error('Failed to load statuses')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusCreated = (newStatus) => {
    setStatuses([newStatus, ...statuses])
  }

  const handleStatusUpdate = (updatedStatus) => {
    setStatuses(statuses.map(s => (s._id === updatedStatus._id ? updatedStatus : s)))
  }

  const handleStatusDelete = (statusId) => {
    setStatuses(statuses.filter(s => s._id !== statusId))
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm p-4 border-b dark:border-gray-700">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Community
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            <FiPlus className="w-5 h-5" />
            <span>Share Status</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto">
          {loading && statuses.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500 dark:text-gray-400">Loading statuses...</p>
            </div>
          ) : statuses.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500 dark:text-gray-400">
                No statuses yet. Be the first to share!
              </p>
            </div>
          ) : (
            <>
              {statuses.map((status) => (
                <StatusCard
                  key={status._id}
                  status={status}
                  onUpdate={handleStatusUpdate}
                  onDelete={handleStatusDelete}
                />
              ))}

              {/* Pagination */}
              <div className="flex justify-center space-x-2 mt-6">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Status Modal */}
      <CreateStatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStatusCreated={handleStatusCreated}
      />
    </div>
  )
}
