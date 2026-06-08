import {
  buildBusinessParaphraseEntry,
  businessParaphrasesToSemanticEntries,
  matchBusinessLearnedParaphrase,
  mergeBusinessParaphrases,
  normalizeBusinessParaphrasePrompt,
  shouldLearnBusinessParaphrase,
} from './ai-business-paraphrase.util.js';
import { BUSINESS_PARAPHRASE_SCENARIOS } from './ai-business-paraphrase.fixtures.js';

describe('ai-business-paraphrase.util (acc-3.13)', () => {
  it.each(BUSINESS_PARAPHRASE_SCENARIOS)(
    'scenario $id — build and match expectations',
    (scenario) => {
      const entry = buildBusinessParaphraseEntry({
        prompt: scenario.prompt,
        action: scenario.action,
        surface: scenario.surface,
        source: scenario.source,
        hitCount: scenario.hitCount,
      });

      if (scenario.id === 'biz-paraphrase-skip-short') {
        expect(entry).toBeNull();
        expect(shouldLearnBusinessParaphrase(scenario.prompt, scenario.action)).toBe(
          false,
        );
        return;
      }

      expect(entry).toEqual(
        expect.objectContaining({
          phrase: scenario.prompt,
          action: scenario.action,
          surface: scenario.surface,
          source: scenario.source,
        }),
      );

      const stored = mergeBusinessParaphrases([], [entry!]);
      const match = matchBusinessLearnedParaphrase(
        scenario.prompt,
        stored,
        scenario.surface,
      );
      expect(match?.action).toBe(scenario.action);
      expect(match?.source).toBe('business_learned');
    },
  );

  it('mergeBusinessParaphrases increments hitCount and keeps correction action', () => {
    const recurring = buildBusinessParaphraseEntry({
      prompt: 'pull the morning sheet',
      action: 'list_bookings',
      surface: 'dashboard',
      source: 'recurring',
    })!;
    const correction = buildBusinessParaphraseEntry({
      prompt: 'pull the morning sheet',
      action: 'export_bookings',
      surface: 'dashboard',
      source: 'correction',
    })!;

    const merged = mergeBusinessParaphrases([recurring], [correction, recurring]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.action).toBe('export_bookings');
    expect(merged[0]?.source).toBe('correction');
    expect(merged[0]?.hitCount).toBe(3);
  });

  it('businessParaphrasesToSemanticEntries tags business_learned source', () => {
    const entry = buildBusinessParaphraseEntry({
      prompt: 'pull the morning sheet',
      action: 'list_bookings',
      surface: 'dashboard',
      source: 'correction',
    })!;
    expect(businessParaphrasesToSemanticEntries([entry])).toEqual([
      expect.objectContaining({
        id: entry.id,
        source: 'business_learned',
      }),
    ]);
  });

  it('normalizeBusinessParaphrasePrompt collapses whitespace', () => {
    expect(normalizeBusinessParaphrasePrompt('  Pull   THE   sheet  ')).toBe(
      'pull the sheet',
    );
  });
});
