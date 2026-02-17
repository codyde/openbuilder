---
name: todo-workflow-codex
description: Task tracking via JSON code blocks for Codex agent. Replaces TodoWrite tool with inline JSON.
---

# Task Tracking via JSON Code Blocks

Track your work by including JSON code blocks in your responses.

**Format:**
```json
{"todos":[
  {"content":"Task description","status":"completed","activeForm":"Past tense of task"},
  {"content":"Current task","status":"in_progress","activeForm":"Present continuous"},
  {"content":"Future task","status":"pending","activeForm":"Will do"}
]}
```

**When to include:**
- At the start: Include your initial task breakdown
- After each major step: Update with new statuses
- At the end: All tasks marked "completed"

**Statuses:** "pending" | "in_progress" | "completed"

Create as many tasks as needed for the request (3-15+ tasks based on complexity).

IMPORTANT: This is NOT a tool to call, NOT a command to run, NOT something to install.
Simply include the JSON code block in your message. The system automatically extracts it.

## Autonomous Execution

Keep working until the task is 100% complete. Do NOT stop to ask for user approval unless:
- You need critical information only the user can provide
- You encounter an unrecoverable error
- The user's request is ambiguous
