'use client'

import { cn } from '@/lib/utils'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import * as React from 'react'

const RadioGroupSegmented = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn('inline-flex border-2 border-border', className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroupSegmented.displayName = 'RadioGroupSegmented'

interface RadioGroupSegmentedItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}

const RadioGroupSegmentedItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupSegmentedItemProps
>(({ className, children, icon: Icon, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2',
        'border-l-2 border-border first:border-l-0',
        'data-[state=checked]:bg-gray-200 dark:data-[state=checked]:bg-accent data-[state=checked]:text-foreground dark:data-[state=checked]:text-accent-foreground',
        'data-[state=unchecked]:bg-background',
        'data-[state=unchecked]:text-foreground',
        'hover:bg-muted data-[state=checked]:hover:bg-gray-200 dark:data-[state=checked]:hover:bg-accent',
        'focus:z-10 focus:outline-none focus-visible:ring-0',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupSegmentedItem.displayName = 'RadioGroupSegmentedItem'

export { RadioGroupSegmented, RadioGroupSegmentedItem }
