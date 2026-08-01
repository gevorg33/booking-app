import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PublicCustomerAuthService } from './public-customer-auth.service.js';

/**
 * e2e-bug.218 — token from business A must not resolve/export/delete under slug B.
 */
describe('PublicCustomerAuthService cross-tenant (e2e-bug.218)', () => {
  const salon = { id: 'biz-salon', slug: 'salon', isActive: true, settings: {} };
  const clinic = {
    id: 'biz-clinic',
    slug: 'clinic',
    isActive: true,
    settings: {},
  };

  const customers = new Map<string, Record<string, unknown>>([
    [
      'cust-salon',
      {
        id: 'cust-salon',
        businessId: salon.id,
        name: 'Salon Guest',
        email: 'salon@example.com',
        phone: '+15550001',
        isActive: true,
      },
    ],
  ]);

  const businessService = {
    findBySlug: jest.fn(async (slug: string) => {
      if (slug === salon.slug) return salon;
      if (slug === clinic.slug) return clinic;
      throw new NotFoundException('Business not found');
    }),
  };

  const customerRepo = {
    findOne: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
      for (const customer of customers.values()) {
        if (
          customer.id === where.id &&
          customer.businessId === where.businessId &&
          customer.isActive === where.isActive
        ) {
          return customer;
        }
      }
      return null;
    }),
  };

  const service = new PublicCustomerAuthService(
    businessService as any,
    { sign: jest.fn() } as any,
    { isReady: false } as any,
    {} as any,
    {} as any,
    {} as any,
    { emit: jest.fn() } as any,
    customerRepo as any,
    {} as any,
    {} as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    {
      id: 'same-tenant-ok',
      slug: 'salon',
      payloadBusinessId: salon.id,
      expectOk: true,
    },
    {
      id: 'cross-tenant-reject',
      slug: 'clinic',
      payloadBusinessId: salon.id,
      expectOk: false,
    },
    {
      id: 'missing-slug-reject',
      slug: '',
      payloadBusinessId: salon.id,
      expectOk: false,
    },
  ])(
    'assertSessionMatchesSlug $id',
    async ({ slug, payloadBusinessId, expectOk }) => {
      if (expectOk) {
        await expect(
          service.assertSessionMatchesSlug(slug, payloadBusinessId),
        ).resolves.toBe(salon.id);
      } else {
        await expect(
          service.assertSessionMatchesSlug(slug, payloadBusinessId),
        ).rejects.toBeInstanceOf(UnauthorizedException);
      }
    },
  );

  it('resolveCustomerForSlug loads under path business only', async () => {
    const same = await service.resolveCustomerForSlug('salon', 'cust-salon');
    expect(same.businessId).toBe(salon.id);
    expect(same.customer.id).toBe('cust-salon');

    await expect(
      service.resolveCustomerForSlug('clinic', 'cust-salon'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('getProfileForSlug refuses foreign-tenant customer id', async () => {
    await expect(
      service.getProfileForSlug('clinic', 'cust-salon'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    await expect(
      service.getProfileForSlug('salon', 'cust-salon'),
    ).resolves.toMatchObject({
      id: 'cust-salon',
      email: 'salon@example.com',
    });
  });
});
