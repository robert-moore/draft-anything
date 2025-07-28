export interface ColorTheme {
  id: string
  name: string
  description: string
  primary: string // HSL format for CSS variables
  primaryHex: string // Hex for UI display
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'orange',
    name: 'Warm Clay',
    description: 'Earthy warmth',
    primary: '25 85% 65%',
    primaryHex: '#F4A460'
  },
  {
    id: 'blue',
    name: 'Soft Sky',
    description: 'Gentle clarity',
    primary: '210 80% 70%',
    primaryHex: '#87CEEB'
  },
  {
    id: 'green',
    name: 'Sage Mint',
    description: 'Natural calm',
    primary: '160 50% 60%',
    primaryHex: '#98D8C8'
  },
  {
    id: 'purple',
    name: 'Lavender Mist',
    description: 'Creative flow',
    primary: '270 60% 75%',
    primaryHex: '#C8A8E9'
  },
  {
    id: 'pink',
    name: 'Rose Quartz',
    description: 'Gentle energy',
    primary: '340 65% 75%',
    primaryHex: '#F4C2C2'
  },
  {
    id: 'teal',
    name: 'Ocean Foam',
    description: 'Fresh breeze',
    primary: '180 55% 65%',
    primaryHex: '#7DD3C0'
  },
  {
    id: 'amber',
    name: 'Golden Hour',
    description: 'Warm glow',
    primary: '40 80% 70%',
    primaryHex: '#F5D042'
  },
  {
    id: 'slate',
    name: 'Soft Graphite',
    description: 'Modern elegance',
    primary: '220 25% 65%',
    primaryHex: '#9CA3AF'
  }
]

export const DEFAULT_COLOR_THEME = COLOR_THEMES[2] // Sage Mint
