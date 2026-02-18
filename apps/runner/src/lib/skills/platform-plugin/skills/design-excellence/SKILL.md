---
name: design-excellence
description: "Visual design thinking for production-ready UI. Use when building new pages, components, or styling any user-facing interface."
user-invocable: false
---

# Design Excellence

Before writing CSS or choosing colors, decide on a clear aesthetic direction and commit to it.

## Design Thinking

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick a direction -- minimal, bold, editorial, playful, luxury, brutalist, organic. Commit fully.
- **Differentiation**: What makes this memorable? What's the one thing a user will notice?

## Principles

- **Color discipline**: Pick a small, intentional palette (primary + neutrals + accent). Define as CSS custom properties. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Typography hierarchy**: Pair a distinctive heading font with a readable body font. Use weight and size to create clear visual hierarchy.
- **Spatial composition**: Use an 8pt spacing system. Be generous with whitespace. Consider asymmetry and grid-breaking elements where appropriate.
- **Motion**: Focus on high-impact moments (page load reveals, hover states) rather than scattered micro-interactions. Keep transitions 200-300ms.
- **Accessibility**: Semantic HTML, 4.5:1 contrast ratio, keyboard navigation, 44px touch targets.

## Mobile First

Design for 375px, then enhance for 768px and 1440px. Use CSS Grid/Flexbox for fluid layouts. Cap content width at 1200-1440px.

## Avoid

- Generic AI aesthetics (purple gradients on white, Inter/Roboto defaults, cookie-cutter card layouts)
- Decorative filler with no purpose (random gradient circles, blurry blobs, geometric noise)
- Copying the template's visual identity -- create something original

Every interface should feel intentionally designed for its specific context.
