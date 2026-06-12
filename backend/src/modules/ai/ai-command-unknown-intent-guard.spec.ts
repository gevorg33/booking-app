import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { UNKNOWN_INTENT_GUARD_PIPE_MARKER } from './ai-unknown-intent.fixtures.js';

const AI_COMMAND_SERVICE_SOURCE = readFileSync(
  join(__dirname, 'ai-command.service.ts'),
  'utf8',
);

describe('AiCommandService unknown intent guard (pipe-1.8.1)', () => {
  it('blocks unknown from handler switch before resolve/validate/switch', () => {
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      'shouldBlockUnknownFromHandlerSwitch(parsed.action)',
    );
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      'buildUnknownIntentClarifyResult({',
    );

    const guardIndex = AI_COMMAND_SERVICE_SOURCE.indexOf(
      'shouldBlockUnknownFromHandlerSwitch(parsed.action)',
    );
    const resolveIndex = AI_COMMAND_SERVICE_SOURCE.indexOf(
      'runCompletionValidateHandoff(',
    );
    const switchIndex = AI_COMMAND_SERVICE_SOURCE.indexOf(
      'switch (parsed.action)',
    );

    expect(guardIndex).toBeGreaterThan(-1);
    expect(resolveIndex).toBeGreaterThan(guardIndex);
    expect(switchIndex).toBeGreaterThan(guardIndex);
  });

  it('runs post-rescue clear schedule and vertical rescue before unknown guard', () => {
    const clearRescueIndex = AI_COMMAND_SERVICE_SOURCE.indexOf(
      "parsed.action === 'unknown' && isClearSchedulePrompt",
    );
    const verticalRescueIndex = AI_COMMAND_SERVICE_SOURCE.indexOf(
      'this.platform.rescueVerticalIntent(',
    );
    const guardIndex = AI_COMMAND_SERVICE_SOURCE.indexOf(
      'shouldBlockUnknownFromHandlerSwitch(parsed.action)',
    );

    expect(clearRescueIndex).toBeGreaterThan(-1);
    expect(verticalRescueIndex).toBeGreaterThan(clearRescueIndex);
    expect(guardIndex).toBeGreaterThan(verticalRescueIndex);
  });

  it('does not route unknown through unwired default helper', () => {
    expect(AI_COMMAND_SERVICE_SOURCE).not.toContain("case 'unknown':");
    expect(AI_COMMAND_SERVICE_SOURCE).toContain('emitClarify(businessId');
  });

  it('uses pipe-1.8.1 marker from fixtures contract', () => {
    expect(UNKNOWN_INTENT_GUARD_PIPE_MARKER).toBe('pipe-1.8.1');
  });
});
