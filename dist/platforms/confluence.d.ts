/**
 * Confluence 발행 플랫폼
 */
import { PublishOptions, PublishResult } from '../types/index.js';
export interface ConfluenceConfig {
    baseUrl: string;
    username: string;
    apiToken: string;
    spaceKey: string;
}
export declare function publishToConfluence(document: string, title: string, options?: Partial<PublishOptions>): Promise<PublishResult>;
export declare function updateConfluencePage(pageId: string, document: string, title: string): Promise<PublishResult>;
//# sourceMappingURL=confluence.d.ts.map