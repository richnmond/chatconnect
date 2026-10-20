import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export const wallpapers = [
  { id: 'plain', name: 'Clear', style: {} },
  { id: 'aurora', name: 'Aurora', style: { backgroundImage: 'linear-gradient(135deg, #dbeafe 0%, #f5d0fe 48%, #dcfce7 100%)' } },
  { id: 'sunset', name: 'Sunset', style: { backgroundImage: 'linear-gradient(135deg, #fed7aa 0%, #fecdd3 48%, #ddd6fe 100%)' } },
  { id: 'mint', name: 'Mint', style: { backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,.75) 0 2px, transparent 3px), linear-gradient(135deg, #ccfbf1, #d9f99d)' } },
  { id: 'night', name: 'Night sky', style: { backgroundColor: '#172554', backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,.75) 0 1px, transparent 2px), radial-gradient(circle at 75% 65%, rgba(255,255,255,.55) 0 1px, transparent 2px), linear-gradient(135deg, #172554, #312e81)' } }
]

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [wallpaper, setWallpaper] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wallpaper')) || wallpapers[0]
    } catch {
      return wallpapers[0]
    }
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  const toggleTheme = () => {
    setIsDark(prev => !prev)
  }

  const selectWallpaper = (nextWallpaper) => {
    setWallpaper(nextWallpaper)
    localStorage.setItem('wallpaper', JSON.stringify(nextWallpaper))
  }

  const value = {
    isDark,
    toggleTheme,
    wallpaper,
    wallpapers,
    selectWallpaper
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}