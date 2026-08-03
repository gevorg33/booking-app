import { UnauthorizedException } from '@nestjs/common';
import { PublicCustomerJwtStrategy } from './public-customer-jwt.strategy.js';

describe('PublicCustomerJwtStrategy (e2e-bug.218)', () => {
  const authService = {
    assertSessionMatchesSlug: jest.fn(),
    getCustomerById: jest.fn(),
  };

  const configService = {
    get: jest.fn(() => 'test-jwt-secret'),
  };

  let strategy: PublicCustomerJwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new PublicCustomerJwtStrategy(
      configService as any,
      authService as any,
    );
  });

  it('rejects non-public_customer tokens', async () => {
    await expect(
      strategy.validate({ params: { slug: 'salon' } }, {
        sub: 'cust-1',
        email: 'a@b.com',
        businessId: 'biz-a',
        type: 'staff',
      } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(authService.assertSessionMatchesSlug).not.toHaveBeenCalled();
  });

  it('rejects when route slug tenant mismatches JWT businessId', async () => {
    authService.assertSessionMatchesSlug.mockRejectedValue(
      new UnauthorizedException('Customer session does not match this business'),
    );

    await expect(
      strategy.validate(
        { params: { slug: 'clinic' } },
        {
          sub: 'cust-1',
          email: 'a@b.com',
          businessId: 'biz-salon',
          type: 'public_customer',
        },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(authService.assertSessionMatchesSlug).toHaveBeenCalledWith(
      'clinic',
      'biz-salon',
    );
    expect(authService.getCustomerById).not.toHaveBeenCalled();
  });

  it('attaches user only after slug tenant matches', async () => {
    authService.assertSessionMatchesSlug.mockResolvedValue('biz-salon');
    authService.getCustomerById.mockResolvedValue({
      id: 'cust-1',
      businessId: 'biz-salon',
      name: 'Jane',
      email: 'a@b.com',
    });

    const user = await strategy.validate(
      { params: { slug: 'salon' } },
      {
        sub: 'cust-1',
        email: 'a@b.com',
        businessId: 'biz-salon',
        type: 'public_customer',
      },
    );

    expect(user).toEqual({
      customerId: 'cust-1',
      email: 'a@b.com',
      businessId: 'biz-salon',
      customer: expect.objectContaining({ id: 'cust-1' }),
    });
    expect(authService.getCustomerById).toHaveBeenCalledWith(
      'biz-salon',
      'cust-1',
    );
  });
});
