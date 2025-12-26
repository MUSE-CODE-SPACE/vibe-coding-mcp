import { Platform } from '../types/index.js';
export interface NormalizeForPlatformInput {
    document: string;
    platform: Platform;
    options?: {
        preserveLocalLinks?: boolean;
        convertImages?: boolean;
        addFrontmatter?: boolean;
        frontmatterData?: Record<string, string | string[]>;
        stripHtml?: boolean;
        convertTables?: boolean;
        addTags?: string[];
        convertCodeBlocks?: boolean;
        maxLineLength?: number;
    };
}
export interface NormalizeForPlatformOutput {
    normalizedDocument: string;
    platform: Platform;
    changes: string[];
    stats: {
        originalLength: number;
        normalizedLength: number;
        headingsCount: number;
        codeBlocksCount: number;
        linksCount: number;
        imagesCount: number;
    };
    warnings?: string[];
}
export declare function normalizeForPlatform(input: NormalizeForPlatformInput): NormalizeForPlatformOutput;
export declare const normalizeForPlatformSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            document: {
                type: string;
                description: string;
            };
            platform: {
                type: string;
                enum: string[];
                description: string;
            };
            options: {
                type: string;
                properties: {
                    preserveLocalLinks: {
                        type: string;
                        description: string;
                    };
                    convertImages: {
                        type: string;
                        description: string;
                    };
                    addFrontmatter: {
                        type: string;
                        description: string;
                    };
                    frontmatterData: {
                        type: string;
                        description: string;
                    };
                    stripHtml: {
                        type: string;
                        description: string;
                    };
                    convertTables: {
                        type: string;
                        description: string;
                    };
                    addTags: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description: string;
                    };
                    convertCodeBlocks: {
                        type: string;
                        description: string;
                    };
                    maxLineLength: {
                        type: string;
                        description: string;
                    };
                };
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=normalizeForPlatform.d.ts.map