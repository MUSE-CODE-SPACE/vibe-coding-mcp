/**
 * AST 기반 코드 분석 유틸리티
 * 함수, 클래스, 의존성을 자동으로 추출
 */
export interface FunctionInfo {
    name: string;
    params: string[];
    returnType?: string;
    async: boolean;
    exported: boolean;
    lineNumber?: number;
    docstring?: string;
}
export interface ClassInfo {
    name: string;
    methods: FunctionInfo[];
    properties: PropertyInfo[];
    extends?: string;
    implements?: string[];
    exported: boolean;
    lineNumber?: number;
    docstring?: string;
}
export interface PropertyInfo {
    name: string;
    type?: string;
    visibility: 'public' | 'private' | 'protected';
    static: boolean;
}
export interface ImportInfo {
    source: string;
    imports: string[];
    isDefault: boolean;
    isNamespace: boolean;
}
export interface ExportInfo {
    name: string;
    type: 'function' | 'class' | 'variable' | 'type' | 'interface';
    isDefault: boolean;
}
export interface CodeAnalysis {
    language: string;
    functions: FunctionInfo[];
    classes: ClassInfo[];
    imports: ImportInfo[];
    exports: ExportInfo[];
    dependencies: string[];
    complexity: number;
    lineCount: number;
}
export declare function analyzeTypeScript(code: string): CodeAnalysis;
export declare function analyzePython(code: string): CodeAnalysis;
export declare function analyzeGo(code: string): CodeAnalysis;
export declare function analyzeCode(code: string, language?: string): CodeAnalysis;
//# sourceMappingURL=astParser.d.ts.map