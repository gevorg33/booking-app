import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import {
  handleListMyMultiServiceGroupsLogic,
  handleListMyPackageVisitsLogic,
  handleListPackageAppointmentsTodayLogic,
  handleProviderBookingCompoundLogic,
  handleProviderMarkPaidLogic,
  mergeProviderBookingCompoundContext,
  type ProviderBookingLogicDeps,
} from './ai-provider-booking.logic.js';

function buildDeps(
  overrides: Partial<ProviderBookingLogicDeps> = {},
): ProviderBookingLogicDeps {
  const packageBooking = {
    id: 'book-pkg-1',
    businessId: 'biz-1',
    employeeId: 'emp-1',
    packagePurchaseId: 'pkg-purchase-1',
    multiServiceGroupId: null,
    startTime: new Date(),
    status: BookingStatus.CONFIRMED,
    paymentStatus: PaymentStatus.PENDING,
    metadata: { payAtVenue: true },
    customer: { name: 'Anna' },
    service: { name: 'Massage' },
    employee: { name: 'Maria' },
  };
  const multiBooking = {
    id: 'book-ms-1',
    businessId: 'biz-1',
    employeeId: 'emp-1',
    packagePurchaseId: null,
    multiServiceGroupId: 'ms-group-1',
    startTime: new Date(),
    status: BookingStatus.CONFIRMED,
    paymentStatus: PaymentStatus.PENDING,
    metadata: {},
    customer: { name: 'John' },
    service: { name: 'Haircut' },
    employee: { name: 'Maria' },
  };
  const otherEmployeeBooking = {
    ...packageBooking,
    id: 'book-other',
    employeeId: 'emp-2',
  };

  return {
    bookingRepo: {
      find: jest.fn(async ({ where }: any) => {
        if (where.businessId === 'biz-1')
          return [packageBooking, multiBooking, otherEmployeeBooking];
        return [];
      }),
      findOne: jest.fn(async ({ where }: any) => {
        if (where.id === 'book-pkg-1') return packageBooking;
        if (where.id === 'book-other') return otherEmployeeBooking;
        return null;
      }),
    } as any,
    bookingService: {
      update: jest.fn(async (id, patch) => ({ id, ...patch })),
    } as any,
    ...overrides,
  };
}

describe('ai-provider-booking.logic', () => {
  it('lists scoped package appointments today', async () => {
    const result = await handleListPackageAppointmentsTodayLogic(
      buildDeps(),
      'biz-1',
      {
        sessionEmployeeId: 'emp-1',
      },
    );
    expect(result.success).toBe(true);
    expect((result.details as any).count).toBe(1);
  });

  it('lists scoped package visits and multi-service groups', async () => {
    expect(
      (
        await handleListMyPackageVisitsLogic(
          buildDeps(),
          'biz-1',
          'my package visits',
          { sessionEmployeeId: 'emp-1' },
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleListMyMultiServiceGroupsLogic(
          buildDeps(),
          'biz-1',
          'my multi-service groups',
          {
            sessionEmployeeId: 'emp-1',
          },
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleListMyPackageVisitsLogic(buildDeps(), 'biz-1', 'visits', {
          sessionEmployeeId: 'emp-99',
        })
      ).summary,
    ).toContain('No package visits');
  });

  it('marks paid for own booking and blocks other provider calendars', async () => {
    expect(
      (
        await handleProviderMarkPaidLogic(buildDeps(), 'biz-1', {
          bookingId: 'book-pkg-1',
          sessionEmployeeId: 'emp-1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleProviderMarkPaidLogic(buildDeps(), 'biz-1', {
          bookingId: 'book-other',
          sessionEmployeeId: 'emp-1',
        })
      ).success,
    ).toBe(false);
    expect(
      (await handleProviderMarkPaidLogic(buildDeps(), 'biz-1', {})).success,
    ).toBe(false);
  });

  it('runs compound flows and merges context', async () => {
    const compound = await handleProviderBookingCompoundLogic(
      buildDeps(),
      'biz-1',
      'Show my package appointments today and mark booking book-pkg-1 paid',
      { sessionEmployeeId: 'emp-1', userId: 'user-1' },
    );
    expect(compound.success).toBe(true);
    expect((compound.details as any).steps).toHaveLength(2);

    const ctx = mergeProviderBookingCompoundContext(
      {},
      { action: 'list_package_appointments_today', params: {}, segment: 'x' },
      {
        success: true,
        action: 'list_package_appointments_today',
        summary: 'ok',
        details: { bookings: [{ id: 'book-pkg-1' }] },
      },
    );
    expect(ctx.bookingId).toBe('book-pkg-1');

    const failed = await handleProviderBookingCompoundLogic(
      buildDeps(),
      'biz-1',
      'compound',
      {
        sessionEmployeeId: 'emp-1',
        compoundSteps: [
          {
            action: 'list_package_appointments_today',
            params: {},
            segment: 'list',
          },
          {
            action: 'mark_paid',
            params: { bookingId: 'missing' },
            segment: 'pay',
          },
        ],
      },
    );
    expect(failed.success).toBe(false);
    expect((failed.details as any).failedStep).toBe('mark_paid');

    expect(
      (
        await handleProviderBookingCompoundLogic(
          buildDeps(),
          'biz-1',
          'Show my package appointments today',
          {},
        )
      ).success,
    ).toBe(false);

    const unsupported = await handleProviderBookingCompoundLogic(
      buildDeps(),
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'list_package_appointments_today',
            params: {},
            segment: 'a',
          },
          { action: 'unsupported_action' as any, params: {}, segment: 'b' },
        ],
      },
    );
    expect(unsupported.success).toBe(false);

    const managerList = await handleListPackageAppointmentsTodayLogic(
      buildDeps(),
      'biz-1',
      {},
    );
    expect((managerList.details as any).count).toBe(2);

    const ctxWithSession = mergeProviderBookingCompoundContext(
      {},
      { action: 'mark_paid', params: {}, segment: 'x' },
      {
        success: true,
        action: 'mark_paid',
        summary: 'ok',
        details: {
          bookingId: 'book-pkg-1',
          sessionContext: { cartServiceIds: 'svc-1' },
        },
      },
    );
    expect((ctxWithSession as any).cartServiceIds).toBe('svc-1');

    const emptyToday = await handleListPackageAppointmentsTodayLogic(
      buildDeps({
        bookingRepo: {
          find: jest.fn(async () => [
            {
              id: 'book-ms-1',
              businessId: 'biz-1',
              employeeId: 'emp-1',
              packagePurchaseId: null,
              multiServiceGroupId: 'g1',
              startTime: new Date(),
            },
          ]),
          findOne: jest.fn(),
        } as any,
      }),
      'biz-1',
      { sessionEmployeeId: 'emp-1' },
    );
    expect(emptyToday.summary).toContain('No package appointments');

    const emptyMulti = await handleListMyMultiServiceGroupsLogic(
      buildDeps({
        bookingRepo: {
          find: jest.fn(async () => [
            {
              id: 'book-pkg-1',
              businessId: 'biz-1',
              employeeId: 'emp-1',
              packagePurchaseId: 'p1',
              multiServiceGroupId: null,
              startTime: new Date(),
            },
          ]),
          findOne: jest.fn(),
        } as any,
      }),
      'biz-1',
      'groups',
      { sessionEmployeeId: 'emp-1' },
    );
    expect(emptyMulti.summary).toContain('No multi-service groups');

    expect(
      (
        await handleProviderMarkPaidLogic(buildDeps(), 'biz-1', {
          sessionEmployeeId: 'emp-1',
          _prompt: 'mark booking book-pkg-1 paid',
        })
      ).success,
    ).toBe(true);

    expect(
      (
        await handleProviderMarkPaidLogic(buildDeps(), 'biz-1', {
          employeeId: 'emp-1',
          bookingId: 'book-pkg-1',
        })
      ).success,
    ).toBe(true);

    const noBookingIdCtx = mergeProviderBookingCompoundContext(
      {},
      { action: 'list_package_appointments_today', params: {}, segment: 'x' },
      {
        success: true,
        action: 'list_package_appointments_today',
        summary: 'ok',
        details: { bookings: [{}] },
      },
    );
    expect(noBookingIdCtx.bookingId).toBeUndefined();

    const markPaidCtx = mergeProviderBookingCompoundContext(
      {},
      { action: 'mark_paid', params: {}, segment: 'x' },
      {
        success: true,
        action: 'mark_paid',
        summary: 'ok',
        details: { bookingId: 'book-pkg-1' },
      },
    );
    expect(markPaidCtx.bookingId).toBe('book-pkg-1');

    const viaCompoundSteps = await handleProviderBookingCompoundLogic(
      buildDeps(),
      'biz-1',
      'compound',
      {
        sessionEmployeeId: 'emp-1',
        userId: 'user-1',
        compoundSteps: [
          { action: 'list_my_multi_service_groups', params: {}, segment: 'a' },
          { action: 'list_my_package_visits', params: {}, segment: 'b' },
        ],
      },
    );
    expect(viaCompoundSteps.success).toBe(true);
  });
});
