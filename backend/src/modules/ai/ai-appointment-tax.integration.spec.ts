import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { handleExplainAppointmentTaxLogic } from './ai-business-tax.logic.js';
import { EXPLAIN_APPOINTMENT_TAX_PROMPTS } from './ai-appointment-tax.fixtures.js';
import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import type { Booking } from '../booking/entities/booking.entity.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';

describe('ai appointment tax integration (ai-cmd-tax-11)', () => {
  const business: Business = {
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: {},
  } as Business;

  const booking: Booking = {
    id: 'bk-tax-001',
    businessId: 'biz-1',
    employeeId: 'emp-1',
    status: BookingStatus.CONFIRMED,
    paymentStatus: PaymentStatus.PAID,
    startTime: new Date().toISOString(),
    metadata: {
      pricing: {
        amountDue: 120,
        taxEnabled: true,
        taxName: 'VAT',
        taxRate: 20,
        taxModel: 'exclusive',
        taxAmount: 20,
        netAmount: 100,
      },
    },
    customer: { id: 'cust-1', name: 'Jane Doe' },
    service: { id: 'svc-1', name: 'Massage', price: 100, currency: 'USD' },
  } as Booking;

  const businessRepo = {
    findOne: jest.fn(async () => ({ ...business })),
    save: jest.fn(async (b: Business) => b),
  };
  const serviceRepo = {
    find: jest.fn(async () => [] as Service[]),
    save: jest.fn(async (service: Service) => service),
  };
  const bookingRepo = {
    findOne: jest.fn(async () => ({ ...booking })),
    find: jest.fn(async () => [{ ...booking }]),
  };

  const deps = () => ({ businessRepo, serviceRepo, bookingRepo });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    bookingRepo.findOne.mockResolvedValue({ ...booking });
    bookingRepo.find.mockResolvedValue([{ ...booking }]);
    rescue = new AiIntentRescueService();
  });

  it.each(EXPLAIN_APPOINTMENT_TAX_PROMPTS)(
    'rescues explain appointment tax $id',
    async ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_appointment_tax');
    },
  );

  it('explains exclusive tax lines and collected amount when marked paid', async () => {
    const result = await handleExplainAppointmentTaxLogic(
      deps(),
      'biz-1',
      { bookingId: 'bk-tax-001' },
      'Explain tax lines on this appointment payment breakdown',
      'emp-1',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_appointment_tax');
    expect(result.summary).toContain('Tax-exclusive pricing');
    expect(result.summary).toContain('marked paid');
    expect(result.details?.paymentStatus).toBe(PaymentStatus.PAID);
    expect(result.details?.collectedAmount).toBe(120);
  });

  it('blocks appointments outside provider scope', async () => {
    const result = await handleExplainAppointmentTaxLogic(
      deps(),
      'biz-1',
      { bookingId: 'bk-tax-001' },
      'Explain tax lines on this appointment payment breakdown',
      'emp-other',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('not on your provider schedule');
  });
});
