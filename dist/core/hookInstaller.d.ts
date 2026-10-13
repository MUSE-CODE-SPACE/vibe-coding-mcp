/**
 * Claude Code hook installer — writes the `Stop` + `SessionEnd` hooks that
 * invoke `vibe-coding-mcp hook` into a Claude Code settings file, merging
 * with whatever is already there and backing the file up first.
 */
export declare const HOOK_MARKER = "vibe-coding-mcp hook";
export interface HookHandler {
    type: 'command';
    command: string;
    timeout?: number;
    async?: boolean;
}
export interface HookGroup {
    matcher?: string;
    hooks: HookHandler[];
}
export interface ClaudeSettings {
    hooks?: Record<string, HookGroup[]>;
    mcpServers?: Record<string, unknown>;
    [key: string]: unknown;
}
export type SettingsScope = 'global' | 'project' | 'local';
export declare function settingsPathFor(scope: SettingsScope, cwd?: string): string;
/** The hook command. Prefers a globally-installed binary, falls back to npx. */
export declare function hookCommand(binaryOnPath: boolean): string;
/** Build the hook groups we install. */
export declare function buildHookGroups(command: string): Record<string, HookGroup[]>;
/**
 * Pure merge: returns a new settings object with our hooks present exactly
 * once per event. Existing unrelated hooks are preserved. A previously
 * installed vibe-coding hook (any command text containing the marker) is
 * replaced so re-running `init` upgrades the command.
 */
export declare function mergeHooks(settings: ClaudeSettings, command: string): {
    settings: ClaudeSettings;
    changed: boolean;
};
/** Remove our hooks (pure). */
export declare function removeHooks(settings: ClaudeSettings): {
    settings: ClaudeSettings;
    changed: boolean;
};
export declare function readSettings(file: string): Promise<ClaudeSettings>;
export declare function writeSettingsWithBackup(file: string, settings: ClaudeSettings): Promise<{
    backup?: string;
}>;
/** Does any event in the settings carry our hook? */
export declare function hooksInstalled(settings: ClaudeSettings): {
    stop: boolean;
    sessionEnd: boolean;
};
//# sourceMappingURL=hookInstaller.d.ts.map