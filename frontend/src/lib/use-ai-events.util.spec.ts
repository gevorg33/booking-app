import { describe, expect, it } from 'vitest';
import { parseAiAlertPayload } from './use-ai-events.util';

describe('use-ai-events.util', () => {
  it('parses valid alert payloads', () => {
    expect(
      parseAiAlertPayload({
        alertType: 'conflict',
        title: 'Conflict',
        message: 'Overlap',
        prompt: 'Fix it',
        taskId: 't1',
        route: '/dashboard/ai-ops',
      }),
    ).toEqual({
      alertType: 'conflict',
      title: 'Conflict',
      message: 'Overlap',
      prompt: 'Fix it',
      taskId: 't1',
      route: '/dashboard/ai-ops',
    });
  });

  it('allows optional prompt, taskId, and route to be omitted', () => {
    expect(
      parseAiAlertPayload({
        alertType: 'approval',
        title: 'Approve',
        message: 'Plan ready',
      }),
    ).toEqual({
      alertType: 'approval',
      title: 'Approve',
      message: 'Plan ready',
      prompt: undefined,
      taskId: undefined,
      route: undefined,
    });
  });

  it('rejects invalid alert types or missing fields', () => {
    expect(parseAiAlertPayload({ alertType: 'other', title: 'x', message: 'y' })).toBeNull();
    expect(parseAiAlertPayload({ alertType: 'conflict', title: 1, message: 'y' })).toBeNull();
    expect(parseAiAlertPayload({})).toBeNull();
  });
});
