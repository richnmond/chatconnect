export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password) => {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' }
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  
  return { valid: true, message: '' }
}

export const validateUsername = (username) => {
  if (username.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters long' }
  }
  
  if (username.length > 30) {
    return { valid: false, message: 'Username must be less than 30 characters' }
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, message: 'Username can only contain letters, numbers, and underscores' }
  }
  
  return { valid: true, message: '' }
}

export const validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type)
}

export const validateFileSize = (file, maxSize) => {
  return file.size <= maxSize
}