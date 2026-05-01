export const storage = {
  set: (key, value) => {
    try {
      const serializedValue = JSON.stringify(value)
      localStorage.setItem(key, serializedValue)
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  },

  get: (key, defaultValue = null) => {
    try {
      const serializedValue = localStorage.getItem(key)
      if (serializedValue === null) return defaultValue
      return JSON.parse(serializedValue)
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return defaultValue
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing from localStorage:', error)
    }
  },

  clear: () => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }
}

export const sessionStorage = {
  set: (key, value) => {
    try {
      const serializedValue = JSON.stringify(value)
      sessionStorage.setItem(key, serializedValue)
    } catch (error) {
      console.error('Error saving to sessionStorage:', error)
    }
  },

  get: (key, defaultValue = null) => {
    try {
      const serializedValue = sessionStorage.getItem(key)
      if (serializedValue === null) return defaultValue
      return JSON.parse(serializedValue)
    } catch (error) {
      console.error('Error reading from sessionStorage:', error)
      return defaultValue
    }
  },

  remove: (key) => {
    try {
      sessionStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing from sessionStorage:', error)
    }
  },

  clear: () => {
    try {
      sessionStorage.clear()
    } catch (error) {
      console.error('Error clearing sessionStorage:', error)
    }
  }
}