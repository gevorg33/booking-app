import {
  assertClarifyFollowupEvalGate,
  buildClarifyFollowupEvalGateReport,
  proposeClarifyFollowupFloorBump,
} from './ai-n99-clarify-followup-gate.util.js';
import { CLARIFY_FOLLOWUP_RATCHET_SCENARIOS } from './ai-n99-clarify-followup-gate.fixtures.js';
import type { AiCommandEvalCase, AiEvalCaseResult } from './ai-command-eval.types.js';

function result(id: string, passed: boolean): AiEvalCaseResult {
  return { id, passed, errors: passed ? [] : ['failed'] };
}

describe('ai-n99-clarify-followup-gate.util (n99-1.9)', () => {
  it.each(CLARIFY_FOLLOWUP_RATCHET_SCENARIOS)(
    '$id clarify_followup ratchet proposal',
    ({ currentFloor, measuredAccuracy, expectBump, expectNextFloor }) => {
      const proposal = proposeClarifyFollowupFloorBump({
        currentFloor,
        measuredAccuracy,
      });
      expect(proposal.shouldBump).toBe(expectBump);
      expect(proposal.proposedFloor).toBeCloseTo(expectNextFloor, 3);
    },
  );

  it('buildClarifyFollowupEvalGateReport enforces EN/HY/RU locale floors', () => {
    const cases: AiCommandEvalCase[] = [
      { id: 'en-1', prompt: 'a', locale: 'en', expect: {} },
      { id: 'en-2', prompt: 'b', locale: 'en', expect: {} },
      { id: 'hy-1', prompt: 'c', locale: 'hy', expect: {} },
      { id: 'hy-2', prompt: 'd', locale: 'hy', expect: {} },
      { id: 'ru-1', prompt: 'e', locale: 'ru', expect: {} },
      { id: 'ru-2', prompt: 'f', locale: 'ru', expect: {} },
    ];
    const results = cases.map((entry) => result(entry.id, true));

    const report = buildClarifyFollowupEvalGateReport({
      cases,
      results,
      baseline: { clarifyFollowupFloor: 0.95, clarifyFollowupMinCases: 6 },
    });

    expect(report.gatePassed).toBe(true);
    expect(report.localeScores.map((score) => score.locale)).toEqual(['en', 'hy', 'ru']);
    expect(() => assertClarifyFollowupEvalGate(report)).not.toThrow();
  });

  it('assertClarifyFollowupEvalGate fails when a primary locale is below floor', () => {
    const cases: AiCommandEvalCase[] = [
      { id: 'en-1', prompt: 'a', locale: 'en', expect: {} },
      { id: 'en-2', prompt: 'b', locale: 'en', expect: {} },
      { id: 'hy-1', prompt: 'c', locale: 'hy', expect: {} },
      { id: 'hy-2', prompt: 'd', locale: 'hy', expect: {} },
      { id: 'ru-1', prompt: 'e', locale: 'ru', expect: {} },
      { id: 'ru-2', prompt: 'f', locale: 'ru', expect: {} },
    ];
    const results = cases.map((entry, index) => result(entry.id, index !== 4));

    const report = buildClarifyFollowupEvalGateReport({
      cases,
      results,
      baseline: { clarifyFollowupFloor: 0.95, clarifyFollowupMinCases: 6 },
    });

    expect(report.gatePassed).toBe(false);
    expect(() => assertClarifyFollowupEvalGate(report)).toThrow(/RU accuracy/i);
  });
});
