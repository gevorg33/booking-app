import { describe, expect, it } from 'vitest';
import {
  buildPublicAssistantStarterChips,
  resolvePublicAssistantStarterSurface,
} from './public-assistant-starter-chips.util';
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

describe('public-assistant-starter-chips.util (ai-cmd-customer-4.9.2)', () => {
  it.each([
    { pathname: '/book/demo/checkout', expected: 'checkout' },
    { pathname: '/book/demo/services', expected: 'service-list' },
    { pathname: '/book/demo/professionals', expected: null },
    { pathname: '/book/demo', expected: null },
  ] as const)('resolvePublicAssistantStarterSurface $pathname', ({ pathname, expected }) => {
    expect(resolvePublicAssistantStarterSurface(pathname)).toBe(expected);
  });

  it('buildPublicAssistantStarterChips returns checkout prompts', () => {
    expect(buildPublicAssistantStarterChips('/book/demo/checkout', t)).toEqual(
      CONSUMER_AI_PAGE_SUGGESTIONS_EN.book.map((prompt, index) => ({
        id: `checkout-public.pageSuggestions.book.${['amountDue', 'payCash', 'whyEmail'][index]}`,
        label: prompt,
        prompt,
      })),
    );
  });

  it('buildPublicAssistantStarterChips interpolates service name on service list', () => {
    const chips = buildPublicAssistantStarterChips('/book/demo/services', t, {
      services: [{ id: 's1', name: 'Haircut' }],
    });
    expect(chips[0]?.prompt).toBe('How much is Haircut?');
    expect(chips[1]?.prompt).toBe('Do I pay online for Haircut?');
    expect(chips[2]?.prompt).toBe('What can I book without paying online?');
  });

  it('returns empty array on unsupported routes', () => {
    expect(buildPublicAssistantStarterChips('/book/demo', t)).toEqual([]);
  });
});
