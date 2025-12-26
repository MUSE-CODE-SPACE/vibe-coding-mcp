/**
 * Mermaid 다이어그램 생성 유틸리티
 * 의존성 그래프, 플로우차트, 클래스 다이어그램 등 생성
 */
// 의존성 그래프 생성
export function generateDependencyGraph(analyses, options = {}) {
    const { direction = 'LR', maxNodes = 50 } = options;
    const lines = [`flowchart ${direction}`];
    const nodes = new Set();
    const edges = [];
    for (const { filename, analysis } of analyses) {
        const nodeName = sanitizeNodeName(filename);
        nodes.add(nodeName);
        for (const imp of analysis.imports) {
            if (!imp.source.startsWith('.'))
                continue; // 외부 패키지 제외
            const targetName = sanitizeNodeName(imp.source);
            nodes.add(targetName);
            edges.push(`    ${nodeName} --> ${targetName}`);
        }
        if (nodes.size >= maxNodes)
            break;
    }
    // 노드 정의
    for (const node of nodes) {
        lines.push(`    ${node}[${node}]`);
    }
    // 엣지 추가
    lines.push(...edges);
    return lines.join('\n');
}
// 클래스 다이어그램 생성
export function generateClassDiagram(classes, options = {}) {
    const { showPrivate = false } = options;
    const lines = ['classDiagram'];
    for (const cls of classes) {
        // 클래스 정의
        lines.push(`    class ${cls.name} {`);
        // 속성
        for (const prop of cls.properties) {
            if (!showPrivate && prop.visibility === 'private')
                continue;
            const visibility = prop.visibility === 'private' ? '-' : prop.visibility === 'protected' ? '#' : '+';
            const staticPrefix = prop.static ? '$' : '';
            lines.push(`        ${visibility}${staticPrefix}${prop.name}${prop.type ? `: ${prop.type}` : ''}`);
        }
        // 메서드
        for (const method of cls.methods) {
            if (!showPrivate && method.name.startsWith('_'))
                continue;
            const asyncPrefix = method.async ? '<<async>> ' : '';
            lines.push(`        +${asyncPrefix}${method.name}()`);
        }
        lines.push('    }');
        // 상속 관계
        if (cls.extends) {
            lines.push(`    ${cls.extends} <|-- ${cls.name}`);
        }
        // 구현 관계
        if (cls.implements) {
            for (const impl of cls.implements) {
                lines.push(`    ${impl} <|.. ${cls.name}`);
            }
        }
    }
    return lines.join('\n');
}
// 플로우차트 생성 (함수 호출 흐름)
export function generateFlowchart(functions, options = {}) {
    const { direction = 'TB' } = options;
    const lines = [`flowchart ${direction}`];
    for (let i = 0; i < functions.length; i++) {
        const func = functions[i];
        const nodeName = sanitizeNodeName(func.name);
        const shape = func.async ? `${nodeName}{{${func.name}}}` : `${nodeName}[${func.name}]`;
        lines.push(`    ${shape}`);
        // 연결 (순차적)
        if (i > 0) {
            const prevName = sanitizeNodeName(functions[i - 1].name);
            lines.push(`    ${prevName} --> ${nodeName}`);
        }
    }
    return lines.join('\n');
}
// 시퀀스 다이어그램 생성
export function generateSequenceDiagram(participants, interactions) {
    const lines = ['sequenceDiagram'];
    // 참가자 정의
    for (const participant of participants) {
        lines.push(`    participant ${sanitizeNodeName(participant)} as ${participant}`);
    }
    lines.push('');
    // 상호작용
    for (const { from, to, message, type = 'sync' } of interactions) {
        const fromName = sanitizeNodeName(from);
        const toName = sanitizeNodeName(to);
        switch (type) {
            case 'async':
                lines.push(`    ${fromName} ->> ${toName}: ${message}`);
                break;
            case 'return':
                lines.push(`    ${fromName} -->> ${toName}: ${message}`);
                break;
            default:
                lines.push(`    ${fromName} -> ${toName}: ${message}`);
        }
    }
    return lines.join('\n');
}
// 아키텍처 다이어그램 생성
export function generateArchitectureDiagram(components, connections, options = {}) {
    const { direction = 'TB' } = options;
    const lines = [`flowchart ${direction}`];
    // 서브그래프로 레이어 구분
    const services = components.filter(c => c.type === 'service');
    const databases = components.filter(c => c.type === 'database');
    const apis = components.filter(c => c.type === 'api');
    const clients = components.filter(c => c.type === 'client');
    const queues = components.filter(c => c.type === 'queue');
    if (clients.length > 0) {
        lines.push('    subgraph Clients');
        for (const c of clients) {
            lines.push(`        ${sanitizeNodeName(c.name)}[${c.name}]`);
        }
        lines.push('    end');
    }
    if (apis.length > 0) {
        lines.push('    subgraph APIs');
        for (const c of apis) {
            lines.push(`        ${sanitizeNodeName(c.name)}{{${c.name}}}`);
        }
        lines.push('    end');
    }
    if (services.length > 0) {
        lines.push('    subgraph Services');
        for (const c of services) {
            lines.push(`        ${sanitizeNodeName(c.name)}[${c.name}]`);
        }
        lines.push('    end');
    }
    if (queues.length > 0) {
        lines.push('    subgraph Queues');
        for (const c of queues) {
            lines.push(`        ${sanitizeNodeName(c.name)}>>${c.name}]`);
        }
        lines.push('    end');
    }
    if (databases.length > 0) {
        lines.push('    subgraph Databases');
        for (const c of databases) {
            lines.push(`        ${sanitizeNodeName(c.name)}[(${c.name})]`);
        }
        lines.push('    end');
    }
    // 연결
    for (const conn of connections) {
        const from = sanitizeNodeName(conn.from);
        const to = sanitizeNodeName(conn.to);
        if (conn.label) {
            lines.push(`    ${from} -->|${conn.label}| ${to}`);
        }
        else {
            lines.push(`    ${from} --> ${to}`);
        }
    }
    return lines.join('\n');
}
// 상태 다이어그램 생성
export function generateStateDiagram(states, transitions) {
    const lines = ['stateDiagram-v2'];
    // 시작 상태
    if (states.length > 0) {
        lines.push(`    [*] --> ${sanitizeNodeName(states[0])}`);
    }
    // 전환
    for (const { from, to, trigger } of transitions) {
        const fromName = from === 'start' ? '[*]' : sanitizeNodeName(from);
        const toName = to === 'end' ? '[*]' : sanitizeNodeName(to);
        if (trigger) {
            lines.push(`    ${fromName} --> ${toName}: ${trigger}`);
        }
        else {
            lines.push(`    ${fromName} --> ${toName}`);
        }
    }
    return lines.join('\n');
}
// 간트 차트 생성
export function generateGanttChart(title, tasks) {
    const lines = [
        'gantt',
        `    title ${title}`,
        '    dateFormat YYYY-MM-DD'
    ];
    let currentSection = '';
    for (const task of tasks) {
        if (task.section && task.section !== currentSection) {
            currentSection = task.section;
            lines.push(`    section ${currentSection}`);
        }
        lines.push(`    ${task.name}: ${task.start}, ${task.duration}`);
    }
    return lines.join('\n');
}
// ER 다이어그램 생성
export function generateERDiagram(entities, relationships) {
    const lines = ['erDiagram'];
    // 엔티티 정의
    for (const entity of entities) {
        lines.push(`    ${entity.name} {`);
        for (const attr of entity.attributes) {
            const pk = attr.pk ? ' PK' : '';
            const fk = attr.fk ? ' FK' : '';
            lines.push(`        ${attr.type} ${attr.name}${pk}${fk}`);
        }
        lines.push('    }');
    }
    // 관계 정의
    const relationSymbols = {
        'one-to-one': '||--||',
        'one-to-many': '||--o{',
        'many-to-many': '}o--o{'
    };
    for (const rel of relationships) {
        const symbol = relationSymbols[rel.type];
        if (rel.label) {
            lines.push(`    ${rel.from} ${symbol} ${rel.to} : "${rel.label}"`);
        }
        else {
            lines.push(`    ${rel.from} ${symbol} ${rel.to} : ""`);
        }
    }
    return lines.join('\n');
}
// 파이 차트 생성
export function generatePieChart(title, data) {
    const lines = [
        'pie showData',
        `    title ${title}`
    ];
    for (const item of data) {
        lines.push(`    "${item.label}" : ${item.value}`);
    }
    return lines.join('\n');
}
// 타임라인 생성
export function generateTimeline(title, events) {
    const lines = [
        'timeline',
        `    title ${title}`
    ];
    for (const period of events) {
        lines.push(`    ${period.period}`);
        for (const event of period.events) {
            lines.push(`        : ${event}`);
        }
    }
    return lines.join('\n');
}
// 노드 이름 정규화 (Mermaid 호환)
function sanitizeNodeName(name) {
    return name
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/_+/g, '_')
        || 'node';
}
// 종합 다이어그램 생성 (코드 분석 결과로부터)
export function generateDiagramsFromAnalysis(analysis, filename) {
    const diagrams = [];
    // 클래스 다이어그램
    if (analysis.classes.length > 0) {
        diagrams.push({
            type: 'class',
            diagram: generateClassDiagram(analysis.classes)
        });
    }
    // 의존성 다이어그램
    if (analysis.imports.length > 0) {
        const depDiagram = generateDependencyDiagramFromImports(filename, analysis.imports);
        diagrams.push({
            type: 'dependency',
            diagram: depDiagram
        });
    }
    // 함수 플로우차트
    if (analysis.functions.length > 0) {
        diagrams.push({
            type: 'flowchart',
            diagram: generateFlowchart(analysis.functions)
        });
    }
    // 언어별 통계 파이차트
    diagrams.push({
        type: 'stats',
        diagram: generatePieChart('Code Composition', [
            { label: 'Functions', value: analysis.functions.length },
            { label: 'Classes', value: analysis.classes.length },
            { label: 'Imports', value: analysis.imports.length }
        ])
    });
    return diagrams;
}
function generateDependencyDiagramFromImports(filename, imports) {
    const lines = ['flowchart LR'];
    const mainNode = sanitizeNodeName(filename);
    lines.push(`    ${mainNode}[${filename}]`);
    for (const imp of imports) {
        const importNode = sanitizeNodeName(imp.source);
        lines.push(`    ${importNode}[${imp.source}]`);
        lines.push(`    ${mainNode} --> ${importNode}`);
    }
    return lines.join('\n');
}
//# sourceMappingURL=mermaidGenerator.js.map