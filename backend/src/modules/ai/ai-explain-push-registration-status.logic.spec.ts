import {
  handleExplainPushRegistrationStatusLogic,
  type ExplainPushRegistrationStatusLogicDeps,
} from './ai-explain-push-registration-status.logic.js';

function buildDeps(
  overrides: Partial<ExplainPushRegistrationStatusLogicDeps> = {},
): ExplainPushRegistrationStatusLogicDeps {
  return {
    consumerPushTokenService: {
      getNativePushStatus: jest.fn(async () => ({
        registered: true,
        platform: 'ios' as const,
      })),
    },
    ...overrides,
  } as ExplainPushRegistrationStatusLogicDeps;
}

describe('handleExplainPushRegistrationStatusLogic', () => {
  it('reports registered status', async () => {
    const deps = buildDeps();
    const result = await handleExplainPushRegistrationStatusLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1', platform: 'ios' },
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_push_registration_status');
    expect(result.summary).toContain('on');
    expect(
      deps.consumerPushTokenService.getNativePushStatus,
    ).toHaveBeenCalledWith('cust-1', 'biz-1', 'ios');
  });

  it('reports unregistered status', async () => {
    const result = await handleExplainPushRegistrationStatusLogic(
      buildDeps({
        consumerPushTokenService: {
          getNativePushStatus: jest.fn(async () => ({
            registered: false,
            platform: null,
          })),
        },
      }),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('not enabled');
  });

  it('requires sign-in', async () => {
    const result = await handleExplainPushRegistrationStatusLogic(
      buildDeps(),
      'biz-1',
      {},
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
