import { DocumentType, CodeContext, DesignDecision, DocumentOptions } from '../types/index.js';
import { codeBlockToMarkdown, designDecisionToMarkdown, formatDate } from '../utils/markdown.js';

export interface GenerateDevDocumentInput {
  documentType: DocumentType;
  title?: string;
  projectName?: string;
  description?: string;
  codeContexts?: CodeContext[];
  designDecisions?: DesignDecision[];
  customSections?: Record<string, string>;
  includeTableOfContents?: boolean;
}

export interface GenerateDevDocumentOutput {
  document: string;
  documentType: DocumentType;
  generatedAt: string;
}

export function generateDevDocument(input: GenerateDevDocumentInput): GenerateDevDocumentOutput {
  let document = '';

  switch (input.documentType) {
    case 'README':
      document = generateReadme(input);
      break;
    case 'DESIGN':
      document = generateDesignDoc(input);
      break;
    case 'TUTORIAL':
      document = generateTutorial(input);
      break;
    case 'CHANGELOG':
      document = generateChangelog(input);
      break;
  }

  return {
    document,
    documentType: input.documentType,
    generatedAt: new Date().toISOString()
  };
}

function generateTableOfContents(sections: string[]): string {
  let toc = '## Table of Contents\n\n';
  sections.forEach((section, index) => {
    const slug = section.toLowerCase().replace(/\s+/g, '-');
    toc += `${index + 1}. [${section}](#${slug})\n`;
  });
  return toc + '\n';
}

function generateReadme(input: GenerateDevDocumentInput): string {
  const title = input.title || input.projectName || 'Project';
  let doc = `# ${title}\n\n`;

  if (input.description) {
    doc += `${input.description}\n\n`;
  }

  const sections: string[] = [];

  if (input.includeTableOfContents) {
    sections.push('Overview', 'Installation', 'Usage', 'Code Examples', 'Design Decisions');
    doc += generateTableOfContents(sections);
  }

  doc += `## Overview\n\n`;
  if (input.codeContexts && input.codeContexts.length > 0) {
    doc += input.codeContexts[0].conversationSummary + '\n\n';
  } else {
    doc += `This document provides an overview of the ${title} project.\n\n`;
  }

  doc += `## Installation\n\n`;
  doc += '```bash\n# Installation instructions\nnpm install\n```\n\n';

  doc += `## Usage\n\n`;
  doc += 'Describe how to use the project here.\n\n';

  if (input.codeContexts && input.codeContexts.length > 0) {
    doc += `## Code Examples\n\n`;
    for (const context of input.codeContexts) {
      for (const block of context.codeBlocks) {
        doc += codeBlockToMarkdown(block) + '\n\n';
      }
    }
  }

  if (input.designDecisions && input.designDecisions.length > 0) {
    doc += `## Design Decisions\n\n`;
    for (const decision of input.designDecisions) {
      doc += designDecisionToMarkdown(decision) + '\n\n';
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

function generateDesignDoc(input: GenerateDevDocumentInput): string {
  const title = input.title || 'Design Document';
  let doc = `# ${title}\n\n`;

  doc += `**Date:** ${formatDate()}\n\n`;

  if (input.description) {
    doc += `## Summary\n\n${input.description}\n\n`;
  }

  doc += `## Architecture Overview\n\n`;
  doc += 'Describe the overall architecture here.\n\n';

  if (input.designDecisions && input.designDecisions.length > 0) {
    doc += `## Key Decisions\n\n`;

    // 카테고리별로 그룹화
    const byCategory = input.designDecisions.reduce((acc, d) => {
      if (!acc[d.category]) acc[d.category] = [];
      acc[d.category].push(d);
      return acc;
    }, {} as Record<string, DesignDecision[]>);

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
      doc += `### ${context.timestamp}\n\n`;
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

function generateTutorial(input: GenerateDevDocumentInput): string {
  const title = input.title || 'Tutorial';
  let doc = `# ${title}\n\n`;

  if (input.description) {
    doc += `${input.description}\n\n`;
  }

  doc += `## Prerequisites\n\n`;
  doc += '- List prerequisites here\n\n';

  doc += `## Getting Started\n\n`;

  if (input.codeContexts && input.codeContexts.length > 0) {
    let stepNumber = 1;
    for (const context of input.codeContexts) {
      doc += `### Step ${stepNumber}: ${context.tags?.[0] || 'Next Step'}\n\n`;
      doc += context.conversationSummary + '\n\n';

      for (const block of context.codeBlocks) {
        doc += codeBlockToMarkdown(block) + '\n\n';
      }
      stepNumber++;
    }
  }

  doc += `## Summary\n\n`;
  doc += 'Summarize what was learned in this tutorial.\n\n';

  if (input.customSections) {
    for (const [sectionTitle, content] of Object.entries(input.customSections)) {
      doc += `## ${sectionTitle}\n\n${content}\n\n`;
    }
  }

  return doc;
}

function generateChangelog(input: GenerateDevDocumentInput): string {
  let doc = `# Changelog\n\n`;
  doc += `All notable changes to this project will be documented in this file.\n\n`;

  const today = formatDate();
  doc += `## [Unreleased] - ${today}\n\n`;

  if (input.codeContexts && input.codeContexts.length > 0) {
    doc += `### Added\n\n`;
    for (const context of input.codeContexts) {
      doc += `- ${context.conversationSummary}\n`;
    }
    doc += '\n';
  }

  if (input.designDecisions && input.designDecisions.length > 0) {
    doc += `### Changed\n\n`;
    for (const decision of input.designDecisions) {
      doc += `- ${decision.title}: ${decision.description}\n`;
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

export const generateDevDocumentSchema = {
  name: 'generate_dev_document',
  description: 'Generates README, DESIGN, TUTORIAL, or CHANGELOG documents in Markdown format.',
  inputSchema: {
    type: 'object',
    properties: {
      documentType: {
        type: 'string',
        enum: ['README', 'DESIGN', 'TUTORIAL', 'CHANGELOG'],
        description: 'Type of document to generate'
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
