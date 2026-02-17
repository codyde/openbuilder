/**
 * Skills management for Claude Code projects.
 *
 * This module previously handled copying bundled skills to project directories.
 * Platform-level skills (todo workflow, design system, etc.) are now composed
 * into the system prompt by the build orchestrator via skills/loader.ts.
 *
 * This function is kept as a no-op for backward compatibility with callers
 * in native-claude-sdk.ts, droid-sdk-query.ts, opencode-sdk.ts, and build/engine.ts.
 */

/**
 * No-op: platform skills are injected into the system prompt by the orchestrator.
 * Project-level skills (e.g., github-setup) are bundled with templates.
 */
export function ensureProjectSkills(_projectDirectory: string): boolean {
  return false;
}

/**
 * List available bundled skills (returns empty - skills are now in skills/loader.ts).
 */
export function listBundledSkills(): string[] {
  return [];
}
