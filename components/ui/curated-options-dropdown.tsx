'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { useRef, useState } from 'react'

interface CuratedOption {
  id: number
  optionText: string
  isUsed: boolean
}

interface CuratedOptionsDropdownProps {
  options: CuratedOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function CuratedOptionsDropdown({
  options,
  value,
  onValueChange,
  placeholder = 'Select an option...',
  disabled = false
}: CuratedOptionsDropdownProps) {
  const [searchValue, setSearchValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter out used options
  const availableOptions = options.filter(option => !option.isUsed)

  // Find the selected option
  const selectedOption = options.find(option => option.optionText === value)

  // Filter options based on search
  const filteredOptions = availableOptions.filter(option =>
    option.optionText.toLowerCase().includes(searchValue.toLowerCase())
  )

  const handleSelect = (optionText: string) => {
    onValueChange(optionText)
    setSearchValue('')
    setIsOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
    // Keep focus on input
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 0)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between border-2 border-border dark:border-input"
          disabled={disabled}
        >
          {value ? selectedOption?.optionText : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full min-w-[300px] max-h-[400px] overflow-y-auto">
        <div className="p-2">
          <Input
            ref={searchInputRef}
            placeholder="Search options..."
            value={searchValue}
            onChange={handleInputChange}
            className="mb-2 border-2 border-border dark:border-input"
            autoFocus
          />
        </div>
        {filteredOptions.length === 0 ? (
          <div className="p-2 text-sm text-muted-foreground">
            No options found.
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {filteredOptions.map(option => (
              <DropdownMenuItem
                key={option.id}
                onClick={() => handleSelect(option.optionText)}
                className={cn(
                  'cursor-pointer',
                  value === option.optionText && 'bg-accent'
                )}
              >
                {option.optionText}
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
