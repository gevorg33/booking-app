import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';

describe('provider AI update_provider_profile dispatch (ai-cmd-provider-6.11)', () => {
  const businessId = 'biz-611';
  const userId = 'user-611';
  const employeeId = 'emp-611';

  let service: ReturnType<typeof createProviderAiCommandHarness>;
  let llm: { isAvailableForBusiness: jest.Mock; completeJson: jest.Mock<any> };
  let updateProviderProfile: jest.Mock<any>;

  const staffAccess = {
    viewMode: 'provider' as const,
    membershipRole: MemberRole.STAFF,
    employee: { id: employeeId, name: 'Alex Provider' },
  };

  beforeEach(() => {
    llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(),
    };
    updateProviderProfile = jest.fn(async (_businessId, _userId, dto) => ({
      id: employeeId,
      name: 'Alex Provider',
      email: null,
      phone: null,
      title: dto.title ?? null,
      avatarUrl: dto.avatarUrl ?? null,
      viewMode: 'provider',
    }));
    service = createProviderAiCommandHarness({
      llm,
      providerMobile: {
        resolveMobileAccess: jest.fn(async () => staffAccess),
        getScopedEmployeeId: jest.fn(() => employeeId),
        updateProviderProfile,
      },
    });
  });

  function mockIntent(params: Record<string, unknown>) {
    llm.completeJson.mockResolvedValue({
      action: 'update_provider_profile',
      params,
      reasoning: 'test',
    });
  }

  it('updates the title', async () => {
    mockIntent({ title: 'Senior Stylist' });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Set my title to Senior Stylist',
      [],
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('update_provider_profile');
    expect(updateProviderProfile).toHaveBeenCalledWith(businessId, userId, {
      title: 'Senior Stylist',
      avatarUrl: undefined,
    });
  });

  it('updates the avatar URL', async () => {
    mockIntent({ avatarUrl: 'https://example.com/avatar.png' });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Update my avatar to https://example.com/avatar.png',
      [],
    );

    expect(result.success).toBe(true);
    expect(updateProviderProfile).toHaveBeenCalledWith(businessId, userId, {
      title: undefined,
      avatarUrl: 'https://example.com/avatar.png',
    });
  });

  it('asks for clarification when neither title nor avatarUrl is given', async () => {
    mockIntent({});

    const result = await service.executeCommand(
      businessId,
      userId,
      'Update my profile',
      [],
    );

    expect(result.success).toBe(false);
    expect(result.details).toMatchObject({ clarify: true });
    expect(updateProviderProfile).not.toHaveBeenCalled();
  });
});
