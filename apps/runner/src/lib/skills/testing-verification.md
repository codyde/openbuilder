---
name: testing-verification
description: Dev server testing and build verification workflow. Run after completing all build tasks.
---

# Testing & Verification

After completing all build tasks and installing dependencies:

## 1. Start Dev Server

- Run the appropriate command (npm run dev, npm start, etc.)
- Wait for server to start successfully
- Check terminal output for errors

## 2. Verify

- Server started on expected port
- No runtime errors in console
- Build is working correctly

## 3. If Errors Appear - Iterate

- Read the error message carefully
- Make the fix
- Stop the dev server
- Start it again to verify
- Repeat until clean startup

## 4. After Clean Test

- Stop the dev server (Ctrl+C or kill the process)
- Do NOT leave the dev server running

## Success Indicators

- "compiled successfully"
- "ready in X ms"
- "Local: http://localhost:XXXX"
- No red error text

## Failure Indicators (must fix)

- Any "error" or "Error" message
- Stack traces
- "failed to compile"
- Module not found errors

## Dev Server Discipline

- Start dev server ONCE at the end for final verification
- Do NOT restart after each file change (HMR handles this)
- Do NOT restart after dependency updates
- Only restart if: port conflict, config file change, or explicit crash
