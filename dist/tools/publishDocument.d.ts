import { Platform, PublishOptions, PublishResult } from '../types/index.js';
export interface PublishDocumentInput {
    document: string;
    title: string;
    platform: Platform;
    options?: Partial<PublishOptions>;
}
export interface PublishDocumentOutput {
    result: PublishResult;
}
export declare function publishDocument(input: PublishDocumentInput): Promise<PublishDocumentOutput>;
export declare const publishDocumentSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            document: {
                type: string;
                description: string;
            };
            title: {
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
                    parentPageId: {
                        type: string;
                        description: string;
                    };
                    wikiPath: {
                        type: string;
                        description: string;
                    };
                    vaultPath: {
                        type: string;
                        description: string;
                    };
                    filename: {
                        type: string;
                        description: string;
                    };
                };
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=publishDocument.d.ts.map