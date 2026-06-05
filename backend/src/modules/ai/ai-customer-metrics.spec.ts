import { describe, expect, it } from '@jest/globals';
import { resolveCustomerMetric } from './ai-intent-heuristics.js';

describe('Sprint 18 customer page AI metrics', () => {
  it('maps no-show discovery prompts', () => {
    expect(
      resolveCustomerMetric({}, 'Find customers with the most no-shows'),
    ).toBe('most_no_shows');
    expect(
      resolveCustomerMetric({}, 'Which customer has the most no-shows?'),
    ).toBe('most_no_shows');
  });

  it('maps re-engagement and inactive prompts to at_risk', () => {
    expect(resolveCustomerMetric({}, 'Re-engage inactive customers')).toBe(
      'at_risk',
    );
    expect(resolveCustomerMetric({}, 'Win back lapsed clients')).toBe(
      'at_risk',
    );
    expect(resolveCustomerMetric({}, 'Show inactive customers')).toBe(
      'at_risk',
    );
  });

  it('respects explicit customerMetric param', () => {
    expect(resolveCustomerMetric({ customerMetric: 'vip' }, 'anything')).toBe(
      'vip',
    );
  });
});
