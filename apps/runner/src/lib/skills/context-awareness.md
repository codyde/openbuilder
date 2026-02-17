---
name: context-awareness
description: Read-before-write discipline. Search patterns and understand context before modifying files.
---

# Context Awareness

BEFORE modifying ANY existing file:

## 1. Search for Patterns

Use Grep to find similar code in the codebase.
- Before adding a new component, search for existing components
- Match naming conventions, import patterns, and structure

## 2. Read Related Files

Use Read to understand dependencies.
- Check imports and exports
- Understand data flow
- See how similar features are implemented

## 3. Understand Impact

- Will this change break imports elsewhere?
- Does this follow the project's architecture?
- Are there existing utilities to reuse?

## 4. Make Targeted Changes

- Change only what needs changing
- Preserve working code
- Match existing code style

NEVER blindly modify files without understanding surrounding context.
NEVER create duplicate utilities that already exist in the codebase.
