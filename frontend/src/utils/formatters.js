import { format, formatDistance, formatRelative, isToday, isYesterday } from 'date-fns'

export const formatMessageTime = (date) => {
  const messageDate = new Date(date)
  
  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm')
  } else if (isYesterday(messageDate)) {
    return `Yesterday ${format(messageDate, 'HH:mm')}`
  } else {
    return format(messageDate, 'dd/MM/yyyy HH:mm')
  }
}

export const formatLastSeen = (date) => {
  if (!date) return 'Never'
  
  const lastSeenDate = new Date(date)
  const now = new Date()
  const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`
  
  return formatDistance(lastSeenDate, now, { addSuffix: true })
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatChatTime = (date) => {
  const chatDate = new Date(date)
  
  if (isToday(chatDate)) {
    return format(chatDate, 'HH:mm')
  } else if (isYesterday(chatDate)) {
    return 'Yesterday'
  } else if (chatDate.getFullYear() === new Date().getFullYear()) {
    return format(chatDate, 'dd MMM')
  } else {
    return format(chatDate, 'dd/MM/yyyy')
  }
}

export const truncateText = (text, maxLength = 30) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const formatTypingUsers = (users) => {
  if (users.length === 0) return ''
  if (users.length === 1) return `${users[0]} is typing...`
  if (users.length === 2) return `${users[0]} and ${users[1]} are typing...`
  return `${users.length} people are typing...`
}

export const getInitials = (name) => {
  if (!name) return '?'
  
  const parts = name.split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export const formatPhoneNumber = (phoneNumber) => {
  const cleaned = ('' + phoneNumber).replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3]
  }
  
  return phoneNumber
}