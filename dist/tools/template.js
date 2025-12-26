/**
 * Custom Templates Tool (v2.11)
 * Manages user-defined document templates with variables
 */
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createToolLogger } from '../core/logger.js';
const logger = createToolLogger('template');
// Storage
const STORAGE_DIR = process.env.VIBE_CODING_STORAGE_DIR ||
    path.join(os.homedir(), '.vibe-coding-mcp', 'templates');
let initialized = false;
async function initializeStorage() {
    if (initialized)
        return;
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    initialized = true;
    logger.info('Template storage initialized', { path: STORAGE_DIR });
}
function getTemplatePath(templateId) {
    return path.join(STORAGE_DIR, `${templateId}.json`);
}
function generateId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `template_${timestamp}_${random}`;
}
// Template variable substitution
function renderTemplate(content, data, variables) {
    let rendered = content;
    const missing = [];
    // Build a map of variable values with defaults
    const values = {};
    variables.forEach((v) => {
        if (data[v.name] !== undefined) {
            values[v.name] = data[v.name];
        }
        else if (v.default !== undefined) {
            values[v.name] = v.default;
        }
        else if (v.required) {
            missing.push(v.name);
        }
    });
    // Replace variables in content
    // Support formats: {{variable}}, ${variable}, {variable}
    const patterns = [
        /\{\{(\w+)\}\}/g, // {{variable}}
        /\$\{(\w+)\}/g, // ${variable}
        /\{(\w+)\}/g, // {variable}
    ];
    patterns.forEach((pattern) => {
        rendered = rendered.replace(pattern, (match, varName) => {
            if (values[varName] !== undefined) {
                const value = values[varName];
                // Format based on type
                if (Array.isArray(value)) {
                    return value.join(', ');
                }
                else if (value instanceof Date) {
                    return value.toISOString();
                }
                else if (typeof value === 'object') {
                    return JSON.stringify(value);
                }
                return String(value);
            }
            // Check if it's a built-in variable
            switch (varName) {
                case 'date':
                    return new Date().toISOString().split('T')[0];
                case 'datetime':
                    return new Date().toISOString();
                case 'timestamp':
                    return Date.now().toString();
                case 'year':
                    return new Date().getFullYear().toString();
                case 'month':
                    return String(new Date().getMonth() + 1).padStart(2, '0');
                case 'day':
                    return String(new Date().getDate()).padStart(2, '0');
                default:
                    // Variable not found, keep original
                    return match;
            }
        });
    });
    return { rendered, missing };
}
// Built-in templates
const BUILTIN_TEMPLATES = [
    {
        name: 'Basic README',
        type: 'document',
        description: 'A simple README template',
        content: `# {{projectName}}

{{description}}

## Installation

\`\`\`bash
npm install {{packageName}}
\`\`\`

## Usage

{{usage}}

## License

{{license}}

---
Generated on {{date}}
`,
        variables: [
            { name: 'projectName', type: 'string', required: true, description: 'Project name' },
            { name: 'description', type: 'string', required: true, description: 'Project description' },
            { name: 'packageName', type: 'string', required: false, default: '', description: 'npm package name' },
            { name: 'usage', type: 'string', required: false, default: 'See documentation.', description: 'Usage instructions' },
            { name: 'license', type: 'string', required: false, default: 'MIT', description: 'License type' },
        ],
    },
    {
        name: 'Session Summary',
        type: 'session-log',
        description: 'Template for session documentation',
        content: `# Session: {{title}}

**Date**: {{date}}
**Duration**: {{duration}} minutes
**Tags**: {{tags}}

## Summary

{{summary}}

## Code Changes

{{codeChanges}}

## Design Decisions

{{decisions}}

## Next Steps

{{nextSteps}}
`,
        variables: [
            { name: 'title', type: 'string', required: true, description: 'Session title' },
            { name: 'duration', type: 'number', required: false, default: 0, description: 'Duration in minutes' },
            { name: 'tags', type: 'array', required: false, default: [], description: 'Session tags' },
            { name: 'summary', type: 'string', required: true, description: 'Session summary' },
            { name: 'codeChanges', type: 'string', required: false, default: 'No code changes recorded.', description: 'Code changes' },
            { name: 'decisions', type: 'string', required: false, default: 'No design decisions recorded.', description: 'Design decisions' },
            { name: 'nextSteps', type: 'string', required: false, default: 'TBD', description: 'Next steps' },
        ],
    },
    {
        name: 'Weekly Report',
        type: 'report',
        description: 'Weekly progress report template',
        content: `# Weekly Report: {{weekOf}}

## Overview

- **Sessions Completed**: {{sessionCount}}
- **Code Blocks Written**: {{codeBlockCount}}
- **Design Decisions Made**: {{decisionCount}}

## Highlights

{{highlights}}

## Challenges

{{challenges}}

## Goals for Next Week

{{goals}}

---
Report generated on {{datetime}}
`,
        variables: [
            { name: 'weekOf', type: 'string', required: true, description: 'Week starting date' },
            { name: 'sessionCount', type: 'number', required: false, default: 0 },
            { name: 'codeBlockCount', type: 'number', required: false, default: 0 },
            { name: 'decisionCount', type: 'number', required: false, default: 0 },
            { name: 'highlights', type: 'string', required: false, default: 'None noted.' },
            { name: 'challenges', type: 'string', required: false, default: 'None noted.' },
            { name: 'goals', type: 'string', required: false, default: 'TBD' },
        ],
    },
];
// Main tool function
export async function templateTool(input) {
    const { action, templateId, name, type, content, description, variables, data, format = 'json', filePath, filterType, limit, offset = 0, } = input;
    logger.info('Template action requested', { action, templateId, name });
    try {
        await initializeStorage();
        switch (action) {
            case 'create': {
                if (!name) {
                    return { success: false, action, error: 'name is required' };
                }
                if (!type) {
                    return { success: false, action, error: 'type is required' };
                }
                if (!content) {
                    return { success: false, action, error: 'content is required' };
                }
                const id = generateId();
                const now = new Date().toISOString();
                const template = {
                    id,
                    name,
                    type,
                    content,
                    description,
                    variables: variables || [],
                    createdAt: now,
                    updatedAt: now,
                };
                await fs.writeFile(getTemplatePath(id), JSON.stringify(template, null, 2), 'utf-8');
                logger.info('Template created', { templateId: id, name });
                return {
                    success: true,
                    action,
                    template,
                    message: `Template "${name}" created successfully`,
                };
            }
            case 'get': {
                if (!templateId && !name) {
                    return { success: false, action, error: 'templateId or name is required' };
                }
                // Try to find by ID first
                if (templateId) {
                    try {
                        const data = await fs.readFile(getTemplatePath(templateId), 'utf-8');
                        const template = JSON.parse(data);
                        return { success: true, action, template };
                    }
                    catch {
                        return { success: false, action, error: `Template not found: ${templateId}` };
                    }
                }
                // Search by name
                const files = await fs.readdir(STORAGE_DIR);
                for (const file of files) {
                    if (!file.endsWith('.json'))
                        continue;
                    const data = await fs.readFile(path.join(STORAGE_DIR, file), 'utf-8');
                    const template = JSON.parse(data);
                    if (template.name === name) {
                        return { success: true, action, template };
                    }
                }
                // Check built-in templates
                const builtin = BUILTIN_TEMPLATES.find((t) => t.name === name);
                if (builtin) {
                    const template = {
                        ...builtin,
                        id: `builtin_${builtin.name.toLowerCase().replace(/\s+/g, '_')}`,
                        createdAt: new Date(0).toISOString(),
                        updatedAt: new Date(0).toISOString(),
                    };
                    return { success: true, action, template };
                }
                return { success: false, action, error: `Template not found: ${name}` };
            }
            case 'update': {
                if (!templateId) {
                    return { success: false, action, error: 'templateId is required' };
                }
                const templatePath = getTemplatePath(templateId);
                let template;
                try {
                    const existingData = await fs.readFile(templatePath, 'utf-8');
                    template = JSON.parse(existingData);
                }
                catch {
                    return { success: false, action, error: `Template not found: ${templateId}` };
                }
                // Update fields
                if (name)
                    template.name = name;
                if (type)
                    template.type = type;
                if (content)
                    template.content = content;
                if (description !== undefined)
                    template.description = description;
                if (variables)
                    template.variables = variables;
                template.updatedAt = new Date().toISOString();
                await fs.writeFile(templatePath, JSON.stringify(template, null, 2), 'utf-8');
                logger.info('Template updated', { templateId });
                return {
                    success: true,
                    action,
                    template,
                    message: 'Template updated successfully',
                };
            }
            case 'delete': {
                if (!templateId) {
                    return { success: false, action, error: 'templateId is required' };
                }
                const templatePath = getTemplatePath(templateId);
                try {
                    await fs.unlink(templatePath);
                    logger.info('Template deleted', { templateId });
                    return { success: true, action, message: 'Template deleted successfully' };
                }
                catch {
                    return { success: false, action, error: `Template not found: ${templateId}` };
                }
            }
            case 'list': {
                const templates = [];
                // Load stored templates
                try {
                    const files = await fs.readdir(STORAGE_DIR);
                    for (const file of files) {
                        if (!file.endsWith('.json'))
                            continue;
                        const data = await fs.readFile(path.join(STORAGE_DIR, file), 'utf-8');
                        const template = JSON.parse(data);
                        // Filter by type if specified
                        if (filterType && template.type !== filterType)
                            continue;
                        templates.push(template);
                    }
                }
                catch {
                    // Directory might not exist yet
                }
                // Add built-in templates
                BUILTIN_TEMPLATES.forEach((builtin) => {
                    if (filterType && builtin.type !== filterType)
                        return;
                    templates.push({
                        ...builtin,
                        id: `builtin_${builtin.name.toLowerCase().replace(/\s+/g, '_')}`,
                        createdAt: new Date(0).toISOString(),
                        updatedAt: new Date(0).toISOString(),
                    });
                });
                // Sort by name
                templates.sort((a, b) => a.name.localeCompare(b.name));
                // Paginate
                const total = templates.length;
                const paginated = limit
                    ? templates.slice(offset, offset + limit)
                    : templates.slice(offset);
                return {
                    success: true,
                    action,
                    templates: paginated,
                    total,
                    message: `Found ${total} templates`,
                };
            }
            case 'apply':
            case 'preview': {
                // Get the template
                let template;
                if (templateId) {
                    try {
                        const templateData = await fs.readFile(getTemplatePath(templateId), 'utf-8');
                        template = JSON.parse(templateData);
                    }
                    catch {
                        // Check built-in templates
                        const builtin = BUILTIN_TEMPLATES.find((t) => `builtin_${t.name.toLowerCase().replace(/\s+/g, '_')}` === templateId);
                        if (builtin) {
                            template = {
                                ...builtin,
                                id: templateId,
                                createdAt: new Date(0).toISOString(),
                                updatedAt: new Date(0).toISOString(),
                            };
                        }
                    }
                }
                else if (name) {
                    // Try to find by name
                    const files = await fs.readdir(STORAGE_DIR).catch(() => []);
                    for (const file of files) {
                        if (!file.endsWith('.json'))
                            continue;
                        const d = await fs.readFile(path.join(STORAGE_DIR, file), 'utf-8');
                        const t = JSON.parse(d);
                        if (t.name === name) {
                            template = t;
                            break;
                        }
                    }
                    // Check built-in
                    if (!template) {
                        const builtin = BUILTIN_TEMPLATES.find((t) => t.name === name);
                        if (builtin) {
                            template = {
                                ...builtin,
                                id: `builtin_${builtin.name.toLowerCase().replace(/\s+/g, '_')}`,
                                createdAt: new Date(0).toISOString(),
                                updatedAt: new Date(0).toISOString(),
                            };
                        }
                    }
                }
                if (!template) {
                    return { success: false, action, error: 'Template not found' };
                }
                const { rendered, missing } = renderTemplate(template.content, data || {}, template.variables);
                if (action === 'preview') {
                    return {
                        success: true,
                        action,
                        rendered,
                        missingVariables: missing,
                        template,
                        message: missing.length > 0
                            ? `Preview ready with ${missing.length} missing variables`
                            : 'Preview ready',
                    };
                }
                // For apply, check required variables
                if (missing.length > 0) {
                    return {
                        success: false,
                        action,
                        missingVariables: missing,
                        error: `Missing required variables: ${missing.join(', ')}`,
                    };
                }
                return {
                    success: true,
                    action,
                    rendered,
                    template,
                    message: 'Template applied successfully',
                };
            }
            case 'export': {
                const templates = [];
                // Load all templates
                const files = await fs.readdir(STORAGE_DIR).catch(() => []);
                for (const file of files) {
                    if (!file.endsWith('.json'))
                        continue;
                    const d = await fs.readFile(path.join(STORAGE_DIR, file), 'utf-8');
                    templates.push(JSON.parse(d));
                }
                if (templates.length === 0) {
                    return { success: false, action, error: 'No templates to export' };
                }
                const exportData = format === 'json'
                    ? JSON.stringify(templates, null, 2)
                    : templates.map((t) => `---\n${JSON.stringify(t, null, 2)}\n`).join('\n');
                if (filePath) {
                    await fs.writeFile(filePath, exportData, 'utf-8');
                    return {
                        success: true,
                        action,
                        filePath,
                        exportedCount: templates.length,
                        message: `Exported ${templates.length} templates to ${filePath}`,
                    };
                }
                return {
                    success: true,
                    action,
                    rendered: exportData,
                    exportedCount: templates.length,
                    message: `Exported ${templates.length} templates`,
                };
            }
            case 'import': {
                if (!filePath && !content) {
                    return { success: false, action, error: 'filePath or content is required' };
                }
                let importData;
                if (filePath) {
                    importData = await fs.readFile(filePath, 'utf-8');
                }
                else {
                    importData = content;
                }
                let templates;
                try {
                    templates = JSON.parse(importData);
                    if (!Array.isArray(templates)) {
                        templates = [templates];
                    }
                }
                catch {
                    return { success: false, action, error: 'Invalid template data format' };
                }
                let importedCount = 0;
                for (const t of templates) {
                    const id = generateId();
                    const now = new Date().toISOString();
                    const template = {
                        ...t,
                        id,
                        createdAt: now,
                        updatedAt: now,
                    };
                    await fs.writeFile(getTemplatePath(id), JSON.stringify(template, null, 2), 'utf-8');
                    importedCount++;
                }
                return {
                    success: true,
                    action,
                    importedCount,
                    message: `Imported ${importedCount} templates`,
                };
            }
            default:
                return { success: false, action, error: `Unknown action: ${action}` };
        }
    }
    catch (error) {
        logger.error('Template operation failed', error);
        return {
            success: false,
            action,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
// Schema for MCP registration
export const templateSchema = {
    name: 'muse_template',
    description: 'Manages custom document templates with variable substitution. Actions: create, get, update, delete, list, apply (render with data), preview (render preview), import, export.',
    inputSchema: {
        type: 'object',
        properties: {
            action: {
                type: 'string',
                enum: ['create', 'get', 'update', 'delete', 'list', 'apply', 'preview', 'import', 'export'],
                description: 'Action to perform',
            },
            templateId: {
                type: 'string',
                description: 'Template ID',
            },
            name: {
                type: 'string',
                description: 'Template name',
            },
            type: {
                type: 'string',
                enum: ['document', 'session-log', 'export', 'report'],
                description: 'Template type',
            },
            content: {
                type: 'string',
                description: 'Template content with {{variables}}',
            },
            description: {
                type: 'string',
                description: 'Template description',
            },
            variables: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        type: { type: 'string', enum: ['string', 'number', 'boolean', 'array', 'date'] },
                        required: { type: 'boolean' },
                        default: {},
                        description: { type: 'string' },
                    },
                    required: ['name', 'type'],
                },
                description: 'Template variables definition',
            },
            data: {
                type: 'object',
                description: 'Variable values for apply/preview',
            },
            format: {
                type: 'string',
                enum: ['json', 'yaml'],
                description: 'Import/export format (default: json)',
            },
            filePath: {
                type: 'string',
                description: 'File path for import/export',
            },
            filterType: {
                type: 'string',
                enum: ['document', 'session-log', 'export', 'report'],
                description: 'Filter list by type',
            },
            limit: {
                type: 'number',
                description: 'Limit results for list',
            },
            offset: {
                type: 'number',
                description: 'Offset for list pagination',
            },
        },
        required: ['action'],
    },
};
//# sourceMappingURL=template.js.map