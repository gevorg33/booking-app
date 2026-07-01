import { handleUpdateMyProfileLogic } from './ai-update-my-profile.logic.js';

describe('ai-update-my-profile.logic (ai-cmd-customer-4.5.6)', () => {
  const deps = {} as any;

  it('returns UI-only navigate handoff for signed-in customer', async () => {
    const result = await handleUpdateMyProfileLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Change my phone number',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('update_my_profile');
    expect(result.summary).toContain('phone number');
    expect(result.details?.uiOnly).toBe(true);
    expect(result.details?.apiBlockedReason).toContain('PATCH me/profile');
    expect(result.details?.navigate).toEqual({
      path: 'account',
      query: { section: 'profile', field: 'phone' },
    });
  });

  it('requires sign-in', async () => {
    const result = await handleUpdateMyProfileLogic(
      deps,
      'biz-1',
      {},
      'Update my name',
    );

    expect(result.success).toBe(false);
    expect(result.details?.missing).toContain('sessionCustomerId');
  });

  it('returns clarify for non-update prompts', async () => {
    const result = await handleUpdateMyProfileLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Show my profile',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('includes extracted name in details', async () => {
    const result = await handleUpdateMyProfileLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Update my name to Jane Doe',
    );

    expect(result.success).toBe(true);
    expect(result.details?.name).toBe('Jane Doe');
    expect(result.details?.field).toBe('name');
    expect(result.details?.navigate).toEqual({
      path: 'account',
      query: { section: 'profile', field: 'name' },
    });
  });

  it('omits field query for generic profile update', async () => {
    const result = await handleUpdateMyProfileLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Update my profile details',
    );

    expect(result.details?.navigate).toEqual({
      path: 'account',
      query: { section: 'profile' },
    });
  });
});
