/**
 * Git output parsing utilities
 */
export type FileStatusType = 'modified' | 'added' | 'deleted' | 'renamed' | 'copied' | 'untracked' | 'ignored' | 'unmerged';
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
export declare function parseStatusPorcelainV2(output: string): ParsedStatus;
/**
 * Parse git log with custom format
 * Format: %H|%h|%an|%ae|%aI|%s
 */
export declare function parseLogOutput(output: string, includeBody?: boolean): GitCommit[];
/**
 * Parse git diff --stat output
 */
export declare function parseDiffStat(output: string): ParsedDiff;
/**
 * Parse git branch output
 * Format: %(refname:short)|%(objectname:short)|%(upstream:short)|%(upstream:track,nobracket)
 */
export declare function parseBranchOutput(output: string, currentBranch: string): BranchInfo[];
/**
 * Parse git stash list output
 * Format: stash@{0}|message|date
 */
export declare function parseStashList(output: string): Array<{
    index: number;
    message: string;
    date: string;
}>;
/**
 * Detect language from text (simple heuristic)
 */
export declare function detectLanguage(text: string): 'en' | 'ko';
/**
 * Infer design decision category from text
 */
export declare function inferCategory(text: string, lang: 'en' | 'ko'): 'architecture' | 'library' | 'pattern' | 'implementation' | 'other';
/**
 * Calculate commit importance based on content
 */
export declare function calculateCommitImportance(commit: GitCommit, fullMessage: string): 'high' | 'medium' | 'low';
//# sourceMappingURL=gitParsers.d.ts.map