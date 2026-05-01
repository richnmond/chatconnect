import toast from 'react-hot-toast'

export const handleApiError = (error) => {
  console.error('API Error:', error)
  
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response
    
    switch (status) {
      case 400:
        toast.error(data.message || 'Bad request')
        break
      case 401:
        toast.error('Session expired. Please login again.')
        localStorage.removeItem('token')
        window.location.href = '/login'
        break
      case 403:
        toast.error('You do not have permission to perform this action')
        break
      case 404:
        toast.error('Resource not found')
        break
      case 413:
        toast.error('File too large')
        break
      case 429:
        toast.error('Too many requests. Please try again later.')
        break
      case 500:
        toast.error('Server error. Please try again later.')
        break
      default:
        toast.error(data.message || 'An error occurred')
    }
  } else if (error.request) {
    // Request made but no response
    toast.error('Network error. Please check your connection.')
  } else {
    // Error in request setup
    toast.error(error.message || 'An error occurred')
  }
}

export const handleSocketError = (error) => {
  console.error('Socket Error:', error)
  
  if (error === 'Authentication error') {
    toast.error('Connection failed. Please login again.')
    localStorage.removeItem('token')
    window.location.href = '/login'
  } else {
    toast.error('Connection error. Reconnecting...')
  }
}

export const logError = (error, context = {}) => {
  // In production, you might want to send this to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      ...context
    })
    // Send to error tracking service like Sentry
    // Sentry.captureException(error, { extra: context })
  } else {
    console.error('Error:', error, context)
  }
}