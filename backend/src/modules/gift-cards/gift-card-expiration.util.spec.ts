import { BadRequestException } from '@nestjs/common';
import {
  parseExpiresAtDay,
  parseExpiresAtInput,
  resolveGiftCardExpirationUpdate,
} from './gift-card-expiration.util.js';

describe('gift-card-expiration.util', () => {
  const now = new Date('2026-06-01T12:00:00.000Z');

  it('parses YYYY-MM-DD to end of UTC day', () => {
    expect(parseExpiresAtDay('2027-01-15').toISOString()).toBe(
      '2027-01-15T23:59:59.999Z',
    );
  });

  it('rejects invalid day strings', () => {
    expect(() => parseExpiresAtDay('01-15-2027')).toThrow(BadRequestException);
  });

  it('parses ISO timestamps', () => {
    expect(parseExpiresAtInput('2027-06-01T00:00:00.000Z').toISOString()).toBe(
      '2027-06-01T00:00:00.000Z',
    );
  });

  it('clears expiration when expiresAt is null', () => {
    expect(
      resolveGiftCardExpirationUpdate(
        new Date('2027-01-01'),
        { expiresAt: null },
        now,
      ),
    ).toEqual({ expiresAt: null, action: 'clear' });
  });

  it('sets expiration from date key', () => {
    expect(
      resolveGiftCardExpirationUpdate(null, { expiresAt: '2028-03-20' }, now),
    ).toEqual({
      expiresAt: new Date('2028-03-20T23:59:59.999Z'),
      action: 'set',
    });
  });

  it('extends from future expiration', () => {
    const previous = new Date('2027-12-01T23:59:59.999Z');
    const result = resolveGiftCardExpirationUpdate(
      previous,
      { extendMonths: 2, extendDays: 5 },
      now,
    );
    expect(result.action).toBe('extend');
    const expectedMs =
      previous.getTime() +
      2 * 30 * 24 * 60 * 60 * 1000 +
      5 * 24 * 60 * 60 * 1000;
    expect(result.expiresAt?.getTime()).toBe(expectedMs);
  });

  it('extends from now when previous is past', () => {
    const previous = new Date('2020-01-01T00:00:00.000Z');
    const result = resolveGiftCardExpirationUpdate(
      previous,
      { extendDays: 10 },
      now,
    );
    expect(result.action).toBe('extend');
    expect(result.expiresAt!.getTime()).toBe(
      now.getTime() + 10 * 24 * 60 * 60 * 1000,
    );
  });

  it('rejects conflicting set and extend inputs', () => {
    expect(() =>
      resolveGiftCardExpirationUpdate(
        null,
        { expiresAt: '2028-01-01', extendDays: 1 },
        now,
      ),
    ).toThrow('not both');
  });

  it('rejects empty extend request', () => {
    expect(() =>
      resolveGiftCardExpirationUpdate(
        null,
        { extendMonths: 0, extendDays: 0 },
        now,
      ),
    ).toThrow('extendMonths or extendDays');
  });

  it('rejects invalid ISO timestamps', () => {
    expect(() => parseExpiresAtInput('not-a-date')).toThrow(
      BadRequestException,
    );
  });

  it('rejects negative extend values', () => {
    expect(() =>
      resolveGiftCardExpirationUpdate(null, { extendDays: -1 }, now),
    ).toThrow('non-negative');
  });

  it('rejects missing input', () => {
    expect(() => resolveGiftCardExpirationUpdate(null, {}, now)).toThrow(
      BadRequestException,
    );
  });
});
