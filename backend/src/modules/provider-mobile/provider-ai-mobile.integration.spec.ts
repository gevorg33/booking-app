import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { ProviderAiCommandService } from './provider-ai-command.service.js';

describe('Provider mobile AI (ai-cmd-h3.5)', () => {
  const businessId = 'biz-h35';
  const userId = 'user-h35';
  const employeeId = 'emp-h35';
  const bookingId = 'book-push-1';

  let service: ProviderAiCommandService;
  let llm: { isAvailableForBusiness: jest.Mock; completeJson: jest.Mock };
  let providerMobile: {
    resolveMobileAccess: jest.Mock;
    getScopedEmployeeId: jest.Mock;
  };
  let pushActions: { handleAction: jest.Mock };
  let providerBooking: {
    handleMarkPaid: jest.Mock;
    handleListPackageAppointmentsToday: jest.Mock;
    isProviderBookingCompound: jest.Mock;
    handleProviderBookingCompound: jest.Mock;
    rescueProviderBookingIntent: jest.Mock;
  };
  let pushNotifications: {
    isPushNotificationsCompound: jest.Mock;
    handlePushNotificationsCompound: jest.Mock;
    rescuePushNotificationsIntent: jest.Mock;
    handleOpenBookingFromPush: jest.Mock;
    handleExplainLastPush: jest.Mock;
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

  const lastPush = {
    bookingId,
    pushType: 'booking_created',
    title: 'New appointment',
    body: 'Sam — Cut at 14:00',
  };

  beforeEach(() => {
    llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(),
    };
    providerMobile = {
      resolveMobileAccess: jest.fn(async () => staffAccess),
      getScopedEmployeeId: jest.fn(() => employeeId),
    };
    pushActions = {
      handleAction: jest.fn(async () => ({
        success: true,
        summary: 'Confirmed Sam',
      })),
    };
    providerBooking = {
      handleMarkPaid: jest.fn(async () => ({
        success: true,
        action: 'mark_paid',
        summary: 'Marked paid',
        details: { bookingId },
      })),
      handleListPackageAppointmentsToday: jest.fn(async () => ({
        success: true,
        action: 'list_package_appointments_today',
        summary: '2 package appointments today',
        details: { count: 2 },
      })),
      isProviderBookingCompound: jest.fn(() => false),
      handleProviderBookingCompound: jest.fn(),
      rescueProviderBookingIntent: jest.fn(() => null),
    };
    pushNotifications = {
      isPushNotificationsCompound: jest.fn(() => false),
      handlePushNotificationsCompound: jest.fn(),
      rescuePushNotificationsIntent: jest.fn(() => null),
      handleOpenBookingFromPush: jest.fn(async () => ({
        success: true,
        action: 'open_booking_from_push',
        summary: 'Open Sam',
        details: { bookingId, deepLink: `/provider/today?bookingId=${bookingId}` },
      })),
      handleExplainLastPush: jest.fn(() => ({
        success: true,
        action: 'explain_last_push',
        summary: 'New booking push with quick actions.',
        details: { explained: true },
      })),
    };
    completionPipeline = {
      mergeProviderSessionContext: jest.fn((params) => params),
      normalizeDateParams: jest.fn(),
      buildProviderSessionContext: jest.fn((params) => params),
    };

    service = new ProviderAiCommandService(
      { find: jest.fn(async () => []) } as any,
      { find: jest.fn(async () => []) } as any,
      { find: jest.fn() } as any,
      { createQueryBuilder: jest.fn() } as any,
      { find: jest.fn(async () => []) } as any,
      {} as any,
      {} as any,
      llm as any,
      providerMobile as any,
      completionPipeline as any,
      { emitClarify: jest.fn(), emitTaskCompleted: jest.fn() } as any,
      { handleBlockSchedule: jest.fn() } as any,
      {} as any,
      {} as any,
      {
        preflightBlock: jest.fn(() => null),
        enforceAction: jest.fn(() => null),
        stripParams: jest.fn((params) => params),
        applyStaffScope: jest.fn((_tier, _action, params) => params),
      } as any,
      pushNotifications as any,
      providerBooking as any,
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
      pushActions as any,
    );
  });

  function mockIntent(action: string, params: Record<string, unknown> = {}) {
    llm.completeJson.mockResolvedValue({
      action,
      params,
      reasoning: 'test',
    });
  }

  it('confirms booking via NL with push parity (same as push Confirm)', async () => {
    mockIntent('update_bookings', {});
    const result = await service.executeCommand(
      businessId,
      userId,
      'Confirm this booking from the push notification',
      [],
      { lastPush },
    );
    expect(result.action).toBe('confirm_booking_from_push');
    expect(pushActions.handleAction).toHaveBeenCalledWith(
      businessId,
      userId,
      expect.objectContaining({ actionId: 'confirm', bookingId }),
    );
    expect(result.details.pushParity).toBe('confirm');
  });

  it('marks paid via NL with bookingId inherited from lastPush', async () => {
    mockIntent('payment_sweep', {});
    const result = await service.executeCommand(
      businessId,
      userId,
      'Mark booking paid from push',
      [],
      { lastPush },
    );
    expect(result.action).toBe('mark_paid');
    expect(providerBooking.handleMarkPaid).toHaveBeenCalledWith(
      businessId,
      expect.objectContaining({ bookingId }),
      userId,
    );
  });

  it('suggest reschedule from push opens AI guidance like push button', async () => {
    mockIntent('reschedule_booking', {});
    pushActions.handleAction.mockResolvedValueOnce({
      success: true,
      summary: 'Open AI to reschedule Sam',
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Reschedule from push notification',
      [],
      { lastPush },
    );
    expect(result.action).toBe('suggest_reschedule_from_push');
    expect(pushActions.handleAction).toHaveBeenCalledWith(
      businessId,
      userId,
      expect.objectContaining({ actionId: 'suggest_reschedule', bookingId }),
    );
    expect(result.details.openAi).toBe(true);
  });

  it('executes open booking + confirm compound', async () => {
    const result = await service.executeCommand(
      businessId,
      userId,
      'Open booking from push and confirm it',
      [],
      { lastPush },
    );
    expect(result.action).toBe('compound_intent');
    expect(result.details.compound).toBe(true);
    expect(pushNotifications.handleOpenBookingFromPush).toHaveBeenCalled();
    expect(pushActions.handleAction).toHaveBeenCalledWith(
      businessId,
      userId,
      expect.objectContaining({ actionId: 'confirm', bookingId }),
    );
  });

  it('rescues scoped package list from dashboard phrasing', async () => {
    mockIntent('list_package_bookings', {});
    const result = await service.executeCommand(
      businessId,
      userId,
      'Show my package appointments today',
    );
    expect(result.action).toBe('list_package_appointments_today');
    expect(providerBooking.handleListPackageAppointmentsToday).toHaveBeenCalled();
  });
});
