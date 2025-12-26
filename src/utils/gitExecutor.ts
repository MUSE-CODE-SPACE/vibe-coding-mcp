/**
 * Git command execution utility using spawn for security
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { ToolError } from '../core/errors.js';

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
export async function execGit(
  args: string[],
  options: GitExecOptions = {}
): Promise<GitExecResult> {
  const { cwd = process.cwd(), timeout = 30000, env = {} } = options;

  return new Promise((resolve, reject) => {
    const proc = spawn('git', args, {
      cwd,
      env: {
        ...process.env,
        ...env,
        GIT_TERMINAL_PROMPT: '0',
        LC_ALL: 'C.UTF-8',
      },
      timeout,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 0 });
    });

    proc.on('error', (err) => {
      reject(
        new ToolError(`Failed to execute git: ${err.message}`, 'INTERNAL_ERROR', {
          args,
          cwd,
        })
      );
    });
  });
}

/**
 * Check if directory is a git repository
 */
export async function isGitRepository(repoPath: string): Promise<boolean> {
  try {
    const result = await execGit(['rev-parse', '--git-dir'], { cwd: repoPath });
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * Get repository root path
 */
export async function getRepoRoot(repoPath: string): Promise<string | null> {
  try {
    const result = await execGit(['rev-parse', '--show-toplevel'], { cwd: repoPath });
    if (result.exitCode === 0) {
      return result.stdout.trim();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get remote URL for origin
 */
export async function getRemoteUrl(repoPath: string): Promise<string | null> {
  try {
    const result = await execGit(['remote', 'get-url', 'origin'], { cwd: repoPath });
    if (result.exitCode === 0) {
      return result.stdout.trim();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate and resolve repository path
 */
export async function validateRepoPath(inputPath?: string): Promise<string> {
  const repoPath = inputPath ? path.resolve(inputPath) : process.cwd();

  const isRepo = await isGitRepository(repoPath);
  if (!isRepo) {
    throw new ToolError(
      `Not a git repository: ${repoPath}. Initialize with "git init" or specify a valid repository path.`,
      'VALIDATION_ERROR',
      { path: repoPath }
    );
  }

  return repoPath;
}
