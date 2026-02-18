---
name: dependency-management
description: "Install all project dependencies upfront in a single operation. Use when starting a new feature, scaffolding a project, or when any npm/pnpm package installation is needed."
user-invocable: false
---

# Dependency Management

Identify every package the feature needs before writing source code. Install once, then build.

## Workflow

1. Read the requirements and identify ALL needed packages
2. Add them all to package.json in one edit
3. Run install once (`pnpm install` or `npm install`)
4. Begin writing source code

## Example

Task: "Add a chart dashboard with date filtering"

Identify upfront: recharts, date-fns, @types/recharts

```json
// One package.json edit with all three
"dependencies": {
  "recharts": "^2.12.0",
  "date-fns": "^3.6.0"
},
"devDependencies": {
  "@types/recharts": "^2.0.0"
}
```

Then one `npm install`, then start coding.

## Avoid

- Writing code, discovering a missing import, installing, repeat
- Running multiple install commands throughout the build
- Installing packages one at a time as you discover them
