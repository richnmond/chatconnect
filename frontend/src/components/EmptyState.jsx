import { FiMessageCircle } from 'react-icons/fi'

export default function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
      <FiMessageCircle className="w-16 h-16 mb-4" />
      <h3 className="text-xl font-medium mb-2">Welcome to ConnectChat</h3>
      <p>Select a chat or start a new conversation</p>
    </div>
  )
}