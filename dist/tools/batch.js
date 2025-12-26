/**
 * Batch Operations Tool (v2.12)
 * Executes multiple tool operations in batch with dependency management
 */
import { createToolLogger } from '../core/logger.js';
// Import all available tools for batch execution
import { collectCodeContext } from './collectCodeContext.js';
import { summarizeDesignDecisions } from './summarizeDesignDecisions.js';
import { generateDevDocument } from './generateDevDocument.js';
import { normalizeForPlatform } from './normalizeForPlatform.js';
import { publishDocument } from './publishDocument.js';
import { createSessionLog } from './createSessionLog.js';
import { analyzeCodeTool } from './analyzeCode.js';
import { sessionHistoryTool } from './sessionHistory.js';
import { exportSessionTool } from './exportSession.js';
import { projectProfileTool } from './projectProfile.js';
import { gitTool } from './git.js';
import { sessionStatsTool } from './sessionStats.js';
import { autoTagTool } from './autoTag.js';
import { templateTool } from './template.js';
const logger = createToolLogger('batch');
// In-memory job storage
const jobHistory = new Map();
const activeJobs = new Map();
// Tool registry mapping tool names to functions
// Wrap sync functions to return promises for consistent handling
const toolRegistry = {
    muse_collect_code_context: async (p) => collectCodeContext(p),
    muse_summarize_design_decisions: summarizeDesignDecisions,
    muse_generate_dev_document: async (p) => generateDevDocument(p),
    muse_normalize_for_platform: async (p) => normalizeForPlatform(p),
    muse_publish_document: publishDocument,
    muse_create_session_log: createSessionLog,
    muse_analyze_code: analyzeCodeTool,
    muse_session_history: sessionHistoryTool,
    muse_export_session: exportSessionTool,
    muse_project_profile: projectProfileTool,
    muse_git: gitTool,
    muse_session_stats: sessionStatsTool,
    muse_auto_tag: autoTagTool,
    muse_template: templateTool,
};
// Helper functions
function generateJobId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `batch_${timestamp}_${random}`;
}
function generateOpId(index, tool) {
    return `op_${index}_${tool.replace(/^muse_/, '')}`;
}
// Sort operations by dependencies using topological sort
function sortByDependencies(operations) {
    const opMap = new Map();
    const inDegree = new Map();
    const graph = new Map();
    // Initialize
    operations.forEach((op, index) => {
        const id = op.id || generateOpId(index, op.tool);
        opMap.set(id, { ...op, id });
        inDegree.set(id, 0);
        graph.set(id, []);
    });
    // Build graph
    operations.forEach((op, index) => {
        const id = op.id || generateOpId(index, op.tool);
        if (op.dependsOn) {
            op.dependsOn.forEach((depId) => {
                if (opMap.has(depId)) {
                    graph.get(depId).push(id);
                    inDegree.set(id, (inDegree.get(id) || 0) + 1);
                }
            });
        }
    });
    // Topological sort
    const queue = [];
    const sorted = [];
    inDegree.forEach((degree, id) => {
        if (degree === 0)
            queue.push(id);
    });
    while (queue.length > 0) {
        const current = queue.shift();
        sorted.push(opMap.get(current));
        graph.get(current)?.forEach((neighbor) => {
            const newDegree = (inDegree.get(neighbor) || 0) - 1;
            inDegree.set(neighbor, newDegree);
            if (newDegree === 0)
                queue.push(neighbor);
        });
    }
    // Check for cycles
    if (sorted.length !== operations.length) {
        throw new Error('Circular dependency detected in batch operations');
    }
    return sorted;
}
// Execute a single operation
async function executeOperation(operation, previousResults, timeout) {
    const startedAt = new Date().toISOString();
    const opId = operation.id || generateOpId(0, operation.tool);
    // Resolve any parameter references to previous results
    const resolvedParams = { ...operation.params };
    Object.entries(resolvedParams).forEach(([key, value]) => {
        if (typeof value === 'string' && value.startsWith('$')) {
            const refId = value.substring(1);
            if (previousResults.has(refId)) {
                resolvedParams[key] = previousResults.get(refId);
            }
        }
    });
    try {
        const toolFn = toolRegistry[operation.tool];
        if (!toolFn) {
            throw new Error(`Unknown tool: ${operation.tool}`);
        }
        // Execute with timeout
        const result = await Promise.race([
            toolFn(resolvedParams),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timeout')), timeout)),
        ]);
        const completedAt = new Date().toISOString();
        const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();
        return {
            id: opId,
            tool: operation.tool,
            status: 'completed',
            result,
            startedAt,
            completedAt,
            duration,
        };
    }
    catch (error) {
        const completedAt = new Date().toISOString();
        const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();
        return {
            id: opId,
            tool: operation.tool,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            startedAt,
            completedAt,
            duration,
        };
    }
}
// Main tool function
export async function batchTool(input) {
    const { action, operations, mode = 'sequential', stopOnError = true, timeout = 60000, jobId, limit = 20, status: filterStatus, includeResults = true, includeErrors = true, } = input;
    logger.info('Batch action requested', { action, mode, operationCount: operations?.length });
    try {
        switch (action) {
            case 'execute':
            case 'preview': {
                if (!operations || operations.length === 0) {
                    return {
                        success: false,
                        action,
                        error: 'operations are required',
                    };
                }
                // Validate operations
                for (const op of operations) {
                    if (!toolRegistry[op.tool]) {
                        return {
                            success: false,
                            action,
                            error: `Unknown tool: ${op.tool}`,
                        };
                    }
                }
                // For preview, just return the plan
                if (action === 'preview') {
                    const sortedOps = sortByDependencies(operations);
                    const previewResults = sortedOps.map((op, index) => ({
                        id: op.id || generateOpId(index, op.tool),
                        tool: op.tool,
                        status: 'pending',
                    }));
                    return {
                        success: true,
                        action,
                        results: previewResults,
                        message: `Preview: ${operations.length} operations will be executed in ${mode} mode`,
                    };
                }
                // Execute
                const batchJobId = generateJobId();
                const startedAt = new Date().toISOString();
                activeJobs.set(batchJobId, { cancelled: false });
                const job = {
                    id: batchJobId,
                    status: 'running',
                    operations: [],
                    mode,
                    startedAt,
                    successCount: 0,
                    failCount: 0,
                };
                jobHistory.set(batchJobId, job);
                const sortedOps = sortByDependencies(operations);
                const previousResults = new Map();
                if (mode === 'sequential') {
                    // Sequential execution
                    for (let i = 0; i < sortedOps.length; i++) {
                        const op = sortedOps[i];
                        // Check for cancellation
                        if (activeJobs.get(batchJobId)?.cancelled) {
                            job.status = 'cancelled';
                            break;
                        }
                        const result = await executeOperation(op, previousResults, timeout);
                        job.operations.push(result);
                        if (result.status === 'completed') {
                            job.successCount++;
                            previousResults.set(result.id, result.result);
                        }
                        else {
                            job.failCount++;
                            if (stopOnError) {
                                job.status = 'failed';
                                break;
                            }
                        }
                    }
                }
                else {
                    // Parallel execution (respecting dependencies)
                    const completed = new Set();
                    const pending = new Map();
                    sortedOps.forEach((op, index) => {
                        const id = op.id || generateOpId(index, op.tool);
                        pending.set(id, { ...op, id });
                    });
                    while (pending.size > 0 && !activeJobs.get(batchJobId)?.cancelled) {
                        // Find operations that can be executed (dependencies satisfied)
                        const ready = [];
                        pending.forEach((op, id) => {
                            const deps = op.dependsOn || [];
                            if (deps.every((d) => completed.has(d))) {
                                ready.push(op);
                            }
                        });
                        if (ready.length === 0 && pending.size > 0) {
                            // Deadlock or cycle
                            job.status = 'failed';
                            job.operations.push({
                                id: 'deadlock',
                                tool: 'batch',
                                status: 'failed',
                                error: 'Deadlock detected: unable to proceed with remaining operations',
                            });
                            break;
                        }
                        // Execute ready operations in parallel
                        const results = await Promise.all(ready.map((op) => executeOperation(op, previousResults, timeout)));
                        for (const result of results) {
                            job.operations.push(result);
                            completed.add(result.id);
                            pending.delete(result.id);
                            if (result.status === 'completed') {
                                job.successCount++;
                                previousResults.set(result.id, result.result);
                            }
                            else {
                                job.failCount++;
                                if (stopOnError) {
                                    job.status = 'failed';
                                    pending.clear();
                                    break;
                                }
                            }
                        }
                    }
                }
                // Finalize job
                if (job.status === 'running') {
                    job.status = job.failCount > 0 ? 'failed' : 'completed';
                }
                job.completedAt = new Date().toISOString();
                job.totalDuration = new Date(job.completedAt).getTime() - new Date(startedAt).getTime();
                activeJobs.delete(batchJobId);
                jobHistory.set(batchJobId, job);
                // Prepare response
                const responseResults = job.operations.map((op) => ({
                    ...op,
                    result: includeResults ? op.result : undefined,
                    error: includeErrors ? op.error : undefined,
                }));
                return {
                    success: job.status === 'completed',
                    action,
                    job: { ...job, operations: responseResults },
                    results: responseResults,
                    message: `Batch ${job.status}: ${job.successCount} succeeded, ${job.failCount} failed`,
                };
            }
            case 'status': {
                if (!jobId) {
                    return {
                        success: false,
                        action,
                        error: 'jobId is required',
                    };
                }
                const job = jobHistory.get(jobId);
                if (!job) {
                    return {
                        success: false,
                        action,
                        error: `Job not found: ${jobId}`,
                    };
                }
                return {
                    success: true,
                    action,
                    job,
                    message: `Job ${job.status}`,
                };
            }
            case 'cancel': {
                if (!jobId) {
                    return {
                        success: false,
                        action,
                        error: 'jobId is required',
                    };
                }
                const activeJob = activeJobs.get(jobId);
                if (!activeJob) {
                    return {
                        success: false,
                        action,
                        error: `Job not found or already completed: ${jobId}`,
                    };
                }
                activeJob.cancelled = true;
                return {
                    success: true,
                    action,
                    message: `Job ${jobId} cancellation requested`,
                };
            }
            case 'history': {
                let jobs = Array.from(jobHistory.values());
                // Filter by status if specified
                if (filterStatus) {
                    jobs = jobs.filter((j) => j.status === filterStatus);
                }
                // Sort by start time (newest first)
                jobs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
                // Paginate
                const total = jobs.length;
                const paginated = jobs.slice(0, limit);
                return {
                    success: true,
                    action,
                    jobs: paginated,
                    total,
                    message: `Found ${total} batch jobs`,
                };
            }
            default:
                return {
                    success: false,
                    action,
                    error: `Unknown action: ${action}`,
                };
        }
    }
    catch (error) {
        logger.error('Batch operation failed', error);
        return {
            success: false,
            action,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
// Schema for MCP registration
export const batchSchema = {
    name: 'muse_batch',
    description: 'Executes multiple tool operations in batch. Actions: execute (run batch), preview (plan without executing), status (check job status), cancel (stop running job), history (list past jobs). Supports sequential and parallel execution with dependency management.',
    inputSchema: {
        type: 'object',
        properties: {
            action: {
                type: 'string',
                enum: ['execute', 'preview', 'status', 'cancel', 'history'],
                description: 'Action to perform',
            },
            operations: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        tool: {
                            type: 'string',
                            description: 'Tool name to execute (e.g., muse_analyze_code)',
                        },
                        params: {
                            type: 'object',
                            description: 'Parameters to pass to the tool',
                        },
                        id: {
                            type: 'string',
                            description: 'Optional operation ID for dependency reference',
                        },
                        dependsOn: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'IDs of operations this depends on',
                        },
                    },
                    required: ['tool', 'params'],
                },
                description: 'Array of operations to execute',
            },
            mode: {
                type: 'string',
                enum: ['sequential', 'parallel'],
                description: 'Execution mode (default: sequential)',
            },
            stopOnError: {
                type: 'boolean',
                description: 'Stop batch on first error (default: true)',
            },
            timeout: {
                type: 'number',
                description: 'Timeout per operation in ms (default: 60000)',
            },
            jobId: {
                type: 'string',
                description: 'Job ID for status/cancel actions',
            },
            limit: {
                type: 'number',
                description: 'Limit for history action (default: 20)',
            },
            status: {
                type: 'string',
                enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
                description: 'Filter history by status',
            },
            includeResults: {
                type: 'boolean',
                description: 'Include operation results in response (default: true)',
            },
            includeErrors: {
                type: 'boolean',
                description: 'Include error details in response (default: true)',
            },
        },
        required: ['action'],
    },
};
//# sourceMappingURL=batch.js.map