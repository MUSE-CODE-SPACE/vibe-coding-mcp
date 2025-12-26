/**
 * 코드 분석 도구
 * AST 파싱을 통한 고급 코드 분석 및 다이어그램 생성
 */
import { analyzeCode } from '../utils/astParser.js';
import { generateClassDiagram, generateFlowchart, generateDependencyGraph } from '../utils/mermaidGenerator.js';
export function analyzeCodeTool(input) {
    const { code, language, filename = 'unknown', generateDiagrams = true, diagramTypes = ['all'] } = input;
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
    const insights = [];
    // 복잡도 분석
    if (analysis.complexity > 20) {
        insights.push(`High complexity (${analysis.complexity}): Consider breaking down into smaller functions`);
    }
    else if (analysis.complexity > 10) {
        insights.push(`Moderate complexity (${analysis.complexity}): Code is reasonably structured`);
    }
    else {
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
    let diagrams;
    if (generateDiagrams) {
        diagrams = [];
        const shouldGenerate = (type) => diagramTypes.includes('all') || diagramTypes.includes(type);
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
    return {
        analysis,
        diagrams,
        summary,
        insights
    };
}
export const analyzeCodeSchema = {
    name: 'muse_analyze_code',
    description: 'Performs deep code analysis using AST parsing. Extracts functions, classes, imports, and generates Mermaid diagrams for visualization.',
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
            }
        },
        required: ['code']
    }
};
//# sourceMappingURL=analyzeCode.js.map