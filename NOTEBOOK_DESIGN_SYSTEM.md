# Notebook/Journal Design System

Inspired by geometric paper notebooks, dot grids, and clean line work that feels like a well-organized journal or designer's sketchbook.

## Visual Philosophy

### Overall Aesthetic
- **Geometric Precision**: Clean lines, perfect dots, mathematical spacing
- **Notebook Feel**: Like pages from a high-quality dot grid journal
- **Minimal Color**: Mostly monochromatic with subtle accent colors
- **Hard Lines**: Sharp, crisp borders and dividers - no rounded corners except where necessary
- **Grid-Based**: Everything aligns to a subtle dot grid system
- **Typographic**: Focus on typography and spacing over decorative elements

## Color Palette

### Light Mode (Paper)
- **Background**: `#fafafa` - Cream white paper
- **Paper**: `#ffffff` - Pure white for cards
- **Lines**: `#e5e5e5` - Light gray lines
- **Dots**: `#d1d5db` - Subtle dot grid
- **Text Primary**: `#111827` - Near black ink
- **Text Secondary**: `#6b7280` - Gray ink
- **Text Muted**: `#9ca3af` - Light gray
- **Accent**: `#3b82f6` - Blue ink
- **Accent Secondary**: `#ef4444` - Red ink

### Dark Mode (Black Paper)
- **Background**: `#0f172a` - Dark blue-black
- **Paper**: `#1e293b` - Slate paper
- **Lines**: `#334155` - Gray lines
- **Dots**: `#475569` - Visible dots
- **Text Primary**: `#f8fafc` - White ink
- **Text Secondary**: `#cbd5e1` - Light gray
- **Text Muted**: `#64748b` - Medium gray
- **Accent**: `#60a5fa` - Light blue
- **Accent Secondary**: `#f87171` - Light red

## Typography

### Font Stack
- **Primary**: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Monospace**: `"JetBrains Mono", "SF Mono", Consolas, monospace`

### Hierarchy
- **Display**: `2.5rem/1.1` - Major headings, minimal weight
- **H1**: `2rem/1.2` - Page titles, medium weight
- **H2**: `1.5rem/1.3` - Section headers, medium weight
- **H3**: `1.25rem/1.4` - Subsections, medium weight
- **Body**: `1rem/1.6` - Regular text, normal weight
- **Small**: `0.875rem/1.5` - Secondary text
- **Caption**: `0.75rem/1.4` - Fine print, monospace

## Grid System

### Dot Grid Foundation
- **Base unit**: `8px` - Everything aligns to this grid
- **Dots**: Every 24px (3 units) in both directions
- **Margins**: Multiples of 24px
- **Component spacing**: 16px, 24px, 32px, 48px

### Layout
- **Container**: `1200px` max width
- **Gutters**: `24px` on mobile, `32px` on desktop
- **Grid columns**: 12-column system aligned to dot grid

## Visual Elements

### Lines & Borders
- **Weight**: Always `1px` or `2px` - no fractional pixels
- **Style**: Solid, never dashed or dotted
- **Color**: Use line colors from palette
- **Corners**: Sharp 90-degree angles, no border radius

### Dots
- **Size**: `2px` diameter circles
- **Spacing**: `24px` grid
- **Color**: Subtle dot color from palette
- **Usage**: Background pattern, bullet points, dividers

### Geometric Shapes
- **Rectangles**: Perfect 90-degree corners
- **Squares**: For icons and small elements
- **Lines**: Horizontal rules, vertical dividers
- **No curves**: Avoid rounded corners except for avatars

## Components

### Cards
```css
.notebook-card {
  background: paper-color;
  border: 1px solid line-color;
  border-radius: 0; /* Sharp corners */
  padding: 24px;
  position: relative;
}

.notebook-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 24px;
  bottom: 0;
  width: 1px;
  background: line-color;
  opacity: 0.3;
}
```

### Lists
- **Bullet points**: Small dots aligned to grid
- **Numbers**: Monospace font in squares
- **Spacing**: 16px between items
- **Indentation**: 24px multiples

### Forms
- **Inputs**: Rectangle with 1px border, no border radius
- **Labels**: Above inputs, medium weight
- **Focus**: 2px accent color border
- **Spacing**: 24px between form groups

### Buttons
- **Primary**: Rectangle with accent background
- **Secondary**: Rectangle with accent border
- **Ghost**: No background, accent text
- **Corners**: Sharp edges only
- **States**: Color changes only, no shadows

## Layout Patterns

### Page Structure
```
┌─────────────────────────────────┐
│ Header (fixed, lined)           │
├─────────────────────────────────┤
│ · · · · · · · · · · · · · · · · │ ← Dot grid background
│ ·   Content Area           · · │
│ ·   ┌─────────────────┐   · · │
│ ·   │ Card            │   · · │
│ ·   │ ┌─────────────┐ │   · · │
│ ·   │ │ Content     │ │   · · │
│ ·   │ └─────────────┘ │   · · │
│ ·   └─────────────────┘   · · │
│ · · · · · · · · · · · · · · · · │
└─────────────────────────────────┘
```

### Grid Layouts
- **2-column**: 2:1 ratio for main + sidebar
- **3-column**: Equal widths for features
- **4-column**: For cards or small items
- **All aligned**: To 24px dot grid

### Spacing Rules
- **Micro**: `8px` - Between related elements
- **Small**: `16px` - Between form elements
- **Medium**: `24px` - Between components
- **Large**: `48px` - Between sections
- **XL**: `72px` - Between major areas

## Notebook Elements

### Paper Lines
- **Ruled lines**: Horizontal lines every 24px
- **Margin lines**: Vertical line 72px from left edge
- **Grid dots**: 24px spacing in both directions
- **Usage**: Subtle background patterns

### Journal Headers
```
┌─────────────────────────────────┐
│ DATE: 2024-01-15    PAGE: 001   │ ← Monospace header
├─────────────────────────────────┤
│                                 │
│ TITLE: Draft Anything           │ ← Main content
│                                 │
└─────────────────────────────────┘
```

### List Styles
- **Bullet**: `•` Simple dot
- **Number**: `01.` Monospace with dot
- **Check**: `□` Empty square for tasks
- **Arrow**: `→` For navigation

### Dividers
- **Full width**: Horizontal line across container
- **Partial**: Line with text break in middle
- **Dotted**: Series of dots `• • • • •`
- **Double**: Two parallel lines 8px apart

## Implementation

### CSS Variables
```css
:root {
  --grid-unit: 8px;
  --dot-spacing: 24px;
  --line-weight: 1px;
  --paper-color: #ffffff;
  --line-color: #e5e5e5;
  --dot-color: #d1d5db;
  --ink-color: #111827;
  --blue-ink: #3b82f6;
  --red-ink: #ef4444;
}
```

### Grid Background
```css
.dot-grid {
  background-image: 
    radial-gradient(circle at var(--dot-spacing) var(--dot-spacing), var(--dot-color) 1px, transparent 1px);
  background-size: var(--dot-spacing) var(--dot-spacing);
}
```

### Sharp Containers
```css
.notebook-container {
  border: var(--line-weight) solid var(--line-color);
  border-radius: 0;
  background: var(--paper-color);
  position: relative;
}
```

## Usage Guidelines

### Do
- Align everything to the 8px grid
- Use sharp, clean lines
- Keep color palette minimal
- Make typography the focus
- Use geometric shapes
- Maintain consistent spacing

### Don't
- Use rounded corners unnecessarily
- Add decorative elements
- Use many colors
- Break the grid alignment
- Add shadows or gradients
- Use script or decorative fonts

### Accessibility
- Maintain 4.5:1 contrast ratio minimum
- Ensure dot grid doesn't interfere with readability
- Use semantic HTML structure
- Provide focus indicators that fit the aesthetic