import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';

describe('provider AI clinic tasks & lab results (ai-cmd-provider-6.9)', () => {
  const businessId = 'biz-69';
  const userId = 'user-69';
  const employeeId = 'emp-69';

  let service: ReturnType<typeof createProviderAiCommandHarness>;
  let llm: { isAvailableForBusiness: jest.Mock; completeJson: jest.Mock<any> };
  let providerClinicTasksAndResults: {
    rescueProviderClinicTasksAndResultsIntent: jest.Mock<any>;
    handleListLabResultsQueue: jest.Mock<any>;
    handleClaimClinicTask: jest.Mock<any>;
    handleCompleteClinicTask: jest.Mock<any>;
    handleListBookingLabSummaries: jest.Mock<any>;
  };

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
    providerClinicTasksAndResults = {
      rescueProviderClinicTasksAndResultsIntent: jest.fn(() => null),
      handleListLabResultsQueue: jest.fn(async () => ({
        success: true,
        action: 'list_lab_results_queue',
        summary: '1 result in your queue.',
        details: { count: 1 },
      })),
      handleClaimClinicTask: jest.fn(async () => ({
        success: true,
        action: 'claim_clinic_task',
        summary: 'Claimed task.',
        details: {},
      })),
      handleCompleteClinicTask: jest.fn(async () => ({
        success: true,
        action: 'complete_clinic_task',
        summary: 'Completed task.',
        details: {},
      })),
      handleListBookingLabSummaries: jest.fn(async () => ({
        success: true,
        action: 'list_booking_lab_summaries',
        summary: '1 lab test on this booking.',
        details: { bookingId: 'b1' },
      })),
    };
    service = createProviderAiCommandHarness({
      llm,
      providerMobile: {
        resolveMobileAccess: jest.fn(async () => staffAccess),
        getScopedEmployeeId: jest.fn(() => employeeId),
      },
      providerClinicTasksAndResults,
    });
  });

  function mockIntent(action: string, params: Record<string, unknown>) {
    llm.completeJson.mockResolvedValue({ action, params, reasoning: 'test' });
  }

  it('dispatches list_lab_results_queue with businessId and userId', async () => {
    mockIntent('list_lab_results_queue', {});

    const result = await service.executeCommand(
      businessId,
      userId,
      'Show my lab results queue',
      [],
    );

    expect(result.action).toBe('list_lab_results_queue');
    expect(
      providerClinicTasksAndResults.handleListLabResultsQueue,
    ).toHaveBeenCalledWith(businessId, userId);
  });

  it('dispatches claim_clinic_task with params and prompt', async () => {
    mockIntent('claim_clinic_task', { taskId: 'task-1' });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Claim this task',
      [],
    );

    expect(result.action).toBe('claim_clinic_task');
    expect(
      providerClinicTasksAndResults.handleClaimClinicTask,
    ).toHaveBeenCalledWith(
      businessId,
      userId,
      expect.objectContaining({ taskId: 'task-1' }),
      'Claim this task',
    );
  });

  it('dispatches complete_clinic_task with params and prompt', async () => {
    mockIntent('complete_clinic_task', { taskId: 'task-1' });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Mark task done',
      [],
    );

    expect(result.action).toBe('complete_clinic_task');
    expect(
      providerClinicTasksAndResults.handleCompleteClinicTask,
    ).toHaveBeenCalledWith(
      businessId,
      userId,
      expect.objectContaining({ taskId: 'task-1' }),
      'Mark task done',
    );
  });

  it('dispatches list_booking_lab_summaries with bookingId from context', async () => {
    mockIntent('list_booking_lab_summaries', {});

    const result = await service.executeCommand(
      businessId,
      userId,
      'Any flagged results on this visit?',
      [],
      { bookingId: 'b1' },
    );

    expect(result.action).toBe('list_booking_lab_summaries');
    expect(
      providerClinicTasksAndResults.handleListBookingLabSummaries,
    ).toHaveBeenCalledWith(
      businessId,
      userId,
      expect.objectContaining({ bookingId: 'b1' }),
      'Any flagged results on this visit?',
    );
  });
});
