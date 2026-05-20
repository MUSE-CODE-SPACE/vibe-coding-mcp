/**
 * Shared tool registry — single source of truth for all 15 MCP tools.
 *
 * Both entry points (`src/index.ts` HTTP transport and `src/stdio.ts` stdio
 * transport) import from this module so they expose an identical capability
 * surface. Adding/removing a tool is a single-line change here.
 */
import { z } from 'zod';
/**
 * MCP-style tool definition object (the JSON-schema descriptor that ships
 * over the wire to clients via `tools/list`).
 */
export interface ToolDescriptor {
    name: string;
    description: string;
    inputSchema: unknown;
}
/**
 * A registered tool — pairs the public JSON-schema descriptor with the
 * server-side handler (which validates input via a Zod schema then dispatches
 * to the underlying tool implementation).
 */
export interface RegisteredTool {
    /** Descriptor returned by `tools/list`. */
    descriptor: ToolDescriptor;
    /** Zod schema used to validate `tools/call` arguments. */
    inputZodSchema: z.ZodTypeAny;
    /** Validated-input handler. Returns the tool's structured result object. */
    handler: (args: unknown) => unknown | Promise<unknown>;
}
/**
 * All 15 tools, in display order. Edit this array to add/remove/reorder
 * capabilities. The order here is the order clients see in `tools/list`.
 */
export declare const TOOL_REGISTRY: readonly RegisteredTool[];
/** All tool names exposed by the server. */
export declare function getToolNames(): string[];
/** All tool descriptors (for `tools/list`). */
export declare function getToolDescriptors(): ToolDescriptor[];
/** Look up a registered tool by its public name. */
export declare function findTool(name: string): RegisteredTool | undefined;
/**
 * Wraps a tool handler invocation into the MCP `tools/call` result envelope.
 * Used by the low-level transport adapter (kept for backward compatibility);
 * the high-level `McpServer.tool()` registration in `mcpServerFactory.ts`
 * uses the handler directly.
 */
export declare function callToolByName(name: string, args: unknown): Promise<{
    content: Array<{
        type: 'text';
        text: string;
    }>;
    isError?: boolean;
}>;
//# sourceMappingURL=toolRegistry.d.ts.map