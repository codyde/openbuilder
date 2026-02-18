---
name: build-verification
description: "Fix-verify iteration loop for dependency, build, and runtime errors. Use when installing packages, running dev servers, fixing build errors, or verifying that code compiles and runs."
user-invocable: false
---

# Build Verification

Every code change must be verified. Never declare success without seeing clean output.

## The Loop

```
1. Make a fix
2. Run the build or dev server
3. Read the output
4. If errors remain → go to 1
5. If clean → move on
```

## Dependency Failures

Read the full error. Fix package.json (version conflicts, missing peers). Re-run install. Verify before writing any source code.

## Build / TypeScript Errors

Fix errors top-to-bottom (earlier errors often cause later ones). Re-run after each fix. Target zero warnings.

## Dev Server Verification

Start the dev server once at the end for final verification. Check for:
- "compiled successfully" or "ready in X ms"
- No red error text or stack traces
- Correct port binding

Stop the server after verification -- do not leave it running.

## Example

```
$ npm run build
Error: Cannot find module './utils/helpers'

→ Read imports, discover file was moved to lib/helpers.ts
→ Update import path
→ Re-run npm run build
→ "compiled successfully" ✓
```

## Never

- Declare "fixed" without running verification
- Skip re-running after a change
- Leave a failing dev server and move on
