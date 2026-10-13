/**
 * muse_capture_transcript — capture a Claude Code transcript into the
 * session store on demand (the same engine the `vibe-coding-mcp hook` CLI
 * uses, exposed as an MCP tool so the agent can say "save this session now"
 * even when no hook is installed).
 */
import { CaptureResult } from '../core/captureEngine.js';
export type CaptureTranscriptAction = 'capture' | 'preview' | 'list';
export interface CaptureTranscriptInput {
    action?: CaptureTranscriptAction;
    transcriptPath?: string;
    cwd?: string;
    all?: boolean;
    limit?: number;
    minPrompts?: number;
    maxFiles?: number;
    maxDecisions?: number;
    tags?: string[];
}
export interface CaptureTranscriptOutput {
    success: boolean;
    action: CaptureTranscriptAction;
    cwd?: string;
    results?: CaptureResult[];
    transcripts?: Array<{
        path: string;
        modifiedAt: string;
        sizeBytes: number;
    }>;
    message?: string;
    error?: string;
}
export declare function captureTranscriptTool(input: CaptureTranscriptInput): Promise<CaptureTranscriptOutput>;
export declare const captureTranscriptSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            action: {
                type: string;
                enum: string[];
                description: string;
            };
            transcriptPath: {
                type: string;
                description: string;
            };
            cwd: {
                type: string;
                description: string;
            };
            all: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            minPrompts: {
                type: string;
                description: string;
            };
            maxFiles: {
                type: string;
                description: string;
            };
            maxDecisions: {
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
        };
    };
};
//# sourceMappingURL=captureTranscript.d.ts.map