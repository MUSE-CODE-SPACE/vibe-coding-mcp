#!/usr/bin/env node
/**
 * MCP 서버 실제 동작 테스트
 */

const SERVER_URL = 'https://vibe-coding-mcp-production.up.railway.app';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

async function testTool(toolName, args) {
  console.log(`\n${CYAN}테스트: ${toolName}${RESET}`);

  try {
    // SSE 연결로 세션 ID 획득
    const sseResponse = await fetch(`${SERVER_URL}/sse`, {
      headers: { 'Accept': 'text/event-stream' }
    });

    const reader = sseResponse.body.getReader();
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);

    // 세션 ID 파싱
    const match = text.match(/sessionId=([a-f0-9-]+)/);
    if (!match) {
      throw new Error('세션 ID를 찾을 수 없음');
    }
    const sessionId = match[1];
    reader.cancel();

    // 도구 호출
    const messageResponse = await fetch(`${SERVER_URL}/message?sessionId=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      })
    });

    const result = await messageResponse.json();

    if (result.error) {
      console.log(`${RED}✗ 에러: ${result.error.message}${RESET}`);
      return false;
    }

    console.log(`${GREEN}✓ 성공${RESET}`);

    // 결과 미리보기
    if (result.result?.content?.[0]?.text) {
      const preview = result.result.content[0].text.substring(0, 200);
      console.log(`  ${YELLOW}결과 미리보기:${RESET} ${preview}...`);
    }

    return true;
  } catch (error) {
    console.log(`${RED}✗ 실패: ${error.message}${RESET}`);
    return false;
  }
}

async function main() {
  console.log(`${YELLOW}=== Vibe Coding MCP 서버 테스트 ===${RESET}`);
  console.log(`서버: ${SERVER_URL}\n`);

  // 서버 상태 확인
  console.log(`${CYAN}서버 상태 확인...${RESET}`);
  const statusRes = await fetch(SERVER_URL);
  const status = await statusRes.json();
  console.log(`${GREEN}✓ 서버 실행 중${RESET}`);
  console.log(`  도구: ${status.tools.join(', ')}\n`);

  let passed = 0;
  let failed = 0;

  // 1. collect_code_context 테스트
  if (await testTool('collect_code_context', {
    codeBlocks: [{ language: 'typescript', code: 'const hello = "world";' }],
    conversationSummary: '간단한 변수 선언'
  })) passed++; else failed++;

  // 2. summarize_design_decisions 테스트
  if (await testTool('summarize_design_decisions', {
    conversationLog: 'I decided to use TypeScript for type safety. I chose React because of its ecosystem.'
  })) passed++; else failed++;

  // 3. generate_dev_document 테스트
  if (await testTool('generate_dev_document', {
    documentType: 'README',
    title: 'Test Project',
    description: '테스트용 프로젝트입니다.',
    features: ['기능1', '기능2']
  })) passed++; else failed++;

  // 4. normalize_for_platform 테스트
  if (await testTool('normalize_for_platform', {
    document: '# Test\n- [ ] Todo\n- [x] Done',
    platform: 'notion'
  })) passed++; else failed++;

  // 5. create_session_log 테스트
  if (await testTool('create_session_log', {
    title: '테스트 세션',
    summary: 'MCP 서버 테스트를 진행했습니다.',
    tags: ['test', 'mcp']
  })) passed++; else failed++;

  // 6. publish_document 테스트 (Obsidian - API 키 불필요)
  if (await testTool('publish_document', {
    document: '# Test Document\n\nThis is a test.',
    title: 'Test',
    platform: 'obsidian'
  })) passed++; else failed++;

  console.log(`\n${YELLOW}=== 테스트 결과 ===${RESET}`);
  console.log(`${GREEN}통과: ${passed}${RESET}`);
  console.log(`${RED}실패: ${failed}${RESET}`);
  console.log(`총: ${passed + failed}\n`);

  if (failed === 0) {
    console.log(`${GREEN}✓ 모든 테스트 통과! PlayMCP 등록 가능합니다.${RESET}\n`);
  }
}

main().catch(console.error);
