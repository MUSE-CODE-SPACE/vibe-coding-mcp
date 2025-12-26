/**
 * 코드 분석 도구
 * AST 파싱을 통한 고급 코드 분석 및 다이어그램 생성
 * v2.5: AI 기반 심층 분석 추가
 */
import { CodeAnalysis } from '../utils/astParser.js';
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
    diagrams?: {
        type: string;
        diagram: string;
    }[];
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
        issues: Array<{
            type: string;
            severity: string;
            description: string;
            line?: number;
        }>;
        suggestions: string[];
        metrics: Record<string, number | string>;
    };
}
export declare function analyzeCodeTool(input: AnalyzeCodeInput): Promise<AnalyzeCodeOutput>;
export declare const analyzeCodeSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            code: {
                type: string;
                description: string;
            };
            language: {
                type: string;
                enum: string[];
                description: string;
            };
            filename: {
                type: string;
                description: string;
            };
            generateDiagrams: {
                type: string;
                description: string;
            };
            diagramTypes: {
                type: string;
                items: {
                    type: string;
                    enum: string[];
                };
                description: string;
            };
            useAI: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=analyzeCode.d.ts.map