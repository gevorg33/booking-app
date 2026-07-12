import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PublicCustomerAuthService } from './public-customer-auth.service.js';

describe('PublicCustomerAuthService profile update (ai-cmd-customer-6.14.3)', () => {
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
    phone: null as string | null,
    isActive: true,
    metadata: {},
  };

  const businessService = {
    findBySlug: jest.fn().mockResolvedValue(business),
  };
  const customerRepo = {
    findOne: jest.fn().mockResolvedValue(customer),
  };
  const customerService = {
    update: jest.fn(),
  };

  const service = new PublicCustomerAuthService(
    businessService as any,
    {} as any,
    {} as any,
    {} as any,
    customerService as any,
    {} as any,
    {} as any,
    customerRepo as any,
    {} as any,
    {} as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    customerRepo.findOne.mockResolvedValue(customer);
  });

  it('updates the customer name and returns the new profile', async () => {
    customerService.update.mockResolvedValue({
      ...customer,
      name: 'Jane Doe',
    });

    const result = await service.updateMyProfile('demo-salon', 'cust-1', {
      name: 'Jane Doe',
    });

    expect(customerService.update).toHaveBeenCalledWith('cust-1', {
      name: 'Jane Doe',
      phone: undefined,
    });
    expect(result).toEqual({
      id: 'cust-1',
      name: 'Jane Doe',
      email: 'alex@example.com',
      phone: null,
    });
  });

  it('updates the customer phone and returns the new profile', async () => {
    customerService.update.mockResolvedValue({
      ...customer,
      phone: '15551234567',
    });

    const result = await service.updateMyProfile('demo-salon', 'cust-1', {
      phone: '15551234567',
    });

    expect(customerService.update).toHaveBeenCalledWith('cust-1', {
      name: undefined,
      phone: '15551234567',
    });
    expect(result.phone).toBe('15551234567');
  });

  it('rejects an update with neither name nor phone', async () => {
    await expect(
      service.updateMyProfile('demo-salon', 'cust-1', {}),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(customerService.update).not.toHaveBeenCalled();
  });

  it('rejects when the customer does not belong to this business', async () => {
    customerRepo.findOne.mockResolvedValue(null);

    await expect(
      service.updateMyProfile('demo-salon', 'cust-1', { name: 'Jane' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(customerService.update).not.toHaveBeenCalled();
  });
});
