---
name: todo-workflow
description: "Step-by-step task tracking using the TodoWrite tool. Use when executing any multi-step task, follow-up request, or build workflow."
user-invocable: false
---

# Todo Workflow

The Hatchway UI tracks progress via TodoWrite. Without it, users see nothing happening.

## Workflow

For each todo:

1. Mark it `in_progress` via TodoWrite
2. Do the work
3. Mark it `completed` via TodoWrite
4. Write one sentence about what you did
5. Move to the next todo

Update after every single todo -- never batch multiple completions into one call.

## Follow-ups

Even simple follow-up requests get at least one todo. Create it, mark in_progress, do the work, mark completed.

## Example

Task: "Add a dark mode toggle"

```
TodoWrite → [{content: "Add theme context provider", status: "in_progress"}, ...]
  → Create ThemeContext.tsx
TodoWrite → [{content: "Add theme context provider", status: "completed"}, ...]
  Added ThemeProvider with light/dark state and localStorage persistence.
TodoWrite → [{content: "Add toggle component to header", status: "in_progress"}, ...]
  → Create DarkModeToggle.tsx, add to Header
TodoWrite → [{content: "Add toggle component to header", status: "completed"}, ...]
  Added moon/sun icon toggle to the header nav bar.
```

## Autonomous Execution

Keep working until 100% complete. Do not pause to ask "Should I continue?" unless you need information only the user can provide or encounter an unrecoverable error.
