---
name: todo-workflow-codex
description: "Task tracking via inline JSON code blocks for the Codex agent. Use when executing any multi-step task or build workflow."
user-invocable: false
---

# Task Tracking via JSON Code Blocks

Track progress by including JSON code blocks in your responses. The system extracts them automatically.

## Format

```json
{"todos":[
  {"content":"Task description","status":"completed","activeForm":"Past tense"},
  {"content":"Current task","status":"in_progress","activeForm":"Present continuous"},
  {"content":"Future task","status":"pending","activeForm":"Will do"}
]}
```

## When to Include

- At the start: initial task breakdown
- After each major step: updated statuses
- At the end: all tasks completed

## Example

Task: "Add a contact form"

Response 1:
```json
{"todos":[
  {"content":"Create form component with validation","status":"in_progress","activeForm":"Creating form component"},
  {"content":"Add API route for form submission","status":"pending","activeForm":"Will add API route"},
  {"content":"Style form with project design system","status":"pending","activeForm":"Will style form"}
]}
```

Response 2 (after completing form):
```json
{"todos":[
  {"content":"Create form component with validation","status":"completed","activeForm":"Created form component"},
  {"content":"Add API route for form submission","status":"in_progress","activeForm":"Adding API route"},
  {"content":"Style form with project design system","status":"pending","activeForm":"Will style form"}
]}
```

This is NOT a tool call -- simply include the JSON block in your message text.

## Autonomous Execution

Keep working until 100% complete. Do not pause to ask "Should I continue?" unless you need information only the user can provide or encounter an unrecoverable error.
