import { readStoredStrategyEval } from './strategy-eval.types.js';

describe('strategy-eval.types', () => {
  it('returns empty object when strategyEval is missing', () => {
    expect(readStoredStrategyEval(undefined)).toEqual({});
    expect(readStoredStrategyEval({})).toEqual({});
  });

  it('reads nested strategyEval payload', () => {
    expect(
      readStoredStrategyEval({
        strategyEval: {
          hipaa: { answers: { handles_phi: 'no' } },
        },
      }),
    ).toEqual({
      hipaa: { answers: { handles_phi: 'no' } },
    });
  });
});
