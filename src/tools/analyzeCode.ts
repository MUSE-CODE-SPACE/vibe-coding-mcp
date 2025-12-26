/**
 * 코드 분석 도구
 * AST 파싱을 통한 고급 코드 분석 및 다이어그램 생성
 * v2.5: AI 기반 심층 분석 추가
 */

import { analyzeCode, CodeAnalysis } from '../utils/astParser.js';
import {
  generateClassDiagram,
  generateFlowchart,
  generateDiagramsFromAnalysis,
  generateDependencyGraph,
  generateArchitectureDiagram
} from '../utils/mermaidGenerator.js';
import { isAIAvailable, analyzeCodeWithAI } from '../core/ai.js';

export interface AnalyzeCodeInput {
  code: string;
  language?: string;
  filename?: string;
  generateDiagrams?: boolean;
  diagramTypes?: ('class' | 'flowchart' | 'dependency' | 'all')[];
  useAI?: boolean;
}

export interface AnalyzeCodeOutput {
  analysis: CodeAnalysis;
  diagrams?: { type: string; diagram: string }[];
  summary: {
    totalFunctions: number;
    totalClasses: number;
    totalImports: number;
    complexity: number;
    exportedItems: number;
    dependencies: string[];
  };
  insights: string[];
  usedAI: boolean;
  aiAnalysis?: {
    summary: string;
    issues: Array<{ type: string; severity: string; description: string; line?: number }>;
    suggestions: string[];
    metrics: Record<string, number | string>;
  };
}

export async function analyzeCodeTool(input: AnalyzeCodeInput): Promise<AnalyzeCodeOutput> {
  const { code, language, filename = 'unknown', generateDiagrams = true, diagramTypes = ['all'], useAI = false } = input;

  // AST 분석 수행
  const analysis = analyzeCode(code, language);

  // 요약 생성
  const summary = {
    totalFunctions: analysis.functions.length,
    totalClasses: analysis.classes.length,
    totalImports: analysis.imports.length,
    complexity: analysis.complexity,
    exportedItems: analysis.exports.length,
    dependencies: analysis.dependencies
  };

  // 인사이트 생성
  const insights: string[] = [];

  // 복잡도 분석
  if (analysis.complexity > 20) {
    insights.push(`High complexity (${analysis.complexity}): Consider breaking down into smaller functions`);
  } else if (analysis.complexity > 10) {
    insights.push(`Moderate complexity (${analysis.complexity}): Code is reasonably structured`);
  } else {
    insights.push(`Low complexity (${analysis.complexity}): Code is simple and easy to maintain`);
  }

  // 함수 분석
  const asyncFunctions = analysis.functions.filter(f => f.async);
  if (asyncFunctions.length > 0) {
    insights.push(`Found ${asyncFunctions.length} async function(s): ${asyncFunctions.map(f => f.name).join(', ')}`);
  }

  // 클래스 분석
  const exportedClasses = analysis.classes.filter(c => c.exported);
  if (exportedClasses.length > 0) {
    insights.push(`Exported ${exportedClasses.length} class(es): ${exportedClasses.map(c => c.name).join(', ')}`);
  }

  // 의존성 분석
  if (analysis.dependencies.length > 10) {
    insights.push(`High dependency count (${analysis.dependencies.length}): Consider reducing external dependencies`);
  }

  // 다이어그램 생성
  let diagrams: { type: string; diagram: string }[] | undefined;

  if (generateDiagrams) {
    diagrams = [];
    const shouldGenerate = (type: string) =>
      diagramTypes.includes('all') || diagramTypes.includes(type as any);

    if (shouldGenerate('class') && analysis.classes.length > 0) {
      diagrams.push({
        type: 'class',
        diagram: generateClassDiagram(analysis.classes)
      });
    }

    if (shouldGenerate('flowchart') && analysis.functions.length > 0) {
      diagrams.push({
        type: 'flowchart',
        diagram: generateFlowchart(analysis.functions)
      });
    }

    if (shouldGenerate('dependency') && analysis.imports.length > 0) {
      const depAnalyses = [{ filename, analysis }];
      diagrams.push({
        type: 'dependency',
        diagram: generateDependencyGraph(depAnalyses)
      });
    }
  }

  // AI 분석 (선택적)
  let aiAnalysis: AnalyzeCodeOutput['aiAnalysis'];
  let usedAI = false;

  if (useAI && isAIAvailable()) {
    try {
      aiAnalysis = await analyzeCodeWithAI(code, {
        language: language || analysis.language,
        analysisType: 'all',
        outputLanguage: 'en'
      });
      usedAI = true;

      // AI 인사이트를 기존 인사이트에 추가
      if (aiAnalysis.suggestions) {
        insights.push(...aiAnalysis.suggestions.map(s => `[AI] ${s}`));
      }
    } catch {
      // AI 분석 실패 시 무시하고 계속 진행
    }
  }

  return {
    analysis,
    diagrams,
    summary,
    insights,
    usedAI,
    aiAnalysis
  };
}

export const analyzeCodeSchema = {
  name: 'muse_analyze_code',
  description: 'Performs deep code analysis using AST parsing. Extracts functions, classes, imports, and generates Mermaid diagrams. Supports AI-powered analysis for quality insights, security issues, and improvement suggestions.',
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'The source code to analyze'
      },
      language: {
        type: 'string',
        enum: ['typescript', 'javascript', 'python', 'go'],
        description: 'Programming language (auto-detected if not provided)'
      },
      filename: {
        type: 'string',
        description: 'Optional filename for context'
      },
      generateDiagrams: {
        type: 'boolean',
        description: 'Generate Mermaid diagrams (default: true)'
      },
      diagramTypes: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['class', 'flowchart', 'dependency', 'all']
        },
        description: 'Types of diagrams to generate (default: all)'
      },
      useAI: {
        type: 'boolean',
        description: 'Enable AI-powered analysis for quality, security, and suggestions (default: false, requires ANTHROPIC_API_KEY)'
      }
    },
    required: ['code']
  }
};
