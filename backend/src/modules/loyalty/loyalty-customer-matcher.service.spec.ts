import { LoyaltyCustomerMatcherService } from './loyalty-customer-matcher.service.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Booking, PaymentStatus } from '../booking/entities/booking.entity.js';

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'booking-1',
    businessId: 'biz-1',
    customerId: null as any,
    metadata: {},
    paymentStatus: PaymentStatus.PAID,
    ...overrides,
  } as Booking;
}

describe('LoyaltyCustomerMatcherService', () => {
  const customerRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const matcher = new LoyaltyCustomerMatcherService(customerRepo as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('matches signed-in customer via booking customer id', async () => {
    customerRepo.findOne.mockResolvedValue({
      id: 'cust-1',
      businessId: 'biz-1',
      isActive: true,
      email: 'user@test.com',
    });

    const result = await matcher.resolveForBooking(
      makeBooking({ customerId: 'cust-1' }),
    );

    expect(result.status).toBe('matched');
    expect(result.customerId).toBe('cust-1');
    expect(result.method).toBe('booking_customer_id');
  });

  it('matches guest booking by normalized email', async () => {
    customerRepo.find.mockResolvedValue([
      { id: 'cust-email', businessId: 'biz-1', isActive: true, email: 'guest@test.com', phone: null },
    ] as Customer[]);

    const result = await matcher.resolveForBooking(
      makeBooking({
        metadata: { customerEmail: '  Guest@Test.com ' },
      }),
    );

    expect(result.status).toBe('matched');
    expect(result.customerId).toBe('cust-email');
    expect(result.method).toBe('email');
  });

  it('matches guest booking by normalized phone', async () => {
    customerRepo.find.mockResolvedValue([
      { id: 'cust-phone', businessId: 'biz-1', isActive: true, email: null, phone: '+37491234567' },
    ] as Customer[]);

    const result = await matcher.resolveForBooking(
      makeBooking({
        metadata: { customerPhone: '374 91 234567' },
      }),
    );

    expect(result.status).toBe('matched');
    expect(result.customerId).toBe('cust-phone');
    expect(result.method).toBe('phone');
  });

  it('flags ambiguous matches when email and phone map to different customers', async () => {
    customerRepo.find.mockResolvedValue([
      { id: 'cust-a', businessId: 'biz-1', isActive: true, email: 'a@test.com', phone: null },
      { id: 'cust-b', businessId: 'biz-1', isActive: true, email: null, phone: '+37491234567' },
    ] as Customer[]);

    const result = await matcher.resolveForBooking(
      makeBooking({
        metadata: {
          customerEmail: 'a@test.com',
          customerPhone: '+37491234567',
        },
      }),
    );

    expect(result.status).toBe('ambiguous');
    expect(result.candidateCustomerIds?.sort()).toEqual(['cust-a', 'cust-b']);
  });
});
