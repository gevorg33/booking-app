import { BadRequestException } from '@nestjs/common';
import { PublicCustomerAuthService } from './public-customer-auth.service.js';

describe('PublicCustomerAuthService preferred locale (catalog-notify-1.1)', () => {
  const business = {
    id: 'biz-1',
    slug: 'demo-salon',
    name: 'Demo Salon',
    isActive: true,
    settings: {
      enabledLocales: ['en', 'hy'],
      defaultLocale: 'en',
    },
  };

  const customer = {
    id: 'cust-1',
    businessId: 'biz-1',
    name: 'Alex',
    email: 'alex@example.com',
    isActive: true,
    metadata: {},
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
    customer.metadata = {};
    customerRepo.findOne.mockResolvedValue(customer);
  });

  it('returns resolved locale with null stored when unset', async () => {
    await expect(
      service.getPreferredLocale('demo-salon', 'cust-1'),
    ).resolves.toEqual({
      preferredLocale: 'en',
      storedLocale: null,
    });
  });

  it('updates preferredLocale and preserves other metadata', async () => {
    customer.metadata = { notifications: { pushNews: false } };

    const result = await service.updatePreferredLocale(
      'demo-salon',
      'cust-1',
      'hy',
    );

    expect(result).toEqual({ preferredLocale: 'hy', storedLocale: 'hy' });
    expect(customerRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          preferredLocale: 'hy',
          notifications: { pushNews: false },
        }),
      }),
    );
  });

  it('skips save when locale is unchanged', async () => {
    customer.metadata = { preferredLocale: 'hy' };

    const result = await service.updatePreferredLocale(
      'demo-salon',
      'cust-1',
      'hy',
    );

    expect(result.storedLocale).toBe('hy');
    expect(customerRepo.save).not.toHaveBeenCalled();
  });

  it('rejects disabled locale for tenant', async () => {
    await expect(
      service.updatePreferredLocale('demo-salon', 'cust-1', 'ru'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
