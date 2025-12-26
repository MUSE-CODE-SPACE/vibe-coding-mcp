import { validatePathWithinDirectory, sanitizeFilename } from '../core/security.js';
import * as fs from 'fs/promises';
import * as path from 'path';
export async function publishToObsidian(document, title, options) {
    try {
        // Vault 경로 결정
        const vaultPath = options?.vaultPath || process.env.OBSIDIAN_VAULT_PATH;
        if (!vaultPath) {
            throw new Error('Obsidian vault path is required. Set OBSIDIAN_VAULT_PATH or provide vaultPath option.');
        }
        // Vault 존재 확인
        try {
            await fs.access(vaultPath);
        }
        catch {
            throw new Error(`Obsidian vault not found at: ${vaultPath}`);
        }
        // 파일명 생성 (sanitize to prevent path traversal)
        const rawFilename = options?.filename || `${title}.md`;
        const safeFilename = sanitizeFilename(rawFilename.replace(/\.md$/, '')) + '.md';
        // 파일 경로 설정
        const targetPath = path.join(vaultPath, safeFilename);
        // Validate path stays within vault directory (prevent path traversal)
        const filePath = validatePathWithinDirectory(targetPath, vaultPath);
        // 디렉토리 생성 (필요시)
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        // 파일 쓰기
        await fs.writeFile(filePath, document, 'utf-8');
        return {
            success: true,
            platform: 'obsidian',
            filePath: filePath
        };
    }
    catch (error) {
        return {
            success: false,
            platform: 'obsidian',
            error: error instanceof Error ? error.message : 'Failed to publish to Obsidian'
        };
    }
}
//# sourceMappingURL=obsidian.js.map