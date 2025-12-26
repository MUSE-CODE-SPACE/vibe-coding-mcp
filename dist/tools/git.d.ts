/**
 * Git Integration Tool (muse_git)
 * Provides git repository context for vibe coding sessions
 */
import { type GitFileStatus, type GitCommit, type BranchInfo } from '../utils/gitParsers.js';
export type GitAction = 'status' | 'log' | 'diff' | 'branch' | 'snapshot' | 'extractDecisions' | 'linkToSession';
export interface GitInput {
    action: GitAction;
    repoPath?: string;
    includeUntracked?: boolean;
    limit?: number;
    author?: string;
    since?: string;
    until?: string;
    grep?: string;
    oneline?: boolean;
    diffType?: 'staged' | 'unstaged' | 'all';
    fromRef?: string;
    toRef?: string;
    path?: string;
    contextLines?: number;
    stat?: boolean;
    includeRemote?: boolean;
    verbose?: boolean;
    includeDiff?: boolean;
    includeLog?: boolean;
    logLimit?: number;
    includeStash?: boolean;
    patterns?: string[];
    language?: 'en' | 'ko' | 'auto';
    sessionId?: string;
    snapshotType?: 'minimal' | 'full';
}
export interface GitStatusResult {
    branch: string;
    upstream?: string;
    ahead: number;
    behind: number;
    staged: GitFileStatus[];
    unstaged: GitFileStatus[];
    untracked: GitFileStatus[];
    conflicts: GitFileStatus[];
    isClean: boolean;
    isDetached: boolean;
}
export interface GitDiffResult {
    files: Array<{
        path: string;
        additions: number;
        deletions: number;
        binary: boolean;
    }>;
    totalAdditions: number;
    totalDeletions: number;
    patch?: string;
}
export interface GitBranchInfo {
    current: string;
    isDetached: boolean;
    local: BranchInfo[];
    remote: Array<{
        name: string;
        lastCommit?: string;
    }>;
}
export interface GitSnapshot {
    timestamp: string;
    repository: {
        path: string;
        remoteUrl?: string;
    };
    status: GitStatusResult;
    branch: GitBranchInfo;
    recentCommits?: GitCommit[];
    currentDiff?: GitDiffResult;
    stashes?: Array<{
        index: number;
        message: string;
        date: string;
    }>;
}
export interface GitDesignDecision {
    commitHash: string;
    shortHash: string;
    date: string;
    author: string;
    title: string;
    description: string;
    category: 'architecture' | 'library' | 'pattern' | 'implementation' | 'other';
    relatedFiles: string[];
    importance: 'high' | 'medium' | 'low';
}
export interface GitOutput {
    success: boolean;
    action: GitAction;
    status?: GitStatusResult;
    commits?: GitCommit[];
    diff?: GitDiffResult;
    branch?: GitBranchInfo;
    snapshot?: GitSnapshot;
    decisions?: GitDesignDecision[];
    linkedSessionId?: string;
    repoPath?: string;
    executionTime?: number;
    message?: string;
    error?: string;
}
export declare function gitTool(input: GitInput): Promise<GitOutput>;
export declare const gitSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            action: {
                type: string;
                enum: string[];
                description: string;
            };
            repoPath: {
                type: string;
                description: string;
            };
            includeUntracked: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            author: {
                type: string;
                description: string;
            };
            since: {
                type: string;
                description: string;
            };
            until: {
                type: string;
                description: string;
            };
            grep: {
                type: string;
                description: string;
            };
            oneline: {
                type: string;
                description: string;
            };
            diffType: {
                type: string;
                enum: string[];
                description: string;
            };
            fromRef: {
                type: string;
                description: string;
            };
            toRef: {
                type: string;
                description: string;
            };
            path: {
                type: string;
                description: string;
            };
            contextLines: {
                type: string;
                description: string;
            };
            stat: {
                type: string;
                description: string;
            };
            includeRemote: {
                type: string;
                description: string;
            };
            verbose: {
                type: string;
                description: string;
            };
            includeDiff: {
                type: string;
                description: string;
            };
            includeLog: {
                type: string;
                description: string;
            };
            logLimit: {
                type: string;
                description: string;
            };
            includeStash: {
                type: string;
                description: string;
            };
            patterns: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            language: {
                type: string;
                enum: string[];
                description: string;
            };
            sessionId: {
                type: string;
                description: string;
            };
            snapshotType: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=git.d.ts.map