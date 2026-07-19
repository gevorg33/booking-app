import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  MultiServiceSelectionDto,
  PublicPackageQuoteDto,
} from './public-booking.dto.js';
import {
  PublicBookingManageCancelDto,
  PublicBookingManageQueryDto,
  PublicReviewContextQueryDto,
} from './public-customer-booking.dto.js';

describe('public booking UUID DTO validation — e2e-bug.117', () => {
  const bad = 'not-a-uuid';
  const good = '11111111-1111-4111-8111-111111111111';

  async function expectUuidFieldRejected(
    Cls: new () => object,
    plain: Record<string, unknown>,
    property: string,
  ) {
    const dto = plainToInstance(Cls, plain);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === property)).toBe(true);
  }

  it('rejects non-UUID packageId on quote', async () => {
    await expectUuidFieldRejected(
      PublicPackageQuoteDto,
      { packageId: bad },
      'packageId',
    );
  });

  it('rejects non-UUID serviceIds on multi-service preview', async () => {
    await expectUuidFieldRejected(
      MultiServiceSelectionDto,
      { serviceIds: [good, bad] },
      'serviceIds',
    );
  });

  it('rejects non-UUID bookingId on manage query/cancel and review context', async () => {
    await expectUuidFieldRejected(
      PublicBookingManageQueryDto,
      { bookingId: bad, token: 'tok' },
      'bookingId',
    );
    await expectUuidFieldRejected(
      PublicBookingManageCancelDto,
      { bookingId: bad, token: 'tok' },
      'bookingId',
    );
    await expectUuidFieldRejected(
      PublicReviewContextQueryDto,
      { bookingId: bad, token: 'tok' },
      'bookingId',
    );
  });

  it('accepts valid UUIDs', async () => {
    for (const [Cls, plain] of [
      [PublicPackageQuoteDto, { packageId: good }],
      [MultiServiceSelectionDto, { serviceIds: [good, good] }],
      [PublicBookingManageQueryDto, { bookingId: good, token: 'tok' }],
      [PublicReviewContextQueryDto, { bookingId: good, token: 'tok' }],
    ] as const) {
      const errors = await validate(plainToInstance(Cls, plain));
      expect(errors).toHaveLength(0);
    }
  });
});
