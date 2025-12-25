import { PublishOptions, PublishResult } from '../types/index.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export async function publishToGitHubWiki(
  document: string,
  title: string,
  options?: Partial<PublishOptions>
): Promise<PublishResult> {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO;

    if (!githubToken) {
      throw new Error('GITHUB_TOKEN environment variable is not set');
    }

    if (!githubRepo) {
      throw new Error('GITHUB_REPO environment variable is not set (format: owner/repo)');
    }

    const [owner, repo] = githubRepo.split('/');
    if (!owner || !repo) {
      throw new Error('Invalid GITHUB_REPO format. Expected: owner/repo');
    }

    // 파일명 생성 (공백을 하이픈으로)
    const filename = options?.filename || `${title.replace(/\s+/g, '-')}.md`;
    const wikiPath = options?.wikiPath || '';

    // 임시 디렉토리에서 작업
    const tempDir = path.join(os.tmpdir(), `wiki-${Date.now()}`);

    try {
      // Wiki 레포 클론
      const wikiUrl = `https://${githubToken}@github.com/${owner}/${repo}.wiki.git`;
      await execAsync(`git clone --depth 1 ${wikiUrl} ${tempDir}`);

      // 파일 경로 설정
      const filePath = wikiPath
        ? path.join(tempDir, wikiPath, filename)
        : path.join(tempDir, filename);

      // 디렉토리 생성 (필요시)
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // 파일 쓰기
      await fs.writeFile(filePath, document, 'utf-8');

      // Git 커밋 및 푸시
      await execAsync(`cd ${tempDir} && git add -A`);
      await execAsync(`cd ${tempDir} && git config user.email "mcp@vibe-coding.local"`);
      await execAsync(`cd ${tempDir} && git config user.name "Vibe Coding MCP"`);
      await execAsync(`cd ${tempDir} && git commit -m "Update: ${title}" --allow-empty`);
      await execAsync(`cd ${tempDir} && git push origin master || git push origin main`);

      // 임시 디렉토리 정리
      await fs.rm(tempDir, { recursive: true, force: true });

      // Wiki URL 생성
      const wikiPageName = filename.replace('.md', '');
      const wikiUrl2 = `https://github.com/${owner}/${repo}/wiki/${wikiPageName}`;

      return {
        success: true,
        platform: 'github-wiki',
        url: wikiUrl2
      };
    } catch (gitError) {
      // 정리 시도
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch { }

      throw gitError;
    }
  } catch (error) {
    return {
      success: false,
      platform: 'github-wiki',
      error: error instanceof Error ? error.message : 'Failed to publish to GitHub Wiki'
    };
  }
}
