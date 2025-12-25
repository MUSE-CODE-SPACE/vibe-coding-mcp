import { PublishOptions, PublishResult } from '../types/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function publishToObsidian(
  document: string,
  title: string,
  options?: Partial<PublishOptions>
): Promise<PublishResult> {
  try {
    // Vault 경로 결정
    const vaultPath = options?.vaultPath || process.env.OBSIDIAN_VAULT_PATH;

    if (!vaultPath) {
      throw new Error('Obsidian vault path is required. Set OBSIDIAN_VAULT_PATH or provide vaultPath option.');
    }

    // Vault 존재 확인
    try {
      await fs.access(vaultPath);
    } catch {
      throw new Error(`Obsidian vault not found at: ${vaultPath}`);
    }

    // 파일명 생성
    const filename = options?.filename || `${sanitizeFilename(title)}.md`;

    // 파일 경로 설정
    const filePath = path.join(vaultPath, filename);

    // 디렉토리 생성 (필요시)
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // 파일 쓰기
    await fs.writeFile(filePath, document, 'utf-8');

    return {
      success: true,
      platform: 'obsidian',
      filePath: filePath
    };
  } catch (error) {
    return {
      success: false,
      platform: 'obsidian',
      error: error instanceof Error ? error.message : 'Failed to publish to Obsidian'
    };
  }
}

// 파일명에서 잘못된 문자 제거
function sanitizeFilename(filename: string): string {
  // Windows, macOS, Linux에서 공통으로 문제되는 문자 제거
  return filename
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}
