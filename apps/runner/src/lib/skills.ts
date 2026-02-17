/**
 * Skills management for Claude Code projects.
 *
 * Copies modular skill .md files into project .claude/skills/ directories
 * so the Claude Agent SDK discovers and loads them natively via its
 * built-in skill tool call mechanism.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Find the directory containing our skill .md source files.
 * Works in dev (src/lib/skills/) and bundled (dist/lib/skills/) modes.
 */
function findSkillSourceDir(): string | null {
  const candidates = [
    join(__dirname, 'skills'),                        // dev: src/lib/skills/
    join(__dirname, 'lib', 'skills'),                 // bundle: dist/lib/skills/
    join(__dirname, '..', 'src', 'lib', 'skills'),    // bundle fallback
  ];

  for (const dir of candidates) {
    if (existsSync(dir)) {
      const files = readdirSync(dir).filter(f => f.endsWith('.md'));
      if (files.length > 0) {
        return dir;
      }
    }
  }

  return null;
}

// Cache the source directory
let _skillSourceDir: string | null | undefined;

function getSkillSourceDir(): string | null {
  if (_skillSourceDir === undefined) {
    _skillSourceDir = findSkillSourceDir();
  }
  return _skillSourceDir;
}

// Skills that should only be installed for new projects (not existing project edits)
const NEW_PROJECT_ONLY_SKILLS = new Set([
  'architectural-thinking',
  'template-originality',
]);

// Codex-specific skills that shouldn't be installed for Claude SDK
const CODEX_ONLY_SKILLS = new Set([
  'todo-workflow-codex',
]);

/**
 * Ensure skills are written to a project's .claude/skills/ directory
 * so the Claude Agent SDK discovers them natively.
 *
 * Each skill .md file becomes .claude/skills/<name>/SKILL.md
 */
export function ensureProjectSkills(projectDirectory: string): boolean {
  const sourceDir = getSkillSourceDir();
  if (!sourceDir) {
    process.stderr.write(`[skills] No skill source directory found, skipping project skill installation\n`);
    return false;
  }

  const skillFiles = readdirSync(sourceDir).filter(f => f.endsWith('.md'));
  if (skillFiles.length === 0) {
    return false;
  }

  const targetBase = join(projectDirectory, '.claude', 'skills');
  let installed = 0;

  for (const file of skillFiles) {
    const skillName = basename(file, '.md');

    // Skip codex-only skills for Claude SDK
    if (CODEX_ONLY_SKILLS.has(skillName)) continue;

    // Skip new-project-only skills for existing projects
    // (We can't determine this here, so we install all and let the SDK decide)

    const skillDir = join(targetBase, skillName);
    const targetFile = join(skillDir, 'SKILL.md');

    // Skip if already exists (don't overwrite on every build)
    if (existsSync(targetFile)) {
      installed++;
      continue;
    }

    mkdirSync(skillDir, { recursive: true });
    const content = readFileSync(join(sourceDir, file), 'utf-8');
    writeFileSync(targetFile, content, 'utf-8');
    installed++;
  }

  if (installed > 0) {
    process.stderr.write(`[skills] Installed ${installed} skills to ${targetBase}\n`);
  }

  return installed > 0;
}

/**
 * List available skill names from the source directory.
 */
export function listBundledSkills(): string[] {
  const sourceDir = getSkillSourceDir();
  if (!sourceDir) return [];

  return readdirSync(sourceDir)
    .filter(f => f.endsWith('.md'))
    .map(f => basename(f, '.md'));
}
