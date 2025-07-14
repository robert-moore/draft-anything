'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from './button'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-9 h-9 p-0 border-gray-300/20 dark:border-white/20 bg-gray-100/10 dark:bg-white/10 backdrop-blur-sm hover:bg-gray-200/20 dark:hover:bg-white/20"
      >
        <div className="h-4 w-4" />
      </Button>
    )
  }

  const toggleTheme = () => {
    if (theme === 'system') {
      // If currently system, switch to the opposite of the resolved theme
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    } else {
      // If currently light or dark, switch to the opposite
      setTheme(theme === 'dark' ? 'light' : 'dark')
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="w-9 h-9 p-0 border-gray-300/20 dark:border-white/20 bg-gray-100/10 dark:bg-white/10 backdrop-blur-sm hover:bg-gray-200/20 dark:hover:bg-white/20 transition-all duration-300"
      aria-label={`Switch to ${
        resolvedTheme === 'dark' ? 'light' : 'dark'
      } mode`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-4 w-4 text-gray-700 dark:text-white" />
      ) : (
        <Moon className="h-4 w-4 text-gray-700 dark:text-white" />
      )}
    </Button>
  )
}
