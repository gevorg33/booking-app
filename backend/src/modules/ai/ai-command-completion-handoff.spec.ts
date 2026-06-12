import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { COMPLETION_VALIDATE_HANDOFF_PIPE_MARKER } from './command-completion-handoff.fixtures.js';

const AI_COMMAND_SERVICE_SOURCE = readFileSync(
  join(__dirname, 'ai-command.service.ts'),
  'utf8',
);
const COMPOUND_GRAPH_SOURCE = readFileSync(
  join(__dirname, 'compound-command-graph.service.ts'),
  'utf8',
);

describe('AiCommandService completion validate handoff (pipe-1.8.2)', () => {
  it('delegates resolve+validate to runCompletionValidateHandoff', () => {
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      'runCompletionValidateHandoff(',
    );
    expect(AI_COMMAND_SERVICE_SOURCE).not.toMatch(
      /if \(shouldValidateAction\(parsed\.action\)\) \{\s*const validation = this\.completionPipeline\.validate/,
    );

    const handoffIndex = AI_COMMAND_SERVICE_SOURCE.indexOf(
      'runCompletionValidateHandoff(',
    );
    const switchIndex = AI_COMMAND_SERVICE_SOURCE.indexOf(
      'switch (parsed.action)',
    );
    expect(handoffIndex).toBeGreaterThan(-1);
    expect(switchIndex).toBeGreaterThan(handoffIndex);
  });

  it('uses pipe-1.8.2 marker contract', () => {
    expect(COMPLETION_VALIDATE_HANDOFF_PIPE_MARKER).toBe('pipe-1.8.2');
  });
});

describe('CompoundCommandGraphService completion validate handoff (pipe-1.8.2)', () => {
  it('delegates resolve+validate to runCompletionValidateHandoff', () => {
    expect(COMPOUND_GRAPH_SOURCE).toContain('runCompletionValidateHandoff(');
    expect(COMPOUND_GRAPH_SOURCE).not.toContain('shouldValidateAction');
  });
});
