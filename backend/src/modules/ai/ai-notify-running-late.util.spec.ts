import {
  NOTIFY_RUNNING_LATE_BOUNDARY_PROMPTS,
  NOTIFY_RUNNING_LATE_PROMPTS,
  NOTIFY_RUNNING_LATE_RESCUE_SCENARIOS,
} from './ai-notify-running-late.fixtures.js';
import { NOTIFY_RUNNING_LATE_MULTILINGUAL_SCENARIOS } from './ai-notify-running-late-multilingual.fixtures.js';
import {
  extractRunningLateMinutesFromCustomerPrompt,
  isNotifyRunningLateIntent,
  isNotifyRunningLatePrompt,
  parseNotifyRunningLateFromPrompt,
  rescueNotifyRunningLateIntent,
  enrichNotifyRunningLateParamsFromPrompt,
  buildNotifyRunningLateAmbiguousSummary,
} from './ai-notify-running-late.util.js';

describe('ai-notify-running-late.util (ai-cmd-customer-4.4.6)', () => {
  it.each(NOTIFY_RUNNING_LATE_PROMPTS.map((row) => [row.id, row.prompt]))(
    'detects prompt %s',
    (_id, prompt) => {
      expect(isNotifyRunningLatePrompt(prompt)).toBe(true);
    },
  );

  it.each(
    NOTIFY_RUNNING_LATE_MULTILINGUAL_SCENARIOS.map((row) => [
      row.id,
      row.prompt,
    ]),
  )('detects multilingual prompt %s', (_id, prompt) => {
    expect(isNotifyRunningLatePrompt(prompt)).toBe(true);
  });

  it.each(NOTIFY_RUNNING_LATE_BOUNDARY_PROMPTS)(
    'rejects boundary prompt $id',
    ({ prompt }) => {
      expect(isNotifyRunningLatePrompt(prompt)).toBe(false);
    },
  );

  it.each(NOTIFY_RUNNING_LATE_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueNotifyRunningLateIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('extracts minutes from prompt and params', () => {
    expect(
      extractRunningLateMinutesFromCustomerPrompt("I'm 15 minutes late", {}),
    ).toBe(15);
    expect(
      extractRunningLateMinutesFromCustomerPrompt('Running late', {
        minutesLate: 20,
      }),
    ).toBe(20);
  });

  it('parses notify_running_late params', () => {
    const parsed = parseNotifyRunningLateFromPrompt(
      'Tell them I am 20 min late for my haircut',
      {},
    );
    expect(parsed?.minutesLate).toBe(20);
    expect(parsed?.serviceName).toMatch(/haircut/i);
  });

  it('enriches params and builds ambiguous summary', () => {
    expect(
      enrichNotifyRunningLateParamsFromPrompt({}, "I'm 12 minutes late"),
    ).toMatchObject({ minutesLate: 12 });
    expect(
      buildNotifyRunningLateAmbiguousSummary([
        {
          startTime: new Date('2030-01-01T10:00:00.000Z'),
          service: { name: 'Facial' },
        },
      ]),
    ).toMatch(/Multiple upcoming bookings/);
  });

  it('recognizes notify_running_late intent', () => {
    expect(isNotifyRunningLateIntent('notify_running_late')).toBe(true);
  });
});
