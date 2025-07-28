'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { COLOR_THEMES, ColorTheme, DEFAULT_COLOR_THEME } from './color-themes'

interface ColorThemeContextType {
  currentTheme: ColorTheme
  setTheme: (theme: ColorTheme) => void
  themes: ColorTheme[]
  isLoaded: boolean
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(
  undefined
)

export function ColorThemeProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [currentTheme, setCurrentTheme] =
    useState<ColorTheme>(DEFAULT_COLOR_THEME)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load saved theme from localStorage on mount
  useEffect(() => {
    const savedThemeId = localStorage.getItem('color-theme')
    if (savedThemeId) {
      const savedTheme = COLOR_THEMES.find(theme => theme.id === savedThemeId)
      if (savedTheme && savedTheme.id !== currentTheme.id) {
        setCurrentTheme(savedTheme)
        updateCSSVariables(savedTheme)
      }
    } else {
      // Apply default theme CSS variables on first load
      updateCSSVariables(DEFAULT_COLOR_THEME)
    }
    setIsLoaded(true)
  }, [])

  const setTheme = (theme: ColorTheme) => {
    setCurrentTheme(theme)
    updateCSSVariables(theme)
    localStorage.setItem('color-theme', theme.id)
  }

  const updateCSSVariables = (theme: ColorTheme) => {
    if (typeof document === 'undefined') return // SSR guard

    const root = document.documentElement

    // Only update if the value is actually different
    const currentPrimary = root.style.getPropertyValue('--primary').trim()
    const newPrimary = theme.primary.trim()

    if (currentPrimary !== newPrimary) {
      // console.log('Updating CSS variables:', { from: currentPrimary, to: newPrimary, theme: theme.name })
      root.style.setProperty('--primary', newPrimary)
      root.style.setProperty('--ring', newPrimary)
      root.style.setProperty('--sidebar-primary', newPrimary)
      root.style.setProperty('--sidebar-ring', newPrimary)
    }
  }

  return (
    <ColorThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        themes: COLOR_THEMES,
        isLoaded
      }}
    >
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
