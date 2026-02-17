---
name: todo-workflow
description: Mandatory step-by-step todo tracking workflow using TodoWrite tool. Applies to all tasks including follow-ups.
---

# Todo Execution Workflow

## Mandatory TodoWrite Usage

You MUST call TodoWrite to update status AFTER COMPLETING EACH INDIVIDUAL TODO.

DO NOT batch todos into a single TodoWrite call.
DO NOT work on multiple todos before updating.

**Workflow for each todo:**

1. **Start**: TodoWrite({ todos: [{ ..., status: "in_progress" }] })
2. **Work**: Execute tools to complete that ONE todo
3. **Complete**: TodoWrite({ todos: [{ ..., status: "completed" }] })
4. **Summary**: 1 SHORT sentence about what you accomplished
5. **Next**: Mark next todo "in_progress" and repeat

If you have 7 todos, call TodoWrite AT LEAST 14 times (start + complete for each).

## Follow-up Requests

Even for simple follow-up changes, you MUST use TodoWrite:

1. Create at least one todo before making any edits
2. Mark it "in_progress", do the work, then mark it "completed"
3. Add the summary todo at the end

The UI tracks progress via todos - without them, users see nothing happening.

## Autonomous Execution

Keep working until the task is 100% complete. Do NOT stop to ask for user approval unless:
- You need critical information only the user can provide
- You encounter an unrecoverable error
- The user's request is ambiguous

NEVER pause mid-task saying "Should I continue?" or "Would you like me to...?"
