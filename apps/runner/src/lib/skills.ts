/**
 * Skills provisioning for the Claude Agent SDK.
 *
 * Platform-level skills are written to a runner-local directory structure
 * that the Claude SDK discovers via additionalDirectories. The SDK loads
 * only skill descriptions into context, and loads full content on-demand
 * when the agent decides a skill is relevant.
 *
 * Directory structure created:
 *   <skillsRoot>/.claude/skills/<name>/SKILL.md
 *
 * The skillsRoot is passed as an additionalDirectory to the SDK.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Codex-specific skills that shouldn't be provisioned for Claude SDK
const CODEX_ONLY_SKILLS = new Set(['todo-workflow-codex']);

/**
 * Find the directory containing our skill .md source files.
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
      if (files.length > 0) return dir;
    }
  }
  return null;
}

let _skillSourceDir: string | null | undefined;
function getSkillSourceDir(): string | null {
  if (_skillSourceDir === undefined) _skillSourceDir = findSkillSourceDir();
  return _skillSourceDir;
}

// Cached provisioned directory (only needs to be written once per process)
let _provisionedDir: string | null = null;

/**
 * Provision platform skills into a directory the Claude SDK can discover.
 *
 * Creates <tmpdir>/hatchway-skills/.claude/skills/<name>/SKILL.md for each
 * platform skill. Returns the root directory to add to additionalDirectories.
 *
 * Returns null if no skills could be provisioned.
 */
export function provisionPlatformSkills(): { skillsDir: string; skillNames: string[] } | null {
  if (_provisionedDir) {
    // Already provisioned, just return the names
    const sourceDir = getSkillSourceDir();
    if (!sourceDir) return null;
    const skillNames = readdirSync(sourceDir)
      .filter(f => f.endsWith('.md'))
      .map(f => basename(f, '.md'))
      .filter(name => !CODEX_ONLY_SKILLS.has(name));
    return { skillsDir: _provisionedDir, skillNames };
  }

  const sourceDir = getSkillSourceDir();
  if (!sourceDir) {
    process.stderr.write('[skills] No skill source directory found\n');
    return null;
  }

  const skillFiles = readdirSync(sourceDir).filter(f => f.endsWith('.md'));
  if (skillFiles.length === 0) return null;

  // Create a stable directory for skills (reused across builds in the same process)
  const skillsRoot = join(tmpdir(), 'hatchway-platform-skills');
  const skillNames: string[] = [];

  for (const file of skillFiles) {
    const skillName = basename(file, '.md');
    if (CODEX_ONLY_SKILLS.has(skillName)) continue;

    const skillDir = join(skillsRoot, '.claude', 'skills', skillName);
    const targetFile = join(skillDir, 'SKILL.md');

    if (!existsSync(targetFile)) {
      mkdirSync(skillDir, { recursive: true });
      const content = readFileSync(join(sourceDir, file), 'utf-8');
      writeFileSync(targetFile, content, 'utf-8');
    }

    skillNames.push(skillName);
  }

  _provisionedDir = skillsRoot;
  process.stderr.write(`[skills] Provisioned ${skillNames.length} platform skills to ${skillsRoot}/.claude/skills/: [${skillNames.join(', ')}]\n`);

  return { skillsDir: skillsRoot, skillNames };
}

/**
 * No-op for backward compatibility with callers that used the old copy-to-project approach.
 */
export function ensureProjectSkills(_projectDirectory: string): boolean {
  return false;
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
