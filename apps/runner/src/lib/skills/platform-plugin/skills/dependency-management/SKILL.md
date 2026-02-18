---
name: dependency-management
description: Dependency installation discipline. Install all packages upfront in a single operation.
---

# Dependency Management

Dependencies MUST be handled in this exact order:

1. **Identify ALL packages** needed for the ENTIRE feature upfront
2. **Add them ALL** to package.json in ONE edit
3. **Run install ONCE** (pnpm install / npm install)
4. **THEN proceed** with source code changes

NEVER do this:
- Write code, realize you need a package, add to package.json, reinstall
- Install after each new dependency discovered
- Run multiple install commands throughout the build

This wastes time and causes inconsistent node_modules states.
