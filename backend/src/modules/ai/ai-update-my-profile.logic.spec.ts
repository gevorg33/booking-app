import { handleUpdateMyProfileLogic } from './ai-update-my-profile.logic.js';

describe('ai-update-my-profile.logic (ai-cmd-customer-4.5.6 / 6.14.3)', () => {
  const deps = {} as any;

  it('clarifies when phone is requested without a new value (e2e-bug.40)', async () => {
    const result = await handleUpdateMyProfileLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Change my phone number',
    );

    expect(result.success).toBe(false);
    expect(result.action).toBe('update_my_profile');
    expect(result.summary).toContain('new phone number');
    expect(result.details?.clarify).toBe(true);
    expect(result.details?.navigate).toBeUndefined();
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

  it('clarifies for generic profile update without a field value (e2e-bug.40)', async () => {
    const result = await handleUpdateMyProfileLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Update my profile details',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(result.details?.navigate).toBeUndefined();
    expect(result.summary).toMatch(/name or phone/i);
  });

  it('says email is unsupported and does not navigate to dead section=profile (e2e-bug.40)', async () => {
    const result = await handleUpdateMyProfileLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Change my email to jane@example.com',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/aren't supported yet/i);
    expect(result.details?.emailUnsupported).toBe(true);
    expect(result.details?.email).toBe('jane@example.com');
    expect(result.details?.apiBlockedReason).toContain('email not shipped');
    expect(result.details?.navigate).toBeUndefined();
  });

  it('says email is unsupported even without a concrete address (e2e-bug.40)', async () => {
    const result = await handleUpdateMyProfileLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Edit my email',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/aren't supported yet/i);
    expect(result.details?.emailUnsupported).toBe(true);
    expect(result.details?.navigate).toBeUndefined();
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

  it('fails gracefully when business slug cannot be resolved for a live-eligible update', async () => {
    const liveDeps = {
      publicCustomerAuthService: { updateMyProfile: jest.fn() },
      businessRepo: { findOne: jest.fn(async () => null) },
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

  it('resolves slug from businessId for live profile update without params.slug (e2e-bug.82)', async () => {
    const updateMyProfile = jest.fn().mockResolvedValue({
      id: 'cust-1',
      name: 'Jane Doe',
      phone: null,
    });
    const liveDeps = {
      publicCustomerAuthService: { updateMyProfile },
      businessRepo: {
        findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'demo-salon' })),
      },
    } as any;

    const result = await handleUpdateMyProfileLogic(
      liveDeps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Update my name to Jane Doe',
    );

    expect(result.success).toBe(true);
    expect(updateMyProfile).toHaveBeenCalledWith('demo-salon', 'cust-1', {
      name: 'Jane Doe',
      phone: undefined,
    });
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
