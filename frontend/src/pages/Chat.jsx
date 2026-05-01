import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import EmptyState from '../components/EmptyState'

export default function Chat() {
  const [selectedChat, setSelectedChat] = useState(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const { user } = useAuth()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <div className={`
        lg:relative fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
        ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:w-80 w-full
      `}>
        <Sidebar 
          selectedChat={selectedChat} 
          onSelectChat={(chat) => {
            setSelectedChat(chat)
            if (window.innerWidth < 1024) {
              setShowSidebar(false)
            }
          }} 
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <ChatWindow 
            chat={selectedChat} 
            onBack={() => {
              setSelectedChat(null)
              if (window.innerWidth < 1024) {
                setShowSidebar(true)
              }
            }}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Overlay for mobile */}
      {showSidebar && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  )
}