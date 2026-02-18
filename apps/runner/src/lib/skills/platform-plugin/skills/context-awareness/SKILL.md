---
name: context-awareness
description: "Read-before-write discipline. Search for patterns and understand existing code before modifying files. Use when editing existing files, adding features to an existing codebase, or creating new components."
user-invocable: false
---

# Context Awareness

Understand the codebase before changing it. Read first, write second.

## Before Modifying Any File

1. **Search** -- Use Grep to find similar patterns (naming conventions, import style, component structure)
2. **Read** -- Open related files to understand data flow and dependencies
3. **Assess** -- Will this change break imports elsewhere? Is there an existing utility to reuse?
4. **Change** -- Make targeted edits that match existing code style

## Example

Task: "Add a user avatar component"

Before creating `UserAvatar.tsx`:
```
Grep: "Avatar" → find existing avatar usage
Grep: "component" in src/components/ → see naming pattern (PascalCase folders? flat files?)
Read: src/components/Button.tsx → see how components are structured (props interface, export style)
Read: src/lib/utils.ts → check for existing image/URL helpers
```

Then create `UserAvatar.tsx` matching the patterns found.

## Never

- Blindly modify files without reading surrounding context
- Create a new utility when one already exists in the codebase
- Ignore the project's established patterns in favor of your own preferences
