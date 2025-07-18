'use client'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Monitor, Moon, Sun, ChevronDown, Palette } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useColorTheme } from '@/lib/theme/color-theme-context'
import { ColorTheme } from '@/lib/theme/color-themes'
import { useEffect, useState } from 'react'
import { Button } from './button'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { currentTheme, setTheme: setColorTheme, themes } = useColorTheme()
  const [mounted, setMounted] = useState(false)
  const [hoveredColorTheme, setHoveredColorTheme] = useState<ColorTheme | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Clean up hover state when component unmounts
  useEffect(() => {
    return () => {
      if (hoveredColorTheme) {
        setHoveredColorTheme(null)
      }
    }
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

  const handleColorThemeHover = (colorTheme: ColorTheme | null) => {
    setHoveredColorTheme(colorTheme)
    
    // Only update CSS if we're actually changing to a different theme
    const targetTheme = colorTheme || currentTheme
    const root = document.documentElement
    const currentPrimary = root.style.getPropertyValue('--primary')
    
    if (currentPrimary !== targetTheme.primary) {
      root.style.setProperty('--primary', targetTheme.primary)
      root.style.setProperty('--ring', targetTheme.primary)
      root.style.setProperty('--sidebar-primary', targetTheme.primary)
      root.style.setProperty('--sidebar-ring', targetTheme.primary)
    }
  }

  const handleColorThemeSelect = (colorTheme: ColorTheme) => {
    setColorTheme(colorTheme)
    setHoveredColorTheme(null)
  }

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
      <PopoverContent 
        align="end" 
        className="w-72 p-0 bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-lg overflow-hidden"
        onPointerLeave={() => handleColorThemeHover(null)}
      >
        {/* Theme Mode Section */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Appearance
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`
                  flex flex-col items-center gap-1.5 p-3 rounded-md transition-all duration-200
                  hover:bg-accent/50 text-foreground
                  ${theme === option.value 
                    ? 'bg-accent/70 ring-1 ring-primary/30' 
                    : 'hover:bg-accent/30'
                  }
                `}
              >
                {option.icon}
                <span className="text-xs font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color Theme Section */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Color Theme
            </span>
          </div>
          
          <div className="mb-3 text-center">
            <p className="text-sm font-medium text-foreground">
              {hoveredColorTheme?.name || currentTheme.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {hoveredColorTheme?.description || currentTheme.description}
            </p>
          </div>
          
          <div className="grid grid-cols-4 gap-2.5">
            {themes.map((colorTheme) => (
              <button
                key={colorTheme.id}
                onClick={() => handleColorThemeSelect(colorTheme)}
                onMouseEnter={() => handleColorThemeHover(colorTheme)}
                className={`
                  relative aspect-square rounded-lg transition-all duration-200 border-2
                  hover:scale-105 hover:shadow-lg hover:shadow-primary/20
                  ${currentTheme.id === colorTheme.id 
                    ? 'border-border shadow-md scale-105 ring-2 ring-primary/30' 
                    : 'border-border/30 hover:border-border/60'
                  }
                `}
                style={{ backgroundColor: colorTheme.primaryHex }}
                title={`${colorTheme.name} - ${colorTheme.description}`}
              >
                {currentTheme.id === colorTheme.id && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white/90 rounded-full shadow-sm" />
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <div className="text-center pt-3 mt-3 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              Hover to preview • Click to apply
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
