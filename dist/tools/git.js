/**
 * Git Integration Tool (muse_git)
 * Provides git repository context for vibe coding sessions
 */
import { ToolError } from '../core/errors.js';
import { createToolLogger } from '../core/logger.js';
import { execGit, getRemoteUrl, validateRepoPath, } from '../utils/gitExecutor.js';
import { parseStatusPorcelainV2, parseLogOutput, parseDiffStat, parseBranchOutput, parseStashList, detectLanguage, inferCategory, calculateCommitImportance, } from '../utils/gitParsers.js';
import { getSession, updateSession } from '../core/sessionStorage.js';
const logger = createToolLogger('git');
// Action implementations
async function getStatus(repoPath, includeUntracked) {
    const args = ['status', '--porcelain=v2', '--branch'];
    if (includeUntracked) {
        args.push('--untracked-files=all');
    }
    else {
        args.push('--untracked-files=no');
    }
    const result = await execGit(args, { cwd: repoPath });
    if (result.exitCode !== 0) {
        throw new ToolError(`Git status failed: ${result.stderr}`, 'INTERNAL_ERROR');
    }
    const parsed = parseStatusPorcelainV2(result.stdout);
    return {
        branch: parsed.branch,
        upstream: parsed.upstream,
        ahead: parsed.ahead,
        behind: parsed.behind,
        staged: parsed.staged,
        unstaged: parsed.unstaged,
        untracked: parsed.untracked,
        conflicts: parsed.conflicts,
        isClean: parsed.staged.length === 0 &&
            parsed.unstaged.length === 0 &&
            parsed.conflicts.length === 0,
        isDetached: parsed.branch === '(detached)',
    };
}
async function getLog(repoPath, options) {
    const { limit = 20, author, since, until, grep, oneline = false, path } = options;
    const format = oneline ? '%H|%h|%an|%ae|%aI|%s' : '%H|%h|%an|%ae|%aI|%s|%b|END_COMMIT';
    const args = ['log', `--format=${format}`, `-n${limit}`, '--no-merges'];
    if (author)
        args.push(`--author=${author}`);
    if (since)
        args.push(`--since=${since}`);
    if (until)
        args.push(`--until=${until}`);
    if (grep)
        args.push(`--grep=${grep}`, '-i');
    if (path)
        args.push('--', path);
    const result = await execGit(args, { cwd: repoPath });
    if (result.exitCode !== 0) {
        throw new ToolError(`Git log failed: ${result.stderr}`, 'INTERNAL_ERROR');
    }
    return parseLogOutput(result.stdout, !oneline);
}
async function getDiff(repoPath, options) {
    const { diffType = 'all', fromRef, toRef, path, contextLines = 3, stat = true } = options;
    const args = ['diff'];
    if (fromRef && toRef) {
        args.push(fromRef, toRef);
    }
    else if (fromRef) {
        args.push(fromRef);
    }
    else if (diffType === 'staged') {
        args.push('--cached');
    }
    else if (diffType === 'all') {
        args.push('HEAD');
    }
    // unstaged is default (no extra args)
    args.push(`-U${contextLines}`);
    if (stat) {
        args.push('--stat');
    }
    if (path) {
        args.push('--', path);
    }
    const result = await execGit(args, { cwd: repoPath });
    // diff returns exit code 1 if there are differences, which is not an error
    if (result.exitCode !== 0 && result.exitCode !== 1) {
        throw new ToolError(`Git diff failed: ${result.stderr}`, 'INTERNAL_ERROR');
    }
    const parsed = parseDiffStat(result.stdout);
    return {
        files: parsed.files,
        totalAdditions: parsed.totalAdditions,
        totalDeletions: parsed.totalDeletions,
        patch: stat ? undefined : result.stdout,
    };
}
async function getBranches(repoPath, options) {
    const { includeRemote = true, verbose = false } = options;
    // Get current branch
    const currentResult = await execGit(['branch', '--show-current'], { cwd: repoPath });
    const current = currentResult.stdout.trim() || 'HEAD';
    const isDetached = current === 'HEAD' || current === '';
    // Get local branches
    const localFormat = '%(refname:short)|%(objectname:short)|%(upstream:short)|%(upstream:track,nobracket)';
    const localResult = await execGit(['branch', `--format=${localFormat}`], { cwd: repoPath });
    const local = parseBranchOutput(localResult.stdout, current);
    // Get remote branches
    let remote = [];
    if (includeRemote) {
        const remoteResult = await execGit(['branch', '-r', '--format=%(refname:short)|%(objectname:short)'], { cwd: repoPath });
        if (remoteResult.exitCode === 0) {
            remote = remoteResult.stdout
                .split('\n')
                .filter((l) => l.trim())
                .map((line) => {
                const [name, lastCommit] = line.split('|');
                return { name: name.trim(), lastCommit: lastCommit?.trim() };
            });
        }
    }
    return {
        current: isDetached ? `HEAD (detached)` : current,
        isDetached,
        local,
        remote,
    };
}
async function captureSnapshot(repoPath, options) {
    const { includeDiff = true, includeLog = true, logLimit = 10, includeStash = false } = options;
    const remoteUrl = await getRemoteUrl(repoPath);
    const status = await getStatus(repoPath, true);
    const branch = await getBranches(repoPath, { includeRemote: true });
    let recentCommits;
    if (includeLog) {
        recentCommits = await getLog(repoPath, { limit: logLimit });
    }
    let currentDiff;
    if (includeDiff && !status.isClean) {
        currentDiff = await getDiff(repoPath, { diffType: 'all', stat: true });
    }
    let stashes;
    if (includeStash) {
        const stashResult = await execGit(['stash', 'list', '--format=%gd|%s|%ci'], { cwd: repoPath });
        if (stashResult.exitCode === 0 && stashResult.stdout.trim()) {
            stashes = parseStashList(stashResult.stdout);
        }
    }
    return {
        timestamp: new Date().toISOString(),
        repository: {
            path: repoPath,
            remoteUrl: remoteUrl || undefined,
        },
        status,
        branch,
        recentCommits,
        currentDiff,
        stashes,
    };
}
async function extractDecisions(repoPath, options) {
    const { limit = 50, since, author, path, patterns, language = 'auto' } = options;
    // Default patterns for detecting design decisions
    const defaultPatterns = {
        en: [
            /(?:refactor|redesign|migrate|switch(?:ed)? to|implement|introduce)/i,
            /(?:architecture|design decision|tech debt)/i,
            /(?:breaking change|major change)/i,
            /\b(?:why|because|reason|rationale):/i,
            /feat:|fix:|refactor:|perf:|BREAKING CHANGE/i,
        ],
        ko: [
            /(?:리팩토링|재설계|마이그레이션|전환|도입)/,
            /(?:아키텍처|설계 결정|기술 부채)/,
            /\b(?:이유|배경|근거):/,
        ],
    };
    const commits = await getLog(repoPath, { limit, since, author, path });
    const decisions = [];
    for (const commit of commits) {
        const fullMessage = `${commit.message}\n${commit.body || ''}`;
        const lang = language === 'auto' ? detectLanguage(fullMessage) : language;
        const patternsToUse = patterns
            ? patterns.map((p) => new RegExp(p, 'i'))
            : [...defaultPatterns.en, ...defaultPatterns.ko];
        if (patternsToUse.some((p) => p.test(fullMessage))) {
            // Get files changed in this commit
            const filesResult = await execGit(['diff-tree', '--no-commit-id', '--name-only', '-r', commit.hash], { cwd: repoPath });
            const relatedFiles = filesResult.exitCode === 0
                ? filesResult.stdout
                    .split('\n')
                    .filter((f) => f.trim())
                    .slice(0, 10)
                : [];
            decisions.push({
                commitHash: commit.hash,
                shortHash: commit.shortHash,
                date: commit.date,
                author: commit.author,
                title: commit.message.split('\n')[0],
                description: commit.body || commit.message,
                category: inferCategory(fullMessage, lang),
                relatedFiles,
                importance: calculateCommitImportance(commit, fullMessage),
            });
        }
    }
    return decisions;
}
async function linkToSession(sessionId, repoPath, snapshotType) {
    const session = await getSession(sessionId);
    if (!session) {
        throw new ToolError(`Session not found: ${sessionId}`, 'NOT_FOUND', { sessionId });
    }
    const snapshot = await captureSnapshot(repoPath, {
        includeDiff: snapshotType === 'full',
        includeLog: snapshotType === 'full',
        logLimit: snapshotType === 'full' ? 10 : 3,
        includeStash: false,
    });
    const gitContext = snapshotType === 'full'
        ? snapshot
        : {
            linkedAt: new Date().toISOString(),
            repository: snapshot.repository,
            branch: snapshot.branch.current,
            commitHash: snapshot.recentCommits?.[0]?.hash,
            isClean: snapshot.status.isClean,
            modifiedCount: snapshot.status.unstaged.length + snapshot.status.staged.length,
        };
    await updateSession(sessionId, {
        metadata: {
            ...(session.metadata || {}),
            gitContext,
        },
    });
}
// Main tool function
export async function gitTool(input) {
    const startTime = Date.now();
    const { action } = input;
    logger.info(`Git ${action} requested`, { action, repoPath: input.repoPath });
    try {
        const repoPath = await validateRepoPath(input.repoPath);
        switch (action) {
            case 'status': {
                const status = await getStatus(repoPath, input.includeUntracked ?? true);
                return {
                    success: true,
                    action,
                    status,
                    repoPath,
                    executionTime: Date.now() - startTime,
                    message: status.isClean ? 'Working tree clean' : 'Changes detected',
                };
            }
            case 'log': {
                const commits = await getLog(repoPath, {
                    limit: input.limit,
                    author: input.author,
                    since: input.since,
                    until: input.until,
                    grep: input.grep,
                    oneline: input.oneline,
                    path: input.path,
                });
                return {
                    success: true,
                    action,
                    commits,
                    repoPath,
                    executionTime: Date.now() - startTime,
                    message: `Found ${commits.length} commits`,
                };
            }
            case 'diff': {
                const diff = await getDiff(repoPath, {
                    diffType: input.diffType,
                    fromRef: input.fromRef,
                    toRef: input.toRef,
                    path: input.path,
                    contextLines: input.contextLines,
                    stat: input.stat,
                });
                return {
                    success: true,
                    action,
                    diff,
                    repoPath,
                    executionTime: Date.now() - startTime,
                    message: `${diff.files.length} files changed, +${diff.totalAdditions} -${diff.totalDeletions}`,
                };
            }
            case 'branch': {
                const branch = await getBranches(repoPath, {
                    includeRemote: input.includeRemote,
                    verbose: input.verbose,
                });
                return {
                    success: true,
                    action,
                    branch,
                    repoPath,
                    executionTime: Date.now() - startTime,
                    message: `Current branch: ${branch.current}`,
                };
            }
            case 'snapshot': {
                const snapshot = await captureSnapshot(repoPath, {
                    includeDiff: input.includeDiff,
                    includeLog: input.includeLog,
                    logLimit: input.logLimit,
                    includeStash: input.includeStash,
                });
                return {
                    success: true,
                    action,
                    snapshot,
                    repoPath,
                    executionTime: Date.now() - startTime,
                    message: `Snapshot captured for ${snapshot.branch.current}`,
                };
            }
            case 'extractDecisions': {
                const decisions = await extractDecisions(repoPath, {
                    limit: input.limit,
                    since: input.since,
                    author: input.author,
                    path: input.path,
                    patterns: input.patterns,
                    language: input.language,
                });
                return {
                    success: true,
                    action,
                    decisions,
                    repoPath,
                    executionTime: Date.now() - startTime,
                    message: `Extracted ${decisions.length} design decisions`,
                };
            }
            case 'linkToSession': {
                if (!input.sessionId) {
                    throw new ToolError('sessionId is required for linkToSession action', 'VALIDATION_ERROR');
                }
                await linkToSession(input.sessionId, repoPath, input.snapshotType ?? 'minimal');
                return {
                    success: true,
                    action,
                    linkedSessionId: input.sessionId,
                    repoPath,
                    executionTime: Date.now() - startTime,
                    message: `Git context linked to session ${input.sessionId}`,
                };
            }
            default:
                throw new ToolError(`Unknown action: ${action}`, 'VALIDATION_ERROR');
        }
    }
    catch (error) {
        logger.error(`Git ${action} failed`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isNotRepo = errorMessage.includes('Not a git repository');
        const isNotInstalled = errorMessage.includes('git: command not found');
        return {
            success: false,
            action,
            repoPath: input.repoPath,
            executionTime: Date.now() - startTime,
            error: isNotRepo
                ? 'Not a git repository. Initialize with "git init" or specify a valid repository path.'
                : isNotInstalled
                    ? 'Git is not installed or not in PATH.'
                    : errorMessage,
        };
    }
}
// MCP Schema
export const gitSchema = {
    name: 'muse_git',
    description: 'Git integration for vibe coding sessions. Get repository status, commit history, diffs, branch info. Capture git snapshots for sessions and extract design decisions from commit messages.',
    inputSchema: {
        type: 'object',
        properties: {
            action: {
                type: 'string',
                enum: ['status', 'log', 'diff', 'branch', 'snapshot', 'extractDecisions', 'linkToSession'],
                description: 'Action: status (repo state), log (commit history), diff (changes), branch (branch info), snapshot (full context), extractDecisions (from commits), linkToSession (attach to session)',
            },
            repoPath: {
                type: 'string',
                description: 'Path to git repository. Defaults to current working directory.',
            },
            includeUntracked: {
                type: 'boolean',
                description: 'Include untracked files in status (default: true)',
            },
            limit: {
                type: 'number',
                description: 'Max commits to return for log/extractDecisions (default: 20, max: 500)',
            },
            author: {
                type: 'string',
                description: 'Filter commits by author name or email',
            },
            since: {
                type: 'string',
                description: 'Filter commits after date (e.g., "2024-01-01", "1 week ago")',
            },
            until: {
                type: 'string',
                description: 'Filter commits before date',
            },
            grep: {
                type: 'string',
                description: 'Search commit messages for keyword',
            },
            oneline: {
                type: 'boolean',
                description: 'Compact log format (default: false)',
            },
            diffType: {
                type: 'string',
                enum: ['staged', 'unstaged', 'all'],
                description: 'Diff type: staged, unstaged, or all changes (default: all)',
            },
            fromRef: {
                type: 'string',
                description: 'Source commit/branch/tag for diff',
            },
            toRef: {
                type: 'string',
                description: 'Target commit/branch/tag for diff',
            },
            path: {
                type: 'string',
                description: 'Filter by file or directory path',
            },
            contextLines: {
                type: 'number',
                description: 'Lines of context around changes (default: 3)',
            },
            stat: {
                type: 'boolean',
                description: 'Include stat summary in diff (default: true)',
            },
            includeRemote: {
                type: 'boolean',
                description: 'Include remote branches (default: true)',
            },
            verbose: {
                type: 'boolean',
                description: 'Include last commit info per branch (default: false)',
            },
            includeDiff: {
                type: 'boolean',
                description: 'Include current diff in snapshot (default: true)',
            },
            includeLog: {
                type: 'boolean',
                description: 'Include recent commits in snapshot (default: true)',
            },
            logLimit: {
                type: 'number',
                description: 'Commits to include in snapshot (default: 10)',
            },
            includeStash: {
                type: 'boolean',
                description: 'Include stash list in snapshot (default: false)',
            },
            patterns: {
                type: 'array',
                items: { type: 'string' },
                description: 'Custom regex patterns for detecting design decisions',
            },
            language: {
                type: 'string',
                enum: ['en', 'ko', 'auto'],
                description: 'Language for analysis (default: auto-detect)',
            },
            sessionId: {
                type: 'string',
                description: 'Session ID to link git context to (required for linkToSession)',
            },
            snapshotType: {
                type: 'string',
                enum: ['minimal', 'full'],
                description: 'Detail level when linking to session (default: minimal)',
            },
        },
        required: ['action'],
    },
};
//# sourceMappingURL=git.js.map