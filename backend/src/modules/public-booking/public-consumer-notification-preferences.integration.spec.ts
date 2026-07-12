import { BadRequestException } from '@nestjs/common';
import { PublicCustomerAuthService } from './public-customer-auth.service.js';

describe('PublicCustomerAuthService notification preferences (adopt-4.8)', () => {
  const business = {
    id: 'biz-1',
    slug: 'demo-salon',
    name: 'Demo Salon',
    isActive: true,
    settings: {},
  };

  const customer = {
    id: 'cust-1',
    businessId: 'biz-1',
    name: 'Alex',
    email: 'alex@example.com',
    isActive: true,
    metadata: {
      notifications: {
        pushReminders: true,
        pushOffers: true,
        pushNews: false,
      },
    },
  };

  const businessService = {
    findBySlug: jest.fn().mockResolvedValue(business),
  };
  const customerRepo = {
    findOne: jest.fn().mockResolvedValue(customer),
    save: jest.fn(async (entity: typeof customer) => entity),
  };

  const service = new PublicCustomerAuthService(
    businessService as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    customerRepo as any,
    {} as any,
    {} as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    customer.metadata = {
      notifications: {
        pushReminders: true,
        pushOffers: true,
        pushNews: false,
      },
    };
    customerRepo.findOne.mockResolvedValue(customer);
  });

  it('returns mapped push preference categories', async () => {
    await expect(
      service.getNotificationPreferences('demo-salon', 'cust-1'),
    ).resolves.toEqual({
      pushReminders: true,
      pushOffers: true,
      pushNews: false,
    });
  });

  it('updates selected categories and preserves other metadata', async () => {
    customer.metadata = {
      ...customer.metadata,
      reminderHoursBefore: 24,
    };

    const result = await service.updateNotificationPreferences(
      'demo-salon',
      'cust-1',
      { pushOffers: false },
    );

    expect(result.pushOffers).toBe(false);
    expect(result.pushReminders).toBe(true);
    expect(customerRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          reminderHoursBefore: 24,
          notifications: expect.objectContaining({ pushOffers: false }),
        }),
      }),
    );
  });

  it('rejects empty patch payloads', async () => {
    await expect(
      service.updateNotificationPreferences('demo-salon', 'cust-1', {}),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
