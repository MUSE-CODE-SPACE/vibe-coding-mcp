/**
 * AST 기반 코드 분석 유틸리티
 * 함수, 클래스, 의존성을 자동으로 추출
 */

export interface FunctionInfo {
  name: string;
  params: string[];
  returnType?: string;
  async: boolean;
  exported: boolean;
  lineNumber?: number;
  docstring?: string;
}

export interface ClassInfo {
  name: string;
  methods: FunctionInfo[];
  properties: PropertyInfo[];
  extends?: string;
  implements?: string[];
  exported: boolean;
  lineNumber?: number;
  docstring?: string;
}

export interface PropertyInfo {
  name: string;
  type?: string;
  visibility: 'public' | 'private' | 'protected';
  static: boolean;
}

export interface ImportInfo {
  source: string;
  imports: string[];
  isDefault: boolean;
  isNamespace: boolean;
}

export interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'variable' | 'type' | 'interface';
  isDefault: boolean;
}

export interface CodeAnalysis {
  language: string;
  functions: FunctionInfo[];
  classes: ClassInfo[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  dependencies: string[];
  complexity: number;
  lineCount: number;
}

// TypeScript/JavaScript 분석
export function analyzeTypeScript(code: string): CodeAnalysis {
  const functions: FunctionInfo[] = [];
  const classes: ClassInfo[] = [];
  const imports: ImportInfo[] = [];
  const exports: ExportInfo[] = [];
  const dependencies: string[] = [];
  const lines = code.split('\n');

  // Import 분석
  const importRegex = /import\s+(?:(\w+)\s*,?\s*)?(?:\{([^}]+)\})?\s*(?:from\s+)?['"]([^'"]+)['"]/g;
  const importTypeRegex = /import\s+type\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;

  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const defaultImport = match[1];
    const namedImports = match[2]?.split(',').map(s => s.trim().split(' as ')[0].trim()).filter(Boolean) || [];
    const source = match[3];

    imports.push({
      source,
      imports: defaultImport ? [defaultImport, ...namedImports] : namedImports,
      isDefault: !!defaultImport,
      isNamespace: false
    });

    if (!source.startsWith('.') && !source.startsWith('@/')) {
      dependencies.push(source.split('/')[0]);
    }
  }

  // 함수 분석
  const functionRegex = /(?:(export)\s+)?(?:(async)\s+)?function\s+(\w+)\s*(?:<[^>]+>)?\s*\(([^)]*)\)(?:\s*:\s*([^\s{]+))?\s*\{/g;
  const arrowFunctionRegex = /(?:(export)\s+)?(?:const|let|var)\s+(\w+)\s*(?::\s*[^=]+)?\s*=\s*(?:(async)\s+)?\([^)]*\)\s*(?::\s*([^\s=]+))?\s*=>/g;

  while ((match = functionRegex.exec(code)) !== null) {
    const lineNumber = code.substring(0, match.index).split('\n').length;
    functions.push({
      name: match[3],
      params: match[4].split(',').map(p => p.trim().split(':')[0].trim()).filter(Boolean),
      returnType: match[5],
      async: !!match[2],
      exported: !!match[1],
      lineNumber
    });
  }

  while ((match = arrowFunctionRegex.exec(code)) !== null) {
    const lineNumber = code.substring(0, match.index).split('\n').length;
    functions.push({
      name: match[2],
      params: [],
      returnType: match[4],
      async: !!match[3],
      exported: !!match[1],
      lineNumber
    });
  }

  // 클래스 분석
  const classRegex = /(?:(export)\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?\s*\{/g;

  while ((match = classRegex.exec(code)) !== null) {
    const className = match[2];
    const lineNumber = code.substring(0, match.index).split('\n').length;

    // 클래스 본문 추출
    const classStart = match.index + match[0].length;
    let braceCount = 1;
    let classEnd = classStart;

    for (let i = classStart; i < code.length && braceCount > 0; i++) {
      if (code[i] === '{') braceCount++;
      if (code[i] === '}') braceCount--;
      classEnd = i;
    }

    const classBody = code.substring(classStart, classEnd);
    const methods: FunctionInfo[] = [];
    const properties: PropertyInfo[] = [];

    // 메서드 추출
    const methodRegex = /(?:(public|private|protected)\s+)?(?:(static)\s+)?(?:(async)\s+)?(\w+)\s*\([^)]*\)/g;
    let methodMatch;
    while ((methodMatch = methodRegex.exec(classBody)) !== null) {
      if (!['constructor', 'if', 'for', 'while', 'switch'].includes(methodMatch[4])) {
        methods.push({
          name: methodMatch[4],
          params: [],
          async: !!methodMatch[3],
          exported: false,
          lineNumber: lineNumber + classBody.substring(0, methodMatch.index).split('\n').length
        });
      }
    }

    classes.push({
      name: className,
      methods,
      properties,
      extends: match[3],
      implements: match[4]?.split(',').map(s => s.trim()),
      exported: !!match[1],
      lineNumber
    });
  }

  // Export 분석
  const exportRegex = /export\s+(?:(default)\s+)?(?:const|let|var|function|class|type|interface)\s+(\w+)/g;
  while ((match = exportRegex.exec(code)) !== null) {
    const exportType = code.substring(match.index).match(/export\s+(?:default\s+)?(const|let|var|function|class|type|interface)/)?.[1];
    exports.push({
      name: match[2],
      type: exportType as any || 'variable',
      isDefault: !!match[1]
    });
  }

  // 복잡도 계산 (간단한 휴리스틱)
  const complexity = calculateComplexity(code);

  return {
    language: 'typescript',
    functions,
    classes,
    imports,
    exports,
    dependencies: [...new Set(dependencies)],
    complexity,
    lineCount: lines.length
  };
}

// Python 분석
export function analyzePython(code: string): CodeAnalysis {
  const functions: FunctionInfo[] = [];
  const classes: ClassInfo[] = [];
  const imports: ImportInfo[] = [];
  const exports: ExportInfo[] = [];
  const dependencies: string[] = [];
  const lines = code.split('\n');

  // Import 분석
  const importRegex = /^(?:from\s+(\S+)\s+)?import\s+(.+)$/gm;
  let match;

  while ((match = importRegex.exec(code)) !== null) {
    const source = match[1] || match[2].split(',')[0].trim().split(' as ')[0];
    const importNames = match[2].split(',').map(s => s.trim().split(' as ')[0].trim());

    imports.push({
      source,
      imports: importNames,
      isDefault: !match[1],
      isNamespace: false
    });

    const pkgName = source.split('.')[0];
    if (!pkgName.startsWith('.')) {
      dependencies.push(pkgName);
    }
  }

  // 함수 분석
  const functionRegex = /^(\s*)(?:(async)\s+)?def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*(\S+))?:/gm;

  while ((match = functionRegex.exec(code)) !== null) {
    const indent = match[1].length;
    const lineNumber = code.substring(0, match.index).split('\n').length;

    // 독스트링 추출
    const afterDef = code.substring(match.index + match[0].length);
    const docstringMatch = afterDef.match(/^\s*[']{3}([\s\S]*?)[']{3}|^\s*["]{3}([\s\S]*?)["]{3}/);

    functions.push({
      name: match[3],
      params: match[4].split(',').map(p => p.trim().split(':')[0].split('=')[0].trim()).filter(Boolean),
      returnType: match[5],
      async: !!match[2],
      exported: indent === 0 && !match[3].startsWith('_'),
      lineNumber,
      docstring: docstringMatch?.[1] || docstringMatch?.[2]
    });
  }

  // 클래스 분석
  const classRegex = /^class\s+(\w+)(?:\(([^)]*)\))?:/gm;

  while ((match = classRegex.exec(code)) !== null) {
    const className = match[1];
    const lineNumber = code.substring(0, match.index).split('\n').length;
    const parentClasses = match[2]?.split(',').map(s => s.trim()) || [];

    classes.push({
      name: className,
      methods: [],
      properties: [],
      extends: parentClasses[0],
      implements: parentClasses.slice(1),
      exported: !className.startsWith('_'),
      lineNumber
    });
  }

  const complexity = calculateComplexity(code);

  return {
    language: 'python',
    functions,
    classes,
    imports,
    exports,
    dependencies: [...new Set(dependencies)],
    complexity,
    lineCount: lines.length
  };
}

// Go 분석
export function analyzeGo(code: string): CodeAnalysis {
  const functions: FunctionInfo[] = [];
  const classes: ClassInfo[] = [];
  const imports: ImportInfo[] = [];
  const exports: ExportInfo[] = [];
  const dependencies: string[] = [];
  const lines = code.split('\n');

  // Import 분석
  const singleImportRegex = /import\s+"([^"]+)"/g;
  const multiImportRegex = /import\s+\(([\s\S]*?)\)/g;

  let match;
  while ((match = singleImportRegex.exec(code)) !== null) {
    imports.push({
      source: match[1],
      imports: [match[1].split('/').pop() || match[1]],
      isDefault: false,
      isNamespace: false
    });
    dependencies.push(match[1].split('/')[0]);
  }

  while ((match = multiImportRegex.exec(code)) !== null) {
    const importBlock = match[1];
    const importLines = importBlock.match(/"([^"]+)"/g) || [];

    for (const imp of importLines) {
      const source = imp.replace(/"/g, '');
      imports.push({
        source,
        imports: [source.split('/').pop() || source],
        isDefault: false,
        isNamespace: false
      });
      dependencies.push(source.split('/')[0]);
    }
  }

  // 함수 분석
  const functionRegex = /func\s+(?:\((\w+)\s+\*?(\w+)\)\s+)?(\w+)\s*\(([^)]*)\)(?:\s*\(([^)]*)\)|\s*(\w+))?\s*\{/g;

  while ((match = functionRegex.exec(code)) !== null) {
    const lineNumber = code.substring(0, match.index).split('\n').length;
    const isMethod = !!match[1];
    const funcName = match[3];

    functions.push({
      name: funcName,
      params: match[4].split(',').map(p => p.trim().split(' ')[0]).filter(Boolean),
      returnType: match[5] || match[6],
      async: false,
      exported: funcName[0] === funcName[0].toUpperCase(),
      lineNumber
    });
  }

  // Struct 분석 (Go의 클래스 역할)
  const structRegex = /type\s+(\w+)\s+struct\s*\{/g;

  while ((match = structRegex.exec(code)) !== null) {
    const structName = match[1];
    const lineNumber = code.substring(0, match.index).split('\n').length;

    classes.push({
      name: structName,
      methods: [],
      properties: [],
      exported: structName[0] === structName[0].toUpperCase(),
      lineNumber
    });
  }

  const complexity = calculateComplexity(code);

  return {
    language: 'go',
    functions,
    classes,
    imports,
    exports,
    dependencies: [...new Set(dependencies)],
    complexity,
    lineCount: lines.length
  };
}

// 복잡도 계산 (Cyclomatic Complexity 근사)
function calculateComplexity(code: string): number {
  let complexity = 1;

  // 조건문/반복문 카운트
  const patterns = [
    /\bif\b/g,
    /\belse\s+if\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /\?\s*.*\s*:/g,  // 삼항 연산자
    /&&/g,
    /\|\|/g
  ];

  for (const pattern of patterns) {
    const matches = code.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  }

  return complexity;
}

// 언어 감지 및 분석
export function analyzeCode(code: string, language?: string): CodeAnalysis {
  const detectedLanguage = language || detectLanguageForAnalysis(code);

  switch (detectedLanguage) {
    case 'typescript':
    case 'javascript':
      return analyzeTypeScript(code);
    case 'python':
      return analyzePython(code);
    case 'go':
      return analyzeGo(code);
    default:
      return {
        language: detectedLanguage,
        functions: [],
        classes: [],
        imports: [],
        exports: [],
        dependencies: [],
        complexity: calculateComplexity(code),
        lineCount: code.split('\n').length
      };
  }
}

function detectLanguageForAnalysis(code: string): string {
  if (/^import\s+.*from\s+['"]|:\s*(string|number|boolean)\b/.test(code)) {
    return 'typescript';
  }
  if (/^def\s+\w+|^class\s+\w+.*:$/m.test(code)) {
    return 'python';
  }
  if (/^package\s+\w+|^func\s+/.test(code)) {
    return 'go';
  }
  if (/^const\s+|^let\s+|^function\s+/.test(code)) {
    return 'javascript';
  }
  return 'unknown';
}
