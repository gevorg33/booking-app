import { NotFoundException } from '@nestjs/common';
import { CustomerPrivacyService } from './customer-privacy.service.js';
import type { Customer } from './entities/customer.entity.js';
import type { Booking } from '../booking/entities/booking.entity.js';

describe('CustomerPrivacyService', () => {
  const customerRepo = { findOne: jest.fn(), save: jest.fn() };
  const bookingRepo = { find: jest.fn() };
  const service = new CustomerPrivacyService(
    customerRepo as any,
    bookingRepo as any,
  );

  const customer = {
    id: 'cust-1',
    businessId: 'biz-1',
    name: 'Jane',
    email: 'jane@example.com',
    phone: '+1555',
    tags: ['vip'],
    isVip: true,
    isActive: true,
    metadata: {
      gdpr: { marketingOptIn: true },
      notifications: { emailReminders: true },
    },
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
  } as Customer;

  beforeEach(() => {
    jest.clearAllMocks();
    customerRepo.save.mockImplementation(async (c: Customer) => c);
    customer.metadata = {
      gdpr: { marketingOptIn: true },
      notifications: { emailReminders: true },
    };
  });

  it('applyConsent records marketing opt-in only', () => {
    const updated = service.applyConsent(
      { ...customer, metadata: { ...customer.metadata } },
      {
        marketingOptIn: false,
        source: 'account',
      },
    );
    expect(updated.metadata.gdpr).toMatchObject({
      marketingOptIn: false,
      source: 'account',
    });
  });

  it('exportCustomerData returns profile and bookings', async () => {
    customerRepo.findOne.mockResolvedValue(customer);
    bookingRepo.find.mockResolvedValue([
      {
        id: 'b1',
        startTime: new Date('2026-05-01T10:00:00Z'),
        endTime: new Date('2026-05-01T11:00:00Z'),
        status: 'confirmed',
        paymentStatus: 'paid',
        service: { name: 'Cut' },
        employee: { name: 'Alex' },
      },
    ] as Booking[]);

    const data = await service.exportCustomerData('biz-1', 'cust-1');
    expect(data.customer.name).toBe('Jane');
    expect(data.bookings).toHaveLength(1);
    expect(data.gdpr?.marketingOptIn).toBe(true);
  });

  it('exportCustomerData throws when customer missing', async () => {
    customerRepo.findOne.mockResolvedValue(null);
    await expect(
      service.exportCustomerData('biz-1', 'x'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deleteCustomerData anonymizes customer', async () => {
    customerRepo.findOne.mockResolvedValue({ ...customer });
    const result = await service.deleteCustomerData('biz-1', 'cust-1');
    expect(result.deleted).toBe(true);
    expect(customerRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.stringMatching(/^Deleted customer \([a-f0-9]{12}\)$/),
        email: expect.stringMatching(
          /^deleted-[a-f0-9]{12}@anonymized\.local$/,
        ),
        isActive: false,
        metadata: expect.objectContaining({
          gdpr: expect.objectContaining({ deletionRequested: true }),
        }),
      }),
    );
  });

  it('deleteCustomerData throws when customer missing', async () => {
    customerRepo.findOne.mockResolvedValue(null);
    await expect(
      service.deleteCustomerData('biz-1', 'x'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('export includes null optional fields', async () => {
    customerRepo.findOne.mockResolvedValue({
      ...customer,
      email: null,
      phone: null,
      tags: null,
      metadata: {},
    });
    bookingRepo.find.mockResolvedValue([]);
    const data = await service.exportCustomerData('biz-1', 'cust-1');
    expect(data.customer.email).toBeNull();
    expect(data.gdpr).toBeNull();
  });
});
