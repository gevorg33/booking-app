import { PrepaymentMode } from '../service/entities/service.entity.js';
import { handleFindSoonestAppointmentLogic } from './ai-find-soonest-appointment.logic.js';
import type { PaymentsLogicDeps } from './ai-payments.logic.js';

const services = [
  {
    id: 's1',
    name: 'Trim',
    businessId: 'biz-1',
    price: 30,
    currency: 'USD',
    durationMinutes: 30,
    isActive: true,
    prepaymentMode: PrepaymentMode.NONE,
    depositAmount: null,
  },
  {
    id: 's2',
    name: 'Massage',
    businessId: 'biz-1',
    price: 80,
    currency: 'USD',
    durationMinutes: 60,
    isActive: true,
    prepaymentMode: PrepaymentMode.NONE,
    depositAmount: null,
  },
] as const;

function buildDeps(
  overrides: Partial<PaymentsLogicDeps> = {},
): PaymentsLogicDeps {
  return {
    giftCardsService: {} as PaymentsLogicDeps['giftCardsService'],
    giftCardPurchaseService: {} as PaymentsLogicDeps['giftCardPurchaseService'],
    giftCardOrderService: {} as PaymentsLogicDeps['giftCardOrderService'],
    giftCardRefundService: {} as PaymentsLogicDeps['giftCardRefundService'],
    publicBookingService: {
      findNearestBookableSlotAcrossWindows: jest.fn(async () => ({
        slot: {
          employeeId: 'e1',
          employeeName: 'Anna',
          dateKey: '2026-06-26',
          startTime: '2026-06-26T10:00:00.000Z',
        },
        windowIndex: 0,
        timeOfDay: null,
        dateKeys: ['2026-06-26'],
      })),
    } as unknown as PaymentsLogicDeps['publicBookingService'],
    accountingIntegrationService:
      {} as PaymentsLogicDeps['accountingIntegrationService'],
    commissionsService: {} as PaymentsLogicDeps['commissionsService'],
    subscriptionsService: {} as PaymentsLogicDeps['subscriptionsService'],
    bookingRepo: {} as PaymentsLogicDeps['bookingRepo'],
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        slug: 'salon',
        timezone: 'UTC',
        settings: {},
      })),
    } as unknown as PaymentsLogicDeps['businessRepo'],
    serviceRepo: {
      find: jest.fn(async () => [...services]),
    } as unknown as PaymentsLogicDeps['serviceRepo'],
    giftCardRepo: {} as PaymentsLogicDeps['giftCardRepo'],
    serviceService: {} as PaymentsLogicDeps['serviceService'],
    ...overrides,
  };
}

describe('ai-find-soonest-appointment.logic (ai-cmd-customer-4.1.3)', () => {
  it('requires a service when none is named', async () => {
    const result = await handleFindSoonestAppointmentLogic(
      buildDeps(),
      'biz-1',
      {},
      'Earliest slot this week',
    );
    expect(result.success).toBe(false);
    expect(result.action).toBe('find_soonest_appointment');
    expect((result.details as { clarify?: boolean }).clarify).toBe(true);
  });

  it('returns the soonest opening without booking', async () => {
    const result = await handleFindSoonestAppointmentLogic(
      buildDeps(),
      'biz-1',
      { serviceName: 'Trim' },
      "Who's free soonest for a trim?",
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('find_soonest_appointment');
    expect(result.summary).toContain('Soonest opening');
    expect(result.summary).toContain('Anna');
    expect(
      (result.details as { bookingFirstAvailable: boolean })
        .bookingFirstAvailable,
    ).toBe(true);
  });

  it('reports no slots when nearest scan is empty', async () => {
    const result = await handleFindSoonestAppointmentLogic(
      buildDeps({
        publicBookingService: {
          findNearestBookableSlotAcrossWindows: jest.fn(async () => null),
        } as unknown as PaymentsLogicDeps['publicBookingService'],
      }),
      'biz-1',
      { serviceName: 'Massage' },
      'Earliest massage appointment',
    );
    expect(result.success).toBe(false);
    expect(result.action).toBe('find_soonest_appointment');
    expect(result.summary).toContain('No bookable slot');
  });
});
