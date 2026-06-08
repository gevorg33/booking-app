import {
  N99_PHRASING_MEMORY_SCENARIOS,
  N99_PHRASING_MEMORY_TRIM_SCENARIOS,
} from './ai-n99-phrasing-memory.fixtures.js';
import {
  applyPhrasingMemoryGrounding,
  resolveActionFromPhrasingMemory,
  trimNeedlessClarifyIssuesFromPhrasing,
} from './ai-n99-phrasing-memory.util.js';

describe('ai-n99-phrasing-memory.util (n99-2.3)', () => {
  it.each(N99_PHRASING_MEMORY_SCENARIOS)(
    '$id resolves recurring business phrasing without clarify',
    (scenario) => {
      const result = applyPhrasingMemoryGrounding({
        prompt: scenario.prompt,
        action: scenario.action,
        params: { ...scenario.params },
        surface: scenario.surface,
        entityMemory: scenario.entityMemory,
        actionConfidence:
          'actionConfidence' in scenario ? scenario.actionConfidence : undefined,
      });

      if ('expectFilled' in scenario && scenario.expectFilled) {
        for (const [key, value] of Object.entries(scenario.expectFilled)) {
          expect(result.params[key]).toEqual(value);
        }
      }

      if ('expectAction' in scenario && scenario.expectAction) {
        expect(result.action).toBe(scenario.expectAction);
      }

      if ('expectActionSource' in scenario && scenario.expectActionSource) {
        expect(result.actionSource).toBe(scenario.expectActionSource);
      }

      if ('expectAlias' in scenario && scenario.expectAlias) {
        expect(result.matchedAliases).toContain(scenario.expectAlias);
      }
    },
  );

  it.each(N99_PHRASING_MEMORY_TRIM_SCENARIOS)(
    '$id trims clarify issues inferable from phrasing memory',
    (scenario) => {
      const trimmed = trimNeedlessClarifyIssuesFromPhrasing({
        prompt: scenario.prompt,
        action: scenario.action,
        params: scenario.params,
        issues: scenario.issues.map((issue) => ({
          field: issue.field,
          message: issue.message,
          example: '',
        })),
        entityMemory: scenario.entityMemory,
        surface: 'dashboard',
      });
      for (const field of scenario.expectTrimmedFields) {
        expect(trimmed.some((issue) => issue.field === field)).toBe(false);
      }
    },
  );

  it('resolveActionFromPhrasingMemory prefers business paraphrase on unknown', () => {
    const resolved = resolveActionFromPhrasingMemory({
      prompt: 'fill gevorg gaps this week',
      action: 'unknown',
      actionConfidence: 0.4,
      surface: 'dashboard',
      entityMemory: {
        aliases: {},
        paraphrases: [
          {
            id: 'biz-1',
            phrase: 'fill gevorg gaps this week',
            normalizedPhrase: 'fill gevorg gaps this week',
            action: 'fill_unused_slots',
            surface: 'dashboard',
            source: 'correction',
            hitCount: 2,
            learnedAt: '2026-06-01T00:00:00.000Z',
          },
        ],
      },
    });
    expect(resolved.action).toBe('fill_unused_slots');
    expect(resolved.source).toBe('business_paraphrase');
  });
});
