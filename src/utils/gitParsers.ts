/**
 * Git output parsing utilities
 */

// File status types
export type FileStatusType =
  | 'modified'
  | 'added'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'untracked'
  | 'ignored'
  | 'unmerged';

export interface GitFileStatus {
  path: string;
  status: FileStatusType;
  staged: boolean;
  oldPath?: string;
}

export interface ParsedStatus {
  branch: string;
  upstream?: string;
  ahead: number;
  behind: number;
  staged: GitFileStatus[];
  unstaged: GitFileStatus[];
  untracked: GitFileStatus[];
  conflicts: GitFileStatus[];
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  authorEmail: string;
  date: string;
  message: string;
  body?: string;
  files?: string[];
}

export interface DiffFileStat {
  path: string;
  additions: number;
  deletions: number;
  binary: boolean;
}

export interface ParsedDiff {
  files: DiffFileStat[];
  totalAdditions: number;
  totalDeletions: number;
}

export interface BranchInfo {
  name: string;
  current: boolean;
  upstream?: string;
  ahead?: number;
  behind?: number;
  lastCommit?: string;
  lastCommitDate?: string;
}

/**
 * Parse git status --porcelain=v2 --branch output
 */
export function parseStatusPorcelainV2(output: string): ParsedStatus {
  const lines = output.split('\n').filter((line) => line.length > 0);

  let branch = 'HEAD';
  let upstream: string | undefined;
  let ahead = 0;
  let behind = 0;
  const staged: GitFileStatus[] = [];
  const unstaged: GitFileStatus[] = [];
  const untracked: GitFileStatus[] = [];
  const conflicts: GitFileStatus[] = [];

  for (const line of lines) {
    // Branch header lines
    if (line.startsWith('# branch.oid')) {
      continue;
    }
    if (line.startsWith('# branch.head')) {
      branch = line.split(' ')[2] || 'HEAD';
      continue;
    }
    if (line.startsWith('# branch.upstream')) {
      upstream = line.split(' ')[2];
      continue;
    }
    if (line.startsWith('# branch.ab')) {
      const match = line.match(/\+(\d+) -(\d+)/);
      if (match) {
        ahead = parseInt(match[1], 10);
        behind = parseInt(match[2], 10);
      }
      continue;
    }

    // Untracked files
    if (line.startsWith('?')) {
      const path = line.slice(2);
      untracked.push({ path, status: 'untracked', staged: false });
      continue;
    }

    // Ignored files
    if (line.startsWith('!')) {
      continue;
    }

    // Changed entries (1 = ordinary, 2 = renamed/copied)
    if (line.startsWith('1') || line.startsWith('2')) {
      const parts = line.split('\t');
      const info = parts[0].split(' ');
      const xy = info[1]; // XY status codes
      const path = parts[parts.length - 1];
      const oldPath = parts.length > 2 ? parts[1] : undefined;

      const indexStatus = xy[0];
      const worktreeStatus = xy[1];

      // Staged changes
      if (indexStatus !== '.') {
        staged.push({
          path,
          status: mapStatusCode(indexStatus),
          staged: true,
          oldPath,
        });
      }

      // Unstaged changes
      if (worktreeStatus !== '.') {
        unstaged.push({
          path,
          status: mapStatusCode(worktreeStatus),
          staged: false,
        });
      }
      continue;
    }

    // Unmerged entries
    if (line.startsWith('u')) {
      const parts = line.split('\t');
      const path = parts[parts.length - 1];
      conflicts.push({ path, status: 'unmerged', staged: false });
    }
  }

  return { branch, upstream, ahead, behind, staged, unstaged, untracked, conflicts };
}

/**
 * Map git status code to FileStatusType
 */
function mapStatusCode(code: string): FileStatusType {
  switch (code) {
    case 'M':
      return 'modified';
    case 'A':
      return 'added';
    case 'D':
      return 'deleted';
    case 'R':
      return 'renamed';
    case 'C':
      return 'copied';
    case 'U':
      return 'unmerged';
    default:
      return 'modified';
  }
}

/**
 * Parse git log with custom format
 * Format: %H|%h|%an|%ae|%aI|%s
 */
export function parseLogOutput(output: string, includeBody: boolean = false): GitCommit[] {
  if (!output.trim()) {
    return [];
  }

  const commits: GitCommit[] = [];
  const separator = includeBody ? 'END_COMMIT\n' : '\n';
  const entries = output.split(separator).filter((e) => e.trim());

  for (const entry of entries) {
    const lines = entry.trim().split('\n');
    if (lines.length === 0) continue;

    const firstLine = lines[0];
    const parts = firstLine.split('|');

    if (parts.length >= 6) {
      const commit: GitCommit = {
        hash: parts[0],
        shortHash: parts[1],
        author: parts[2],
        authorEmail: parts[3],
        date: parts[4],
        message: parts.slice(5).join('|'), // Handle | in message
      };

      if (includeBody && lines.length > 1) {
        commit.body = lines.slice(1).join('\n').trim();
      }

      commits.push(commit);
    }
  }

  return commits;
}

/**
 * Parse git diff --stat output
 */
export function parseDiffStat(output: string): ParsedDiff {
  const lines = output.split('\n');
  const files: DiffFileStat[] = [];
  let totalAdditions = 0;
  let totalDeletions = 0;

  for (const line of lines) {
    // Match file stat lines: " path | 10 ++---"
    const match = line.match(/^\s*(.+?)\s*\|\s*(\d+|Bin)/);
    if (match) {
      const path = match[1].trim();
      const isBinary = match[2] === 'Bin';

      let additions = 0;
      let deletions = 0;

      if (!isBinary) {
        const plusCount = (line.match(/\+/g) || []).length;
        const minusCount = (line.match(/-/g) || []).length;
        additions = plusCount;
        deletions = minusCount;
      }

      files.push({ path, additions, deletions, binary: isBinary });
      totalAdditions += additions;
      totalDeletions += deletions;
    }

    // Match summary line: " 3 files changed, 10 insertions(+), 5 deletions(-)"
    const summaryMatch = line.match(
      /(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/
    );
    if (summaryMatch) {
      totalAdditions = parseInt(summaryMatch[2] || '0', 10);
      totalDeletions = parseInt(summaryMatch[3] || '0', 10);
    }
  }

  return { files, totalAdditions, totalDeletions };
}

/**
 * Parse git branch output
 * Format: %(refname:short)|%(objectname:short)|%(upstream:short)|%(upstream:track,nobracket)
 */
export function parseBranchOutput(output: string, currentBranch: string): BranchInfo[] {
  const lines = output.split('\n').filter((l) => l.trim());
  const branches: BranchInfo[] = [];

  for (const line of lines) {
    const parts = line.split('|');
    if (parts.length < 2) continue;

    const name = parts[0].trim();
    const lastCommit = parts[1]?.trim();
    const upstream = parts[2]?.trim() || undefined;
    const trackInfo = parts[3]?.trim();

    let ahead: number | undefined;
    let behind: number | undefined;

    if (trackInfo) {
      const aheadMatch = trackInfo.match(/ahead (\d+)/);
      const behindMatch = trackInfo.match(/behind (\d+)/);
      if (aheadMatch) ahead = parseInt(aheadMatch[1], 10);
      if (behindMatch) behind = parseInt(behindMatch[1], 10);
    }

    branches.push({
      name,
      current: name === currentBranch,
      upstream,
      ahead,
      behind,
      lastCommit,
    });
  }

  return branches;
}

/**
 * Parse git stash list output
 * Format: stash@{0}|message|date
 */
export function parseStashList(output: string): Array<{ index: number; message: string; date: string }> {
  if (!output.trim()) {
    return [];
  }

  const lines = output.split('\n').filter((l) => l.trim());
  const stashes: Array<{ index: number; message: string; date: string }> = [];

  for (const line of lines) {
    const parts = line.split('|');
    if (parts.length >= 3) {
      const indexMatch = parts[0].match(/stash@\{(\d+)\}/);
      if (indexMatch) {
        stashes.push({
          index: parseInt(indexMatch[1], 10),
          message: parts[1],
          date: parts[2],
        });
      }
    }
  }

  return stashes;
}

/**
 * Detect language from text (simple heuristic)
 */
export function detectLanguage(text: string): 'en' | 'ko' {
  const koreanPattern = /[가-힣]/;
  return koreanPattern.test(text) ? 'ko' : 'en';
}

/**
 * Infer design decision category from text
 */
export function inferCategory(
  text: string,
  lang: 'en' | 'ko'
): 'architecture' | 'library' | 'pattern' | 'implementation' | 'other' {
  const patterns = {
    architecture: {
      en: /architecture|system design|infrastructure|microservice|monolith/i,
      ko: /아키텍처|시스템 설계|인프라|마이크로서비스/,
    },
    library: {
      en: /library|package|dependency|npm|framework|sdk/i,
      ko: /라이브러리|패키지|의존성|프레임워크/,
    },
    pattern: {
      en: /pattern|design pattern|singleton|factory|observer|mvc|mvvm/i,
      ko: /패턴|디자인 패턴|싱글톤|팩토리/,
    },
    implementation: {
      en: /implement|feature|refactor|fix|optimize|improve/i,
      ko: /구현|기능|리팩토링|수정|최적화|개선/,
    },
  };

  for (const [category, langPatterns] of Object.entries(patterns)) {
    if (langPatterns[lang].test(text)) {
      return category as 'architecture' | 'library' | 'pattern' | 'implementation';
    }
  }

  return 'other';
}

/**
 * Calculate commit importance based on content
 */
export function calculateCommitImportance(
  commit: GitCommit,
  fullMessage: string
): 'high' | 'medium' | 'low' {
  const highPatterns = /breaking|major|critical|important|architecture|migrate|security/i;
  const mediumPatterns = /refactor|redesign|feature|implement|add|update/i;

  if (highPatterns.test(fullMessage)) {
    return 'high';
  }
  if (mediumPatterns.test(fullMessage)) {
    return 'medium';
  }
  return 'low';
}
