---
name: design-system
description: Visual design standards for production-ready UI. Color discipline, typography, layout, accessibility, and micro-interactions.
---

# Design Excellence Standards

## Color Discipline

Use EXACTLY 3-5 colors total:
- 1 primary brand color (vibrant, distinctive)
- 2-3 neutrals (backgrounds, text, borders)
- 1-2 accent colors (highlights, CTAs, important elements)

Define colors as CSS custom properties. NEVER use generic color names.
Example: #FF6B6B (primary), #4ECDC4 (accent), #333333/#F7F7F7 (neutrals)

## Typography Hierarchy

MAXIMUM 2 font families:
- 1 for headings (distinctive, bold)
- 1 for body text (readable, clean)

Size scale: h1 (3rem+), h2 (2rem), h3 (1.5rem), body (1rem).
Font weight variation (300, 400, 600, 700) for hierarchy.
Line-height: 1.2 for headings, 1.6 for body text.

## Banned: Decorative Filler

NEVER generate:
- Abstract gradient circles or blurry blobs
- Generic geometric patterns without purpose
- Decorative squares, triangles, or shapes
- Random background noise or textures

Instead use purposeful imagery (Pexels URLs), functional illustrations, intentional gradients, meaningful iconography.

## Layout Standards

- Mobile-first: Design for 375px, then enhance for 768px, 1440px
- CSS Grid/Flexbox for fluid layouts
- 8pt spacing system (8px, 16px, 24px, 32px, 48px, 64px)
- Section padding: min 48px mobile, 64px desktop
- Content max-width: 1200-1440px

## Accessibility

- Semantic HTML5 (nav, main, article, section)
- ARIA labels where needed (WCAG AA minimum)
- Keyboard navigation support
- Color contrast ratio >= 4.5:1 for text
- Touch targets >= 44x44px on mobile

## Micro-interactions

Every design must have:
- Distinctive brand personality
- Visual hierarchy with clear focal points
- Purposeful white space (2rem+ between sections)
- Hover states and transitions (200-300ms)
- Responsive excellence

## CSS Standards

- NEVER include generic `* { margin: 0; padding: 0; box-sizing: border-box; }` resets
- Base CSS on specific design requirements
- Use semantic, design-specific selectors
- Use modern CSS features (flexbox, grid, custom properties)

## Completion Checklist

- [ ] 3-5 colors with clear hierarchy
- [ ] 2 font families maximum
- [ ] No decorative filler or generic patterns
- [ ] Mobile-responsive (375px, 768px, 1440px)
- [ ] All images use valid Pexels URLs (not downloaded)
- [ ] Micro-interactions present
- [ ] Code is production-ready (no placeholders)
