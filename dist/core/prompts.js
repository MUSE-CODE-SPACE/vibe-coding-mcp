/**
 * MCP Prompts — pre-baked, parameterized workflows that compose multiple
 * vibe-coding tools into a single user-facing slash command. Surfaced by
 * Claude UI in the `/`-menu.
 *
 * Each prompt returns a sequence of messages that the LLM should follow,
 * referencing the appropriate `muse_*` tools.
 */
const PROMPTS = [
    {
        descriptor: {
            name: 'daily-vibe-log',
            description: 'Generate a daily vibe coding log summarizing today\'s captured sessions, code contexts, and design decisions.',
            arguments: [
                {
                    name: 'date',
                    description: 'ISO date (YYYY-MM-DD). Defaults to today.',
                    required: false,
                },
                {
                    name: 'language',
                    description: 'Output language: `en` or `ko`. Defaults to `en`.',
                    required: false,
                },
            ],
        },
        build: (args) => {
            const date = args.date || new Date().toISOString().slice(0, 10);
            const language = (args.language || 'en').toLowerCase() === 'ko' ? 'ko' : 'en';
            return {
                description: `Daily vibe log for ${date} (${language}).`,
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: [
                                `Compile a daily vibe coding log for ${date}.`,
                                '',
                                'Workflow:',
                                `1. Call \`muse_session_history\` with action=\"list\" and filter to sessions whose updatedAt starts with \"${date}\".`,
                                '2. For each session, call `muse_session_history` with action=\"get\" to fetch full detail.',
                                '3. Call `muse_session_stats` with action=\"overview\" for productivity numbers.',
                                '4. Call `muse_create_session_log` with logType=\"daily\" passing the aggregated context.',
                                `5. Render the final log in ${language === 'ko' ? 'Korean' : 'English'}, grouping by tag and including code-block counts plus key design decisions.`,
                            ].join('\n'),
                        },
                    },
                ],
            };
        },
    },
    {
        descriptor: {
            name: 'document-session',
            description: 'Walk a user through documenting a captured vibe coding session — fetch it, extract design decisions, generate a dev document, and (optionally) publish.',
            arguments: [
                {
                    name: 'sessionId',
                    description: 'Stored session ID (from `muse_session_history` list/save).',
                    required: true,
                },
                {
                    name: 'documentType',
                    description: 'README, DESIGN, TUTORIAL, CHANGELOG, API, or ARCHITECTURE. Defaults to DESIGN.',
                    required: false,
                },
                {
                    name: 'platform',
                    description: 'Optional publish target: notion, github-wiki, obsidian, confluence, slack, discord. Omit to skip publish.',
                    required: false,
                },
            ],
        },
        build: (args) => {
            const sessionId = args.sessionId ?? '<sessionId>';
            const documentType = args.documentType || 'DESIGN';
            const platform = args.platform;
            return {
                description: `Document session ${sessionId} as a ${documentType}${platform ? ` and publish to ${platform}` : ''}.`,
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: [
                                `Document vibe coding session \`${sessionId}\` as a ${documentType}.`,
                                '',
                                'Workflow:',
                                `1. Call \`muse_session_history\` action=\"get\", sessionId=\"${sessionId}\". Read codeContexts + designDecisions.`,
                                '2. If designDecisions is empty, call `muse_summarize_design_decisions` on the conversationSummary fields.',
                                `3. Call \`muse_generate_dev_document\` with documentType=\"${documentType}\", passing designDecisions and codeContexts from step 1-2.`,
                                platform
                                    ? `4. Call \`muse_normalize_for_platform\` with platform=\"${platform}\", then \`muse_publish_document\` to push the result.`
                                    : '4. Return the generated Markdown to the user (no publish).',
                                '5. Summarize what was documented and where it was published.',
                            ].join('\n'),
                        },
                    },
                ],
            };
        },
    },
    {
        descriptor: {
            name: 'refactor-context',
            description: 'Extract the refactor-ready context from a session: the code that changed, the design decisions that drove the change, and AST analysis of the new code — ready to paste into a refactor PR description.',
            arguments: [
                {
                    name: 'sessionId',
                    description: 'Stored session ID.',
                    required: true,
                },
                {
                    name: 'language',
                    description: 'Code language hint for AST analysis (typescript, javascript, python, go).',
                    required: false,
                },
            ],
        },
        build: (args) => {
            const sessionId = args.sessionId ?? '<sessionId>';
            const language = args.language || 'typescript';
            return {
                description: `Extract refactor context from session ${sessionId}.`,
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: [
                                `Extract refactor context from session \`${sessionId}\`.`,
                                '',
                                'Workflow:',
                                `1. Call \`muse_session_history\` action=\"get\", sessionId=\"${sessionId}\".`,
                                `2. For each non-trivial code block, call \`muse_analyze_code\` with language=\"${language}\" and generateDiagrams=true to surface class/flowchart/dependency diagrams.`,
                                '3. Call `muse_git` action=\"diff\" for the related repo to attach the actual diff (if a repoPath is in session metadata).',
                                '4. Assemble a markdown report with sections: Motivation (from design decisions) / What changed (diff stat + diagrams) / Risks / Follow-ups.',
                                '5. Return the report verbatim so it can be pasted into a refactor PR description.',
                            ].join('\n'),
                        },
                    },
                ],
            };
        },
    },
];
export const PROMPT_DESCRIPTORS = PROMPTS.map((p) => p.descriptor);
export function findPrompt(name) {
    return PROMPTS.find((p) => p.descriptor.name === name);
}
export function buildPrompt(name, args) {
    const prompt = findPrompt(name);
    if (!prompt)
        return null;
    return prompt.build(args);
}
//# sourceMappingURL=prompts.js.map