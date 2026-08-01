import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { OptionalPublicCustomerAuthGuard } from './optional-public-customer-auth.guard.js';

describe('OptionalPublicCustomerAuthGuard (e2e-bug.218)', () => {
  const guard = new OptionalPublicCustomerAuthGuard();

  it('allows anonymous when Authorization header is absent', () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('re-throws tenant mismatch errors from JWT strategy (fail closed)', () => {
    expect(() =>
      guard.handleRequest(
        new UnauthorizedException(
          'Customer session does not match this business',
        ),
        null,
      ),
    ).toThrow(UnauthorizedException);
  });

  it('returns user when JWT validation succeeds', () => {
    const user = { customerId: 'c1', businessId: 'biz-a' };
    expect(guard.handleRequest(null, user)).toEqual(user);
  });
});
