import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { handleSummarizeCustomerTaxPaidLogic } from './ai-business-tax.logic.js';
import { SUMMARIZE_CUSTOMER_TAX_PAID_PROMPTS } from './ai-summarize-customer-tax-paid.fixtures.js';
import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import type { Booking } from '../booking/entities/booking.entity.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';

describe('ai summarize customer tax paid integration (ai-cmd-tax-13)', () => {
  const business: Business = {
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: {},
  } as Business;

  const bookings: Booking[] = [
    {
      id: 'bk-1',
      businessId: 'biz-1',
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      startTime: new Date().toISOString(),
      metadata: {
        pricing: { amountDue: 120, taxAmount: 20, taxEnabled: true },
      },
      customer: { id: 'cust-1', name: 'Jane Doe' },
      service: { id: 'svc-1', name: 'Massage' },
    } as Booking,
    {
      id: 'bk-2',
      businessId: 'biz-1',
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      startTime: new Date().toISOString(),
      metadata: {
        pricing: { amountDue: 113, taxAmount: 13, taxEnabled: true },
      },
      customer: { id: 'cust-1', name: 'Jane Doe' },
      service: { id: 'svc-2', name: 'Facial' },
    } as Booking,
    {
      id: 'bk-3',
      businessId: 'biz-1',
      status: BookingStatus.COMPLETED,
      paymentStatus: PaymentStatus.PENDING,
      startTime: new Date().toISOString(),
      metadata: {
        pricing: { amountDue: 100, taxAmount: 10, taxEnabled: true },
      },
      customer: { id: 'cust-1', name: 'Jane Doe' },
      service: { id: 'svc-3', name: 'Consult' },
    } as Booking,
  ];

  const businessRepo = {
    findOne: jest.fn(async () => ({ ...business })),
    save: jest.fn(async (b: Business) => b),
  };
  const serviceRepo = {
    find: jest.fn(async () => [] as Service[]),
    save: jest.fn(async (service: Service) => service),
  };
  const bookingRepo = {
    findOne: jest.fn(async () => bookings[0]),
    find: jest.fn(async () => bookings.map((booking) => ({ ...booking }))),
  };

  const deps = () => ({ businessRepo, serviceRepo, bookingRepo });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    bookingRepo.find.mockResolvedValue(
      bookings.map((booking) => ({ ...booking })),
    );
    rescue = new AiIntentRescueService();
  });

  it.each(SUMMARIZE_CUSTOMER_TAX_PAID_PROMPTS)(
    'rescues summarize customer tax paid $id',
    async ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('summarize_customer_tax_paid');
    },
  );

  it('sums tax paid from paid appointment metadata', async () => {
    const result = await handleSummarizeCustomerTaxPaidLogic(
      deps(),
      'biz-1',
      { customerName: 'Jane' },
      'How much tax has Jane paid across her appointments?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('summarize_customer_tax_paid');
    expect(result.summary).toContain('$33.00 tax');
    expect(result.details?.totalTaxPaid).toBe(33);
    expect(result.details?.appointmentsWithTax).toBe(2);
  });
});
