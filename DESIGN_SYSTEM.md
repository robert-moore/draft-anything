# Draft Anything Design System

Inspired by modern game interfaces like Scattergories, this design system creates an engaging, playful, yet polished experience.

## Visual Philosophy

### Overall Feel
- **Playful but Professional**: Fun and engaging without being childish
- **Clean and Minimal**: Uncluttered interfaces that focus on content
- **Interactive and Responsive**: Elements feel alive and responsive to user actions
- **Game-like**: Cards, animated transitions, and engaging micro-interactions
- **Friendly Competition**: Emphasizes social interaction and friendly rivalry

### Color Philosophy
- **Warm and Inviting**: Use warm tones that encourage participation
- **High Contrast**: Ensure excellent readability in both light and dark modes
- **Accent Colors**: Bold, saturated colors for CTAs and important actions
- **Neutral Base**: Clean backgrounds that don't compete with content

## Color Palette

### Light Mode
- **Primary Background**: `hsl(0, 0%, 98%)` - Warm white
- **Secondary Background**: `hsl(0, 0%, 95%)` - Light gray
- **Card Background**: `hsl(0, 0%, 100%)` - Pure white
- **Text Primary**: `hsl(220, 8%, 15%)` - Dark charcoal
- **Text Secondary**: `hsl(220, 8%, 45%)` - Medium gray
- **Text Muted**: `hsl(220, 8%, 65%)` - Light gray
- **Border**: `hsl(220, 8%, 90%)` - Subtle borders
- **Accent Primary**: `hsl(230, 95%, 58%)` - Vibrant blue
- **Accent Secondary**: `hsl(280, 85%, 60%)` - Purple
- **Success**: `hsl(142, 70%, 45%)` - Green
- **Warning**: `hsl(38, 95%, 55%)` - Orange
- **Error**: `hsl(0, 85%, 60%)` - Red

### Dark Mode
- **Primary Background**: `hsl(224, 15%, 8%)` - Deep dark blue
- **Secondary Background**: `hsl(224, 15%, 12%)` - Slightly lighter
- **Card Background**: `hsl(224, 15%, 15%)` - Card background
- **Text Primary**: `hsl(0, 0%, 95%)` - Near white
- **Text Secondary**: `hsl(220, 8%, 75%)` - Light gray
- **Text Muted**: `hsl(220, 8%, 55%)` - Medium gray
- **Border**: `hsl(224, 15%, 25%)` - Subtle borders
- **Accent Primary**: `hsl(230, 90%, 65%)` - Bright blue
- **Accent Secondary**: `hsl(280, 80%, 70%)` - Light purple
- **Success**: `hsl(142, 65%, 55%)` - Bright green
- **Warning**: `hsl(38, 90%, 65%)` - Bright orange
- **Error**: `hsl(0, 80%, 70%)` - Bright red

## Typography

### Font Stack
- **Primary**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Monospace**: `"JetBrains Mono", "Fira Code", Consolas, monospace`

### Scale
- **Display**: `clamp(2.5rem, 5vw, 4rem)` - Hero headings
- **H1**: `clamp(2rem, 4vw, 3rem)` - Page titles
- **H2**: `clamp(1.5rem, 3vw, 2.25rem)` - Section headers
- **H3**: `clamp(1.25rem, 2.5vw, 1.75rem)` - Subsection headers
- **Body Large**: `1.125rem` - Important body text
- **Body**: `1rem` - Default body text
- **Body Small**: `0.875rem` - Secondary text
- **Caption**: `0.75rem` - Fine print

### Weights
- **Light**: 300 - Large display text
- **Regular**: 400 - Body text
- **Medium**: 500 - UI elements
- **Semibold**: 600 - Headings
- **Bold**: 700 - Emphasis

## Spacing System

Use consistent spacing based on a 4px grid:

- **xs**: `0.25rem` (4px)
- **sm**: `0.5rem` (8px)
- **md**: `1rem` (16px)
- **lg**: `1.5rem` (24px)
- **xl**: `2rem` (32px)
- **2xl**: `3rem` (48px)
- **3xl**: `4rem` (64px)
- **4xl**: `6rem` (96px)

## Components

### Cards
- **Rounded corners**: `0.75rem` (12px)
- **Shadow**: Subtle drop shadow with color-matched tint
- **Border**: 1px solid border in light mode, none in dark mode
- **Padding**: `1.5rem` (24px) default
- **Hover**: Subtle lift animation and shadow increase

### Buttons
- **Primary**: Bold accent color, white text, rounded
- **Secondary**: Outline style with accent color
- **Ghost**: Transparent with hover background
- **Sizes**: Small (32px), Medium (40px), Large (48px)
- **Border radius**: `0.5rem` (8px)

### Inputs
- **Background**: Card background color
- **Border**: 2px solid, transitions to accent on focus
- **Padding**: `0.75rem 1rem`
- **Border radius**: `0.5rem` (8px)
- **Typography**: Body size, medium weight

### Badges/Pills
- **Small and rounded**: Full border radius
- **Subtle background**: 10% opacity of accent color
- **Typography**: Small size, medium weight

## Layout Patterns

### Grid System
- **Container max-width**: `1200px`
- **Gutters**: `1.5rem` (24px)
- **Breakpoints**:
  - Mobile: `< 640px`
  - Tablet: `640px - 1024px`
  - Desktop: `> 1024px`

### Card Layouts
- **Single column**: Mobile
- **Two column**: Tablet
- **Three column**: Desktop for feature grids
- **Sidebar**: 2:1 ratio for main content + sidebar

### Spacing Rules
- **Vertical rhythm**: Consistent vertical spacing using the spacing scale
- **Section spacing**: `4rem` (64px) between major sections
- **Component spacing**: `1.5rem` (24px) between related components
- **Element spacing**: `1rem` (16px) between form elements

## Animations & Interactions

### Principles
- **Subtle and purposeful**: Enhance UX without being distracting
- **Fast and responsive**: Animations under 300ms
- **Consistent easing**: Use `cubic-bezier(0.4, 0, 0.2, 1)` for most animations
- **Reduce motion**: Respect user preferences

### Common Animations
- **Hover effects**: 150ms ease-out
- **Button press**: 100ms ease-in
- **Card hover**: Subtle scale (1.02) and shadow increase
- **Modal/drawer**: 250ms ease-out slide/fade
- **Loading states**: Smooth skeleton animations

### Interactive States
- **Hover**: Slight color change, shadow, or scale
- **Active**: Slight scale down (0.98)
- **Focus**: Accent color outline/ring
- **Disabled**: 50% opacity, no interactions

## Game-Specific Elements

### Draft Status Indicators
- **Setting Up**: Orange/amber with pulsing animation
- **Active**: Green with subtle glow
- **Completed**: Blue with checkmark
- **Paused**: Yellow with pause icon

### Player Avatars
- **Circular**: Always round
- **Initials**: Clean typography, contrasting background
- **Status indicators**: Small colored dots for online/ready status
- **Hover**: Slight scale and shadow

### Rankings/Lists
- **Numbered items**: Clean numbering with consistent alignment
- **Draggable items**: Card-like appearance with grab cursor
- **Progress indicators**: Colorful progress bars
- **Vote counts**: Pill-shaped badges

### Game Actions
- **Primary actions**: Large, colorful buttons (Join, Start, Submit)
- **Secondary actions**: Outline or ghost buttons (Invite, Share)
- **Destructive actions**: Red accent with confirmation
- **Loading states**: Disabled with spinner or skeleton

## Responsive Behavior

### Mobile-First Approach
- Design for mobile, enhance for larger screens
- Touch-friendly targets (minimum 44px)
- Simplified navigation patterns
- Stacked layouts become side-by-side on larger screens

### Breakpoint Strategies
- **Mobile**: Single column, full-width cards, stacked forms
- **Tablet**: Two-column layouts, sidebar appears
- **Desktop**: Three-column grids, more whitespace, larger typography

### Interactive Elements
- **Hover states**: Only on devices that support hover
- **Touch targets**: Larger on mobile devices
- **Gestures**: Swipe for mobile-specific interactions

## Accessibility

### Color & Contrast
- **WCAG AA compliance**: Minimum 4.5:1 contrast ratio
- **Color blind friendly**: Don't rely solely on color for meaning
- **Dark mode**: Maintain contrast ratios

### Typography
- **Readable fonts**: High-quality, legible typefaces
- **Line height**: 1.5 minimum for body text
- **Font sizes**: Minimum 16px for body text on mobile

### Interaction
- **Keyboard navigation**: Full keyboard accessibility
- **Focus indicators**: Clear, visible focus states
- **Screen reader**: Semantic HTML and ARIA labels
- **Motion**: Respect reduced motion preferences

## Implementation Notes

### CSS Custom Properties
Use CSS custom properties for theming:
```css
:root {
  --color-primary: hsl(230, 95%, 58%);
  --color-text: hsl(220, 8%, 15%);
  --spacing-md: 1rem;
  --radius-md: 0.75rem;
}
```

### Component Architecture
- **Consistent props**: Use standard prop patterns across components
- **Variant system**: Support multiple visual variants
- **Size system**: Consistent sizing across component types
- **Composition**: Build complex components from simple primitives

### Performance
- **Optimized animations**: Use transform and opacity when possible
- **Lazy loading**: For images and heavy components
- **Code splitting**: Split by routes and features
- **Asset optimization**: Compress images, optimize fonts