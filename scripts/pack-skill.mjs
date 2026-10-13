#!/usr/bin/env node
/**
 * Package `skills/vibe-coding/` as a marketplace-ready zip
 * (Agensi, Claude Code plugins, Cursor, Codex …).
 *
 *   npm run skill:pack            → dist-skill/vibe-coding-skill-<version>.zip
 *
 * Validates the SKILL.md frontmatter (name matches folder, description
 * present) before zipping. Uses the system `zip` binary (macOS / Linux).
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SKILL_DIR = path.join(ROOT, 'skills', 'vibe-coding');
const OUT_DIR = path.join(ROOT, 'dist-skill');

async function main() {
  const skillMd = await fs.readFile(path.join(SKILL_DIR, 'SKILL.md'), 'utf-8');
  const fm = skillMd.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) throw new Error('SKILL.md has no frontmatter');
  const name = fm[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = fm[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (name !== path.basename(SKILL_DIR)) throw new Error(`frontmatter name "${name}" must equal folder "${path.basename(SKILL_DIR)}"`);
  if (!description || description.length < 40) throw new Error('description missing or too short');
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error('name must be lowercase letters, digits, hyphens');

  // Make scripts executable.
  for (const f of await fs.readdir(path.join(SKILL_DIR, 'scripts')).catch(() => [])) {
    await fs.chmod(path.join(SKILL_DIR, 'scripts', f), 0o755);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  const zip = path.join(OUT_DIR, `vibe-coding-skill-${pkg.version}.zip`);
  await fs.rm(zip, { force: true });
  execFileSync('zip', ['-r', '-X', zip, 'vibe-coding', '-x', '*.DS_Store'], { cwd: path.join(ROOT, 'skills'), stdio: 'inherit' });

  const st = await fs.stat(zip);
  console.log(`\n✔ ${path.relative(ROOT, zip)} (${(st.size / 1024).toFixed(1)} KB)`);
  console.log(`  name: ${name}\n  description: ${description.slice(0, 120)}…`);
}

main().catch((err) => {
  console.error(`✖ ${err.message}`);
  process.exit(1);
});
