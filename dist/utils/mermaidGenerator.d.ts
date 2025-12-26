/**
 * Mermaid 다이어그램 생성 유틸리티
 * 의존성 그래프, 플로우차트, 클래스 다이어그램 등 생성
 */
import { CodeAnalysis, ClassInfo, FunctionInfo } from './astParser.js';
export interface DiagramOptions {
    direction?: 'TB' | 'BT' | 'LR' | 'RL';
    theme?: 'default' | 'dark' | 'forest' | 'neutral';
    showPrivate?: boolean;
    maxNodes?: number;
}
export declare function generateDependencyGraph(analyses: {
    filename: string;
    analysis: CodeAnalysis;
}[], options?: DiagramOptions): string;
export declare function generateClassDiagram(classes: ClassInfo[], options?: DiagramOptions): string;
export declare function generateFlowchart(functions: FunctionInfo[], options?: DiagramOptions): string;
export declare function generateSequenceDiagram(participants: string[], interactions: {
    from: string;
    to: string;
    message: string;
    type?: 'sync' | 'async' | 'return';
}[]): string;
export declare function generateArchitectureDiagram(components: {
    name: string;
    type: 'service' | 'database' | 'api' | 'client' | 'queue';
}[], connections: {
    from: string;
    to: string;
    label?: string;
}[], options?: DiagramOptions): string;
export declare function generateStateDiagram(states: string[], transitions: {
    from: string;
    to: string;
    trigger?: string;
}[]): string;
export declare function generateGanttChart(title: string, tasks: {
    name: string;
    start: string;
    duration: string;
    section?: string;
}[]): string;
export declare function generateERDiagram(entities: {
    name: string;
    attributes: {
        name: string;
        type: string;
        pk?: boolean;
        fk?: boolean;
    }[];
}[], relationships: {
    from: string;
    to: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
    label?: string;
}[]): string;
export declare function generatePieChart(title: string, data: {
    label: string;
    value: number;
}[]): string;
export declare function generateTimeline(title: string, events: {
    period: string;
    events: string[];
}[]): string;
export declare function generateDiagramsFromAnalysis(analysis: CodeAnalysis, filename: string): {
    type: string;
    diagram: string;
}[];
//# sourceMappingURL=mermaidGenerator.d.ts.map