# Atomic Components

Pure presentational components following brutalist design principles. All components are fully typed, accessible, and support the design system's black/white aesthetic.

## Components

### Button
**File:** `Button.tsx`  
**Props:**
- `variant`: 'primary' | 'secondary' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean
- Extends all native button attributes

**Features:**
- Brutalist shadow with hover offset animation
- Loading state with spinner
- Disabled state handling
- forwardRef support

### Input
**File:** `Input.tsx`  
**Props:**
- `label`: string (optional)
- `error`: string (optional)
- Extends all native input attributes

**Features:**
- Built-in label support
- Error state with message
- Focus state with shadow
- Accessible error announcements
- forwardRef support

### Icon
**File:** `Icon.tsx`  
**Props:**
- `icon`: LucideIcon (required)
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `className`: string (optional)
- `aria-label`: string (optional)

**Features:**
- Lucide React icon wrapper
- Consistent sizing system
- Accessible with aria-label support

### Badge
**File:** `Badge.tsx`  
**Props:**
- `variant`: 'default' | 'success' | 'warning' | 'error' | 'info'
- `size`: 'sm' | 'md'
- Extends all native span attributes

**Features:**
- Status indicator variants
- Colored borders and backgrounds
- Two size options

### Avatar
**File:** `Avatar.tsx`  
**Props:**
- `src`: string (optional)
- `alt`: string (required)
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `fallbackText`: string (optional)
- Extends all native img attributes

**Features:**
- IPFS image loading with skeleton
- Fallback to initials or user icon
- Loading state animation
- Error handling with automatic fallback

### Spinner
**File:** `Spinner.tsx`  
**Props:**
- `size`: 'sm' | 'md' | 'lg'
- `className`: string (optional)
- `aria-label`: string (optional)

**Features:**
- Brutalist spinning border animation
- Accessible with status role
- Screen reader text

### Skeleton
**File:** `Skeleton.tsx`  
**Props:**
- `variant`: 'text' | 'circular' | 'rectangular'
- `width`: string (optional)
- `height`: string (optional)
- `animate`: boolean (default: true)
- Extends all native div attributes

**Features:**
- Three shape variants
- Pulse animation
- Flexible sizing
- aria-hidden for accessibility

## Usage

```tsx
import { Button, Input, Avatar, Badge, Icon, Spinner, Skeleton } from '@/components/atoms';
import { Heart } from 'lucide-react';

function Example() {
  return (
    <>
      <Button variant="primary" size="md">Click me</Button>
      
      <Input 
        label="Username" 
        placeholder="Enter username"
        error="Username is required"
      />
      
      <Avatar 
        src="https://example.com/avatar.jpg"
        alt="User"
        fallbackText="John Doe"
        size="md"
      />
      
      <Badge variant="success">Active</Badge>
      
      <Icon icon={Heart} size="md" />
      
      <Spinner size="md" />
      
      <Skeleton variant="rectangular" width="100%" height="200px" />
    </>
  );
}
```

## Design Principles

1. **Pure Presentation** - No business logic or API calls
2. **Fully Typed** - Strict TypeScript interfaces
3. **Accessible** - ARIA labels, keyboard navigation, screen reader support
4. **Composable** - Simple props, extends native attributes
5. **Brutalist Aesthetic** - 3px borders, offset shadows, sharp corners
6. **Tailwind Only** - No inline styles, all utility classes
7. **forwardRef** - All form elements support refs

## Accessibility Features

- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Focus states with visible indicators
- Error announcements for form fields
- Screen reader text for loading states
- Proper alt text requirements for images

## Performance

- No heavy dependencies (except Lucide icons)
- Minimal re-renders with proper memoization
- Optimized with Tailwind purge
- Lazy loading for IPFS images
