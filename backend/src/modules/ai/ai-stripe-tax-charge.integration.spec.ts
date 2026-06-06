import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { handleExplainStripeTaxChargeLogic } from './ai-business-tax.logic.js';
import { EXPLAIN_STRIPE_TAX_CHARGE_PROMPTS } from './ai-stripe-tax-charge.fixtures.js';
import type { Booking } from '../booking/entities/booking.entity.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';

describe('ai stripe tax charge integration (ai-cmd-tax-9)', () => {
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

  it.each(EXPLAIN_STRIPE_TAX_CHARGE_PROMPTS)(
    'rescues explain stripe tax charge $id',
    async ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_stripe_tax_charge');
    },
  );

  it('explains exclusive Stripe tax charge from metadata.pricing', async () => {
    const result = await handleExplainStripeTaxChargeLogic(
      deps(),
      'biz-1',
      { customerName: 'Jane' },
      "Why did Stripe charge $120 for Jane's booking?",
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_stripe_tax_charge');
    expect(result.summary).toContain('Tax-exclusive pricing');
    expect(result.summary).toContain('metadata.pricing.amountDue=120');
    expect(result.details?.taxAmount).toBe(20);
    expect(result.details?.amountDue).toBe(120);
  });

  it('explains inclusive stacked tax Stripe charge', async () => {
    const inclusiveBooking = {
      ...booking,
      metadata: {
        pricing: {
          amountDue: 113,
          taxEnabled: true,
          taxName: 'GST + PST',
          taxRate: 13,
          taxModel: 'inclusive',
          taxAmount: 13,
          netAmount: 100,
          taxRules: [
            { id: 'gst', name: 'GST', rate: 5, amount: 5 },
            { id: 'pst', name: 'PST', rate: 8, amount: 8 },
          ],
        },
      },
    } as Booking;
    bookingRepo.findOne.mockResolvedValue(inclusiveBooking);
    bookingRepo.find.mockResolvedValue([inclusiveBooking]);

    const result = await handleExplainStripeTaxChargeLogic(
      deps(),
      'biz-1',
      { bookingId: 'bk-tax-001' },
      'Why did Stripe charge $113 with GST and PST lines on the booking?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Tax-inclusive pricing');
    expect(result.summary).toContain('taxRules[] present');
    expect(result.details?.pricing).toMatchObject({
      taxModel: 'inclusive',
      taxAmount: 13,
    });
  });
});
