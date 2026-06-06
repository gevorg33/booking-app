import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { handleLookupBookingTaxMetadataLogic } from './ai-business-tax.logic.js';
import { LOOKUP_BOOKING_TAX_METADATA_PROMPTS } from './ai-lookup-booking-tax-metadata.fixtures.js';
import type { Booking } from '../booking/entities/booking.entity.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';

describe('ai lookup booking tax metadata integration (ai-cmd-tax-10)', () => {
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
        amountPaid: 120,
      },
      stripeSessionId: 'cs_test_123',
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

  it.each(LOOKUP_BOOKING_TAX_METADATA_PROMPTS)(
    'rescues lookup booking tax metadata $id',
    async ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('lookup_booking_tax_metadata');
    },
  );

  it('returns frozen metadata.pricing tax fields for disputes', async () => {
    const result = await handleLookupBookingTaxMetadataLogic(
      deps(),
      'biz-1',
      { bookingId: 'bk-tax-001' },
      'Lookup tax metadata for booking bk-tax-001',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('lookup_booking_tax_metadata');
    expect(result.summary).toContain('metadata.pricing');
    expect(result.summary).toContain('taxAmount=20');
    expect(result.details?.taxMetadata).toMatchObject({
      taxEnabled: true,
      taxName: 'VAT',
      taxAmount: 20,
      stripeSessionId: 'cs_test_123',
    });
  });
});
