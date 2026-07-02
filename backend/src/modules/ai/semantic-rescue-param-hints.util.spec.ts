import { SEMANTIC_RESCUE_PARAM_HINTS_SCENARIOS } from './semantic-rescue-param-hints.fixtures.js';
import {
  applySemanticParamHintsToRescueInput,
  enrichRescueResultWithSemanticParamHints,
  mergeSemanticParamHintsOnly,
  resolveSemanticWinnerCandidate,
  resolveSemanticWinnerParamHints,
  SEMANTIC_RESCUE_PARAM_HINTS_MARKER,
} from './semantic-rescue-param-hints.util.js';

describe('semantic-rescue-param-hints.util (pipe-1.5.2)', () => {
  it('exports pipe marker', () => {
    expect(SEMANTIC_RESCUE_PARAM_HINTS_MARKER).toBe('pipe-1.5.2');
  });

  it('mergeSemanticParamHintsOnly fills gaps without overwriting', () => {
    expect(
      mergeSemanticParamHintsOnly(
        { bookingFirstAvailable: false, serviceName: 'trim' },
        { bookingFirstAvailable: true, allProviders: true },
      ),
    ).toEqual({
      bookingFirstAvailable: false,
      serviceName: 'trim',
      allProviders: true,
    });
  });

  it.each(SEMANTIC_RESCUE_PARAM_HINTS_SCENARIOS)(
    'resolveSemanticWinnerParamHints $id',
    (scenario) => {
      expect(resolveSemanticWinnerParamHints(scenario.candidates)).toEqual(
        scenario.expectedHints,
      );
    },
  );

  it.each(SEMANTIC_RESCUE_PARAM_HINTS_SCENARIOS)(
    'resolveSemanticWinnerCandidate $id',
    (scenario) => {
      const winner = resolveSemanticWinnerCandidate(scenario.candidates);
      if (Object.keys(scenario.expectedHints).length === 0) {
        const hasSemantic = scenario.candidates.some(
          (c) => c.source === 'semantic_match',
        );
        if (!hasSemantic) {
          expect(winner).toBeNull();
        }
        return;
      }
      expect(winner?.source).toBe('semantic_match');
      expect(winner?.paramHints).toEqual(scenario.expectedHints);
    },
  );

  it('applySemanticParamHintsToRescueInput threads hints into params', () => {
    const input = applySemanticParamHintsToRescueInput({
      prompt: 'schedule anna',
      action: 'unknown',
      params: {},
      semanticParamHints: { bookingFirstAvailable: true },
    });
    expect(input.params).toEqual({ bookingFirstAvailable: true });
    expect(input.action).toBe('unknown');
  });

  it('enrichRescueResultWithSemanticParamHints preserves rescued params', () => {
    const enriched = enrichRescueResultWithSemanticParamHints(
      {
        action: 'create_booking',
        params: { employeeName: 'Anna' },
        rescued: true,
        rescueReason: 'create_booking_pattern',
      },
      { bookingFirstAvailable: true },
    );
    expect(enriched?.params).toEqual({
      employeeName: 'Anna',
      bookingFirstAvailable: true,
    });
  });
});
