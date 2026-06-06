import { NotFoundException } from '@nestjs/common';
import { CustomerPrivacyService } from './customer-privacy.service.js';
import { buildGdprMetadata } from './customer-privacy.types.js';

describe('Sprint 37 — customer privacy compliance integration', () => {
  const customerRepo = {
    findOne: jest.fn(),
    save: jest.fn(async (c: unknown) => c),
  };
  const bookingRepo = { find: jest.fn(async () => []) };
  const service = new CustomerPrivacyService(
    customerRepo as never,
    bookingRepo as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deleteCustomerData uses hashed PII placeholders', async () => {
    customerRepo.findOne.mockResolvedValue({
      id: 'cust-1',
      businessId: 'biz-1',
      isActive: true,
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+15551234567',
      metadata: { gdpr: { marketingOptIn: true } },
    });

    await service.deleteCustomerData('biz-1', 'cust-1');

    expect(customerRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.stringMatching(/^Deleted customer \([a-f0-9]{12}\)$/),
        email: expect.stringMatching(
          /^deleted-[a-f0-9]{12}@anonymized\.local$/,
        ),
        phone: expect.stringMatching(/^\+0000000[a-f0-9]{7}$/),
        isActive: false,
        metadata: expect.objectContaining({
          gdpr: expect.objectContaining({ deletionRequested: true }),
        }),
      }),
    );
  });

  it('records granular consent with consent log entries', () => {
    const metadata = buildGdprMetadata(undefined, {
      privacyAccepted: true,
      privacyVersion: '2.0',
      marketingOptIn: true,
      aiProcessingOptIn: true,
      thirdPartyIntegrationsOptIn: false,
      source: 'checkout',
      ip: '127.0.0.1',
    });

    const gdpr = metadata.gdpr as {
      aiProcessingOptIn?: boolean;
      consentLog?: Array<{ type: string }>;
    };
    expect(gdpr.aiProcessingOptIn).toBe(true);
    expect(gdpr.consentLog?.map((e) => e.type)).toEqual(
      expect.arrayContaining([
        'privacy',
        'marketing',
        'ai_processing',
        'third_party_integrations',
      ]),
    );
  });

  it('exportCustomerData returns portable snapshot with bookings and gdpr', async () => {
    const createdAt = new Date('2025-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-01T00:00:00.000Z');
    customerRepo.findOne.mockResolvedValue({
      id: 'cust-1',
      businessId: 'biz-1',
      isActive: true,
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+15551234567',
      tags: ['vip'],
      isVip: true,
      createdAt,
      updatedAt,
      metadata: {
        gdpr: {
          privacyVersion: '2.0',
          marketingOptIn: true,
          aiProcessingOptIn: true,
        },
        notifications: { email: true },
      },
    });
    bookingRepo.find.mockResolvedValue([
      {
        id: 'book-1',
        startTime: new Date('2026-06-01T10:00:00.000Z'),
        endTime: new Date('2026-06-01T11:00:00.000Z'),
        status: 'confirmed',
        paymentStatus: 'paid',
        service: { name: 'Consultation' },
        employee: { name: 'Dr. Smith' },
      },
    ]);

    const result = await service.exportCustomerData('biz-1', 'cust-1');

    expect(result.customer).toMatchObject({
      id: 'cust-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      isVip: true,
    });
    expect(result.gdpr).toMatchObject({
      privacyVersion: '2.0',
      marketingOptIn: true,
      aiProcessingOptIn: true,
    });
    expect(result.notifications).toEqual({ email: true });
    expect(result.bookings).toEqual([
      expect.objectContaining({
        id: 'book-1',
        serviceName: 'Consultation',
        employeeName: 'Dr. Smith',
      }),
    ]);
  });

  it('applyConsent merges GDPR metadata on customer', () => {
    const customer = {
      id: 'cust-1',
      metadata: { gdpr: { marketingOptIn: false } },
    } as never;

    const updated = service.applyConsent(customer, {
      privacyAccepted: true,
      privacyVersion: '3.0',
      marketingOptIn: true,
      source: 'checkout',
    });

    const gdpr = (updated.metadata as { gdpr: { privacyVersion?: string } })
      .gdpr;
    expect(gdpr.privacyVersion).toBe('3.0');
    expect(gdpr).toMatchObject({ marketingOptIn: true, source: 'checkout' });
  });

  it('exportCustomerData throws when customer missing', async () => {
    customerRepo.findOne.mockResolvedValue(null);
    await expect(
      service.exportCustomerData('biz-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
