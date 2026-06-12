import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PIPELINE_MUTATING_ACTIONS_PIPE_MARKER } from './command-pipeline-mutating-actions.fixtures.js';

const AI_COMMAND_SERVICE_SOURCE = readFileSync(
  join(__dirname, 'ai-command.service.ts'),
  'utf8',
);

describe('AiCommandService pipeline mutating actions (pipe-1.9.1)', () => {
  it('uses shared mutating guard after completion validate handoff', () => {
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      'shouldBlockLowConfidencePipelineMutate(',
    );
    expect(AI_COMMAND_SERVICE_SOURCE).not.toContain(
      'const mutatingActions = new Set([',
    );

    const handoffIndex = AI_COMMAND_SERVICE_SOURCE.indexOf(
      'runCompletionValidateHandoff(',
    );
    const guardIndex = AI_COMMAND_SERVICE_SOURCE.indexOf(
      'shouldBlockLowConfidencePipelineMutate(',
    );
    const switchIndex = AI_COMMAND_SERVICE_SOURCE.indexOf(
      'switch (parsed.action)',
    );

    expect(handoffIndex).toBeGreaterThan(-1);
    expect(guardIndex).toBeGreaterThan(handoffIndex);
    expect(switchIndex).toBeGreaterThan(guardIndex);
  });

  it('uses pipe-1.9.1 marker contract', () => {
    expect(PIPELINE_MUTATING_ACTIONS_PIPE_MARKER).toBe('pipe-1.9.1');
  });
});
