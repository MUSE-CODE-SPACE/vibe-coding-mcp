import { SessionLog, CodeContext, DesignDecision, SessionLogOptions } from '../types/index.js';
export interface CreateSessionLogInput {
    title: string;
    summary: string;
    codeContexts?: CodeContext[];
    designDecisions?: DesignDecision[];
    duration?: number;
    tags?: string[];
    options?: SessionLogOptions;
}
export interface CreateSessionLogOutput {
    sessionLog: SessionLog;
    filePath?: string;
    content: string;
}
export declare function createSessionLog(input: CreateSessionLogInput): Promise<CreateSessionLogOutput>;
export declare const createSessionLogSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            title: {
                type: string;
                description: string;
            };
            summary: {
                type: string;
                description: string;
            };
            codeContexts: {
                type: string;
                description: string;
                items: {
                    type: string;
                };
            };
            designDecisions: {
                type: string;
                description: string;
                items: {
                    type: string;
                };
            };
            duration: {
                type: string;
                description: string;
            };
            tags: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            options: {
                type: string;
                properties: {
                    logType: {
                        type: string;
                        enum: string[];
                        description: string;
                    };
                    outputPath: {
                        type: string;
                        description: string;
                    };
                    format: {
                        type: string;
                        enum: string[];
                        description: string;
                    };
                };
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=createSessionLog.d.ts.map