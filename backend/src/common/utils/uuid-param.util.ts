import { BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';

/**
 * e2e-bug.117 — reject non-UUID id params before they hit Postgres uuid columns
 * and leak `invalid input syntax for type uuid` as HTTP 500.
 */
export function assertUuid(
  value: string | undefined | null,
  fieldName: string,
): asserts value is string {
  if (typeof value !== 'string' || !isUUID(value)) {
    throw new BadRequestException(`${fieldName} must be a UUID`);
  }
}

/** Optional query/body ids: skip when absent, validate when present. */
export function assertUuidIfPresent(
  value: string | undefined | null,
  fieldName: string,
): void {
  if (value == null || value === '') return;
  assertUuid(value, fieldName);
}

export function assertUuidList(
  values: readonly string[] | undefined | null,
  fieldName: string,
): void {
  if (!values?.length) return;
  for (const value of values) {
    assertUuid(value, fieldName);
  }
}
