/**
 * MCP Prompts — pre-baked, parameterized workflows that compose multiple
 * vibe-coding tools into a single user-facing slash command. Surfaced by
 * Claude UI in the `/`-menu.
 *
 * Each prompt returns a sequence of messages that the LLM should follow,
 * referencing the appropriate `muse_*` tools.
 */
export interface PromptArgument {
    name: string;
    description: string;
    required: boolean;
}
export interface PromptDescriptor {
    name: string;
    description: string;
    arguments: PromptArgument[];
}
export interface PromptMessage {
    role: 'user' | 'assistant';
    content: {
        type: 'text';
        text: string;
    };
}
export interface PromptResult {
    description: string;
    messages: PromptMessage[];
}
/**
 * All registered prompts. The descriptor block is returned by
 * `prompts/list`; the `build` function is invoked by `prompts/get`.
 */
interface PromptDefinition {
    descriptor: PromptDescriptor;
    build: (args: Record<string, string | undefined>) => PromptResult;
}
export declare const PROMPT_DESCRIPTORS: PromptDescriptor[];
export declare function findPrompt(name: string): PromptDefinition | undefined;
export declare function buildPrompt(name: string, args: Record<string, string | undefined>): PromptResult | null;
export {};
//# sourceMappingURL=prompts.d.ts.map