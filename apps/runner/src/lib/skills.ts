/**
 * Skills provisioning for the Claude Agent SDK.
 *
 * Platform-level skills live within the runner itself at:
 *   src/lib/skills/.claude/skills/<name>/SKILL.md  (dev)
 *   dist/lib/skills/.claude/skills/<name>/SKILL.md (built)
 *
 * The parent directory is passed as an additionalDirectory to the SDK,
 * which discovers the .claude/skills/ structure and loads skills on-demand.
 */

import { existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Codex-specific skills that shouldn't be reported for Claude SDK
const CODEX_ONLY_SKILLS = new Set(['todo-workflow-codex']);

/**
 * Find the skills root directory that contains .claude/skills/.
 * Returns the parent path to pass as an additionalDirectory to the SDK.
 */
function findSkillsRoot(): string | null {
  // The .claude/skills/ structure lives inside the skills/ directory.
  // In dev: __dirname = src/lib/ -> skills dir = src/lib/skills/
  // In bundle: __dirname = dist/ -> skills dir = dist/lib/skills/
  const candidates = [
    join(__dirname, 'skills'),                        // dev: src/lib/skills/
    join(__dirname, 'lib', 'skills'),                 // bundle: dist/lib/skills/
    join(__dirname, '..', 'src', 'lib', 'skills'),    // bundle fallback
  ];

  for (const dir of candidates) {
    const claudeSkillsPath = join(dir, '.claude', 'skills');
    if (existsSync(claudeSkillsPath)) {
      return dir;
    }
  }
  return null;
}

let _skillsRoot: string | null | undefined;

/**
 * Get the directory containing .claude/skills/ to pass as an additionalDirectory.
 * The Claude SDK will discover skills from this path automatically.
 *
 * Returns null if skills directory is not found.
 */
export function getPlatformSkillsDir(): string | null {
  if (_skillsRoot === undefined) {
    _skillsRoot = findSkillsRoot();
    if (_skillsRoot) {
      const names = listBundledSkills();
      process.stderr.write(`[skills] Platform skills directory: ${_skillsRoot}/.claude/skills/ (${names.length} skills: [${names.join(', ')}])\n`);
    } else {
      process.stderr.write('[skills] No platform skills directory found\n');
    }
  }
  return _skillsRoot;
}

/**
 * No-op for backward compatibility with callers that used the old copy-to-project approach.
 */
export function ensureProjectSkills(_projectDirectory: string): boolean {
  return false;
}

/**
 * List available skill names.
 */
export function listBundledSkills(): string[] {
  const root = _skillsRoot ?? findSkillsRoot();
  if (!root) return [];
  const claudeSkillsPath = join(root, '.claude', 'skills');
  if (!existsSync(claudeSkillsPath)) return [];

  return readdirSync(claudeSkillsPath, { withFileTypes: true })
    .filter(d => d.isDirectory() && !CODEX_ONLY_SKILLS.has(d.name))
    .map(d => d.name);
}
