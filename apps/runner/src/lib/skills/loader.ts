/**
 * Skill loader for composing agent system prompts from modular skill files.
 *
 * Skills are modular pieces of procedural knowledge that get conditionally
 * composed into the system prompt based on agent type and project context.
 * This implements progressive disclosure to reduce prompt size.
 */

import type { AgentId } from '@hatchway/agent-core/types/agent';

// Skill content is imported as static strings so rollup can bundle them.
// The source .md files in this directory are the canonical source of truth.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Available skill names. Each corresponds to a .md file in the skills directory.
 */
export type SkillName =
  | 'todo-workflow'
  | 'todo-workflow-codex'
  | 'dependency-management'
  | 'design-system'
  | 'template-originality'
  | 'error-recovery'
  | 'testing-verification'
  | 'context-awareness'
  | 'architectural-thinking'
  | 'code-quality';

// Cache loaded skill content
const skillCache = new Map<string, string>();

/**
 * Strip YAML frontmatter from a markdown string.
 */
function stripFrontmatter(raw: string): string {
  return raw.replace(/^---\n[\s\S]*?\n---\n*/, '').trim();
}

/**
 * Load a skill by name. Tries multiple directory layouts to work in both
 * development (src/lib/skills/) and production (dist/) modes.
 */
export function loadSkill(name: SkillName): string {
  if (skillCache.has(name)) {
    return skillCache.get(name)!;
  }

  // Try paths that work in dev (src/lib/skills/) and in bundled output (dist/)
  // In dev: __dirname = src/lib/skills/ (file is right here)
  // In rollup bundle: __dirname = dist/ (import.meta.url points to dist/index.js)
  const candidates = [
    join(__dirname, `${name}.md`),                              // dev: src/lib/skills/{name}.md
    join(__dirname, 'lib', 'skills', `${name}.md`),             // bundle: dist/lib/skills/{name}.md
    join(__dirname, '..', 'src', 'lib', 'skills', `${name}.md`), // bundle fallback: src/lib/skills/{name}.md
  ];

  for (const candidate of candidates) {
    try {
      const raw = readFileSync(candidate, 'utf-8');
      const content = stripFrontmatter(raw);
      skillCache.set(name, content);
      return content;
    } catch {
      // Try next candidate
    }
  }

  // If no file found, return a descriptive fallback
  console.warn(`[skills] Could not load skill "${name}" from any path. Searched:`, candidates);
  return `[Skill "${name}" not found]`;
}

/**
 * Context for deciding which skills to load.
 */
export interface SkillContext {
  agentId: AgentId;
  isNewProject: boolean;
  hasDesignTags: boolean;
}

/**
 * Compose the full set of skill sections for a given agent and context.
 * Returns an array of skill content strings ready to join into a system prompt.
 */
export function composeSkills(context: SkillContext): string[] {
  const sections: string[] = [];
  const loaded: SkillName[] = [];

  function add(name: SkillName) {
    sections.push(loadSkill(name));
    loaded.push(name);
  }

  // Todo workflow: agent-specific variant
  if (context.agentId === 'openai-codex') {
    add('todo-workflow-codex');
  } else {
    add('todo-workflow');
  }

  // Always load: core behavioral skills
  add('context-awareness');
  add('dependency-management');
  add('code-quality');

  // New project skills (progressive disclosure - skip for existing projects)
  if (context.isNewProject) {
    add('architectural-thinking');
    add('template-originality');
  }

  // Design skills: only for new projects or when design tags are present
  if (context.isNewProject || context.hasDesignTags) {
    add('design-system');
  }

  // Always load: error handling and verification
  add('error-recovery');
  add('testing-verification');

  const totalChars = sections.reduce((sum, s) => sum + s.length, 0);
  console.log(`[skills] Composed ${loaded.length} skills (${totalChars} chars) for agent=${context.agentId} isNew=${context.isNewProject} hasDesign=${context.hasDesignTags}: [${loaded.join(', ')}]`);

  return sections;
}

/**
 * Clear the skill cache (useful for testing).
 */
export function clearSkillCache(): void {
  skillCache.clear();
}
