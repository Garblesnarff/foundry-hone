# foundry-hone Design System

## Overview

Design system based on Tailwind CSS with custom Forge-themed colors and components.

## Color Palette

### Forge Theme (Primary)
- **Forge-50**: `#f9fafb` — Lightest background
- **Forge-100**: `#f3f4f6` — Light background
- **Forge-500**: `#8b4513` — Primary brand (forge brown)
- **Forge-900**: `#2c1810` — Dark/shadow color

### Status Colors
- **Success**: `#10b981` — Green (process complete)
- **Warning**: `#f59e0b` — Amber (detection issues)
- **Error**: `#ef4444` — Red (processing failed)
- **Info**: `#3b82f6` — Blue (progress updates)

## Typography

### Headings
- **H1**: 32px, weight 700
- **H2**: 24px, weight 600
- **H3**: 18px, weight 600

### Body Text
- **Regular**: 16px, weight 400
- **Small**: 14px, weight 400
- **Label**: 14px, weight 500

## Component Library

### Buttons
- **Primary** (Forge-500): "Hone It", "Process"
- **Secondary** (Gray-200): "Cancel"
- **Size**: 44px min height (touch-friendly)
- **Padding**: 12px × 10px
- **Border Radius**: 6px

### Sliders
- **Height**: 6px track
- **Thumb**: 20px diameter, Forge-500
- **Label**: Left-aligned above

### Progress Bar
- **Height**: 8px
- **Background**: Gray-200
- **Fill**: Forge-500 (animated)

## Accessibility

### WCAG 2.1 Level AA
- Color contrast: 4.5:1 (text)
- Focus indicators: visible
- Keyboard navigation: Tab/Space/Enter
- Touch target: 48px min (mobile), 44px (desktop)

## Forge Language in UI

Use blade-forging metaphors:

### Actions
- "Hone It" — Start processing
- "RE-HONE" — Re-run with same settings
- "Forge Output" — Save/export

### Status
- "Honing the blade..." — Upscaling
- "Scanning for faces..." — Detection
- "Restoring faces (X of Y)..." — Restoration
- "Honed to perfection." — Complete

### Components
- "Face Honing Strength" — Blend intensity slider
- "Blade Sharpness" — Upscale factor selector
- "Smithy Ledger" — Job history

## Responsive Design

Mobile-first using Tailwind breakpoints:

```
Default: 320px+ (mobile)
sm: 640px
md: 768px
lg: 1024px
```

Example:
```jsx
<div className="w-full md:w-1/2 lg:w-1/3">Content</div>
```

---

**Version**: 1.0  
**Last Updated**: 2026-03-14  
**Status**: Living Document
