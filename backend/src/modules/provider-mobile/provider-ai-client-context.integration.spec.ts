import { MemberRole } from '../business/entities/business-member.entity.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';

describe('Provider AI client context (prov-exp-1.6)', () => {
  const businessId = 'biz-exp16';
  const userId = 'user-exp16';
  const bookingId = 'bk-exp16';

  let service: ReturnType<typeof createProviderAiCommandHarness>;
  let providerClientContext: {
    handleIntent: jest.Mock;
    rescueProviderClientContextIntent: jest.Mock;
  };

  beforeEach(() => {
    providerClientContext = {
      rescueProviderClientContextIntent: jest.fn((prompt: string) => {
        if (/summarize this client/i.test(prompt)) {
          return {
            action: 'summarize_client',
            rescueReason: 'summarize_client',
          };
        }
        if (/visit history/i.test(prompt)) {
          return {
            action: 'show_client_history',
            rescueReason: 'show_client_history',
          };
        }
        if (/show staff notes/i.test(prompt)) {
          return {
            action: 'list_client_staff_notes',
            rescueReason: 'list_client_staff_notes',
          };
        }
        if (/staff note/i.test(prompt)) {
          return { action: 'add_client_note', rescueReason: 'add_client_note' };
        }
        if (/pre-visit intake/i.test(prompt)) {
          return {
            action: 'explain_client_intake',
            rescueReason: 'explain_client_intake',
          };
        }
        if (/which visit is this in her package/i.test(prompt)) {
          return {
            action: 'explain_package_visit_context',
            rescueReason: 'explain_package_visit_context',
          };
        }
        if (/what's next after this/i.test(prompt)) {
          return {
            action: 'explain_multi_service_timeline',
            rescueReason: 'explain_multi_service_timeline',
          };
        }
        return null;
      }),
      handleIntent: jest.fn(async (_biz, _user, action) => ({
        success: true,
        action,
        summary: `${action} ok`,
        details: { bookingId },
      })),
    };

    service = createProviderAiCommandHarness({
      providerMobile: {
        resolveMobileAccess: jest.fn(async () => ({
          viewMode: 'provider',
          membershipRole: MemberRole.STAFF,
          employee: { id: 'emp-1', name: 'Alex' },
        })),
        getScopedEmployeeId: jest.fn(() => 'emp-1'),
      },
      providerClientContext,
    });
  });

  it('executes summarize_client via rescue + handler', async () => {
    const result = await service.executeCommand(
      businessId,
      userId,
      'Summarize this client',
      [],
      { bookingId },
    );

    expect(result.action).toBe('summarize_client');
    expect(providerClientContext.handleIntent).toHaveBeenCalled();
  });

  it('executes show_client_history via rescue', async () => {
    const result = await service.executeCommand(
      businessId,
      userId,
      "Show this client's visit history",
      [],
      { bookingId },
    );

    expect(result.action).toBe('show_client_history');
  });

  it('executes add_client_note via rescue and enriches note body', async () => {
    const result = await service.executeCommand(
      businessId,
      userId,
      'Add staff note: prefers quiet chair',
      [],
      { bookingId },
    );

    expect(result.action).toBe('add_client_note');
    expect(providerClientContext.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'add_client_note',
      expect.objectContaining({ clientNote: 'prefers quiet chair' }),
      'Add staff note: prefers quiet chair',
      expect.objectContaining({ bookingId }),
    );
  });

  it('executes list_client_staff_notes via rescue', async () => {
    const result = await service.executeCommand(
      businessId,
      userId,
      'Show staff notes for this client',
      [],
      { bookingId },
    );

    expect(result.action).toBe('list_client_staff_notes');
    expect(providerClientContext.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'list_client_staff_notes',
      expect.any(Object),
      'Show staff notes for this client',
      expect.objectContaining({ bookingId }),
    );
  });

  it('executes explain_client_intake via rescue', async () => {
    const result = await service.executeCommand(
      businessId,
      userId,
      'What does their pre-visit intake say?',
      [],
      { bookingId },
    );

    expect(result.action).toBe('explain_client_intake');
    expect(providerClientContext.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'explain_client_intake',
      expect.any(Object),
      'What does their pre-visit intake say?',
      expect.objectContaining({ bookingId }),
    );
  });

  it('executes explain_package_visit_context via rescue (ai-cmd-provider-5.2.8)', async () => {
    const result = await service.executeCommand(
      businessId,
      userId,
      'Which visit is this in her package?',
      [],
      { bookingId },
    );

    expect(result.action).toBe('explain_package_visit_context');
    expect(providerClientContext.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'explain_package_visit_context',
      expect.any(Object),
      'Which visit is this in her package?',
      expect.objectContaining({ bookingId }),
    );
  });

  it('executes explain_multi_service_timeline via rescue (ai-cmd-provider-5.2.9)', async () => {
    const result = await service.executeCommand(
      businessId,
      userId,
      "What's next after this blowdry?",
      [],
      { bookingId },
    );

    expect(result.action).toBe('explain_multi_service_timeline');
    expect(providerClientContext.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'explain_multi_service_timeline',
      expect.any(Object),
      "What's next after this blowdry?",
      expect.objectContaining({ bookingId }),
    );
  });
});
