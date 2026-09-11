import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { handleQuoteStaffBookingTaxLogic } from './ai-business-tax.logic.js';
import { QUOTE_STAFF_BOOKING_TAX_PROMPTS } from './ai-quote-staff-booking-tax.fixtures.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { Booking } from '../booking/entities/booking.entity.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';

describe('ai quote staff booking tax integration (ai-cmd-tax-12)', () => {
  const business: Business = makeBusiness({
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: {
      tax: {
        enabled: true,
        name: 'GST + PST',
        rate: 13,
        model: 'exclusive',
        rules: [
          { id: 'gst', name: 'GST', rate: 5 },
          { id: 'pst', name: 'PST', rate: 8 },
        ],
      },
    },
  });

  const services: Service[] = [
    {
      id: 'svc-1',
      businessId: 'biz-1',
      name: 'Swedish Massage',
      price: 100,
      metadata: {},
    } as Service,
    {
      id: 'svc-2',
      businessId: 'biz-1',
      name: 'Medical Consultation',
      price: 150,
      metadata: { taxRatePercent: 0 },
    } as Service,
  ];

  const businessRepo = {
    findOne: jest.fn(async () => ({ ...business })),
    save: jest.fn(async (b: Business) => b),
  };
  const serviceRepo = {
    find: jest.fn(async () => services.map((service) => ({ ...service }))),
    save: jest.fn(async (service: Service) => service),
  };
  const bookingRepo = {
    findOne: jest.fn(async () => null as Booking | null),
    find: jest.fn(async () => [] as Booking[]),
  };

  const deps = () => ({ businessRepo, serviceRepo, bookingRepo });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    rescue = new AiIntentRescueService();
  });

  it.each(QUOTE_STAFF_BOOKING_TAX_PROMPTS)(
    'rescues quote staff booking tax $id',
    async ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('quote_staff_booking_tax');
    },
  );

  it('quotes stacked tax on a service without override', async () => {
    const result = await handleQuoteStaffBookingTaxLogic(
      deps(),
      'biz-1',
      { serviceQuery: 'massage' },
      'Preview tax on massage before creating a booking',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('quote_staff_booking_tax');
    expect(result.summary).toContain('stacked tax rules apply');
    expect(result.summary).toContain('GST 5%');
    expect(result.details?.taxSource).toBe('stacked_rules');
    expect(result.details?.quote).toMatchObject({ taxAmount: 13 });
  });

  it('quotes tax-exempt service override', async () => {
    const result = await handleQuoteStaffBookingTaxLogic(
      deps(),
      'biz-1',
      { serviceQuery: 'consultation' },
      'Preview tax on medical consultation — is it tax-exempt?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('tax-exempt');
    expect(result.details?.taxSource).toBe('tax_exempt');
  });
});
