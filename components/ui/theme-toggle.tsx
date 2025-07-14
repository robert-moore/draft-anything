'use client'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Monitor, Moon, Sun, ChevronDown } from 'lucide-react'
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
        className="h-9 px-3 border-border/20 bg-background/80 backdrop-blur-sm hover:bg-accent/20"
      >
        <div className="h-4 w-4" />
        <ChevronDown className="h-3 w-3 ml-1" />
      </Button>
    )
  }

  // Get the appropriate icon based on current theme
  const getCurrentIcon = () => {
    if (theme === 'system') {
      return <Monitor className="h-4 w-4" />
    }
    return resolvedTheme === 'dark' ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    )
  }

  const themeOptions = [
    {
      value: 'light',
      label: 'Light',
      icon: <Sun className="h-4 w-4" />
    },
    {
      value: 'dark', 
      label: 'Dark',
      icon: <Moon className="h-4 w-4" />
    },
    {
      value: 'system',
      label: 'System',
      icon: <Monitor className="h-4 w-4" />
    }
  ]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 border-border/20 bg-background/80 backdrop-blur-sm hover:bg-accent/20 transition-all duration-300"
        >
          {getCurrentIcon()}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-32 p-1 bg-popover border border-border shadow-md">
        <div className="space-y-1">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer text-foreground"
            >
              {option.icon}
              <span className="flex-1 text-left">{option.label}</span>
              {theme === option.value && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
