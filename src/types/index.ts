// 코드 블록 정보
export interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
  description?: string;
}

// 수집된 코드 컨텍스트
export interface CodeContext {
  sessionId: string;
  timestamp: string;
  codeBlocks: CodeBlock[];
  conversationSummary: string;
  tags?: string[];
}

// 디자인 결정
export interface DesignDecision {
  id: string;
  title: string;
  description: string;
  rationale: string;
  alternatives?: string[];
  timestamp: string;
  category: 'architecture' | 'implementation' | 'library' | 'pattern' | 'other';
}

// 문서 타입
export type DocumentType = 'README' | 'DESIGN' | 'TUTORIAL' | 'CHANGELOG';

// 플랫폼 타입
export type Platform = 'notion' | 'github-wiki' | 'obsidian';

// 세션 로그
export interface SessionLog {
  sessionId: string;
  date: string;
  title: string;
  summary: string;
  codeContexts: CodeContext[];
  designDecisions: DesignDecision[];
  duration?: number;
  tags?: string[];
}

// 문서 생성 옵션
export interface DocumentOptions {
  type: DocumentType;
  title?: string;
  includeCodeBlocks?: boolean;
  includeDesignDecisions?: boolean;
  customSections?: Record<string, string>;
}

// 플랫폼 발행 옵션
export interface PublishOptions {
  platform: Platform;
  parentPageId?: string;  // Notion
  wikiPath?: string;      // GitHub Wiki
  vaultPath?: string;     // Obsidian
  filename?: string;
}

// 발행 결과
export interface PublishResult {
  success: boolean;
  platform: Platform;
  url?: string;
  filePath?: string;
  error?: string;
}

// 세션 로그 옵션
export interface SessionLogOptions {
  logType: 'daily' | 'session';
  outputPath?: string;
  format?: 'markdown' | 'json';
}
