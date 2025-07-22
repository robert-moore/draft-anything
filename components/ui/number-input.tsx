'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NumberInputProps {
  id: string
  label: string
  value: number | null
  onChange: (value: number | null) => void
  min?: number
  max?: number
  required?: boolean
}

export function NumberInput({
  id,
  label,
  value,
  onChange,
  min,
  max,
  required = false
}: NumberInputProps) {
  const handleBlur = () => {
    if (value === null) return

    let newValue = value
    if (min !== undefined && value < min) {
      newValue = min
    }
    if (max !== undefined && value > max) {
      newValue = max
    }
    if (newValue !== value) {
      onChange(newValue)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    if (inputValue === '') {
      onChange(null)
    } else {
      const numValue = Number(inputValue)
      if (!isNaN(numValue)) {
        onChange(numValue)
      }
    }
  }

  const isEmpty = value === null
  const showError = required && isEmpty

  return (
    <div>
      <Label
        htmlFor={id}
        className="font-bold mb-3 block text-sm text-foreground"
      >
        {label}
      </Label>
      <div
        className={`border-2 bg-card h-16 flex items-center justify-center ${
          showError ? 'border-primary' : 'border-border'
        }`}
      >
        <Input
          id={id}
          type="number"
          min={min}
          max={max}
          value={value === null ? '' : value}
          onChange={handleChange}
          onBlur={handleBlur}
          required={required}
          className="text-center text-2xl font-bold border-0 bg-transparent focus:outline-none p-0 text-foreground"
          placeholder={required ? 'Required' : ''}
        />
      </div>
    </div>
  )
}
