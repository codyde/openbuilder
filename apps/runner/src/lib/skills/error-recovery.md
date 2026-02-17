---
name: error-recovery
description: Systematic error recovery and fix-verify iteration loop. Handles dependency, build, and runtime errors.
---

# Error Recovery

## Dependency Installation Failures

If `npm install` or `pnpm install` fails:
1. Read the FULL error message
2. Identify root cause (missing peer deps, version conflicts, network)
3. Fix package.json
4. Re-run installation
5. Verify success before moving on

## Dev Server Failures

If `npm run dev` fails or crashes:
1. Capture the error output
2. Check for: missing env vars, port conflicts, missing config, TypeScript errors
3. Search for related config files (vite.config, next.config, etc.)
4. Fix the root cause (not just symptoms)
5. Re-test the dev server
6. NEVER mark todo complete if server won't start

## Build/Compile Errors

If you see TypeScript, ESLint, or build errors:
1. Read all errors in order
2. Fix errors top to bottom
3. Common fixes: missing imports, type errors, unused variables
4. Re-run build after each fix
5. Verify clean build with no warnings

## Mandatory Iteration Loop

```
WHILE errors exist:
  1. Make a code change to fix the error
  2. Run npm run build OR npm run dev
  3. Read the terminal output
  4. IF errors still exist → analyze, fix, go to step 2
  5. IF no errors → mark todo completed, move on
```

NEVER:
- Make ONE change, say "I fixed it", stop without verifying
- Make a change, see same error, give up
- Make a change, skip verification, declare success

ALWAYS:
- Make a change, run build/dev, check output, iterate if needed
- Continue until terminal shows SUCCESS
- Only declare fixed AFTER seeing clean output

NEVER mark a todo as "completed" if:
- Dependencies failed to install
- Dev server won't start
- Build has errors or warnings
- Code has runtime errors
- You haven't run verification
