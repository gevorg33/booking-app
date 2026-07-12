import { handleUpdateMyProfileLogic } from './ai-update-my-profile.logic.js';

describe('ai-update-my-profile.logic (ai-cmd-customer-4.5.6 / 6.14.3)', () => {
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
    expect(result.details?.apiBlockedReason).toContain('email not shipped');
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

  it('omits field query for generic profile update', async () => {
    const result = await handleUpdateMyProfileLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Update my profile details',
    );

    expect(result.success).toBe(true);
    expect(result.details?.uiOnly).toBe(true);
    expect(result.details?.navigate).toEqual({
      path: 'account',
      query: { section: 'profile' },
    });
  });

  it('still falls back to UI-only navigate for email (no email API)', async () => {
    const result = await handleUpdateMyProfileLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Change my email to jane@example.com',
    );

    expect(result.success).toBe(true);
    expect(result.details?.uiOnly).toBe(true);
    expect(result.details?.email).toBe('jane@example.com');
    expect(result.details?.apiBlockedReason).toContain('email not shipped');
  });

  it('calls the real profile API when a name is extracted, given a slug', async () => {
    const updateMyProfile = jest.fn().mockResolvedValue({
      id: 'cust-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: null,
    });
    const liveDeps = {
      publicCustomerAuthService: { updateMyProfile },
    } as any;

    const result = await handleUpdateMyProfileLogic(
      liveDeps,
      'biz-1',
      { sessionCustomerId: 'cust-1', slug: 'demo-salon' },
      'Update my name to Jane Doe',
    );

    expect(updateMyProfile).toHaveBeenCalledWith('demo-salon', 'cust-1', {
      name: 'Jane Doe',
      phone: undefined,
    });
    expect(result.success).toBe(true);
    expect(result.details?.uiOnly).toBeUndefined();
    expect(result.details?.profile).toEqual({
      id: 'cust-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: null,
    });
    expect(result.summary).toContain('Jane Doe');
  });

  it('calls the real profile API when a phone is extracted, given a slug', async () => {
    const updateMyProfile = jest.fn().mockResolvedValue({
      id: 'cust-1',
      name: 'Alex',
      email: null,
      phone: '15551234567',
    });
    const liveDeps = {
      publicCustomerAuthService: { updateMyProfile },
    } as any;

    const result = await handleUpdateMyProfileLogic(
      liveDeps,
      'biz-1',
      { sessionCustomerId: 'cust-1', slug: 'demo-salon' },
      'Update my phone to 15551234567',
    );

    expect(updateMyProfile).toHaveBeenCalledWith('demo-salon', 'cust-1', {
      name: undefined,
      phone: '15551234567',
    });
    expect(result.success).toBe(true);
    expect(result.summary).toContain('15551234567');
  });

  it('fails gracefully when no slug is available for a live-eligible update', async () => {
    const liveDeps = {
      publicCustomerAuthService: { updateMyProfile: jest.fn() },
    } as any;

    const result = await handleUpdateMyProfileLogic(
      liveDeps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Update my name to Jane Doe',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toBe('Business not found.');
  });

  it('surfaces backend errors from the profile API', async () => {
    const updateMyProfile = jest
      .fn()
      .mockRejectedValue(new Error('Provide a name or phone to update'));
    const liveDeps = {
      publicCustomerAuthService: { updateMyProfile },
    } as any;

    const result = await handleUpdateMyProfileLogic(
      liveDeps,
      'biz-1',
      { sessionCustomerId: 'cust-1', slug: 'demo-salon' },
      'Update my name to Jane Doe',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toBe('Provide a name or phone to update');
  });
});
