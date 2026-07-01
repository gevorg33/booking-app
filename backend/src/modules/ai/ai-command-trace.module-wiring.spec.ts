import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AI_COMMAND_TRACE_PIPE_MARKER } from './ai-command-trace.fixtures.js';
import { COMMAND_TRACE_RECORDER_PIPE_MARKER } from './ai-command-trace-recorder.fixtures.js';

const AI_MODULE_SOURCE = readFileSync(join(__dirname, 'ai.module.ts'), 'utf8');
const GATEWAY_SOURCE = readFileSync(
  join(__dirname, 'ai-gateway.service.ts'),
  'utf8',
);

describe('AiCommandTrace module wiring (pipe-1.10.1)', () => {
  it('registers entity and service in ai.module', () => {
    expect(AI_MODULE_SOURCE).toContain('AiCommandTrace');
    expect(AI_MODULE_SOURCE).toContain('AiCommandTraceService');
    expect(AI_COMMAND_TRACE_PIPE_MARKER).toBe('pipe-1.10.1');
  });
});

describe('AiCommandTrace gateway wiring (pipe-1.10.3)', () => {
  it('injects trace service and persists from gateway execute', () => {
    expect(GATEWAY_SOURCE).toContain('AiCommandTraceService');
    expect(GATEWAY_SOURCE).toContain('recordFireAndForget');
    expect(GATEWAY_SOURCE).toContain('COMMAND_TRACE_ID_CONTEXT_KEY');
    expect(COMMAND_TRACE_RECORDER_PIPE_MARKER).toBe('pipe-1.10.3');
  });
});
