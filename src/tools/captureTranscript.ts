/**
 * muse_capture_transcript — capture a Claude Code transcript into the
 * session store on demand (the same engine the `vibe-coding-mcp hook` CLI
 * uses, exposed as an MCP tool so the agent can say "save this session now"
 * even when no hook is installed).
 */

import { captureTranscript, captureLatestForCwd, CaptureResult } from '../core/captureEngine.js';
import { findLatestTranscript, listTranscripts, parseTranscriptFile, expandHome } from '../core/transcriptParser.js';

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
  transcripts?: Array<{ path: string; modifiedAt: string; sizeBytes: number }>;
  message?: string;
  error?: string;
}

export async function captureTranscriptTool(input: CaptureTranscriptInput): Promise<CaptureTranscriptOutput> {
  const action: CaptureTranscriptAction = input.action ?? 'capture';
  const cwd = expandHome(input.cwd ?? process.cwd());

  try {
    if (action === 'list') {
      const transcripts = await listTranscripts(cwd);
      return {
        success: true,
        action,
        cwd,
        transcripts: transcripts.slice(0, input.limit ?? 20),
        message: transcripts.length
          ? `Found ${transcripts.length} transcript(s) for ${cwd}`
          : `No Claude Code transcripts found for ${cwd}. Start a Claude Code session in that directory first.`,
      };
    }

    const common = {
      hookEvent: 'manual',
      cwd,
      dryRun: action === 'preview',
      minPrompts: input.minPrompts,
      maxFiles: input.maxFiles,
      maxDecisions: input.maxDecisions,
      extraTags: input.tags,
    };

    if (input.transcriptPath) {
      const resolved = expandHome(input.transcriptPath);
      // Validate it parses before capturing so errors surface clearly.
      await parseTranscriptFile(resolved, { maxTextChars: 10 });
      const result = await captureTranscript(resolved, common);
      return { success: true, action, cwd, results: [result], message: describe([result]) };
    }

    if (input.all) {
      const transcripts = await listTranscripts(cwd);
      const limited = transcripts.slice(0, input.limit ?? 50);
      const results: CaptureResult[] = [];
      for (const t of limited) {
        results.push(await captureTranscript(t.path, common));
      }
      return { success: true, action, cwd, results, message: describe(results) };
    }

    const latest = await findLatestTranscript(cwd);
    if (!latest) {
      return {
        success: false,
        action,
        cwd,
        error: `No Claude Code transcript found for ${cwd}. Pass transcriptPath explicitly or run inside a project that has a Claude Code history.`,
      };
    }
    const result = await captureLatestForCwd(cwd, common);
    return { success: true, action, cwd, results: result ? [result] : [], message: describe(result ? [result] : []) };
  } catch (error) {
    return { success: false, action, cwd, error: error instanceof Error ? error.message : String(error) };
  }
}

function describe(results: CaptureResult[]): string {
  if (!results.length) return 'Nothing captured.';
  const counts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  const parts = Object.entries(counts).map(([k, v]) => `${v} ${k}`);
  const first = results[0];
  return `${parts.join(', ')}. Latest: "${first.title}" — ${first.stats.prompts} prompts, ${first.stats.filesChanged} files, ${first.stats.designDecisions} decisions.`;
}

export const captureTranscriptSchema = {
  name: 'muse_capture_transcript',
  description:
    'Capture a Claude Code conversation transcript (~/.claude/projects/**/*.jsonl) into the vibe-coding session store: ' +
    'extracts user prompts, files written/edited (with code), shell commands, duration, and design decisions — no API key needed. ' +
    'Idempotent per Claude session (re-capturing updates the same stored session). ' +
    'Use action=capture to save the newest transcript for the current project, action=preview to see what would be saved, action=list to enumerate transcripts.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['capture', 'preview', 'list'],
        description: 'capture (default): save to session store. preview: parse only, return the session body. list: enumerate transcripts for cwd.',
      },
      transcriptPath: {
        type: 'string',
        description: 'Explicit path to a .jsonl transcript. If omitted, the newest transcript for cwd is used.',
      },
      cwd: {
        type: 'string',
        description: 'Project working directory used to locate transcripts (defaults to the server process cwd).',
      },
      all: {
        type: 'boolean',
        description: 'Capture every transcript for cwd (newest first, up to limit) instead of just the latest.',
      },
      limit: { type: 'number', description: 'Max transcripts for all=true or action=list (default 50 / 20).' },
      minPrompts: { type: 'number', description: 'Skip transcripts with fewer human prompts than this and no file changes (default 1).' },
      maxFiles: { type: 'number', description: 'Max changed files stored as code contexts (default 40).' },
      maxDecisions: { type: 'number', description: 'Max design decisions extracted (default 10).' },
      tags: { type: 'array', items: { type: 'string' }, description: 'Extra tags to attach to the captured session(s).' },
    },
  },
};
