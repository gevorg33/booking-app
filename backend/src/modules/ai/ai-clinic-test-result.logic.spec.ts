import { MemberRole } from '../business/entities/business-member.entity.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  handleEnterTestResultLogic,
  handleReleaseTestResultLogic,
} from './ai-clinic-test-result.logic.js';
import { ENTER_TEST_RESULT_PROMPTS } from './ai-clinic-test-result.fixtures.js';

describe('ai-clinic-test-result.logic', () => {
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      timezone: 'UTC',
      settings: { businessType: 'clinic' },
    })),
  };
  const bookingRepo = {
    find: jest.fn(async () => [
      {
        id: 'booking-1',
        businessId: 'biz-1',
        customerId: 'cust-1',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-08T10:00:00.000Z'),
        customer: { id: 'cust-1', name: 'Maria Lopez' },
      },
    ]),
    findOne: jest.fn(async () => null),
  };
  const resultRepo = {
    find: jest.fn(async (opts?: { select?: string[] }) => {
      if (opts?.select) {
        return [{ id: 'result-1', orderId: 'order-abc123' }];
      }
      return [
        {
          id: 'result-1',
          businessId: 'biz-1',
          orderId: 'order-abc123',
          customerId: 'cust-1',
          status: 'Reviewed',
        },
      ];
    }),
    findOne: jest.fn(
      async ({ where }: { where: { id?: string; orderId?: string } }) => {
        if (where.orderId === 'abc123') {
          return {
            id: 'result-1',
            businessId: 'biz-1',
            orderId: 'order-abc123',
          };
        }
        if (where.id === 'result-1') {
          return {
            id: 'result-1',
            businessId: 'biz-1',
            orderId: 'order-abc123',
            status: 'Reviewed',
          };
        }
        return null;
      },
    ),
  };
  const clinicTestResultService = {
    enterManualMeasurement: jest.fn(async () => ({
      result: {
        id: 'result-1',
        orderId: 'order-abc123',
        status: 'Completed',
      },
      measurement: { id: 'measurement-1' },
    })),
  };
  const clinicTestResultActionService = {
    markAsReleased: jest.fn(async () => ({
      id: 'result-1',
      orderId: 'order-abc123',
      status: 'Released',
      releasedAt: new Date('2026-06-08T12:00:00.000Z'),
    })),
  };
  const clinicLabAccessService = {
    assertResultLabAccess: jest.fn(async () => ({
      ctx: {
        userId: 'user-1',
        membershipRole: MemberRole.MANAGER,
        employeeId: 'emp-1',
      },
      bookingAccess: null,
    })),
  };

  const deps = {
    businessRepo,
    bookingRepo,
    resultRepo,
    clinicTestResultService,
    clinicTestResultActionService,
    clinicLabAccessService,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns preview before confirming enter_test_result', async () => {
    const prompt = ENTER_TEST_RESULT_PROMPTS[0].prompt;
    const preview = await handleEnterTestResultLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      prompt,
      false,
    );
    expect(preview.success).toBe(true);
    expect(preview.details?.requiresConfirmation).toBe(true);
    expect(
      clinicTestResultService.enterManualMeasurement,
    ).not.toHaveBeenCalled();
  });

  it('records measurement after confirmation', async () => {
    const prompt = ENTER_TEST_RESULT_PROMPTS[0].prompt;
    const result = await handleEnterTestResultLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      prompt,
      true,
    );
    expect(result.success).toBe(true);
    expect(clinicTestResultService.enterManualMeasurement).toHaveBeenCalledWith(
      expect.objectContaining({
        measurementCode: 'WBC',
        value: '12.5',
        orderId: 'abc123',
      }),
    );
  });

  it('blocks enter_test_result for non-clinic businesses', async () => {
    businessRepo.findOne.mockResolvedValueOnce({
      id: 'biz-1',
      settings: { businessType: 'salon' },
    });
    const result = await handleEnterTestResultLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      ENTER_TEST_RESULT_PROMPTS[0].prompt,
      true,
    );
    expect(result.success).toBe(false);
    expect(result.details?.clinicOnly).toBe(true);
  });

  it('releases reviewed result after confirmation', async () => {
    const preview = await handleReleaseTestResultLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Release test result for order abc123',
      false,
    );
    expect(preview.details?.requiresConfirmation).toBe(true);

    const result = await handleReleaseTestResultLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Release test result for order abc123',
      true,
    );
    expect(result.success).toBe(true);
    expect(clinicTestResultActionService.markAsReleased).toHaveBeenCalled();
  });
});
