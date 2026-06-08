import { describe, expect, it } from 'vitest';
import { matchesConsumerUniversalLinkPath } from './consumer-universal-link.util.js';

describe('consumer-universal-link.util', () => {
  it.each([
    ['/book/salon-a', true],
    ['/book/salon-a/checkout', true],
    ['/s/salon-a/book/svc-1', true],
    ['/dashboard', false],
  ] as const)('matchesConsumerUniversalLinkPath(%s)', (path, expected) => {
    expect(matchesConsumerUniversalLinkPath(path)).toBe(expected);
  });
});
