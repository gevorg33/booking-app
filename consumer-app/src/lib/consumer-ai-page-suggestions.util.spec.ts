import { describe, expect, it } from 'vitest';
import { CONSUMER_COPY_EN } from './consumer-copy-catalog.js';
import {
  buildConsumerPageSuggestions,
  resolveConsumerPageSuggestionId,
} from './consumer-ai-page-suggestions.util.js';

describe('consumer-ai-page-suggestions.util (ai-cmd-customer-4.9.1)', () => {
  it.each([
    { pathname: '/s/demo/book/haircut-id', search: '', expected: 'book' },
    {
      pathname: '/s/demo/manage',
      search: '?bookingId=b1&token=t1',
      expected: 'manage-booking',
    },
    { pathname: '/s/demo/manage', search: '', expected: 'manage-booking-guest' },
    { pathname: '/s/demo/account', search: '', expected: 'account' },
    { pathname: '/s/demo/home', search: '', expected: 'salon-home' },
    { pathname: '/s/demo/book/any', search: '', expected: 'multi-service-picker' },
    { pathname: '/s/demo/gift-cards/checkout', search: '', expected: 'gift-card-checkout' },
    { pathname: '/s/demo/book/multi/checkout', search: '', expected: 'multi-service-checkout' },
    { pathname: '/s/demo/book/packages/spa-day', search: '', expected: 'package-confirm' },
    { pathname: '/s/demo/lab-to-book', search: '', expected: 'lab-to-book' },
    { pathname: '/s/demo/results', search: '', expected: 'my-results' },
    { pathname: '/', search: '', expected: 'welcome' },
  ] as const)('resolveConsumerPageSuggestionId $pathname', ({ pathname, search, expected }) => {
    expect(resolveConsumerPageSuggestionId(pathname, search)).toBe(expected);
  });

  it('buildConsumerPageSuggestions returns book checkout chips', () => {
    expect(buildConsumerPageSuggestions(CONSUMER_COPY_EN, '/s/demo/book/massage')).toEqual([
      'How much do I pay today?',
      'Pay cash at visit',
      'Why do you need my email?',
    ]);
  });

  it('buildConsumerPageSuggestions returns account chips', () => {
    expect(buildConsumerPageSuggestions(CONSUMER_COPY_EN, '/s/demo/account')).toEqual([
      'My next appointment',
      'Turn off reminders',
      'Rebook last visit',
    ]);
  });
});
