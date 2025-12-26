import { codeBlockToMarkdown, designDecisionToMarkdown, formatDate } from '../utils/markdown.js';
const translations = {
    en: {
        overview: 'Overview',
        installation: 'Installation',
        usage: 'Usage',
        codeExamples: 'Code Examples',
        designDecisions: 'Design Decisions',
        features: 'Features',
        prerequisites: 'Prerequisites',
        gettingStarted: 'Getting Started',
        summary: 'Summary',
        apiReference: 'API Reference',
        faq: 'FAQ',
        contributing: 'Contributing',
        license: 'License',
        changelog: 'Changelog',
        added: 'Added',
        changed: 'Changed',
        fixed: 'Fixed',
        removed: 'Removed',
        tableOfContents: 'Table of Contents',
        parameters: 'Parameters',
        returns: 'Returns',
        step: 'Step'
    },
    ko: {
        overview: '개요',
        installation: '설치',
        usage: '사용법',
        codeExamples: '코드 예제',
        designDecisions: '설계 결정',
        features: '기능',
        prerequisites: '사전 요구사항',
        gettingStarted: '시작하기',
        summary: '요약',
        apiReference: 'API 레퍼런스',
        faq: 'FAQ',
        contributing: '기여하기',
        license: '라이선스',
        changelog: '변경 이력',
        added: '추가됨',
        changed: '변경됨',
        fixed: '수정됨',
        removed: '제거됨',
        tableOfContents: '목차',
        parameters: '매개변수',
        returns: '반환값',
        step: '단계'
    }
};
export function generateDevDocument(input) {
    const lang = input.language || 'en';
    const t = translations[lang];
    let document = '';
    const sections = [];
    switch (input.documentType) {
        case 'README':
            document = generateReadme(input, t, sections);
            break;
        case 'DESIGN':
            document = generateDesignDoc(input, t, sections);
            break;
        case 'TUTORIAL':
            document = generateTutorial(input, t, sections);
            break;
        case 'CHANGELOG':
            document = generateChangelog(input, t, sections);
            break;
        case 'API':
            document = generateApiDoc(input, t, sections);
            break;
        case 'ARCHITECTURE':
            document = generateArchitectureDoc(input, t, sections);
            break;
    }
    const wordCount = document.split(/\s+/).filter(w => w.length > 0).length;
    return {
        document,
        documentType: input.documentType,
        generatedAt: new Date().toISOString(),
        wordCount,
        sections
    };
}
function generateBadges(badges) {
    return badges
        .map(b => `![${b.label}](https://img.shields.io/badge/${encodeURIComponent(b.label)}-${encodeURIComponent(b.message)}-${b.color})`)
        .join(' ') + '\n\n';
}
function generateTableOfContents(sections, t) {
    let toc = `## ${t.tableOfContents}\n\n`;
    sections.forEach((section, index) => {
        const slug = section.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        toc += `${index + 1}. [${section}](#${slug})\n`;
    });
    return toc + '\n';
}
function generateReadme(input, t, sectionList) {
    const title = input.title || input.projectName || 'Project';
    let doc = `# ${title}\n\n`;
    // 배지
    if (input.badges && input.badges.length > 0) {
        doc += generateBadges(input.badges);
    }
    // 설명
    if (input.description) {
        doc += `${input.description}\n\n`;
    }
    // 목차를 위한 섹션 수집
    const sections = [t.overview];
    if (input.features)
        sections.push(t.features);
    sections.push(t.installation, t.usage);
    if (input.codeContexts?.length)
        sections.push(t.codeExamples);
    if (input.apiReference?.length)
        sections.push(t.apiReference);
    if (input.designDecisions?.length)
        sections.push(t.designDecisions);
    if (input.faq?.length)
        sections.push(t.faq);
    if (input.contributors?.length)
        sections.push(t.contributing);
    if (input.license)
        sections.push(t.license);
    sectionList.push(...sections);
    if (input.includeTableOfContents) {
        doc += generateTableOfContents(sections, t);
    }
    // 개요
    doc += `## ${t.overview}\n\n`;
    if (input.codeContexts && input.codeContexts.length > 0) {
        doc += input.codeContexts[0].conversationSummary + '\n\n';
    }
    else {
        doc += `This document provides an overview of the ${title} project.\n\n`;
    }
    // 기능
    if (input.features && input.features.length > 0) {
        doc += `## ${t.features}\n\n`;
        for (const feature of input.features) {
            doc += `- ${feature}\n`;
        }
        doc += '\n';
    }
    // 설치
    doc += `## ${t.installation}\n\n`;
    if (input.installation) {
        if (input.installation.requirements) {
            doc += `### ${t.prerequisites}\n\n`;
            for (const req of input.installation.requirements) {
                doc += `- ${req}\n`;
            }
            doc += '\n';
        }
        doc += '```bash\n';
        for (const step of input.installation.steps) {
            doc += `${step}\n`;
        }
        doc += '```\n\n';
    }
    else {
        doc += '```bash\n# Installation\nnpm install\n```\n\n';
    }
    // 사용법
    doc += `## ${t.usage}\n\n`;
    doc += 'Describe how to use the project here.\n\n';
    // 코드 예제
    if (input.codeContexts && input.codeContexts.length > 0) {
        doc += `## ${t.codeExamples}\n\n`;
        for (const context of input.codeContexts) {
            if (context.conversationSummary) {
                doc += `### ${context.tags?.[0] || 'Example'}\n\n`;
                doc += context.conversationSummary + '\n\n';
            }
            for (const block of context.codeBlocks) {
                doc += codeBlockToMarkdown(block) + '\n\n';
            }
        }
    }
    // API 레퍼런스
    if (input.apiReference && input.apiReference.length > 0) {
        doc += `## ${t.apiReference}\n\n`;
        for (const api of input.apiReference) {
            doc += `### \`${api.name}\`\n\n`;
            doc += `${api.description}\n\n`;
            if (api.params && api.params.length > 0) {
                doc += `**${t.parameters}:**\n`;
                for (const param of api.params) {
                    doc += `- ${param}\n`;
                }
                doc += '\n';
            }
            if (api.returns) {
                doc += `**${t.returns}:** ${api.returns}\n\n`;
            }
        }
    }
    // 설계 결정
    if (input.designDecisions && input.designDecisions.length > 0) {
        doc += `## ${t.designDecisions}\n\n`;
        for (const decision of input.designDecisions) {
            doc += designDecisionToMarkdown(decision) + '\n\n';
        }
    }
    // FAQ
    if (input.faq && input.faq.length > 0) {
        doc += `## ${t.faq}\n\n`;
        for (const item of input.faq) {
            doc += `### ${item.question}\n\n`;
            doc += `${item.answer}\n\n`;
        }
    }
    // 커스텀 섹션
    if (input.customSections) {
        for (const [sectionTitle, content] of Object.entries(input.customSections)) {
            doc += `## ${sectionTitle}\n\n${content}\n\n`;
        }
    }
    // 기여자
    if (input.contributors && input.contributors.length > 0) {
        doc += `## ${t.contributing}\n\n`;
        for (const contrib of input.contributors) {
            doc += `- **${contrib.name}**${contrib.role ? ` - ${contrib.role}` : ''}\n`;
        }
        doc += '\n';
    }
    // 라이선스
    if (input.license) {
        doc += `## ${t.license}\n\n`;
        doc += `This project is licensed under the ${input.license} License.\n\n`;
    }
    // 푸터
    doc += `---\n\n`;
    if (input.author) {
        doc += `Created by ${input.author}. `;
    }
    doc += `*Generated on ${formatDate()}*\n`;
    return doc;
}
function generateDesignDoc(input, t, sectionList) {
    const title = input.title || 'Design Document';
    let doc = `# ${title}\n\n`;
    doc += `| Field | Value |\n`;
    doc += `|-------|-------|\n`;
    doc += `| **Date** | ${formatDate()} |\n`;
    if (input.author)
        doc += `| **Author** | ${input.author} |\n`;
    if (input.version)
        doc += `| **Version** | ${input.version} |\n`;
    doc += '\n';
    sectionList.push('Summary', 'Architecture Overview', 'Key Decisions', 'Implementation Details');
    if (input.description) {
        doc += `## Summary\n\n${input.description}\n\n`;
    }
    doc += `## Architecture Overview\n\n`;
    if (input.codeContexts && input.codeContexts.length > 0) {
        doc += input.codeContexts[0].conversationSummary + '\n\n';
    }
    else {
        doc += 'Describe the overall architecture here.\n\n';
    }
    if (input.designDecisions && input.designDecisions.length > 0) {
        doc += `## Key Decisions\n\n`;
        // 카테고리별로 그룹화
        const byCategory = input.designDecisions.reduce((acc, d) => {
            if (!acc[d.category])
                acc[d.category] = [];
            acc[d.category].push(d);
            return acc;
        }, {});
        for (const [category, decisions] of Object.entries(byCategory)) {
            doc += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
            for (const decision of decisions) {
                doc += designDecisionToMarkdown(decision) + '\n';
            }
        }
    }
    if (input.codeContexts && input.codeContexts.length > 0) {
        doc += `## Implementation Details\n\n`;
        for (const context of input.codeContexts) {
            const contextTitle = context.tags?.[0] || new Date(context.timestamp).toLocaleDateString();
            doc += `### ${contextTitle}\n\n`;
            doc += context.conversationSummary + '\n\n';
            for (const block of context.codeBlocks) {
                doc += codeBlockToMarkdown(block) + '\n\n';
            }
        }
    }
    if (input.customSections) {
        for (const [sectionTitle, content] of Object.entries(input.customSections)) {
            doc += `## ${sectionTitle}\n\n${content}\n\n`;
        }
    }
    return doc;
}
function generateTutorial(input, t, sectionList) {
    const title = input.title || 'Tutorial';
    let doc = `# ${title}\n\n`;
    if (input.description) {
        doc += `> ${input.description}\n\n`;
    }
    sectionList.push(t.prerequisites, t.gettingStarted, t.summary);
    // 사전 요구사항
    doc += `## ${t.prerequisites}\n\n`;
    if (input.installation?.requirements) {
        for (const req of input.installation.requirements) {
            doc += `- ${req}\n`;
        }
    }
    else {
        doc += '- List prerequisites here\n';
    }
    doc += '\n';
    // 시작하기
    doc += `## ${t.gettingStarted}\n\n`;
    if (input.codeContexts && input.codeContexts.length > 0) {
        let stepNumber = 1;
        for (const context of input.codeContexts) {
            const stepTitle = context.tags?.[0] || `${t.step} ${stepNumber}`;
            doc += `### ${t.step} ${stepNumber}: ${stepTitle}\n\n`;
            doc += context.conversationSummary + '\n\n';
            for (const block of context.codeBlocks) {
                doc += codeBlockToMarkdown(block) + '\n\n';
            }
            stepNumber++;
        }
    }
    // 요약
    doc += `## ${t.summary}\n\n`;
    if (input.features) {
        doc += 'In this tutorial, you learned:\n\n';
        for (const feature of input.features) {
            doc += `- ${feature}\n`;
        }
    }
    else {
        doc += 'Summarize what was learned in this tutorial.\n';
    }
    doc += '\n';
    if (input.customSections) {
        for (const [sectionTitle, content] of Object.entries(input.customSections)) {
            doc += `## ${sectionTitle}\n\n${content}\n\n`;
        }
    }
    return doc;
}
function generateChangelog(input, t, sectionList) {
    let doc = `# ${t.changelog}\n\n`;
    doc += `All notable changes to this project will be documented in this file.\n\n`;
    doc += `The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).\n\n`;
    const today = formatDate();
    const version = input.version || 'Unreleased';
    sectionList.push(`[${version}] - ${today}`);
    doc += `## [${version}] - ${today}\n\n`;
    if (input.codeContexts && input.codeContexts.length > 0) {
        doc += `### ${t.added}\n\n`;
        for (const context of input.codeContexts) {
            doc += `- ${context.conversationSummary}\n`;
            if (context.tags && context.tags.length > 0) {
                doc += `  - Tags: ${context.tags.join(', ')}\n`;
            }
        }
        doc += '\n';
    }
    if (input.designDecisions && input.designDecisions.length > 0) {
        doc += `### ${t.changed}\n\n`;
        for (const decision of input.designDecisions) {
            doc += `- **${decision.title}**: ${decision.description.substring(0, 100)}${decision.description.length > 100 ? '...' : ''}\n`;
        }
        doc += '\n';
    }
    if (input.customSections) {
        for (const [sectionTitle, content] of Object.entries(input.customSections)) {
            doc += `### ${sectionTitle}\n\n${content}\n\n`;
        }
    }
    return doc;
}
function generateApiDoc(input, t, sectionList) {
    const title = input.title || 'API Reference';
    let doc = `# ${title}\n\n`;
    if (input.version) {
        doc += `> Version ${input.version}\n\n`;
    }
    if (input.description) {
        doc += `${input.description}\n\n`;
    }
    sectionList.push('Overview', 'Authentication', 'Endpoints', 'Error Codes');
    doc += `## Overview\n\n`;
    doc += `This document describes the API endpoints and their usage.\n\n`;
    if (input.installation?.requirements) {
        doc += `### Base URL\n\n`;
        doc += `\`\`\`\n${input.installation.requirements[0] || 'https://api.example.com/v1'}\n\`\`\`\n\n`;
    }
    doc += `## Authentication\n\n`;
    doc += `Include your API key in the request header:\n\n`;
    doc += `\`\`\`\nAuthorization: Bearer YOUR_API_KEY\n\`\`\`\n\n`;
    if (input.apiReference && input.apiReference.length > 0) {
        doc += `## Endpoints\n\n`;
        for (const api of input.apiReference) {
            doc += `### ${api.name}\n\n`;
            doc += `${api.description}\n\n`;
            if (api.params && api.params.length > 0) {
                doc += `#### ${t.parameters}\n\n`;
                doc += `| Name | Type | Required | Description |\n`;
                doc += `|------|------|----------|-------------|\n`;
                for (const param of api.params) {
                    const parts = param.split(':').map(s => s.trim());
                    doc += `| \`${parts[0]}\` | ${parts[1] || 'string'} | ${parts[2] || 'No'} | ${parts[3] || '-'} |\n`;
                }
                doc += '\n';
            }
            if (api.returns) {
                doc += `#### Response\n\n`;
                doc += `\`\`\`json\n${api.returns}\n\`\`\`\n\n`;
            }
        }
    }
    doc += `## Error Codes\n\n`;
    doc += `| Code | Description |\n`;
    doc += `|------|-------------|\n`;
    doc += `| 200 | Success |\n`;
    doc += `| 400 | Bad Request |\n`;
    doc += `| 401 | Unauthorized |\n`;
    doc += `| 403 | Forbidden |\n`;
    doc += `| 404 | Not Found |\n`;
    doc += `| 500 | Internal Server Error |\n\n`;
    doc += `---\n\n*Generated on ${formatDate()}*\n`;
    return doc;
}
function generateArchitectureDoc(input, t, sectionList) {
    const title = input.title || 'Architecture Document';
    let doc = `# ${title}\n\n`;
    doc += `| Field | Value |\n`;
    doc += `|-------|-------|\n`;
    doc += `| **Date** | ${formatDate()} |\n`;
    if (input.author)
        doc += `| **Author** | ${input.author} |\n`;
    if (input.version)
        doc += `| **Version** | ${input.version} |\n`;
    doc += '\n';
    sectionList.push('Overview', 'System Components', 'Data Flow', 'Technology Stack', 'Deployment');
    doc += `## Overview\n\n`;
    if (input.description) {
        doc += `${input.description}\n\n`;
    }
    else {
        doc += `This document describes the system architecture.\n\n`;
    }
    doc += `## System Components\n\n`;
    doc += `\`\`\`mermaid\nflowchart TB\n`;
    doc += `    Client[Client Layer]\n`;
    doc += `    API[API Gateway]\n`;
    doc += `    Services[Service Layer]\n`;
    doc += `    DB[(Database)]\n`;
    doc += `    Client --> API\n`;
    doc += `    API --> Services\n`;
    doc += `    Services --> DB\n`;
    doc += `\`\`\`\n\n`;
    if (input.features && input.features.length > 0) {
        doc += `### Components\n\n`;
        for (const feature of input.features) {
            doc += `- **${feature}**\n`;
        }
        doc += '\n';
    }
    doc += `## Data Flow\n\n`;
    doc += `\`\`\`mermaid\nsequenceDiagram\n`;
    doc += `    participant C as Client\n`;
    doc += `    participant A as API\n`;
    doc += `    participant S as Service\n`;
    doc += `    participant D as Database\n`;
    doc += `    C->>A: Request\n`;
    doc += `    A->>S: Process\n`;
    doc += `    S->>D: Query\n`;
    doc += `    D-->>S: Result\n`;
    doc += `    S-->>A: Response\n`;
    doc += `    A-->>C: Response\n`;
    doc += `\`\`\`\n\n`;
    doc += `## Technology Stack\n\n`;
    if (input.codeContexts && input.codeContexts.length > 0) {
        const allTags = new Set();
        for (const ctx of input.codeContexts) {
            ctx.tags?.forEach(tag => allTags.add(tag));
        }
        if (allTags.size > 0) {
            doc += `| Category | Technology |\n`;
            doc += `|----------|------------|\n`;
            for (const tag of allTags) {
                doc += `| ${tag} | - |\n`;
            }
            doc += '\n';
        }
    }
    else {
        doc += `| Category | Technology |\n`;
        doc += `|----------|------------|\n`;
        doc += `| Frontend | - |\n`;
        doc += `| Backend | - |\n`;
        doc += `| Database | - |\n`;
        doc += `| Infrastructure | - |\n\n`;
    }
    doc += `## Deployment\n\n`;
    doc += `\`\`\`mermaid\nflowchart LR\n`;
    doc += `    Dev[Development] --> Staging[Staging]\n`;
    doc += `    Staging --> Prod[Production]\n`;
    doc += `\`\`\`\n\n`;
    if (input.designDecisions && input.designDecisions.length > 0) {
        doc += `## Key Decisions\n\n`;
        for (const decision of input.designDecisions) {
            doc += `### ${decision.title}\n\n`;
            doc += `${decision.description}\n\n`;
            doc += `**Rationale:** ${decision.rationale}\n\n`;
            if (decision.alternatives && decision.alternatives.length > 0) {
                doc += `**Alternatives Considered:**\n`;
                for (const alt of decision.alternatives) {
                    doc += `- ${alt}\n`;
                }
                doc += '\n';
            }
        }
    }
    if (input.customSections) {
        for (const [sectionTitle, content] of Object.entries(input.customSections)) {
            doc += `## ${sectionTitle}\n\n${content}\n\n`;
        }
    }
    doc += `---\n\n*Generated on ${formatDate()}*\n`;
    return doc;
}
export const generateDevDocumentSchema = {
    name: 'muse_generate_dev_document',
    description: 'Generates README, DESIGN, TUTORIAL, or CHANGELOG documents in Markdown format. Supports multiple languages, badges, API reference, FAQ, and more.',
    inputSchema: {
        type: 'object',
        properties: {
            documentType: {
                type: 'string',
                enum: ['README', 'DESIGN', 'TUTORIAL', 'CHANGELOG', 'API', 'ARCHITECTURE'],
                description: 'Type of document to generate (README, DESIGN, TUTORIAL, CHANGELOG, API, ARCHITECTURE)'
            },
            title: {
                type: 'string',
                description: 'Title of the document'
            },
            projectName: {
                type: 'string',
                description: 'Name of the project'
            },
            description: {
                type: 'string',
                description: 'Project or document description'
            },
            language: {
                type: 'string',
                enum: ['en', 'ko'],
                description: 'Language for section headers (default: en)'
            },
            author: {
                type: 'string',
                description: 'Author name'
            },
            version: {
                type: 'string',
                description: 'Version number'
            },
            license: {
                type: 'string',
                description: 'License type (e.g., MIT, Apache-2.0)'
            },
            repository: {
                type: 'string',
                description: 'Repository URL'
            },
            badges: {
                type: 'array',
                description: 'Shield.io badges',
                items: {
                    type: 'object',
                    properties: {
                        label: { type: 'string' },
                        message: { type: 'string' },
                        color: { type: 'string' }
                    }
                }
            },
            features: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of features'
            },
            installation: {
                type: 'object',
                description: 'Installation instructions',
                properties: {
                    steps: { type: 'array', items: { type: 'string' } },
                    requirements: { type: 'array', items: { type: 'string' } }
                }
            },
            apiReference: {
                type: 'array',
                description: 'API documentation',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        params: { type: 'array', items: { type: 'string' } },
                        returns: { type: 'string' }
                    }
                }
            },
            faq: {
                type: 'array',
                description: 'Frequently asked questions',
                items: {
                    type: 'object',
                    properties: {
                        question: { type: 'string' },
                        answer: { type: 'string' }
                    }
                }
            },
            contributors: {
                type: 'array',
                description: 'List of contributors',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        role: { type: 'string' }
                    }
                }
            },
            codeContexts: {
                type: 'array',
                description: 'Array of code contexts to include',
                items: { type: 'object' }
            },
            designDecisions: {
                type: 'array',
                description: 'Array of design decisions to include',
                items: { type: 'object' }
            },
            customSections: {
                type: 'object',
                description: 'Custom sections to add (key: section title, value: content)'
            },
            includeTableOfContents: {
                type: 'boolean',
                description: 'Whether to include a table of contents'
            }
        },
        required: ['documentType']
    }
};
//# sourceMappingURL=generateDevDocument.js.map