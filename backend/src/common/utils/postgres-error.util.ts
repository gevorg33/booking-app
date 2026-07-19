/**
 * True when an error is (or wraps) a Postgres unique_violation (SQLSTATE 23505).
 */
export function isPostgresUniqueViolation(err: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = err;
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);
    const code = (current as { code?: unknown }).code;
    if (code === '23505') return true;
    const message = (current as { message?: unknown }).message;
    if (
      typeof message === 'string' &&
      /duplicate key value violates unique constraint/i.test(message)
    ) {
      return true;
    }
    current =
      (current as { driverError?: unknown }).driverError ??
      (current as { cause?: unknown }).cause;
  }
  return false;
}
