import { isPostgresUniqueViolation } from './postgres-error.util.js';

describe('isPostgresUniqueViolation', () => {
  it('api-bug.5 — detects Postgres 23505 on the error and wrapped driverError', () => {
    expect(isPostgresUniqueViolation({ code: '23505' })).toBe(true);
    expect(
      isPostgresUniqueViolation({
        message: 'QueryFailedError',
        driverError: { code: '23505' },
      }),
    ).toBe(true);
    expect(
      isPostgresUniqueViolation({
        message:
          'duplicate key value violates unique constraint "IDX_f60ed9c21a25fdc91a8d092d2b"',
      }),
    ).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isPostgresUniqueViolation(null)).toBe(false);
    expect(isPostgresUniqueViolation({ code: '23503' })).toBe(false);
    expect(isPostgresUniqueViolation(new Error('boom'))).toBe(false);
  });
});
