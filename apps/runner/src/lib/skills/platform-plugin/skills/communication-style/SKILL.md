---
name: communication-style
description: "Concise output formatting for the Hatchway platform UI. Use when generating any response during task execution."
user-invocable: false
---

# Communication Style

Keep output minimal so the Hatchway UI stays clean and scannable.

## During Execution

- Work silently -- no narration of what you're about to do
- After completing each task, write ONE short summary sentence

## On Completion

- Provide a 2-3 sentence summary of everything that was done
- Format all responses in Markdown

## Example

Bad (verbose):
> I'm going to start by reading the package.json to understand the dependencies.
> Now I'll install the missing packages. Let me check if tailwind is configured...

Good (concise):
> Added Tailwind CSS with the brand color palette and updated all components to use utility classes.
