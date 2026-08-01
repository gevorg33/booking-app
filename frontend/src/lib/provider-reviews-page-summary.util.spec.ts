import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  resolveProviderReviewsPageSummary,
  shouldShowProviderReviewsPageSummary,
} from './provider-reviews-page-summary.util';
import { ProviderReviewSummary } from '@/components/public-booking/provider-reviews';

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === 'public.providerReviewSummary') {
        return `${params?.rating} (${params?.count} reviews)`;
      }
      return key;
    },
    locale: 'en',
  }),
}));

describe('provider-reviews-page-summary.util (e2e-bug.210)', () => {
  it.each([
    {
      id: 'has-reviews',
      averageRating: 3.7,
      reviewCount: 7,
      expected: true,
    },
    {
      id: 'zero-count',
      averageRating: 5,
      reviewCount: 0,
      expected: false,
    },
    {
      id: 'null-average',
      averageRating: null,
      reviewCount: 3,
      expected: false,
    },
    {
      id: 'undefined-average',
      averageRating: undefined,
      reviewCount: 3,
      expected: false,
    },
    {
      id: 'nan-average',
      averageRating: Number.NaN,
      reviewCount: 2,
      expected: false,
    },
    {
      id: 'string-count-coerced',
      averageRating: 4.2,
      reviewCount: '6' as unknown as number,
      expected: true,
    },
  ])(
    'shouldShowProviderReviewsPageSummary: $id',
    ({ averageRating, reviewCount, expected }) => {
      expect(
        shouldShowProviderReviewsPageSummary({ averageRating, reviewCount }),
      ).toBe(expected);
    },
  );

  it('resolveProviderReviewsPageSummary returns numeric payload', () => {
    expect(
      resolveProviderReviewsPageSummary({
        averageRating: 3.7,
        reviewCount: 7,
      }),
    ).toEqual({ averageRating: 3.7, reviewCount: 7 });
  });

  it('resolveProviderReviewsPageSummary returns null when empty', () => {
    expect(
      resolveProviderReviewsPageSummary({
        averageRating: null,
        reviewCount: 0,
      }),
    ).toBeNull();
  });

  it('ProviderReviewSummary renders rating + count (page header reuse)', () => {
    const html = renderToStaticMarkup(
      createElement(ProviderReviewSummary, {
        averageRating: 3.7,
        reviewCount: 7,
        primaryColor: '#fbbf24',
      }),
    );
    expect(html).toContain('data-testid="provider-review-summary"');
    expect(html).toContain('3.7 (7 reviews)');
    expect(html).toContain('aria-label="3.7 out of 5 stars"');
  });
});
