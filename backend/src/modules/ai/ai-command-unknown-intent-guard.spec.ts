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
    // e2e-bug.529 — this searched for
    // "parsed.action === 'unknown' && isClearSchedulePrompt", i.e. two terms
    // adjacent on one line. The guard itself is intact and still in the right
    // place (the clear rescue, the vertical rescue and the unknown guard sit in
    // that order in ai-command.service.ts); what changed is that the condition
    // gained a `!skipClassifierRescues &&` term and prettier wrapped it across
    // four lines, so the two searched terms are no longer neighbours.
    //
    // A source-text ordering test can only be as stable as the smallest string
    // it can anchor on. Anchor on the call itself, which is what the assertion
    // is really about, rather than on one particular formatting of the
    // condition around it.
    const clearRescueIndex = AI_COMMAND_SERVICE_SOURCE.indexOf(
      'isClearSchedulePrompt(effectivePrompt)',
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
