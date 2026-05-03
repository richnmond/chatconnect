
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
  FiX,
  FiVideo,
  FiMic,
  FiStopCircle
} from 'react-icons/fi'
import MessageBubble from './MessageBubble'
import VideoCallModal from './VideoCallModal'

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
  const [audioRecording, setAudioRecording] = useState(false)
  const [incomingCall, setIncomingCall] = useState(null)
  const [callStatus, setCallStatus] = useState(null)
  const [activeCallUser, setActiveCallUser] = useState(null)
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [callTarget, setCallTarget] = useState(null)
  
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const remoteStreamRef = useRef(null)
  
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

    const handleIncomingCall = (data) => {
      if (callStatus === 'in-call' || callStatus === 'calling') {
        socket.emit('decline_call', { callerId: data.caller.id })
        return
      }
      setIncomingCall(data)
      setActiveCallUser(data.caller)
      setCallTarget(data.caller.id)
      setCallStatus('incoming')
      toast.success(`${data.caller.username} is calling you`)
    }

    const handleCallAccepted = async ({ answer }) => {
      try {
        if (!pcRef.current) return
        await pcRef.current.setRemoteDescription(answer)
        setCallStatus('in-call')
        toast.success('Call connected')
      } catch (error) {
        console.error(error)
        toast.error('Error connecting call')
      }
    }

    const handleCallDeclined = () => {
      toast.error('Call declined')
      cleanupCall()
    }

    const handleIceCandidate = async ({ candidate }) => {
      if (pcRef.current && candidate) {
        try {
          await pcRef.current.addIceCandidate(candidate)
        } catch (error) {
          console.error('Error adding ICE candidate', error)
        }
      }
    }

    const handleCallEnded = () => {
      toast('Call ended')
      cleanupCall()
    }

    socket.on('new_message', handleNewMessage)
    socket.on('user_typing', handleUserTyping)
    socket.on('message_deleted', handleMessageDeleted)
    socket.on('message_read', handleMessageRead)
    socket.on('incoming_call', handleIncomingCall)
    socket.on('call_accepted', handleCallAccepted)
    socket.on('call_declined', handleCallDeclined)
    socket.on('ice_candidate', handleIceCandidate)
    socket.on('call_ended', handleCallEnded)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('user_typing', handleUserTyping)
      socket.off('message_deleted', handleMessageDeleted)
      socket.off('message_read', handleMessageRead)
      socket.off('incoming_call', handleIncomingCall)
      socket.off('call_accepted', handleCallAccepted)
      socket.off('call_declined', handleCallDeclined)
      socket.off('ice_candidate', handleIceCandidate)
      socket.off('call_ended', handleCallEnded)
    }
  }, [socket, chat, user._id, callStatus])

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

  const setupLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      setLocalStream(stream)
      localStreamRef.current = stream
      return stream
    } catch (error) {
      toast.error('Unable to access camera and microphone')
      throw error
    }
  }

  const createPeerConnection = (targetUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    })

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', {
          targetUserId,
          candidate: event.candidate
        })
      }
    }

    pc.ontrack = (event) => {
      const [stream] = event.streams
      if (stream) {
        setRemoteStream(stream)
        remoteStreamRef.current = stream
      }
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current))
    }

    pcRef.current = pc
    return pc
  }

  const cleanupCall = () => {
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop())
      remoteStreamRef.current = null
    }

    setLocalStream(null)
    setRemoteStream(null)
    setCallStatus(null)
    setIncomingCall(null)
    setActiveCallUser(null)
    setCallTarget(null)
    setAudioRecording(false)
    audioChunksRef.current = []
  }

  const startCall = async () => {
    if (!chat || chat.isGroup) {
      toast.error('Video calls are available on private chats only')
      return
    }

    const other = chat.participants?.find(participant => participant._id !== user._id)
    if (!other) {
      toast.error('Cannot start call without a chat partner')
      return
    }

    try {
      await setupLocalMedia()
      const pc = createPeerConnection(other._id)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      socket.emit('call_user', {
        targetUserId: other._id,
        offer,
        chatId: chat._id
      })

      setCallTarget(other._id)
      setActiveCallUser(other)
      setCallStatus('calling')
      toast.success(`Calling ${other.username}`)
    } catch (error) {
      cleanupCall()
    }
  }

  const acceptIncomingCall = async () => {
    if (!incomingCall) return

    try {
      await setupLocalMedia()
      const pc = createPeerConnection(incomingCall.caller.id)
      await pc.setRemoteDescription(incomingCall.offer)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      socket.emit('accept_call', {
        callerId: incomingCall.caller.id,
        answer
      })

      setCallStatus('in-call')
      setIncomingCall(null)
      toast.success('Joined call')
    } catch (error) {
      cleanupCall()
    }
  }

  const declineIncomingCall = () => {
    if (incomingCall) {
      socket.emit('decline_call', { callerId: incomingCall.caller.id })
      cleanupCall()
    }
  }

  const endCall = () => {
    if (callTarget) {
      socket.emit('end_call', { targetUserId: callTarget })
    }
    cleanupCall()
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
      if (filePreview && filePreview.startsWith('blob:')) {
        URL.revokeObjectURL(filePreview)
      }

      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => setFilePreview(event.target.result)
        reader.readAsDataURL(file)
      } else if (file.type.startsWith('audio/')) {
        setFilePreview(URL.createObjectURL(file))
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

  const toggleRecording = async () => {
    if (audioRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorderRef.current = new MediaRecorder(stream)
        audioChunksRef.current = []

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop())
          
          // Set as selected file to send
          setSelectedFile(audioFile)
          setFilePreview(URL.createObjectURL(audioBlob))
          setAudioRecording(false)
        }

        mediaRecorderRef.current.start()
        setAudioRecording(true)
      } catch (error) {
        toast.error('Could not access microphone')
        console.error('Error accessing microphone:', error)
      }
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startCall}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <FiVideo className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <FiMoreVertical className="w-5 h-5" />
          </button>
        </div>
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
            <div className="flex items-center space-x-3 w-full">
              <div className="flex-shrink-0">
                {filePreview ? (
                  selectedFile.type.startsWith('image/') ? (
                    <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                  ) : selectedFile.type.startsWith('audio/') ? (
                    <audio controls src={filePreview} className="w-36" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                      <FiPaperclip className="w-6 h-6" />
                    </div>
                  )
                ) : (
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                    <FiPaperclip className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (filePreview && filePreview.startsWith('blob:')) {
                  URL.revokeObjectURL(filePreview)
                }
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
              onClick={toggleRecording}
              className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg ${audioRecording ? 'text-red-600' : ''}`}
            >
              {audioRecording ? <FiStopCircle className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
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
                accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
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

      {(incomingCall || callStatus) && (
        <VideoCallModal
          status={callStatus}
          localStream={localStream}
          remoteStream={remoteStream}
          incomingCall={incomingCall}
          activeCallUser={activeCallUser}
          onAccept={acceptIncomingCall}
          onDecline={declineIncomingCall}
          onHangUp={endCall}
        />
      )}
    </div>
  )
}
