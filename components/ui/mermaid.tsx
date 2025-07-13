'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'

interface MermaidProps {
  chart: string
  className?: string
}

// Simple check: is the mermaid code block complete?
const isMermaidComplete = (chart: string): boolean => {
  const trimmed = chart.trim()
  
  // If empty chart passed (from incomplete block detection), show loading
  if (!trimmed) return false
  
  // Check for streaming cursor - definite indicator that content is still streaming
  if (trimmed.includes('▍')) return false
  
  // Basic validation - must have some actual content
  return trimmed.length > 5
}

export function Mermaid({ chart, className = '' }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    let mermaid: any
    let timeoutId: NodeJS.Timeout

    const renderDiagram = async () => {
      try {
        setError(null)
        setIsLoading(true)

        // Dynamic import of mermaid to avoid SSR issues
        const mermaidModule = await import('mermaid')
        mermaid = mermaidModule.default

        // Configure mermaid with theme
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === 'dark' ? 'dark' : 'default',
          themeVariables: {
            primaryColor: theme === 'dark' ? '#3b82f6' : '#1e40af',
            primaryTextColor: theme === 'dark' ? '#f1f5f9' : '#1e293b',
            primaryBorderColor: theme === 'dark' ? '#475569' : '#cbd5e1',
            lineColor: theme === 'dark' ? '#64748b' : '#475569',
            secondaryColor: theme === 'dark' ? '#1e293b' : '#f1f5f9',
            tertiaryColor: theme === 'dark' ? '#0f172a' : '#ffffff',
          },
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 14,
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
          },
          sequence: {
            useMaxWidth: true,
          },
          gantt: {
            useMaxWidth: true,
          },
        })

        if (!containerRef.current) return

        // Clear previous content
        containerRef.current.innerHTML = ''

        // Generate unique ID for this diagram
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Parse and render the diagram
        const { svg } = await mermaid.render(id, chart.trim())
        
        // Insert the rendered SVG
        containerRef.current.innerHTML = svg

        // Add responsive styling to the SVG
        const svgElement = containerRef.current.querySelector('svg')
        if (svgElement) {
          svgElement.style.maxWidth = '100%'
          svgElement.style.height = 'auto'
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Mermaid rendering error:', err)
        setError(err instanceof Error ? err.message : 'Failed to render diagram')
        setIsLoading(false)
      }
    }

    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Check if diagram is complete before even scheduling a render
    if (!isMermaidComplete(chart)) {
      setIsLoading(true)
      return
    }

    // Debounce rendering - wait 100ms after content stops changing
    timeoutId = setTimeout(() => {
      renderDiagram()
    }, 100)

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [chart, theme])

  if (error) {
    return (
      <div className={`not-prose my-4 p-4 border border-destructive/20 bg-destructive/5 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 text-destructive mb-2">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm font-medium">Diagram Error</span>
        </div>
        <p className="text-sm text-muted-foreground">{error}</p>
        <details className="mt-2">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            Show diagram code
          </summary>
          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
            {chart}
          </pre>
        </details>
      </div>
    )
  }

  return (
    <div className={`not-prose my-4 ${className}`}>
      {isLoading && (
        <div className="relative overflow-hidden rounded-lg border bg-card">
          {/* Linear-inspired skeleton with gradient animation */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-muted animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-24" />
            </div>
            
            {/* Diagram skeleton */}
            <div className="space-y-3">
              <div className="h-16 bg-muted rounded-lg animate-pulse" />
              <div className="flex justify-between items-center">
                <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                <div className="h-8 w-20 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-16 bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
          
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite] dark:via-white/5" />
          
          {/* Status indicator */}
          <div className="absolute top-3 right-3 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-medium">
              {!isMermaidComplete(chart) ? 'Building diagram...' : 'Rendering...'}
            </span>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className={`mermaid-container ${isLoading ? 'hidden' : ''}`}
        style={{
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      />
    </div>
  )
}