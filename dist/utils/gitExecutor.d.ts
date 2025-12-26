/**
 * Git command execution utility using spawn for security
 */
export interface GitExecResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}
export interface GitExecOptions {
    cwd?: string;
    timeout?: number;
    env?: Record<string, string>;
}
/**
 * Execute git command safely using spawn (no shell injection)
 */
export declare function execGit(args: string[], options?: GitExecOptions): Promise<GitExecResult>;
/**
 * Check if directory is a git repository
 */
export declare function isGitRepository(repoPath: string): Promise<boolean>;
/**
 * Get repository root path
 */
export declare function getRepoRoot(repoPath: string): Promise<string | null>;
/**
 * Get remote URL for origin
 */
export declare function getRemoteUrl(repoPath: string): Promise<string | null>;
/**
 * Validate and resolve repository path
 */
export declare function validateRepoPath(inputPath?: string): Promise<string>;
//# sourceMappingURL=gitExecutor.d.ts.map