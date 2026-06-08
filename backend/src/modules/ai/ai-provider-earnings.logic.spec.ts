import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import {
  handleSummarizeMyAppointmentsLogic,
  handleSummarizeMyRevenueLogic,
} from './ai-provider-earnings.logic.js';

describe('ai-provider-earnings.logic', () => {
  const bookingRepo = { find: jest.fn() };
  const commissionsService = { list: jest.fn() };
  const businessService = { findOne: jest.fn() };
  const providerMobile = {
    resolveMobileAccess: jest.fn(),
    getScopedEmployeeId: jest.fn(),
  };

  const deps = {
    bookingRepo: bookingRepo as any,
    commissionsService: commissionsService as any,
    businessService: businessService as any,
    providerMobile: providerMobile as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    providerMobile.resolveMobileAccess.mockResolvedValue({
      viewMode: 'provider',
      employee: { id: 'emp-1', name: 'Alex', userId: 'user-1' },
    });
    providerMobile.getScopedEmployeeId.mockReturnValue('emp-1');
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { currency: 'USD' },
    });
    commissionsService.list.mockResolvedValue([
      {
        id: 'rule-1',
        employeeId: 'emp-1',
        serviceId: 'svc-1',
        type: 'percent',
        value: 50,
        isActive: true,
      },
    ]);
  });

  it('returns appointment count for tomorrow', async () => {
    bookingRepo.find.mockResolvedValue([
      {
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-06-10T10:00:00.000Z'),
      },
      {
        status: BookingStatus.PENDING,
        startTime: new Date('2026-06-10T14:00:00.000Z'),
      },
    ]);

    const result = await handleSummarizeMyAppointmentsLogic(
      deps,
      'biz-1',
      'user-1',
      { date: '10/06/2026' },
      'How many appointments do I have tomorrow?',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('summarize_my_appointments');
    expect(result.summary).toContain('2 appointments');
  });

  it('returns net revenue with commission and tax excluded', async () => {
    bookingRepo.find.mockResolvedValue([
      {
        id: 'book-1',
        employeeId: 'emp-1',
        serviceId: 'svc-1',
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        service: { price: 80, currency: 'USD' },
        metadata: {
          pricing: {
            amountDue: 96,
            taxEnabled: true,
            taxAmount: 16,
            netAmount: 80,
            subtotal: 80,
          },
        },
        startTime: new Date('2026-06-09T10:00:00.000Z'),
      },
    ]);

    const result = await handleSummarizeMyRevenueLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'How much did I make today?',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('summarize_my_revenue');
    expect(result.summary).toContain('Net earnings');
    expect(result.details?.providerNet).toBe(40);
    expect(result.details?.taxExcluded).toBe(16);
  });

  it('requires a linked provider profile for revenue', async () => {
    providerMobile.resolveMobileAccess.mockResolvedValue({
      viewMode: 'team',
      employee: null,
    });

    const result = await handleSummarizeMyRevenueLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'How much did I make today?',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('Link a provider profile');
  });
});
