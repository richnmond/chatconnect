import { useEffect, useRef } from 'react'
import { FiCheck, FiPhoneOff } from 'react-icons/fi'

export default function VideoCallModal({
  status,
  localStream,
  remoteStream,
  incomingCall,
  activeCallUser,
  onAccept,
  onDecline,
  onHangUp,
  onCancel
}) {
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {incomingCall ? 'Incoming video call' : status === 'calling' ? 'Calling...' : 'Video call'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {incomingCall
                ? `${incomingCall.caller.username} is calling you`
                : activeCallUser
                  ? `With ${activeCallUser.username}`
                  : 'Connecting...'}
            </p>
          </div>
          <button
            onClick={onHangUp}
            className="text-red-600 hover:text-red-800"
            aria-label="End call"
          >
            <FiPhoneOff className="w-6 h-6" />
          </button>
        </div>

        {incomingCall ? (
          <div className="p-6 space-y-4 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-4xl text-primary-600">
              {incomingCall.caller.username?.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{incomingCall.caller.username} wants to start a video call.</p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={onAccept}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-green-600 text-white hover:bg-green-700"
              >
                <FiCheck /> Accept
              </button>
              <button
                onClick={onDecline}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Decline
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
            <div className="rounded-2xl bg-gray-100 dark:bg-gray-800 p-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Your video</h3>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-64 rounded-2xl bg-black"
              />
            </div>
            <div className="rounded-2xl bg-gray-100 dark:bg-gray-800 p-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Remote</h3>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-64 rounded-2xl bg-black"
              />
            </div>
          </div>
        )}

        {!incomingCall && (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 text-primary-700 px-4 py-2 text-sm">
                <FiVideo /> {status === 'calling' ? 'Calling...' : 'In call'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
