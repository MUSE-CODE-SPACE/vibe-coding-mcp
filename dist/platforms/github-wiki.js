import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
/**
 * Executes a git command safely using spawn (no shell injection risk)
 */
function execGit(args, cwd) {
    return new Promise((resolve, reject) => {
        const proc = spawn('git', args, {
            cwd,
            env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
        });
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        proc.on('close', (code) => {
            if (code === 0) {
                resolve({ stdout, stderr });
            }
            else {
                reject(new Error(`Git command failed (code ${code}): ${stderr || stdout}`));
            }
        });
        proc.on('error', (err) => {
            reject(new Error(`Failed to spawn git: ${err.message}`));
        });
    });
}
/**
 * Sanitizes filename to prevent path traversal
 */
function sanitizeFilename(filename) {
    return filename
        .replace(/\.\./g, '')
        .replace(/[<>:"/\\|?*]/g, '-')
        .replace(/\s+/g, '-')
        .slice(0, 200);
}
export async function publishToGitHubWiki(document, title, options) {
    const tempDir = path.join(os.tmpdir(), `wiki-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    try {
        const githubToken = process.env.GITHUB_TOKEN;
        const githubRepo = process.env.GITHUB_REPO;
        if (!githubToken) {
            throw new Error('GITHUB_TOKEN environment variable is not set');
        }
        if (!githubRepo) {
            throw new Error('GITHUB_REPO environment variable is not set (format: owner/repo)');
        }
        // Validate repo format
        const repoMatch = githubRepo.match(/^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)$/);
        if (!repoMatch) {
            throw new Error('Invalid GITHUB_REPO format. Expected: owner/repo');
        }
        const [, owner, repo] = repoMatch;
        // Sanitize filename
        const safeTitle = sanitizeFilename(title);
        const filename = options?.filename || `${safeTitle}.md`;
        const wikiPath = options?.wikiPath ? sanitizeFilename(options.wikiPath) : '';
        // Clone wiki repo
        const wikiUrl = `https://${githubToken}@github.com/${owner}/${repo}.wiki.git`;
        await execGit(['clone', '--depth', '1', wikiUrl, tempDir]);
        // Set file path
        const filePath = wikiPath
            ? path.join(tempDir, wikiPath, filename)
            : path.join(tempDir, filename);
        // Ensure path is within tempDir (prevent path traversal)
        const resolvedPath = path.resolve(filePath);
        if (!resolvedPath.startsWith(path.resolve(tempDir))) {
            throw new Error('Invalid file path: path traversal detected');
        }
        // Create directory if needed
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        // Write file
        await fs.writeFile(filePath, document, 'utf-8');
        // Git operations
        await execGit(['add', '-A'], tempDir);
        await execGit(['config', 'user.email', 'mcp@vibe-coding.local'], tempDir);
        await execGit(['config', 'user.name', 'Vibe Coding MCP'], tempDir);
        await execGit(['commit', '-m', `Update: ${safeTitle}`, '--allow-empty'], tempDir);
        // Try pushing to master, then main
        try {
            await execGit(['push', 'origin', 'master'], tempDir);
        }
        catch {
            await execGit(['push', 'origin', 'main'], tempDir);
        }
        // Generate wiki URL
        const wikiPageName = filename.replace('.md', '');
        const wikiViewUrl = `https://github.com/${owner}/${repo}/wiki/${encodeURIComponent(wikiPageName)}`;
        return {
            success: true,
            platform: 'github-wiki',
            url: wikiViewUrl
        };
    }
    catch (error) {
        return {
            success: false,
            platform: 'github-wiki',
            error: error instanceof Error ? error.message : 'Failed to publish to GitHub Wiki'
        };
    }
    finally {
        // Always cleanup temp directory
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
        catch {
            // Ignore cleanup errors
        }
    }
}
//# sourceMappingURL=github-wiki.js.map