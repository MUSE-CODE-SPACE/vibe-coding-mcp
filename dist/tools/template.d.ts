/**
 * Custom Templates Tool (v2.11)
 * Manages user-defined document templates with variables
 */
import type { TemplateInput } from '../core/schemas.js';
export type TemplateAction = 'create' | 'get' | 'update' | 'delete' | 'list' | 'apply' | 'preview' | 'import' | 'export';
export type TemplateType = 'document' | 'session-log' | 'export' | 'report';
interface TemplateVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'date';
    required: boolean;
    default?: unknown;
    description?: string;
}
interface Template {
    id: string;
    name: string;
    type: TemplateType;
    content: string;
    description?: string;
    variables: TemplateVariable[];
    createdAt: string;
    updatedAt: string;
}
export interface TemplateOutput {
    success: boolean;
    action: TemplateAction;
    template?: Template;
    templates?: Template[];
    total?: number;
    rendered?: string;
    missingVariables?: string[];
    filePath?: string;
    exportedCount?: number;
    importedCount?: number;
    message?: string;
    error?: string;
}
export declare function templateTool(input: TemplateInput): Promise<TemplateOutput>;
export declare const templateSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            action: {
                type: string;
                enum: string[];
                description: string;
            };
            templateId: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            variables: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        name: {
                            type: string;
                        };
                        type: {
                            type: string;
                            enum: string[];
                        };
                        required: {
                            type: string;
                        };
                        default: {};
                        description: {
                            type: string;
                        };
                    };
                    required: string[];
                };
                description: string;
            };
            data: {
                type: string;
                description: string;
            };
            format: {
                type: string;
                enum: string[];
                description: string;
            };
            filePath: {
                type: string;
                description: string;
            };
            filterType: {
                type: string;
                enum: string[];
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            offset: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export {};
//# sourceMappingURL=template.d.ts.map