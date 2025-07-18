'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { COLOR_THEMES, ColorTheme, DEFAULT_COLOR_THEME } from './color-themes'

interface ColorThemeContextType {
  currentTheme: ColorTheme
  setTheme: (theme: ColorTheme) => void
  themes: ColorTheme[]
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined)

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(DEFAULT_COLOR_THEME)

  // Load saved theme from localStorage on mount
  useEffect(() => {
    const savedThemeId = localStorage.getItem('color-theme')
    if (savedThemeId) {
      const savedTheme = COLOR_THEMES.find(theme => theme.id === savedThemeId)
      if (savedTheme) {
        setCurrentTheme(savedTheme)
        updateCSSVariables(savedTheme)
      }
    }
  }, [])

  const setTheme = (theme: ColorTheme) => {
    setCurrentTheme(theme)
    updateCSSVariables(theme)
    localStorage.setItem('color-theme', theme.id)
  }

  const updateCSSVariables = (theme: ColorTheme) => {
    const root = document.documentElement
    
    // Update all primary-related CSS variables
    root.style.setProperty('--primary', theme.primary)
    root.style.setProperty('--ring', theme.primary)
    root.style.setProperty('--sidebar-primary', theme.primary)
    root.style.setProperty('--sidebar-ring', theme.primary)
  }

  return (
    <ColorThemeContext.Provider value={{
      currentTheme,
      setTheme,
      themes: COLOR_THEMES
    }}>
      {children}
    </ColorThemeContext.Provider>
  )
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext)
  if (context === undefined) {
    throw new Error('useColorTheme must be used within a ColorThemeProvider')
  }
  return context
}