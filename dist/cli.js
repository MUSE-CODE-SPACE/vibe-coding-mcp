#!/usr/bin/env node
/**
 * `vibe-coding-mcp` command-line entry point.
 *
 *   vibe-coding-mcp              start the MCP server on stdio (default)
 *   vibe-coding-mcp hook         Claude Code hook: read the hook JSON from stdin,
 *                                capture the transcript, never block Claude
 *   vibe-coding-mcp capture      capture the newest transcript for the cwd by hand
 *   vibe-coding-mcp init         install the Stop + SessionEnd hooks into Claude Code settings
 *   vibe-coding-mcp doctor       check hooks, storage, transcripts, env
 *
 * The `hook` subcommand is the piece that makes auto-capture real: Claude
 * Code pipes `{ session_id, transcript_path, cwd, hook_event_name, … }` to
 * stdin, we parse the transcript JSONL and upsert a session. stdout is kept
 * empty on purpose (Claude Code parses hook stdout), all diagnostics go to
 * stderr, and the exit code is always 0 so a capture failure can never
 * interrupt a coding session.
 */
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createRequire } from 'module';
import { captureTranscript, captureLatestForCwd } from './core/captureEngine.js';
import { findLatestTranscript, listTranscripts, claudeProjectsDir, projectSlug, expandHome } from './core/transcriptParser.js';
import { settingsPathFor, hookCommand, mergeHooks, removeHooks, readSettings, writeSettingsWithBackup, hooksInstalled, buildHookGroups, } from './core/hookInstaller.js';
import { listSessions } from './core/sessionStorage.js';
import { validateConfiguration } from './core/config.js';
import { logger } from './core/logger.js';
const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const STORAGE_ROOT = process.env.VIBE_CODING_STORAGE_DIR
    ? path.dirname(process.env.VIBE_CODING_STORAGE_DIR)
    : path.join(os.homedir(), '.vibe-coding-mcp');
const HOOK_LOG = path.join(STORAGE_ROOT, 'hook.log');
function parseArgs(argv) {
    const [command = 'serve', ...rest] = argv;
    const flags = {};
    const positional = [];
    for (let i = 0; i < rest.length; i += 1) {
        const a = rest[i];
        if (a.startsWith('--')) {
            const [k, inlineV] = a.slice(2).split('=', 2);
            if (inlineV !== undefined)
                flags[k] = inlineV;
            else if (rest[i + 1] && !rest[i + 1].startsWith('--')) {
                flags[k] = rest[i + 1];
                i += 1;
            }
            else
                flags[k] = true;
        }
        else
            positional.push(a);
    }
    return { command, flags, positional };
}
function flagStr(flags, name) {
    const v = flags[name];
    return typeof v === 'string' ? v : undefined;
}
// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
async function readStdin(timeoutMs = 3000) {
    if (process.stdin.isTTY)
        return '';
    return new Promise((resolve) => {
        let data = '';
        const timer = setTimeout(() => resolve(data), timeoutMs);
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', (chunk) => {
            data += chunk;
        });
        process.stdin.on('end', () => {
            clearTimeout(timer);
            resolve(data);
        });
        process.stdin.on('error', () => {
            clearTimeout(timer);
            resolve(data);
        });
    });
}
async function appendHookLog(entry) {
    try {
        await fs.mkdir(STORAGE_ROOT, { recursive: true });
        await fs.appendFile(HOOK_LOG, JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n', 'utf-8');
    }
    catch {
        /* never fail the hook because of logging */
    }
}
async function binaryOnPath() {
    const dirs = (process.env.PATH ?? '').split(path.delimiter).filter(Boolean);
    for (const dir of dirs) {
        try {
            await fs.access(path.join(dir, 'vibe-coding-mcp'));
            return true;
        }
        catch {
            /* keep looking */
        }
    }
    return false;
}
function ok(msg) {
    console.log(`  ✔ ${msg}`);
}
function warn(msg) {
    console.log(`  ✖ ${msg}`);
}
function info(msg) {
    console.log(`  · ${msg}`);
}
function summarize(r) {
    return `${r.status}: "${r.title}" (${r.stats.prompts} prompts, ${r.stats.filesChanged} files, ${r.stats.designDecisions} decisions)` +
        (r.sessionId ? ` → ${r.sessionId}` : '') +
        (r.reason ? ` — ${r.reason}` : '');
}
// ---------------------------------------------------------------------------
// subcommands
// ---------------------------------------------------------------------------
async function runHook(args) {
    // Quiet: Claude Code reads stdout, so no logger noise at all.
    logger.setLevel('error');
    let payload = {};
    const raw = await readStdin();
    if (raw.trim()) {
        try {
            payload = JSON.parse(raw);
        }
        catch {
            payload = {};
        }
    }
    const hookEvent = typeof payload.hook_event_name === 'string' ? payload.hook_event_name : 'hook';
    const cwd = flagStr(args.flags, 'cwd') ?? (typeof payload.cwd === 'string' ? payload.cwd : process.cwd());
    let transcript = flagStr(args.flags, 'transcript') ?? (typeof payload.transcript_path === 'string' ? payload.transcript_path : undefined);
    if (transcript)
        transcript = expandHome(transcript);
    try {
        if (!transcript)
            transcript = (await findLatestTranscript(cwd)) ?? undefined;
        if (!transcript) {
            await appendHookLog({ event: hookEvent, cwd, status: 'no-transcript' });
            return;
        }
        const result = await captureTranscript(transcript, { hookEvent, cwd });
        await appendHookLog({
            event: hookEvent,
            cwd,
            status: result.status,
            sessionId: result.sessionId,
            claudeSessionId: result.claudeSessionId,
            prompts: result.stats.prompts,
            files: result.stats.filesChanged,
        });
        if (process.env.VIBE_CODING_HOOK_DEBUG)
            console.error(`[vibe-coding-mcp hook] ${summarize(result)}`);
    }
    catch (err) {
        await appendHookLog({ event: hookEvent, cwd, status: 'error', error: err.message });
        if (process.env.VIBE_CODING_HOOK_DEBUG)
            console.error(`[vibe-coding-mcp hook] error: ${err.message}`);
    }
}
async function runCapture(args) {
    logger.setLevel('error');
    const cwd = expandHome(flagStr(args.flags, 'cwd') ?? process.cwd());
    const dryRun = args.flags['dry-run'] === true;
    const json = args.flags.json === true;
    const results = [];
    const transcriptFlag = flagStr(args.flags, 'transcript');
    if (transcriptFlag) {
        results.push(await captureTranscript(expandHome(transcriptFlag), { hookEvent: 'manual', cwd, dryRun }));
    }
    else if (args.flags.all === true) {
        const all = await listTranscripts(cwd);
        for (const t of all)
            results.push(await captureTranscript(t.path, { hookEvent: 'manual', cwd, dryRun }));
    }
    else {
        const r = await captureLatestForCwd(cwd, { hookEvent: 'manual', cwd, dryRun });
        if (!r) {
            console.error(`No Claude Code transcript found for ${cwd}\n(looked in ${path.join(claudeProjectsDir(), projectSlug(cwd))})`);
            process.exitCode = 1;
            return;
        }
        results.push(r);
    }
    if (json) {
        console.log(JSON.stringify(results.map((r) => ({ ...r, session: dryRun ? r.session : undefined })), null, 2));
        return;
    }
    for (const r of results)
        console.log(summarize(r));
    if (dryRun && results[0]?.session) {
        console.log('\n--- session body (dry-run) ---');
        console.log(JSON.stringify(results[0].session, null, 2));
    }
}
async function runInit(args) {
    const scope = args.flags.project === true ? 'project' : args.flags.local === true ? 'local' : 'global';
    const file = settingsPathFor(scope);
    const command = flagStr(args.flags, 'command') ?? hookCommand(await binaryOnPath());
    if (args.flags.print === true) {
        console.log(JSON.stringify({ hooks: buildHookGroups(command) }, null, 2));
        return;
    }
    const current = await readSettings(file);
    const { settings, changed } = args.flags.remove === true ? removeHooks(current) : mergeHooks(current, command);
    if (!changed) {
        console.log(args.flags.remove === true ? `No vibe-coding hooks found in ${file}` : `Hooks already installed in ${file} (command: ${command})`);
        return;
    }
    if (args.flags['dry-run'] === true) {
        console.log(`Would write ${file}:\n`);
        console.log(JSON.stringify(settings, null, 2));
        return;
    }
    const { backup } = await writeSettingsWithBackup(file, settings);
    console.log(`${args.flags.remove === true ? 'Removed' : 'Installed'} vibe-coding hooks in ${file}`);
    if (backup)
        console.log(`Backup: ${backup}`);
    if (args.flags.remove !== true) {
        console.log(`Hook command: ${command}`);
        console.log('\nNext: restart Claude Code. Every session will now be captured to ~/.vibe-coding-mcp/sessions/.');
        console.log('Register the MCP server too (for /daily-vibe-log, muse_digest, publishing):');
        console.log('  claude mcp add vibe-coding-mcp -- npx -y vibe-coding-mcp');
    }
}
async function runDoctor() {
    logger.setLevel('error');
    console.log(`vibe-coding-mcp doctor (v${pkg.version}, node ${process.version})\n`);
    // 1. Hooks
    console.log('Claude Code hooks');
    for (const scope of ['global', 'project', 'local']) {
        const file = settingsPathFor(scope);
        try {
            const s = await readSettings(file);
            const st = hooksInstalled(s);
            if (st.stop || st.sessionEnd)
                ok(`${scope}: ${file} — Stop=${st.stop ? 'yes' : 'no'}, SessionEnd=${st.sessionEnd ? 'yes' : 'no'}`);
            else
                info(`${scope}: ${file} — not installed`);
        }
        catch (err) {
            warn(`${scope}: ${file} — unreadable (${err.message})`);
        }
    }
    const anyGlobal = hooksInstalled(await readSettings(settingsPathFor('global')).catch(() => ({})));
    const anyProject = hooksInstalled(await readSettings(settingsPathFor('project')).catch(() => ({})));
    const anyLocal = hooksInstalled(await readSettings(settingsPathFor('local')).catch(() => ({})));
    if (![anyGlobal, anyProject, anyLocal].some((s) => s.stop || s.sessionEnd)) {
        warn('No hooks installed — run: npx vibe-coding-mcp init');
    }
    // 2. Transcripts
    console.log('\nClaude Code transcripts');
    const projDir = path.join(claudeProjectsDir(), projectSlug(process.cwd()));
    const transcripts = await listTranscripts(process.cwd());
    if (transcripts.length)
        ok(`${transcripts.length} transcript(s) for ${process.cwd()} (newest ${transcripts[0].modifiedAt})`);
    else
        info(`no transcripts yet for this directory (${projDir})`);
    // 3. Storage
    console.log('\nSession store');
    try {
        const { sessions, total } = await listSessions({ limit: 5 });
        const captured = sessions.filter((s) => s.metadata?.source === 'claude-code');
        ok(`${total} session(s) stored under ${STORAGE_ROOT}`);
        if (captured.length)
            info(`latest auto-capture: "${captured[0].title}" at ${captured[0].updatedAt}`);
    }
    catch (err) {
        warn(`storage error: ${err.message}`);
    }
    // 4. Hook log
    try {
        const log = await fs.readFile(HOOK_LOG, 'utf-8');
        const lines = log.trim().split('\n');
        const last = JSON.parse(lines[lines.length - 1]);
        ok(`last hook run: ${last.at} (${last.event} → ${last.status}${last.error ? `: ${last.error}` : ''})`);
    }
    catch {
        info('hook has not run yet (no hook.log). Edit a file in a Claude Code session, then re-run doctor.');
    }
    // 5. Platforms
    console.log('\nPublishing platforms');
    const cfg = validateConfiguration();
    for (const p of cfg.platforms) {
        if (p.configured)
            ok(`${p.platform}`);
        else
            info(`${p.platform}: missing ${p.missing.join(', ') || 'optional env'}`);
    }
    console.log('');
}
function printHelp() {
    console.log(`vibe-coding-mcp v${pkg.version}

Usage:
  vibe-coding-mcp                 start the MCP server (stdio)
  vibe-coding-mcp init            install Claude Code Stop + SessionEnd hooks (~/.claude/settings.json)
      --project | --local         write .claude/settings.json | .claude/settings.local.json instead
      --dry-run | --print         show the merged file | print only the hooks block
      --remove                    uninstall the hooks
      --command "<cmd>"           override the hook command
  vibe-coding-mcp hook            (used by the hooks) read hook JSON on stdin, capture transcript
  vibe-coding-mcp capture         capture the newest transcript for the cwd
      --transcript <path>         capture a specific .jsonl
      --all                       capture every transcript for the cwd
      --cwd <dir> --dry-run --json
  vibe-coding-mcp doctor          diagnose hooks, transcripts, storage, platforms
  vibe-coding-mcp --version | --help
`);
}
// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
    const args = parseArgs(process.argv.slice(2));
    const cmd = args.command;
    if (cmd === '--version' || cmd === '-v' || args.flags.version === true) {
        console.log(pkg.version);
        return;
    }
    if (cmd === '--help' || cmd === '-h' || cmd === 'help') {
        printHelp();
        return;
    }
    switch (cmd) {
        case 'hook':
            await runHook(args);
            return;
        case 'capture':
            await runCapture(args);
            return;
        case 'init':
            await runInit(args);
            return;
        case 'doctor':
            await runDoctor();
            return;
        case 'serve':
        case 'stdio': {
            const { startStdioServer } = await import('./stdio.js');
            await startStdioServer();
            return;
        }
        default:
            console.error(`Unknown command: ${cmd}\n`);
            printHelp();
            process.exitCode = 1;
    }
}
main().catch((err) => {
    console.error('[vibe-coding-mcp] fatal:', err instanceof Error ? err.message : err);
    // Hook mode must never block Claude; everything else reports failure.
    process.exitCode = process.argv[2] === 'hook' ? 0 : 1;
});
//# sourceMappingURL=cli.js.map