---
inclusion: always
---

# WargaNet Design System Rules

Panduan integrasi Figma designs ke codebase WargaNet menggunakan Model Context Protocol.

## 1. Token Definitions

### Colors
Defined in: `apps/frontend/tailwind.config.js` dan `apps/frontend/src/index.css`

**Tailwind Extended Colors:**
```javascript
colors: {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
}
```

**CSS Variables (Light/Dark Mode):**
```css
/* Light mode */
--color-bg-primary: #ffffff
--color-bg-secondary: #f9fafb
--color-text-primary: #111827
--color-text-secondary: #6b7280
--color-border: #e5e7eb

/* Dark mode */
--color-bg-primary: #1f2937
--color-bg-secondary: #111827
--color-text-primary: #f9fafb
--color-text-secondary: #d1d5db
--color-border: #374151
```

### Typography
- Font Family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif
- Line Height: 1.5
- Font Smoothing: antialiased

### Spacing
Menggunakan Tailwind default spacing scale (0.25rem increments)

## 2. Component Library

### Location
`apps/frontend/src/components/ui/`

### Component Architecture
- React functional components dengan TypeScript
- forwardRef untuk ref forwarding
- Props interface extends native HTML attributes
- Composition pattern untuk flexibility

### Available Components
- Button: `apps/frontend/src/components/ui/Button.tsx`
- Input: `apps/frontend/src/components/ui/Input.tsx`
- Card: `apps/frontend/src/components/ui/Card.tsx`
- Modal: `apps/frontend/src/components/ui/Modal.tsx`
- Table: `apps/frontend/src/components/ui/Table.tsx`
- ThemeToggle: `apps/frontend/src/components/ui/ThemeToggle.tsx`

### Component Pattern Example
```typescript
interface ComponentProps extends HTMLAttributes<HTMLElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const Component = forwardRef<HTMLElement, ComponentProps>(
  ({ variant = 'primary', className = '', ...props }, ref) => {
    return <element ref={ref} className={`base ${variant} ${className}`} {...props} />;
  }
);
```

## 3. Frameworks & Libraries

### UI Framework
- **React 18.2.0** - Functional components dengan hooks
- **React Router DOM 6.21.3** - Client-side routing

### Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **PostCSS 8.4.33** - CSS processing
- **Autoprefixer 10.4.17** - Vendor prefixes

### Build System
- **Vite 5.0.11** - Fast build tool dan dev server
- **TypeScript** - Type safety

### HTTP Client
- **Axios 1.6.5** - API requests

## 4. Asset Management

### Storage
Assets disimpan di `apps/frontend/public/` (belum ada struktur)

### Import Pattern
```typescript
// Static imports
import logo from './assets/logo.svg';

// Dynamic imports untuk lazy loading
const image = new URL('./assets/image.png', import.meta.url).href;
```

### Optimization
- Vite handles asset optimization automatically
- Images < 4kb di-inline sebagai base64
- Larger assets get hashed filenames

## 5. Icon System

### Current State
Belum ada icon system yang terdefinisi

### Recommended Pattern
```typescript
// Gunakan library seperti lucide-react atau heroicons
import { Icon } from 'lucide-react';

<Icon className="w-5 h-5" />
```

## 6. Styling Approach

### Methodology
**Tailwind Utility Classes** dengan custom CSS variables untuk theming

### Component Styling Pattern
```typescript
// Base styles
const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg';

// Variant styles dengan dark mode
const variantStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500',
  secondary: 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
};

// Combine
className={`${baseStyles} ${variantStyles[variant]} ${className}`}
```

### Dark Mode
- Strategy: `class` based (Tailwind darkMode: 'class')
- Toggle: `apps/frontend/src/components/ui/ThemeToggle.tsx`
- Implementation: Add `dark:` prefix to utilities

### Responsive Design
```typescript
// Mobile-first approach
className="w-full md:w-1/2 lg:w-1/3"

// Breakpoints (Tailwind defaults):
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
// 2xl: 1536px
```

### Accessibility Standards
- Minimum touch target: 44x44px (mobile)
- Focus states: `focus:ring-2 focus:ring-offset-2`
- ARIA attributes: `aria-invalid`, `aria-describedby`
- Semantic HTML: proper label associations

## 7. Project Structure

```
apps/frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   └── layout/          # Layout components
│   ├── hooks/               # Custom React hooks
│   ├── routes/              # Route components
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
└── package.json
```

## 8. Figma Integration Guidelines

### Converting Figma to Code

**CRITICAL: Jangan copy-paste Tailwind classes dari Figma output!**

1. **Analyze Figma Output**
   - Lihat struktur component dan behavior
   - Identifikasi design patterns yang digunakan

2. **Map to Existing Components**
   ```typescript
   // ❌ BURUK - Direct Figma output
   <div className="flex items-center justify-center w-full h-12 bg-blue-500 text-white rounded-lg">
     Click Me
   </div>

   // ✅ BAIK - Use existing Button component
   <Button variant="primary" size="md" fullWidth>
     Click Me
   </Button>
   ```

3. **Use Design Tokens**
   ```typescript
   // ❌ BURUK - Hardcoded colors
   className="bg-[#0ea5e9]"

   // ✅ BAIK - Use design tokens
   className="bg-primary-500"
   ```

4. **Maintain Consistency**
   - Gunakan existing spacing scale
   - Follow component variant patterns
   - Respect dark mode implementation
   - Keep accessibility standards

5. **Visual Parity**
   - Strive for 1:1 match dengan Figma design
   - Adjust spacing minimally jika perlu
   - Validate against Figma screenshot

### Code Connect Workflow

1. **Get Figma URL** dari designer
2. **Extract fileKey dan nodeId** dari URL
3. **Run get_design_context** untuk generate code
4. **Map to existing components** instead of using raw output
5. **Run add_code_connect_map** untuk link component ke Figma

### Example Workflow
```typescript
// 1. Get design context
// URL: https://figma.com/design/abc123/MyFile?node-id=1-2

// 2. Figma outputs React + Tailwind
// 3. Convert to WargaNet components:

// Figma output:
<button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
  Submit
</button>

// WargaNet implementation:
<Button variant="primary" size="md">
  Submit
</Button>

// 4. Link to Figma
// add_code_connect_map(
//   nodeId: "1:2",
//   fileKey: "abc123",
//   source: "apps/frontend/src/components/ui/Button.tsx",
//   componentName: "Button",
//   label: "React"
// )
```

## 9. Best Practices

### DO ✅
- Reuse existing components
- Use design tokens (colors, spacing)
- Maintain dark mode support
- Follow accessibility standards (44px touch targets, ARIA)
- Keep components composable
- Use TypeScript for type safety

### DON'T ❌
- Copy-paste Tailwind classes dari Figma
- Hardcode colors atau spacing
- Create duplicate components
- Ignore dark mode
- Skip accessibility attributes
- Use inline styles

## 10. Common Patterns

### Form Fields
```typescript
<Input
  label="Email"
  type="email"
  error={errors.email}
  helperText="We'll never share your email"
/>
```

### Buttons
```typescript
<Button variant="primary" size="md" loading={isSubmitting}>
  Submit
</Button>
```

### Dark Mode Toggle
```typescript
import { ThemeToggle } from '@/components/ui/ThemeToggle';

<ThemeToggle />
```

### Responsive Layout
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

## 11. Monorepo Context

### Backend Integration
- Backend: NestJS di `apps/backend/`
- API calls: Axios dengan base URL dari env
- Shared types: `packages/shared-types/`

### Development
```bash
# Root level
pnpm install
pnpm dev          # Run all apps

# Frontend only
cd apps/frontend
pnpm dev          # http://localhost:5173
```

## Summary

Saat mengintegrasikan Figma designs:
1. **Analyze** Figma output untuk understand structure
2. **Map** ke existing components, jangan create new
3. **Use** design tokens untuk colors, spacing, typography
4. **Maintain** dark mode dan accessibility standards
5. **Validate** visual parity dengan Figma screenshot
6. **Link** components ke Figma dengan Code Connect

**Remember**: Figma output adalah starting point, bukan final code. Always adapt to project standards.
