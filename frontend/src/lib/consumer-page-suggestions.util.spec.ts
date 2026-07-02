import { describe, expect, it } from 'vitest';
import {
  buildPublicPageSuggestions,
  resolveConsumerPageSuggestionId,
} from './consumer-page-suggestions.util';
import { CONSUMER_AI_PAGE_SUGGESTIONS_EN } from './consumer-page-suggestions.types';
import en from '@/i18n/messages/en';

const t = (key: string) => {
  const parts = key.split('.');
  let node: unknown = en;
  for (const part of parts) {
    node = (node as Record<string, unknown>)?.[part];
  }
  return typeof node === 'string' ? node : key;
};

describe('consumer-page-suggestions.util (ai-cmd-customer-4.9.1)', () => {
  it.each([
    { pathname: '/book/demo/checkout', search: '', expected: 'book' },
    { pathname: '/book/demo/services', search: '', expected: 'service-list' },
    {
      pathname: '/book/demo/manage',
      search: '?bookingId=b1&token=t1',
      expected: 'manage-booking',
    },
    { pathname: '/book/demo/manage', search: '', expected: 'manage-booking-guest' },
    { pathname: '/book/demo/account', search: '', expected: 'account' },
    { pathname: '/book/demo', search: '', expected: 'salon-home' },
    { pathname: '/book/demo/any', search: '', expected: 'multi-service-picker' },
    { pathname: '/book/demo/gift-cards/checkout', search: '', expected: 'gift-card-checkout' },
    { pathname: '/book/demo/multi/checkout', search: '', expected: 'multi-service-checkout' },
    { pathname: '/book/demo/packages/spa-day', search: '', expected: 'package-confirm' },
  ] as const)('resolveConsumerPageSuggestionId $pathname', ({ pathname, search, expected }) => {
    expect(resolveConsumerPageSuggestionId(pathname, search)).toBe(expected);
  });

  it('buildPublicPageSuggestions localizes checkout chips from en catalog', () => {
    expect(buildPublicPageSuggestions('/book/demo/checkout', t)).toEqual(
      CONSUMER_AI_PAGE_SUGGESTIONS_EN.book,
    );
  });

  it('exports English defaults for AI_PAGE_SUGGESTIONS mirror', () => {
    expect(CONSUMER_AI_PAGE_SUGGESTIONS_EN['salon-home']).toContain(
      "What's the cheapest service?",
    );
  });
});
