import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { ProviderAiCommandService } from './provider-ai-command.service.js';
import * as smartClarify from '../ai/ai-smart-clarify.util.js';

describe('Sprint 19 provider AI commands integration', () => {
  const businessId = 'biz-s19';
  const userId = 'user-s19';
  const employeeId = 'emp-s19';

  let service: ProviderAiCommandService;
  let llm: { isAvailableForBusiness: jest.Mock; completeJson: jest.Mock };
  let providerMobile: {
    resolveMobileAccess: jest.Mock;
    getScopedEmployeeId: jest.Mock;
  };
  let bookingRepo: { find: jest.Mock };
  let periodRepo: { find: jest.Mock };
  let employeeRepo: { find: jest.Mock };
  let schedulingEngine: { getEmployeeUtilization: jest.Mock };
  let scheduleHandlers: { handleBlockSchedule: jest.Mock };
  let promptSecurity: {
    preflightBlock: jest.Mock;
    enforceAction: jest.Mock;
    stripParams: jest.Mock;
    applyStaffScope: jest.Mock;
  };
  let completionPipeline: {
    mergeProviderSessionContext: jest.Mock;
    normalizeDateParams: jest.Mock;
    buildProviderSessionContext: jest.Mock;
  };

  const staffAccess = {
    viewMode: 'provider' as const,
    membershipRole: MemberRole.STAFF,
    employee: { id: employeeId, name: 'Alex Provider' },
  };

  beforeEach(() => {
    jest.spyOn(smartClarify, 'resolveSmartClarify').mockReturnValue(null);
    llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(),
    };
    providerMobile = {
      resolveMobileAccess: jest.fn(async () => staffAccess),
      getScopedEmployeeId: jest.fn(() => employeeId),
    };
    bookingRepo = { find: jest.fn(async () => []) };
    periodRepo = { find: jest.fn(async () => []) };
    employeeRepo = {
      find: jest.fn(async () => [
        { id: employeeId, name: 'Alex Provider', isActive: true },
      ]),
    };
    schedulingEngine = {
      getEmployeeUtilization: jest.fn(async () => ({
        utilizationPercent: 62,
        bookedMinutes: 180,
        totalMinutes: 290,
      })),
    };
    scheduleHandlers = {
      handleBlockSchedule: jest.fn(async () => ({
        success: true,
        summary: 'Blocked lunch break.',
        details: { blocked: true },
      })),
    };
    promptSecurity = {
      preflightBlock: jest.fn(() => null),
      enforceAction: jest.fn(() => null),
      stripParams: jest.fn((p) => p),
      applyStaffScope: jest.fn((_tier, _action, p) => p),
    };
    completionPipeline = {
      mergeProviderSessionContext: jest.fn((p) => p),
      normalizeDateParams: jest.fn(),
      buildProviderSessionContext: jest.fn(() => ({})),
      trace: jest.fn((_stage, action) => ({ stage: 'classify', action, at: new Date().toISOString() })),
    };

    service = new ProviderAiCommandService(
      bookingRepo as any,
      employeeRepo as any,
      { find: jest.fn(async () => []) } as any,
      { find: jest.fn(async () => []) } as any,
      periodRepo as any,
      {} as any,
      schedulingEngine as any,
      llm as any,
      providerMobile as any,
      completionPipeline as any,
      { emitClarify: jest.fn(), emitTaskCompleted: jest.fn() } as any,
      scheduleHandlers as any,
      {} as any,
      {} as any,
      promptSecurity as any,
      {
        isPushNotificationsCompound: jest.fn(() => false),
        handlePushNotificationsCompound: jest.fn(),
        rescuePushNotificationsIntent: jest.fn(() => null),
      } as any,
      { rescueProviderIntent: jest.fn(() => null) } as any,
      {
        isProviderBookingCompound: jest.fn(() => false),
        handleProviderBookingCompound: jest.fn(),
        rescueProviderBookingIntent: jest.fn(() => null),
      } as any,
      {} as any,
      {} as any,
      {
        handleExplainProviderPaymentCurrency: jest.fn(async () => ({
          success: true,
          action: 'explain_provider_payment_currency',
          summary: 'ok',
          details: {},
        })),
      } as any,
      {
        handleExplainProviderDateDisplay: jest.fn(async () => ({
          success: true,
          action: 'explain_provider_date_display',
          summary: 'ok',
          details: {},
        })),
        handleConfigureProviderPushDateFormat: jest.fn(async () => ({
          success: true,
          action: 'configure_provider_push_date_format',
          summary: 'ok',
          details: {},
        })),
      } as any,
      {
        handleExplainAppointmentTax: jest.fn(async () => ({
          success: true,
          action: 'explain_appointment_tax',
          summary: 'ok',
          details: {},
        })),
      } as any,
      {
        handleExplainProviderSessionTimeout: jest.fn(async () => ({
          success: true,
          action: 'explain_provider_session_timeout',
          summary: 'ok',
          details: {},
        })),
      } as any,
      { handleAction: jest.fn() } as any,
      {
        enrichClassification: jest.fn(async (input: { intent: { action: string } }) => ({
          intent: input.intent,
          verification: { ok: true, confidence: 0.9, fieldConfidence: {}, reasons: [] },
          consensus: { needsEscalation: false, llmAction: input.intent.action },
        })),
      } as any,
      { shouldExecute: jest.fn(() => false), execute: jest.fn() } as any,
    );
  });

  function mockIntent(action: string, params: Record<string, unknown> = {}) {
    llm.completeJson.mockResolvedValue({
      action,
      params,
      reasoning: 'test',
    });
  }

  it('routes show_appointments for who is next with upcoming filter', async () => {
    const future = new Date(Date.now() + 2 * 60 * 60 * 1000);
    bookingRepo.find.mockResolvedValue([
      {
        id: 'b1',
        startTime: future,
        endTime: new Date(future.getTime() + 3_600_000),
        status: BookingStatus.CONFIRMED,
        customer: { name: 'Sam' },
        service: { name: 'Haircut' },
      },
    ]);
    mockIntent('show_appointments', { date: '02/06/2026' });

    const result = await service.executeCommand(
      businessId,
      userId,
      "Who's next?",
    );
    expect(result.action).toBe('show_appointments');
    expect(result.success).toBe(true);
    expect(result.summary).toMatch(/Next up|appointment/i);
  });

  it('checks availability with afternoon gaps', async () => {
    mockIntent('check_availability', { date: '02/06/2026' });
    const result = await service.executeCommand(
      businessId,
      userId,
      'Check my availability this afternoon',
    );
    expect(result.action).toBe('check_availability');
    expect(result.success).toBe(true);
    expect(periodRepo.find).toHaveBeenCalled();
    expect(result.summary).toMatch(/afternoon|Afternoon|open slots/i);
  });

  it('blocks lunch on own calendar for staff', async () => {
    mockIntent('block_schedule', { date: '02/06/2026' });
    const result = await service.executeCommand(
      businessId,
      userId,
      'Block lunch today',
    );
    expect(result.action).toBe('block_schedule');
    expect(scheduleHandlers.handleBlockSchedule).toHaveBeenCalledWith(
      businessId,
      'Block lunch today',
      expect.objectContaining({
        timeFrom: '12:00',
        timeTo: '13:00',
        allProviders: false,
      }),
      expect.arrayContaining([expect.objectContaining({ id: employeeId })]),
      userId,
    );
    expect(result.summary).toMatch(/Blocked lunch/);
  });

  it('summarizes utilization for managers (team scope)', async () => {
    providerMobile.resolveMobileAccess.mockResolvedValue({
      viewMode: 'team',
      membershipRole: MemberRole.MANAGER,
      employee: { id: employeeId, name: 'Alex Provider' },
    });
    providerMobile.getScopedEmployeeId.mockReturnValue(undefined);
    mockIntent('summarize_utilization', {});
    const result = await service.executeCommand(
      businessId,
      userId,
      'Summarize utilization this week',
    );
    expect(result.action).toBe('summarize_utilization');
    expect(result.success).toBe(true);
    expect(result.summary).toMatch(/Team utilization/);
    expect(schedulingEngine.getEmployeeUtilization).toHaveBeenCalled();
  });

  it('fails availability when provider has no linked employee', async () => {
    providerMobile.getScopedEmployeeId.mockReturnValue(undefined);
    mockIntent('check_availability', { date: '02/06/2026' });
    const result = await service.executeCommand(
      businessId,
      userId,
      'Open slots today?',
    );
    expect(result.action).toBe('check_availability');
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/linked to your account/i);
  });
});
