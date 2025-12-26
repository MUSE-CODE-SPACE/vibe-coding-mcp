/**
 * 다국어 지원 유틸리티
 * 한국어/영어 문서 동시 생성 지원
 */
const translations = {
    ko: {
        overview: '개요',
        features: '주요 기능',
        installation: '설치',
        usage: '사용법',
        api: 'API',
        configuration: '설정',
        examples: '예제',
        contributing: '기여하기',
        license: '라이선스',
        changelog: '변경 이력',
        version: '버전',
        author: '작성자',
        description: '설명',
        parameters: '매개변수',
        returns: '반환값',
        type: '타입',
        required: '필수',
        optional: '선택',
        default: '기본값',
        example: '예제',
        note: '참고',
        warning: '주의',
        tip: '팁',
        install: '설치',
        run: '실행',
        build: '빌드',
        test: '테스트',
        deploy: '배포',
        breaking: '주요 변경',
        added: '추가',
        changed: '변경',
        deprecated: '지원 중단 예정',
        removed: '삭제',
        fixed: '수정',
        security: '보안',
        readme: 'README',
        tutorial: '튜토리얼',
        apiReference: 'API 문서',
        designDoc: '설계 문서',
        generatedOn: '생성일',
        lastUpdated: '최종 수정일',
        tableOfContents: '목차',
        gettingStarted: '시작하기',
        prerequisites: '사전 요구사항',
        quickStart: '빠른 시작'
    },
    en: {
        overview: 'Overview',
        features: 'Features',
        installation: 'Installation',
        usage: 'Usage',
        api: 'API',
        configuration: 'Configuration',
        examples: 'Examples',
        contributing: 'Contributing',
        license: 'License',
        changelog: 'Changelog',
        version: 'Version',
        author: 'Author',
        description: 'Description',
        parameters: 'Parameters',
        returns: 'Returns',
        type: 'Type',
        required: 'Required',
        optional: 'Optional',
        default: 'Default',
        example: 'Example',
        note: 'Note',
        warning: 'Warning',
        tip: 'Tip',
        install: 'Install',
        run: 'Run',
        build: 'Build',
        test: 'Test',
        deploy: 'Deploy',
        breaking: 'Breaking Changes',
        added: 'Added',
        changed: 'Changed',
        deprecated: 'Deprecated',
        removed: 'Removed',
        fixed: 'Fixed',
        security: 'Security',
        readme: 'README',
        tutorial: 'Tutorial',
        apiReference: 'API Reference',
        designDoc: 'Design Document',
        generatedOn: 'Generated on',
        lastUpdated: 'Last updated',
        tableOfContents: 'Table of Contents',
        gettingStarted: 'Getting Started',
        prerequisites: 'Prerequisites',
        quickStart: 'Quick Start'
    }
};
// 현재 언어 설정
let currentLanguage = 'en';
export function setLanguage(lang) {
    currentLanguage = lang;
}
export function getLanguage() {
    return currentLanguage;
}
export function t(key, lang) {
    const useLang = lang || currentLanguage;
    return translations[useLang][key] || translations['en'][key] || key;
}
// 양쪽 언어로 동시 생성
export function tBilingual(key) {
    return {
        ko: translations.ko[key],
        en: translations.en[key]
    };
}
// 날짜 포맷
export function formatDate(date, lang) {
    const useLang = lang || currentLanguage;
    if (useLang === 'ko') {
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    }
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
// 코드 코멘트 변환
export function translateCodeComment(comment, targetLang) {
    // 간단한 매핑 (실제로는 더 정교한 번역이 필요)
    const commonTranslations = {
        'TODO': { ko: '할 일', en: 'TODO' },
        'FIXME': { ko: '수정 필요', en: 'FIXME' },
        'NOTE': { ko: '참고', en: 'NOTE' },
        'HACK': { ko: '임시 처리', en: 'HACK' },
        'XXX': { ko: '주의', en: 'XXX' }
    };
    for (const [key, value] of Object.entries(commonTranslations)) {
        if (comment.includes(key)) {
            comment = comment.replace(key, value[targetLang]);
        }
    }
    return comment;
}
// 마크다운 헤더 변환
export function translateMarkdownHeaders(markdown, lang) {
    const headerMappings = {
        'Overview': 'overview',
        'Features': 'features',
        'Installation': 'installation',
        'Usage': 'usage',
        'API': 'api',
        'Configuration': 'configuration',
        'Examples': 'examples',
        'Contributing': 'contributing',
        'License': 'license',
        'Changelog': 'changelog',
        'Table of Contents': 'tableOfContents',
        'Getting Started': 'gettingStarted',
        'Prerequisites': 'prerequisites',
        'Quick Start': 'quickStart',
        '개요': 'overview',
        '주요 기능': 'features',
        '설치': 'installation',
        '사용법': 'usage',
        '설정': 'configuration',
        '예제': 'examples',
        '기여하기': 'contributing',
        '라이선스': 'license',
        '변경 이력': 'changelog',
        '목차': 'tableOfContents',
        '시작하기': 'gettingStarted',
        '사전 요구사항': 'prerequisites',
        '빠른 시작': 'quickStart'
    };
    for (const [original, key] of Object.entries(headerMappings)) {
        const regex = new RegExp(`(#{1,6})\\s*${original}\\s*$`, 'gm');
        markdown = markdown.replace(regex, `$1 ${t(key, lang)}`);
    }
    return markdown;
}
// 문서를 양쪽 언어로 생성
export function generateBilingualDocument(generator) {
    return {
        ko: generator('ko'),
        en: generator('en')
    };
}
//# sourceMappingURL=i18n.js.map