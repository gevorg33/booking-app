import { describe, expect, it } from '@jest/globals';
import {
  isUnscopedCustomerCountPrompt,
  resolveCustomerMetric,
  rescueUnscopedCustomerCountIntent,
  isCustomerRetentionRatePrompt,
  rescueCustomerRetentionRateIntent,
} from './ai-intent-heuristics.js';

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

  it('e2e-bug.155 — cancellation totals route to overview (not ranking)', () => {
    expect(
      resolveCustomerMetric({}, 'How many cancellations have I had in total?'),
    ).toBe('overview');
    expect(
      resolveCustomerMetric({}, 'How many cancellations across all customers?'),
    ).toBe('overview');
    expect(
      resolveCustomerMetric({}, 'Which customers have the most cancellations'),
    ).toBe('most_cancellations');
  });

  describe('e2e-bug.153 — unscoped customer roster totals', () => {
    it.each([
      'How many customers do I have?',
      'How many customers do I have in total?',
      'What is my total number of customers?',
      'How many clients do I have?',
      'Customers in total',
    ])(
      'routes roster count to overview (overrides ranking params): %s',
      (prompt) => {
        expect(isUnscopedCustomerCountPrompt(prompt)).toBe(true);
        expect(resolveCustomerMetric({}, prompt)).toBe('overview');
        expect(
          resolveCustomerMetric({ customerMetric: 'most_no_shows' }, prompt),
        ).toBe('overview');
        expect(
          rescueUnscopedCustomerCountIntent(prompt, 'summarize_customers'),
        ).toEqual({
          action: 'summarize_customers',
          customerMetric: 'overview',
          rescueReason: 'unscoped_customer_count',
        });
        expect(
          rescueUnscopedCustomerCountIntent(prompt, 'list_customers')?.action,
        ).toBe('summarize_customers');
      },
    );

    it('does not steal ranking or segment prompts', () => {
      expect(
        isUnscopedCustomerCountPrompt('Which customer has the most no-shows?'),
      ).toBe(false);
      expect(
        isUnscopedCustomerCountPrompt('How many VIP customers do I have?'),
      ).toBe(false);
      expect(
        isUnscopedCustomerCountPrompt(
          'How many cancellations have I had in total?',
        ),
      ).toBe(false);
      expect(
        resolveCustomerMetric({}, 'Find customers with the most no-shows'),
      ).toBe('most_no_shows');
    });
  });

  describe('e2e-bug.137 — customer retention rate has no react_agent tool', () => {
    it('detects retention-rate phrasing', () => {
      expect(
        isCustomerRetentionRatePrompt('What is my customer retention rate?'),
      ).toBe(true);
      expect(
        isCustomerRetentionRatePrompt(
          'How many returning customers do I have?',
        ),
      ).toBe(true);
      expect(isCustomerRetentionRatePrompt('Are customers coming back?')).toBe(
        true,
      );
    });

    it('does not steal unrelated customer prompts', () => {
      expect(
        isCustomerRetentionRatePrompt('Which customer has the most no-shows?'),
      ).toBe(false);
      expect(
        isCustomerRetentionRatePrompt('How many customers do I have?'),
      ).toBe(false);
    });

    it('resolves the retention metric via resolveCustomerMetric', () => {
      expect(
        resolveCustomerMetric({}, 'What is my customer retention rate?'),
      ).toBe('retention');
    });

    it('rescues unknown/react_agent into summarize_customers with retention metric', () => {
      expect(
        rescueCustomerRetentionRateIntent(
          'What is my customer retention rate?',
          'react_agent',
        ),
      ).toEqual({
        action: 'summarize_customers',
        customerMetric: 'retention',
        rescueReason: 'customer_retention_rate',
      });
      expect(
        rescueCustomerRetentionRateIntent(
          'What is my customer retention rate?',
          'unknown',
        ),
      ).not.toBeNull();
    });

    it('does not rescue unrelated actions or non-matching prompts', () => {
      expect(
        rescueCustomerRetentionRateIntent(
          'What is my customer retention rate?',
          'cancel_my_booking',
        ),
      ).toBeNull();
      expect(
        rescueCustomerRetentionRateIntent(
          'How many customers do I have?',
          'unknown',
        ),
      ).toBeNull();
    });
  });
});
