/**
 * 다국어 지원 유틸리티
 * 한국어/영어 문서 동시 생성 지원
 */
export type Language = 'ko' | 'en';
export interface TranslationStrings {
    overview: string;
    features: string;
    installation: string;
    usage: string;
    api: string;
    configuration: string;
    examples: string;
    contributing: string;
    license: string;
    changelog: string;
    version: string;
    author: string;
    description: string;
    parameters: string;
    returns: string;
    type: string;
    required: string;
    optional: string;
    default: string;
    example: string;
    note: string;
    warning: string;
    tip: string;
    install: string;
    run: string;
    build: string;
    test: string;
    deploy: string;
    breaking: string;
    added: string;
    changed: string;
    deprecated: string;
    removed: string;
    fixed: string;
    security: string;
    readme: string;
    tutorial: string;
    apiReference: string;
    designDoc: string;
    generatedOn: string;
    lastUpdated: string;
    tableOfContents: string;
    gettingStarted: string;
    prerequisites: string;
    quickStart: string;
}
export declare function setLanguage(lang: Language): void;
export declare function getLanguage(): Language;
export declare function t(key: keyof TranslationStrings, lang?: Language): string;
export declare function tBilingual(key: keyof TranslationStrings): {
    ko: string;
    en: string;
};
export declare function formatDate(date: Date, lang?: Language): string;
export declare function translateCodeComment(comment: string, targetLang: Language): string;
export declare function translateMarkdownHeaders(markdown: string, lang: Language): string;
export declare function generateBilingualDocument(generator: (lang: Language) => string): {
    ko: string;
    en: string;
};
//# sourceMappingURL=i18n.d.ts.map