import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';

describe('provider AI compound recipes (ai-cmd-provider-5.14)', () => {
  const businessId = 'biz-514';
  const userId = 'user-514';
  const employeeId = 'emp-514';

  const staffAccess = {
    viewMode: 'provider' as const,
    membershipRole: MemberRole.STAFF,
    employee: { id: employeeId, name: 'Alex Provider' },
  };

  let providerMobile: {
    resolveMobileAccess: jest.Mock<any>;
    getScopedEmployeeId: jest.Mock<any>;
    searchProviderPatients?: jest.Mock<any>;
  };

  function echoActionHandleIntent(summary: string, details: Record<string, unknown> = {}) {
    return jest.fn(async (...args: any[]) => ({
      success: true,
      action: args[2],
      summary,
      details,
    }));
  }

  beforeEach(() => {
    providerMobile = {
      resolveMobileAccess: jest.fn(async () => staffAccess),
      getScopedEmployeeId: jest.fn(() => employeeId),
    };
  });

  it('chair_closeout: marks visit complete, marks paid, and adds the named retail product', async () => {
    const bookingRepo = {
      find: jest.fn(async () => [
        {
          id: 'bk-1',
          businessId,
          status: 'in_progress',
          customer: { name: 'Jane' },
        },
      ]),
    };
    const providerExp3 = {
      handleIntent: echoActionHandleIntent('Added Olaplex to the cart.', {
        productName: 'Olaplex',
      }),
    };
    const service = createProviderAiCommandHarness({
      providerMobile,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
      bookingService: { update: jest.fn(async () => ({})) },
      providerExp3,
      providerBooking: {
        handleMarkPaid: jest.fn(async () => ({
          success: true,
          action: 'mark_paid',
          summary: 'Marked paid.',
          details: {},
        })),
        handleListPackageAppointmentsToday: jest.fn(),
        isProviderBookingCompound: jest.fn(() => false),
        handleProviderBookingCompound: jest.fn(),
        rescueProviderBookingIntent: jest.fn(() => null),
      },
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Finish Jane, mark paid cash, add Olaplex',
      [],
      { bookingId: 'bk-1', confirmed: true },
    );

    expect(result.action).toBe('chair_closeout');
    expect(providerExp3.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'add_retail_to_booking',
      expect.anything(),
      'Finish Jane, mark paid cash, add Olaplex',
      expect.anything(),
      employeeId,
    );
  });

  it('running_late_notify: marks running late and texts the client', async () => {
    const providerExp2 = {
      handleIntent: echoActionHandleIntent('Marked you running late.'),
    };
    const providerExp3 = {
      handleIntent: echoActionHandleIntent('Texted your next client.'),
    };
    const service = createProviderAiCommandHarness({
      providerMobile,
      providerExp2,
      providerExp3,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      "I'm 15 late — text my next client",
      [],
      {},
    );

    expect(result.action).toBe('running_late_notify');
    expect(providerExp2.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'mark_running_late',
      expect.anything(),
      "I'm 15 late — text my next client",
      expect.anything(),
    );
    expect(providerExp3.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'send_client_message',
      expect.anything(),
      "I'm 15 late — text my next client",
      expect.anything(),
      employeeId,
    );
  });

  it('gap_waitlist_fill: suggests, drafts, and coordinates a waitlist offer', async () => {
    const providerOpenShifts = {
      handleIntent: jest.fn(async (...args: any[]) => ({
        success: true,
        action: args[1],
        summary: `ok:${args[1]}`,
        details: { waitlistCustomerId: 'cust-1' },
      })),
    };
    const service = createProviderAiCommandHarness({
      providerMobile,
      providerOpenShifts,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Fill my 3pm gap from waitlist',
      [],
      { confirmed: true },
    );

    expect(result.action).toBe('gap_waitlist_fill');
    expect(providerOpenShifts.handleIntent).toHaveBeenCalledWith(
      businessId,
      'suggest_waitlist_for_gap',
      'Fill my 3pm gap from waitlist',
      expect.anything(),
      employeeId,
      userId,
      expect.anything(),
    );
    expect(providerOpenShifts.handleIntent).toHaveBeenCalledWith(
      businessId,
      'draft_waitlist_offer_message',
      'Fill my 3pm gap from waitlist',
      expect.anything(),
      employeeId,
      userId,
      expect.anything(),
    );
  });

  it('cancel_and_recover: cancels the booking then looks up rebooking candidates', async () => {
    const bookingRepo = {
      find: jest.fn(async () => [
        {
          id: 'bk-2',
          businessId,
          status: 'confirmed',
          startTime: new Date(),
          customer: { name: 'Jane' },
        },
      ]),
      save: jest.fn(async (b: unknown) => b),
    };
    const providerOpenShifts = {
      handleIntent: jest.fn(async (...args: any[]) => ({
        success: true,
        action: args[1],
        summary: 'Found 2 rebooking candidates.',
        details: {},
      })),
    };
    const service = createProviderAiCommandHarness({
      providerMobile,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
      bookingService: { cancel: jest.fn(async () => ({})) },
      providerOpenShifts,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Cancel 2pm and message waitlist',
      [],
      { confirmed: true },
    );

    expect(result.action).toBe('cancel_and_recover');
    expect(providerOpenShifts.handleIntent).toHaveBeenCalledWith(
      businessId,
      'list_rebooking_candidates',
      'Cancel 2pm and message waitlist',
      expect.anything(),
      employeeId,
      userId,
      expect.anything(),
    );
  });

  it('pre_visit_brief: combines client summary, history, and intake', async () => {
    const providerClientContext = {
      handleIntent: echoActionHandleIntent('ok'),
    };
    const service = createProviderAiCommandHarness({
      providerMobile,
      providerClientContext,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Brief me before Jane at 2',
      [],
      { customerName: 'Jane' },
    );

    expect(result.action).toBe('pre_visit_brief');
    for (const action of [
      'summarize_client',
      'show_client_history',
      'explain_client_intake',
    ]) {
      expect(providerClientContext.handleIntent).toHaveBeenCalledWith(
        businessId,
        userId,
        action,
        expect.anything(),
        'Brief me before Jane at 2',
        expect.anything(),
      );
    }
  });

  it('end_of_day_close: runs summary, payment sweep, and no-show marking', async () => {
    const pushNotifications = {
      handleEndOfDaySummary: jest.fn(async (..._args: any[]) => ({
        success: true,
        action: 'end_of_day_summary',
        summary: 'Today: 5 bookings.',
        details: {},
      })),
    };
    const bookingRepo = { find: jest.fn(async () => []) };
    const service = createProviderAiCommandHarness({
      providerMobile,
      pushNotifications,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Wrap today — mark paid and no-shows',
      [],
      { confirmed: true },
    );

    expect(result.action).toBe('end_of_day_close');
    expect(pushNotifications.handleEndOfDaySummary).toHaveBeenCalledWith(
      businessId,
      expect.anything(),
    );
  });

  it('reschedule_and_notify: reschedules the booking and texts the client', async () => {
    const bookingRepo = {
      find: jest.fn(async () => [
        {
          id: 'bk-3',
          businessId,
          status: 'confirmed',
          startTime: new Date(),
          customer: { name: 'Maria' },
          service: { id: 'svc-1', durationMinutes: 30 },
        },
      ]),
      save: jest.fn(async (b: unknown) => b),
    };
    const providerExp3 = {
      handleIntent: echoActionHandleIntent('Texted Maria about the reschedule.'),
    };
    const service = createProviderAiCommandHarness({
      providerMobile,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
      providerExp3,
      planBuilder: {
        buildRescheduleBookingPlan: jest.fn(() => ({ steps: [] })),
      },
      orchestration: {
        executePlan: jest.fn(async () => ({
          success: true,
          summary: 'Rescheduled Maria to 4pm.',
          taskId: 'task-1',
          requiresApproval: false,
        })),
      },
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Move Maria to 4pm and text her',
      [],
      { customerName: 'Maria', date: '2026-07-11' },
    );

    expect(result.action).toBe('reschedule_and_notify');
    expect(providerExp3.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'send_client_message',
      expect.anything(),
      'Move Maria to 4pm and text her',
      expect.anything(),
      employeeId,
    );
  });

  it('clinic_draw_flow: lists the collection queue, opens the chart, then marks collected', async () => {
    const providerClinicCollection = {
      handleListMyCollectionQueue: jest.fn(async () => ({
        success: true,
        action: 'list_my_collection_queue',
        summary: 'Next draw: Jane.',
        details: { customerName: 'Jane' },
      })),
      handleMarkSpecimenCollected: jest.fn(async () => ({
        success: true,
        action: 'mark_specimen_collected',
        summary: 'Marked collected.',
        details: {},
      })),
    };
    const clinicPatientChart = {
      handleExplainPatientChart: jest.fn(async () => ({
        success: true,
        action: 'explain_patient_chart',
        summary: "Jane's chart.",
        details: { customerId: 'cust-1' },
      })),
    };
    const service = createProviderAiCommandHarness({
      providerMobile,
      providerClinicCollection,
      clinicPatientChart,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Next draw — open chart and mark collected',
      [],
    );

    expect(result.action).toBe('clinic_draw_flow');
    expect(
      providerClinicCollection.handleListMyCollectionQueue,
    ).toHaveBeenCalled();
    expect(clinicPatientChart.handleExplainPatientChart).toHaveBeenCalled();
    expect(
      providerClinicCollection.handleMarkSpecimenCollected,
    ).toHaveBeenCalled();
  });

  it('push_confirm_check_in: confirms the push booking then checks the client in', async () => {
    const providerBooking = {
      handleMarkPaid: jest.fn(),
      handleListPackageAppointmentsToday: jest.fn(),
      isProviderBookingCompound: jest.fn(() => false),
      handleProviderBookingCompound: jest.fn(),
      rescueProviderBookingIntent: jest.fn(() => null),
    };
    const bookingRepo = {
      find: jest.fn(async () => [
        {
          id: 'bk-4',
          businessId,
          status: 'pending',
          customer: { name: 'Jane' },
        },
      ]),
      save: jest.fn(async (b: unknown) => b),
    };
    const providerExp2 = {
      handleIntent: echoActionHandleIntent('Checked Jane in.'),
    };
    const service = createProviderAiCommandHarness({
      providerMobile,
      providerBooking,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
      providerExp2,
      pushActions: {
        handleAction: jest.fn(async () => ({
          success: true,
          summary: 'Confirmed the booking.',
        })),
      },
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Confirm push booking and check in when she arrives',
      [],
      { lastPush: { bookingId: 'bk-4' }, bookingId: 'bk-4' },
    );

    expect(result.action).toBe('push_confirm_check_in');
    expect(providerExp2.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'check_in_client',
      expect.anything(),
      'Confirm push booking and check in when she arrives',
      expect.anything(),
    );
  });

  it('pending_confirm_day: confirms pending bookings then summarizes today', async () => {
    const bookingRepo = { find: jest.fn(async () => []) };
    const service = createProviderAiCommandHarness({
      providerMobile,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Confirm all pending then summarize today',
      [],
      { confirmed: true },
    );

    expect(result.action).toBe('pending_confirm_day');
    expect(result.success).toBe(true);
  });

  it('check_in_start_complete: checks in, starts, then completes the visit', async () => {
    const bookingRepo = {
      find: jest.fn(async () => [
        {
          id: 'bk-5',
          businessId,
          status: 'confirmed',
          customer: { name: 'Jane' },
        },
      ]),
      save: jest.fn(async (b: unknown) => b),
    };
    const providerExp2 = {
      handleIntent: echoActionHandleIntent('Checked Jane in.'),
    };
    const service = createProviderAiCommandHarness({
      providerMobile,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
      bookingService: { update: jest.fn(async () => ({})) },
      providerExp2,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Check in Jane, start service, mark done',
      [],
      { bookingId: 'bk-5', confirmed: true },
    );

    expect(result.action).toBe('check_in_start_complete');
    expect(providerExp2.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'check_in_client',
      expect.anything(),
      'Check in Jane, start service, mark done',
      expect.anything(),
    );
  });

  it('retail_closeout: suggests an upsell, adds it, then marks paid', async () => {
    const retailFinance = {
      handleSuggestRetailUpsell: jest.fn(async () => ({
        success: true,
        action: 'suggest_retail_upsell',
        summary: 'Recommend Olaplex.',
        details: { productName: 'Olaplex' },
      })),
    };
    const providerExp3 = {
      handleIntent: echoActionHandleIntent('Added Olaplex to the cart.'),
    };
    const providerBooking = {
      handleMarkPaid: jest.fn(async () => ({
        success: true,
        action: 'mark_paid',
        summary: 'Marked paid.',
        details: {},
      })),
      handleListPackageAppointmentsToday: jest.fn(),
      isProviderBookingCompound: jest.fn(() => false),
      handleProviderBookingCompound: jest.fn(),
      rescueProviderBookingIntent: jest.fn(() => null),
    };
    const service = createProviderAiCommandHarness({
      providerMobile,
      retailFinance,
      providerExp3,
      providerBooking,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Recommend product and close with cash',
      [],
      { bookingId: 'bk-6' },
    );

    expect(result.action).toBe('retail_closeout');
    expect(retailFinance.handleSuggestRetailUpsell).toHaveBeenCalled();
    expect(providerExp3.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'add_retail_to_booking',
      expect.anything(),
      'Recommend product and close with cash',
      expect.anything(),
      employeeId,
    );
    expect(providerBooking.handleMarkPaid).toHaveBeenCalled();
  });

  it('gap_walk_in_book: books a walk-in then checks the client in', async () => {
    const providerOpenShifts = {
      handleIntent: jest.fn(async (...args: any[]) => ({
        success: true,
        action: args[1],
        summary: `ok:${args[1]}`,
        details: { bookingId: 'bk-7' },
      })),
    };
    const providerExp2 = {
      handleIntent: echoActionHandleIntent('Checked in.'),
    };
    const service = createProviderAiCommandHarness({
      providerMobile,
      providerOpenShifts,
      providerExp2,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Book walk-in in 2pm gap and check in',
      [],
      {},
    );

    expect(result.action).toBe('gap_walk_in_book');
    expect(providerOpenShifts.handleIntent).toHaveBeenCalledWith(
      businessId,
      'book_walk_in_gap',
      'Book walk-in in 2pm gap and check in',
      expect.anything(),
      employeeId,
      userId,
      expect.anything(),
    );
    expect(providerExp2.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'check_in_client',
      expect.anything(),
      'Book walk-in in 2pm gap and check in',
      expect.anything(),
    );
  });

  it('no_show_recover: marks no-show, lists rebooking candidates, then drafts an offer', async () => {
    const bookingRepo = { find: jest.fn(async () => []) };
    const providerOpenShifts = {
      handleIntent: jest.fn(async (...args: any[]) => ({
        success: true,
        action: args[1],
        summary: `ok:${args[1]}`,
        details: {},
      })),
    };
    const service = createProviderAiCommandHarness({
      providerMobile,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
      providerOpenShifts,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'No-show at 2 — who should I offer slot to?',
      [],
      { confirmed: true },
    );

    expect(result.action).toBe('no_show_recover');
    expect(providerOpenShifts.handleIntent).toHaveBeenCalledWith(
      businessId,
      'list_rebooking_candidates',
      'No-show at 2 — who should I offer slot to?',
      expect.anything(),
      employeeId,
      userId,
      expect.anything(),
    );
    expect(providerOpenShifts.handleIntent).toHaveBeenCalledWith(
      businessId,
      'draft_waitlist_offer_message',
      'No-show at 2 — who should I offer slot to?',
      expect.anything(),
      employeeId,
      userId,
      expect.anything(),
    );
  });

  it('multi_service_brief: lists groups, the service timeline, then a client snapshot', async () => {
    const providerBooking = {
      handleListMyMultiServiceGroups: jest.fn(async () => ({
        success: true,
        action: 'list_my_multi_service_groups',
        summary: 'Spa day: 3 services.',
        details: { groupId: 'grp-1' },
      })),
      handleMarkPaid: jest.fn(),
      handleListPackageAppointmentsToday: jest.fn(),
      isProviderBookingCompound: jest.fn(() => false),
      handleProviderBookingCompound: jest.fn(),
      rescueProviderBookingIntent: jest.fn(() => null),
    };
    const providerClientContext = {
      handleIntent: echoActionHandleIntent('ok'),
    };
    const service = createProviderAiCommandHarness({
      providerMobile,
      providerBooking,
      providerClientContext,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Brief me on spa day client at 3',
      [],
      { customerName: 'Jane' },
    );

    expect(result.action).toBe('multi_service_brief');
    for (const action of ['explain_multi_service_timeline', 'summarize_client']) {
      expect(providerClientContext.handleIntent).toHaveBeenCalledWith(
        businessId,
        userId,
        action,
        expect.anything(),
        'Brief me on spa day client at 3',
        expect.anything(),
      );
    }
  });

  it('clinic_draw_patient: finds a patient, opens the chart, then marks collected', async () => {
    providerMobile.searchProviderPatients = jest.fn(async () => ({
      labFeaturesEnabled: true,
      patients: [{ id: 'cust-1', name: 'Jane' }],
    }));
    const clinicPatientChart = {
      handleExplainPatientChart: jest.fn(async () => ({
        success: true,
        action: 'explain_patient_chart',
        summary: "Jane's chart.",
        details: { customerId: 'cust-1' },
      })),
    };
    const providerClinicCollection = {
      handleMarkSpecimenCollected: jest.fn(async () => ({
        success: true,
        action: 'mark_specimen_collected',
        summary: 'Marked collected.',
        details: {},
      })),
    };
    const service = createProviderAiCommandHarness({
      providerMobile,
      clinicPatientChart,
      providerClinicCollection,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Find Jane, open chart, mark draw done',
      [],
      { query: 'Jane' },
    );

    expect(result.action).toBe('clinic_draw_patient');
    expect(clinicPatientChart.handleExplainPatientChart).toHaveBeenCalled();
    expect(
      providerClinicCollection.handleMarkSpecimenCollected,
    ).toHaveBeenCalled();
  });

  it('push_mark_paid_close: opens the push booking, marks paid, then completes the visit', async () => {
    const pushNotifications = {
      handleOpenBookingFromPush: jest.fn(async () => ({
        success: true,
        action: 'open_booking_from_push',
        summary: 'Opened booking bk-8.',
        details: { bookingId: 'bk-8' },
      })),
    };
    const providerBooking = {
      handleMarkPaid: jest.fn(async () => ({
        success: true,
        action: 'mark_paid',
        summary: 'Marked paid.',
        details: {},
      })),
      handleListPackageAppointmentsToday: jest.fn(),
      isProviderBookingCompound: jest.fn(() => false),
      handleProviderBookingCompound: jest.fn(),
      rescueProviderBookingIntent: jest.fn(() => null),
    };
    const bookingRepo = {
      find: jest.fn(async () => [
        {
          id: 'bk-8',
          businessId,
          status: 'confirmed',
          customer: { name: 'Jane' },
        },
      ]),
      save: jest.fn(async (b: unknown) => b),
    };
    const service = createProviderAiCommandHarness({
      providerMobile,
      pushNotifications,
      providerBooking,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
      bookingService: { update: jest.fn(async () => ({})) },
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'From notification — mark paid and complete',
      [],
      { lastPush: { bookingId: 'bk-8' }, bookingId: 'bk-8', confirmed: true },
    );

    expect(result.action).toBe('push_mark_paid_close');
    expect(pushNotifications.handleOpenBookingFromPush).toHaveBeenCalled();
    expect(providerBooking.handleMarkPaid).toHaveBeenCalled();
  });

  it('manager_floor_sweep: floor status, team unpaid, then a payment sweep', async () => {
    const providerExp2 = {
      handleIntent: jest.fn(async (...args: any[]) => ({
        success: true,
        action: args[2],
        summary: `ok:${args[2]}`,
        details: {},
      })),
    };
    const bookingRepo = { find: jest.fn(async () => []) };
    const service = createProviderAiCommandHarness({
      providerMobile,
      providerExp2,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Floor status then sweep team unpaid',
      [],
      { confirmed: true },
    );

    expect(result.action).toBe('manager_floor_sweep');
    expect(providerExp2.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'team_floor_status',
      expect.anything(),
      'Floor status then sweep team unpaid',
      expect.anything(),
    );
    expect(providerExp2.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'list_team_unpaid_today',
      expect.anything(),
      'Floor status then sweep team unpaid',
      expect.anything(),
    );
  });
});
