import {
  N99_SCREEN_GROUNDING_SCENARIOS,
  N99_SCREEN_GROUNDING_TRIM_SCENARIOS,
} from './ai-n99-screen-grounding.fixtures.js';
import {
  applyScreenContextGrounding,
  readScreenContext,
  resolveRequestScreenContext,
  trimNeedlessClarifyIssuesFromScreen,
} from './ai-n99-screen-grounding.util.js';

describe('ai-n99-screen-grounding.util (n99-2.2)', () => {
  it.each(N99_SCREEN_GROUNDING_SCENARIOS)('$id grounds deictic prompt from screen', (scenario) => {
    const result = applyScreenContextGrounding({
      prompt: scenario.prompt,
      action: scenario.action,
      params: { ...scenario.params },
      screenContext: scenario.screenContext,
    });
    for (const [key, value] of Object.entries(scenario.expectFilled)) {
      expect(result.params[key]).toEqual(value);
    }
  });

  it.each(N99_SCREEN_GROUNDING_TRIM_SCENARIOS)(
    '$id trims clarify issues inferable from screen',
    (scenario) => {
      const trimmed = trimNeedlessClarifyIssuesFromScreen({
        action: scenario.action,
        params: scenario.params,
        issues: scenario.issues.map((issue) => ({
          field: issue.field,
          message: issue.message,
          example: '',
        })),
        screenContext: scenario.screenContext,
      });
      for (const field of scenario.expectTrimmedFields) {
        expect(trimmed.some((issue) => issue.field === field)).toBe(false);
      }
    },
  );

  it('readScreenContext unwraps nested context object', () => {
    expect(
      readScreenContext({
        context: { bookingId: 'bk-nested' },
        customerName: 'Maria',
      }),
    ).toEqual({
      bookingId: 'bk-nested',
      customerName: 'Maria',
    });
  });

  it('resolveRequestScreenContext prefers request over session', () => {
    expect(
      resolveRequestScreenContext(
        { bookingId: 'bk-req', customerName: 'Anna' },
        { bookingId: 'bk-old', lastEmployeeName: 'Sam' },
      ),
    ).toEqual({
      bookingId: 'bk-req',
      customerName: 'Anna',
      lastEmployeeName: 'Sam',
    });
  });
});
