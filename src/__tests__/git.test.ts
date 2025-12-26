import { gitTool } from '../tools/git.js';
import * as gitExecutor from '../utils/gitExecutor.js';
import {
  parseStatusPorcelainV2,
  parseLogOutput,
  parseDiffStat,
  parseBranchOutput,
} from '../utils/gitParsers.js';
import * as path from 'path';
import * as os from 'os';
import { promises as fs } from 'fs';

// Test with the actual vibe-coding-mcp repo
const TEST_REPO_PATH = path.resolve(process.cwd());

describe('gitTool', () => {
  describe('status action', () => {
    it('should return repository status', async () => {
      const result = await gitTool({
        action: 'status',
        repoPath: TEST_REPO_PATH,
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('status');
      expect(result.status).toBeDefined();
      expect(result.status?.branch).toBeDefined();
      expect(typeof result.status?.isClean).toBe('boolean');
      expect(Array.isArray(result.status?.staged)).toBe(true);
      expect(Array.isArray(result.status?.unstaged)).toBe(true);
    });

    it('should include untracked files by default', async () => {
      const result = await gitTool({
        action: 'status',
        repoPath: TEST_REPO_PATH,
        includeUntracked: true,
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.status?.untracked)).toBe(true);
    });
  });

  describe('log action', () => {
    it('should return commit history', async () => {
      const result = await gitTool({
        action: 'log',
        repoPath: TEST_REPO_PATH,
        limit: 5,
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('log');
      expect(result.commits).toBeDefined();
      expect(Array.isArray(result.commits)).toBe(true);
      expect(result.commits!.length).toBeLessThanOrEqual(5);

      if (result.commits!.length > 0) {
        const commit = result.commits![0];
        expect(commit.hash).toBeDefined();
        expect(commit.shortHash).toBeDefined();
        expect(commit.author).toBeDefined();
        expect(commit.date).toBeDefined();
        expect(commit.message).toBeDefined();
      }
    });

    it('should support oneline format', async () => {
      const result = await gitTool({
        action: 'log',
        repoPath: TEST_REPO_PATH,
        limit: 3,
        oneline: true,
      });

      expect(result.success).toBe(true);
      expect(result.commits).toBeDefined();
    });

    it('should filter by grep', async () => {
      const result = await gitTool({
        action: 'log',
        repoPath: TEST_REPO_PATH,
        limit: 10,
        grep: 'feat',
      });

      expect(result.success).toBe(true);
      // All returned commits should contain 'feat' in message
      if (result.commits && result.commits.length > 0) {
        result.commits.forEach((commit) => {
          expect(commit.message.toLowerCase()).toContain('feat');
        });
      }
    });
  });

  describe('diff action', () => {
    it('should return diff information', async () => {
      const result = await gitTool({
        action: 'diff',
        repoPath: TEST_REPO_PATH,
        diffType: 'all',
        stat: true,
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('diff');
      expect(result.diff).toBeDefined();
      expect(typeof result.diff?.totalAdditions).toBe('number');
      expect(typeof result.diff?.totalDeletions).toBe('number');
      expect(Array.isArray(result.diff?.files)).toBe(true);
    });

    it('should support staged diff', async () => {
      const result = await gitTool({
        action: 'diff',
        repoPath: TEST_REPO_PATH,
        diffType: 'staged',
      });

      expect(result.success).toBe(true);
      expect(result.diff).toBeDefined();
    });
  });

  describe('branch action', () => {
    it('should return branch information', async () => {
      const result = await gitTool({
        action: 'branch',
        repoPath: TEST_REPO_PATH,
        includeRemote: true,
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('branch');
      expect(result.branch).toBeDefined();
      expect(result.branch?.current).toBeDefined();
      expect(Array.isArray(result.branch?.local)).toBe(true);
    });

    it('should include remote branches', async () => {
      const result = await gitTool({
        action: 'branch',
        repoPath: TEST_REPO_PATH,
        includeRemote: true,
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.branch?.remote)).toBe(true);
    });
  });

  describe('snapshot action', () => {
    it('should capture complete git snapshot', async () => {
      const result = await gitTool({
        action: 'snapshot',
        repoPath: TEST_REPO_PATH,
        includeDiff: true,
        includeLog: true,
        logLimit: 5,
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('snapshot');
      expect(result.snapshot).toBeDefined();
      expect(result.snapshot?.timestamp).toBeDefined();
      expect(result.snapshot?.repository).toBeDefined();
      expect(result.snapshot?.status).toBeDefined();
      expect(result.snapshot?.branch).toBeDefined();
      expect(Array.isArray(result.snapshot?.recentCommits)).toBe(true);
    });

    it('should include stash when requested', async () => {
      const result = await gitTool({
        action: 'snapshot',
        repoPath: TEST_REPO_PATH,
        includeStash: true,
      });

      expect(result.success).toBe(true);
      // Stashes may or may not exist
      if (result.snapshot?.stashes) {
        expect(Array.isArray(result.snapshot.stashes)).toBe(true);
      }
    });
  });

  describe('extractDecisions action', () => {
    it('should extract design decisions from commits', async () => {
      const result = await gitTool({
        action: 'extractDecisions',
        repoPath: TEST_REPO_PATH,
        limit: 50,
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('extractDecisions');
      expect(result.decisions).toBeDefined();
      expect(Array.isArray(result.decisions)).toBe(true);

      if (result.decisions && result.decisions.length > 0) {
        const decision = result.decisions[0];
        expect(decision.commitHash).toBeDefined();
        expect(decision.title).toBeDefined();
        expect(decision.category).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(decision.importance);
      }
    });

    it('should filter by since date', async () => {
      const result = await gitTool({
        action: 'extractDecisions',
        repoPath: TEST_REPO_PATH,
        since: '1 month ago',
        limit: 20,
      });

      expect(result.success).toBe(true);
      expect(result.decisions).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle non-git directory gracefully', async () => {
      const nonGitPath = os.tmpdir();

      const result = await gitTool({
        action: 'status',
        repoPath: nonGitPath,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not a git repository');
    });

    it('should handle non-existent path', async () => {
      const result = await gitTool({
        action: 'status',
        repoPath: '/non/existent/path',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should require sessionId for linkToSession', async () => {
      const result = await gitTool({
        action: 'linkToSession',
        repoPath: TEST_REPO_PATH,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('sessionId is required');
    });
  });
});

describe('gitParsers', () => {
  describe('parseStatusPorcelainV2', () => {
    it('should parse branch info', () => {
      const output = `# branch.oid abc123
# branch.head main
# branch.upstream origin/main
# branch.ab +1 -0`;

      const result = parseStatusPorcelainV2(output);
      expect(result.branch).toBe('main');
      expect(result.upstream).toBe('origin/main');
      expect(result.ahead).toBe(1);
      expect(result.behind).toBe(0);
    });

    it('should parse untracked files', () => {
      const output = `# branch.head main
? new-file.ts
? another-file.js`;

      const result = parseStatusPorcelainV2(output);
      expect(result.untracked.length).toBe(2);
      expect(result.untracked[0].path).toBe('new-file.ts');
      expect(result.untracked[0].status).toBe('untracked');
    });

    it('should parse modified files', () => {
      const output = `# branch.head main
1 .M N... 100644 100644 100644 abc123 def456 src/index.ts`;

      const result = parseStatusPorcelainV2(output);
      expect(result.unstaged.length).toBe(1);
      expect(result.unstaged[0].status).toBe('modified');
    });
  });

  describe('parseLogOutput', () => {
    it('should parse log with body', () => {
      const output = `abc123|abc1|John|john@example.com|2024-01-01T00:00:00Z|feat: Add feature
This is the body
END_COMMIT
def456|def4|Jane|jane@example.com|2024-01-02T00:00:00Z|fix: Fix bug
Another body
END_COMMIT`;

      const result = parseLogOutput(output, true);
      expect(result.length).toBe(2);
      expect(result[0].hash).toBe('abc123');
      expect(result[0].author).toBe('John');
      expect(result[0].message).toBe('feat: Add feature');
      expect(result[0].body).toBe('This is the body');
    });

    it('should parse oneline format', () => {
      const output = `abc123|abc1|John|john@example.com|2024-01-01T00:00:00Z|feat: Add feature
def456|def4|Jane|jane@example.com|2024-01-02T00:00:00Z|fix: Fix bug`;

      const result = parseLogOutput(output, false);
      expect(result.length).toBe(2);
      expect(result[0].hash).toBe('abc123');
      expect(result[1].hash).toBe('def456');
    });
  });

  describe('parseDiffStat', () => {
    it('should parse diff stat output', () => {
      const output = ` src/index.ts | 10 ++++------
 src/utils.ts |  5 ++---
 2 files changed, 6 insertions(+), 9 deletions(-)`;

      const result = parseDiffStat(output);
      expect(result.files.length).toBe(2);
      expect(result.totalAdditions).toBe(6);
      expect(result.totalDeletions).toBe(9);
    });
  });
});
