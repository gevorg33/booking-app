import { BadRequestException } from '@nestjs/common';
import {
  assertUuid,
  assertUuidIfPresent,
  assertUuidList,
} from './uuid-param.util.js';

describe('uuid-param.util — e2e-bug.117', () => {
  const valid = '11111111-1111-4111-8111-111111111111';

  it('accepts a valid UUID', () => {
    expect(() => assertUuid(valid, 'bookingId')).not.toThrow();
  });

  it('rejects garbage ids with a clean 400 (no Postgres leak)', () => {
    expect(() => assertUuid('not-a-uuid', 'bookingId')).toThrow(
      BadRequestException,
    );
    expect(() => assertUuid('not-a-uuid', 'bookingId')).toThrow(
      'bookingId must be a UUID',
    );
  });

  it('assertUuidIfPresent skips empty and validates present', () => {
    expect(() => assertUuidIfPresent(undefined, 'employeeId')).not.toThrow();
    expect(() => assertUuidIfPresent('', 'employeeId')).not.toThrow();
    expect(() => assertUuidIfPresent('bad', 'employeeId')).toThrow(
      'employeeId must be a UUID',
    );
  });

  it('assertUuidList validates each entry', () => {
    expect(() => assertUuidList([valid, valid], 'serviceIds')).not.toThrow();
    expect(() => assertUuidList([valid, 'not-a-uuid'], 'serviceIds')).toThrow(
      'serviceIds must be a UUID',
    );
  });
});
