import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  E2E74_LIVE_CASES,
  E2E74_LOCK_SOURCE_RULES,
} from './e2e74-check-in-concurrency.fixtures.js';

describe('e2e-bug.74 check-in concurrency lock shape', () => {
  const source = readFileSync(
    resolve(__dirname, 'provider-booking-check-in.util.ts'),
    'utf8',
  );

  it.each(E2E74_LOCK_SOURCE_RULES)('$id', (rule) => {
    if ('mustContain' in rule && rule.mustContain) {
      expect(source).toContain(rule.mustContain);
    }
    if ('mustNotContain' in rule && rule.mustNotContain) {
      expect(source).not.toContain(rule.mustNotContain);
    }
  });

  it('documents every live QA case id', () => {
    expect(E2E74_LIVE_CASES.map((c) => c.id)).toEqual([
      'first-check-in-succeeds',
      'sequential-second-rejected',
      'concurrent-five-only-one-succeeds',
      'no-for-update-outer-join-500',
      'cancelled-booking-rejected',
    ]);
  });
});
