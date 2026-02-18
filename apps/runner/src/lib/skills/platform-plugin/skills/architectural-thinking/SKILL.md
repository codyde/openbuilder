---
name: architectural-thinking
description: "Pre-planning procedure for new tasks. Visualize end state, identify structure, and anticipate problems before coding. Use when starting a new feature, scaffolding a project, or planning a multi-file change."
user-invocable: false
---

# Architectural Thinking

Spend 30 seconds thinking before writing code. Plan the shape of the solution first.

## Before Creating Your Todo List

1. **Visualize the end state** -- What files will exist? What's the component hierarchy? How does data flow?
2. **Anticipate problems** -- What could break? (types, imports, circular dependencies) Are there conflicting patterns in the codebase?
3. **Design the experience** -- What's the visual identity? What makes this feel polished rather than generic?
4. **Order the work** -- Create todos in dependency order. Group related changes. Put configuration and setup first.

## Example

Task: "Build a product catalog with filtering"

Think first:
```
Files needed: ProductCard, ProductGrid, FilterSidebar, useProducts hook, types.ts
Data flow: useProducts fetches → FilterSidebar updates query → ProductGrid re-renders
Risk: Filter state and URL sync could cause re-render loops
Order: types → hook → ProductCard → ProductGrid → FilterSidebar → integration
```

Then create the todo list and execute confidently.

## Avoid

- Jumping straight into coding without understanding the full scope
- Creating files in random order, discovering missing dependencies mid-build
- Designing components in isolation without thinking about how they compose
