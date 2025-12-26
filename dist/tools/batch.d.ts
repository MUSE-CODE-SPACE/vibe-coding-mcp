/**
 * Batch Operations Tool (v2.12)
 * Executes multiple tool operations in batch with dependency management
 */
import type { BatchInput } from '../core/schemas.js';
export type BatchAction = 'execute' | 'preview' | 'status' | 'cancel' | 'history';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
interface OperationResult {
    id: string;
    tool: string;
    status: JobStatus;
    result?: unknown;
    error?: string;
    startedAt?: string;
    completedAt?: string;
    duration?: number;
}
interface BatchJob {
    id: string;
    status: JobStatus;
    operations: OperationResult[];
    mode: 'sequential' | 'parallel';
    startedAt: string;
    completedAt?: string;
    totalDuration?: number;
    successCount: number;
    failCount: number;
}
export interface BatchOutput {
    success: boolean;
    action: BatchAction;
    job?: BatchJob;
    results?: OperationResult[];
    jobs?: BatchJob[];
    total?: number;
    message?: string;
    error?: string;
}
export declare function batchTool(input: BatchInput): Promise<BatchOutput>;
export declare const batchSchema: {
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
            operations: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        tool: {
                            type: string;
                            description: string;
                        };
                        params: {
                            type: string;
                            description: string;
                        };
                        id: {
                            type: string;
                            description: string;
                        };
                        dependsOn: {
                            type: string;
                            items: {
                                type: string;
                            };
                            description: string;
                        };
                    };
                    required: string[];
                };
                description: string;
            };
            mode: {
                type: string;
                enum: string[];
                description: string;
            };
            stopOnError: {
                type: string;
                description: string;
            };
            timeout: {
                type: string;
                description: string;
            };
            jobId: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            includeResults: {
                type: string;
                description: string;
            };
            includeErrors: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export {};
//# sourceMappingURL=batch.d.ts.map