import {
  handleRegisterCustomerPushLogic,
  type RegisterCustomerPushLogicDeps,
} from './ai-register-customer-push.logic.js';

function buildDeps(
  overrides: Partial<RegisterCustomerPushLogicDeps> = {},
): RegisterCustomerPushLogicDeps {
  return {
    consumerPushTokenService: {
      registerToken: jest.fn(async () => ({
        registered: true as const,
        platform: 'ios' as const,
        refreshed: false,
      })),
    },
    publicCustomerAuthService: {
      linkAnalyticsAnonByCustomerId: jest.fn(async () => undefined),
    },
    ...overrides,
  } as RegisterCustomerPushLogicDeps;
}

describe('handleRegisterCustomerPushLogic', () => {
  it('registers a native push token', async () => {
    const deps = buildDeps();
    const result = await handleRegisterCustomerPushLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      token: 'device-token',
      platform: 'ios',
    });
    expect(result.success).toBe(true);
    expect(result.action).toBe('register_customer_push');
    expect(deps.consumerPushTokenService.registerToken).toHaveBeenCalledWith(
      'cust-1',
      'biz-1',
      {
        token: 'device-token',
        platform: 'ios',
        analyticsAnonId: undefined,
        permissionState: undefined,
      },
    );
    expect(
      deps.publicCustomerAuthService.linkAnalyticsAnonByCustomerId,
    ).not.toHaveBeenCalled();
  });

  it('links analytics anon id when provided', async () => {
    const deps = buildDeps();
    await handleRegisterCustomerPushLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      token: 'device-token',
      platform: 'android',
      analyticsAnonId: 'anon-1',
    });
    expect(
      deps.publicCustomerAuthService.linkAnalyticsAnonByCustomerId,
    ).toHaveBeenCalledWith('biz-1', 'cust-1', 'anon-1');
  });

  it('requires sign-in', async () => {
    const result = await handleRegisterCustomerPushLogic(buildDeps(), 'biz-1', {
      token: 'device-token',
      platform: 'ios',
    });
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('requires token and platform', async () => {
    const result = await handleRegisterCustomerPushLogic(buildDeps(), 'biz-1', {
      sessionCustomerId: 'cust-1',
    });
    expect(result.success).toBe(false);
    expect(result.details?.missing).toEqual(['token', 'platform']);
  });

  it('surfaces a registration failure', async () => {
    const result = await handleRegisterCustomerPushLogic(
      buildDeps({
        consumerPushTokenService: {
          registerToken: jest.fn(async () => {
            throw new Error('Could not save token');
          }),
        },
      }),
      'biz-1',
      { sessionCustomerId: 'cust-1', token: 'bad-token', platform: 'ios' },
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Could not save token');
  });
});
