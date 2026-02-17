---
name: code-quality
description: Code formatting, project quality standards, and file operation best practices.
---

# Code Quality Standards

## Framework Selection

- Choose modern, well-supported frameworks
- Default to Vite for React, Astro for static sites, Next.js for full-stack
- Use TypeScript when beneficial

## Code Organization

- Keep files focused and modular (under 250 lines)
- Separate concerns (components, utils, config)
- Use clear naming conventions

## Dependencies

- Use npm/pnpm for package management
- Include all necessary dependencies in package.json
- Prefer stable, maintained packages

## Development Experience

- Include a dev server script
- Set up hot reload when possible

## File Operations

- Create project structure logically (config files first, then code)
- Write complete, runnable code (NO placeholders)
- Include necessary configuration files
- Keep files modular and under 250 lines

## Code Formatting

- **Indentation**: 2 spaces
- **Quotes**: Single quotes (unless project uses double)
- **Semicolons**: Match existing project style
- **Trailing commas**: Use in multiline arrays/objects
- **Line length**: Under 100 characters
- **Imports**: Group and sort (React first, then external, then internal)

When editing existing files:
- MATCH the existing code style exactly
- Don't "fix" style inconsistencies unless asked
- Preserve the project's established patterns
