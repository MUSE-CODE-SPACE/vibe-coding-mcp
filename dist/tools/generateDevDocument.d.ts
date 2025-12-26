import { DocumentType, CodeContext, DesignDecision } from '../types/index.js';
export interface GenerateDevDocumentInput {
    documentType: DocumentType;
    title?: string;
    projectName?: string;
    description?: string;
    codeContexts?: CodeContext[];
    designDecisions?: DesignDecision[];
    customSections?: Record<string, string>;
    includeTableOfContents?: boolean;
    language?: 'en' | 'ko';
    author?: string;
    version?: string;
    license?: string;
    repository?: string;
    badges?: {
        label: string;
        message: string;
        color: string;
    }[];
    features?: string[];
    installation?: {
        steps: string[];
        requirements?: string[];
    };
    apiReference?: {
        name: string;
        description: string;
        params?: string[];
        returns?: string;
    }[];
    faq?: {
        question: string;
        answer: string;
    }[];
    contributors?: {
        name: string;
        role?: string;
    }[];
}
export interface GenerateDevDocumentOutput {
    document: string;
    documentType: DocumentType;
    generatedAt: string;
    wordCount: number;
    sections: string[];
}
export declare function generateDevDocument(input: GenerateDevDocumentInput): GenerateDevDocumentOutput;
export declare const generateDevDocumentSchema: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            documentType: {
                type: string;
                enum: string[];
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            projectName: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            language: {
                type: string;
                enum: string[];
                description: string;
            };
            author: {
                type: string;
                description: string;
            };
            version: {
                type: string;
                description: string;
            };
            license: {
                type: string;
                description: string;
            };
            repository: {
                type: string;
                description: string;
            };
            badges: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        label: {
                            type: string;
                        };
                        message: {
                            type: string;
                        };
                        color: {
                            type: string;
                        };
                    };
                };
            };
            features: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            installation: {
                type: string;
                description: string;
                properties: {
                    steps: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    requirements: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                };
            };
            apiReference: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        name: {
                            type: string;
                        };
                        description: {
                            type: string;
                        };
                        params: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                        returns: {
                            type: string;
                        };
                    };
                };
            };
            faq: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        question: {
                            type: string;
                        };
                        answer: {
                            type: string;
                        };
                    };
                };
            };
            contributors: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        name: {
                            type: string;
                        };
                        role: {
                            type: string;
                        };
                    };
                };
            };
            codeContexts: {
                type: string;
                description: string;
                items: {
                    type: string;
                };
            };
            designDecisions: {
                type: string;
                description: string;
                items: {
                    type: string;
                };
            };
            customSections: {
                type: string;
                description: string;
            };
            includeTableOfContents: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=generateDevDocument.d.ts.map