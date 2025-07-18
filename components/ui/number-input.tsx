'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NumberInputProps {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export function NumberInput({ id, label, value, onChange, min, max }: NumberInputProps) {
  return (
    <div>
      <Label htmlFor={id} className="font-bold mb-3 block text-sm text-foreground">
        {label}
      </Label>
      <div className="border-2 border-border bg-card h-16 flex items-center justify-center">
        <Input
          id={id}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          required
          className="text-center text-2xl font-bold border-0 bg-transparent focus:outline-none p-0 text-foreground"
        />
      </div>
    </div>
  )
}