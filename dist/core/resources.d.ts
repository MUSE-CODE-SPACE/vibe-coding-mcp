/**
 * MCP Resources — read-only contextual data exposed via `resources/list` and
 * `resources/read`. Resources let Claude UI surface vibe-coding state with
 * @-mentions / slash commands without the LLM having to call a tool first.
 *
 * Registered URIs:
 *   - `vibe-coding://sessions/list`        — list of captured sessions
 *   - `vibe-coding://sessions/{id}`        — full detail for one session (template)
 *   - `vibe-coding://config`               — current platform configuration
 */
export interface ResourceContent {
    uri: string;
    mimeType: string;
    text: string;
}
export interface ResourceDescriptor {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
}
/**
 * Static resources (fixed URI, returned by `resources/list`).
 */
export declare const STATIC_RESOURCE_DESCRIPTORS: ResourceDescriptor[];
/**
 * Resource templates — URIs with variables (RFC 6570). Listed separately
 * by `resources/templates/list`.
 */
export declare const RESOURCE_TEMPLATE_DESCRIPTORS: readonly [{
    readonly uriTemplate: "vibe-coding://sessions/{id}";
    readonly name: "session-detail";
    readonly description: "Full read-only detail of one captured session (code contexts, design decisions, metadata).";
    readonly mimeType: "application/json";
}];
/** Read the `sessions/list` resource. */
export declare function readSessionsList(uri: string): Promise<ResourceContent>;
/** Read a `sessions/{id}` resource. */
export declare function readSessionDetail(uri: string, sessionId: string): Promise<ResourceContent>;
/** Read the `config` resource. */
export declare function readConfig(uri: string): ResourceContent;
/**
 * Dispatch a `resources/read` call by URI. Returns `null` if the URI does
 * not match any registered resource (caller should surface a proper error).
 */
export declare function readResource(uri: string): Promise<ResourceContent | null>;
//# sourceMappingURL=resources.d.ts.map