import { describe, it, expect } from 'vitest';
import { parseDateKey } from './date-key-parse.util';

describe('date-key-parse.util', () => {
  it('parses valid iso day keys at UTC noon', () => {
    expect(parseDateKey('2026-06-04')?.toISOString()).toBe('2026-06-04T12:00:00.000Z');
  });

  it('rejects malformed or invalid calendar keys', () => {
    expect(parseDateKey('bad')).toBeNull();
    expect(parseDateKey('2026-13-40')).toBeNull();
    expect(parseDateKey('not-a-key')).toBeNull();
  });
});
