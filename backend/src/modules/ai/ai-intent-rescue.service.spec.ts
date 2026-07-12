import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { PROVIDER_PAYMENT_SWEEP_PROMPT_SCENARIOS } from './ai-provider-payment-sweep.fixtures.js';
import { PROVIDER_UPDATE_BOOKINGS_STATUS_PROMPT_SCENARIOS } from './ai-provider-update-bookings-status.fixtures.js';
import { PROVIDER_MARK_VISIT_IN_PROGRESS_PROMPT_SCENARIOS } from './ai-provider-mark-visit-in-progress.fixtures.js';
import { PROVIDER_MARK_MULTI_SERVICE_STEP_DONE_PROMPT_SCENARIOS } from './ai-provider-mark-multi-service-step-done.fixtures.js';
import { PROVIDER_CONFIRM_PENDING_BOOKING_PROMPT_SCENARIOS } from './ai-provider-confirm-pending-booking.fixtures.js';
import {
  PROVIDER_EXPLAIN_BOOKING_STATUS_BADGE_PROMPT_SCENARIOS,
  PROVIDER_EXPLAIN_FLOOR_STATUS_PROMPT_SCENARIOS,
} from './ai-provider-visit-status-explainers.fixtures.js';
import {
  PROVIDER_EXPLAIN_CALENDAR_UTILIZATION_BANDS_PROMPT_SCENARIOS,
  PROVIDER_EXPLAIN_BLOCK_VS_TIME_OFF_PROMPT_SCENARIOS,
} from './ai-provider-calendar-scheduling-explainers.fixtures.js';
import {
  PROVIDER_EXPLAIN_OFFLINE_SUGGESTIONS_PROMPT_SCENARIOS,
  PROVIDER_EXPLAIN_ACCESSIBILITY_SETTINGS_PROMPT_SCENARIOS,
} from './ai-provider-assistant-ux-explainers.fixtures.js';
import { PROVIDER_GIVE_AI_FEEDBACK_PROMPTS } from './ai-provider-give-ai-feedback.fixtures.js';
import {
  PROVIDER_EXPLAIN_DASHBOARD_ONLY_ACTION_PROMPT_SCENARIOS,
  PROVIDER_EXPLAIN_REASSIGN_LIMIT_PROMPT_SCENARIOS,
  PROVIDER_EXPLAIN_TIME_OFF_APPROVAL_PROMPT_SCENARIOS,
} from './ai-provider-dashboard-handoff.fixtures.js';

describe('AiIntentRescueService', () => {
  const rescue = new AiIntentRescueService();
  const employees = [
    { id: '1', name: 'Gevorg Gasparyan' },
    { id: '2', name: 'Mary Torgomyan' },
  ];

  it('pipe-1.5.2 merges semantic param hints into rescued booking params', () => {
    const result = rescue.rescue({
      prompt: 'schedule anna for a trim tomorrow',
      action: 'unknown',
      params: {},
      employees,
      semanticParamHints: { bookingFirstAvailable: true },
    });
    expect(result?.action).toBe('create_booking');
    expect(result?.params.bookingFirstAvailable).toBe(true);
    expect(result?.rescued).toBe(true);
  });

  it('pipe-1.5.2 does not let semantic hints override explicit rescue params', () => {
    const result = rescue.rescue({
      prompt: 'schedule anna for a trim tomorrow',
      action: 'unknown',
      params: { bookingFirstAvailable: false },
      employees,
      semanticParamHints: { bookingFirstAvailable: true },
    });
    expect(result?.params.bookingFirstAvailable).toBe(false);
  });

  it('rescues unknown clear schedule prompts', () => {
    const result = rescue.rescue({
      prompt: 'Clear Gevorg schedule for tomorrow',
      action: 'unknown',
      params: { employeeName: 'Gevorg' },
      employees,
    });
    expect(result?.action).toBe('clear_schedule');
    expect(result?.rescued).toBe(true);
  });

  it('rescues payment sweep to payment_sweep action', () => {
    const result = rescue.rescue({
      prompt: 'Run payment sweep for today',
      action: 'unknown',
      params: { date: '26_05_2026' },
      employees,
    });
    expect(result?.action).toBe('payment_sweep');
  });

  it.each(
    PROVIDER_PAYMENT_SWEEP_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]),
  )(
    'rescues payment_sweep prompt %s (ai-cmd-provider-5.3.2)',
    (_id, prompt) => {
      const result = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
        employees,
        surface: 'provider',
      });
      expect(result?.action).toBe('payment_sweep');
      expect(result?.rescueReason).toBe('payment_sweep_pattern');
    },
  );

  it('rescues day replan to day_replan action', () => {
    const result = rescue.rescue({
      prompt: 'Replan my day for tomorrow',
      action: 'unknown',
      params: {},
      employees,
    });
    expect(result?.action).toBe('day_replan');
  });

  it('rescues mark no-shows to mark_no_shows action', () => {
    const result = rescue.rescue({
      prompt: 'Mark no-shows for Gevorg today',
      action: 'unknown',
      params: { employeeName: 'Gevorg', date: '26_05_2026' },
      employees,
    });
    expect(result?.action).toBe('mark_no_shows');
  });

  it('rescues no-show recovery and sick-day replan operations intents', () => {
    expect(
      rescue.rescue({
        prompt:
          'Mark no-shows today, release slots, suggest rebooking messages',
        action: 'unknown',
        params: { date: '26_05_2026' },
        employees,
      })?.action,
    ).toBe('no_show_recovery');

    expect(
      rescue.rescue({
        prompt:
          'Maria is sick — cancel her day and redistribute urgent bookings',
        action: 'unknown',
        params: { date: '26_05_2026' },
        employees,
      })?.action,
    ).toBe('sick_day_replan');

    expect(
      rescue.rescue({
        prompt: 'Raise all massage prices 10% from June 1',
        action: 'unknown',
        params: {},
        employees,
      })?.action,
    ).toBe('update_service_prices');
  });

  it('rescues schedule template creation', () => {
    const result = rescue.rescue({
      prompt: 'Create template Weekday 9-17 Mon-Fri',
      action: 'unknown',
      params: {},
      employees,
    });
    expect(result?.action).toBe('create_schedule_template');
  });

  it('disambiguates create_booking with nearest slot to first-available booking', () => {
    const result = rescue.rescue({
      prompt:
        'check who is free tomorrow evening for permanent lashes, book the nearest slot',
      action: 'create_booking',
      params: { serviceName: 'permanent lashes', date: '2026-06-06' },
      employees,
    });
    expect(result?.rescued).toBe(true);
    expect(result?.action).toBe('create_booking');
    expect(result?.params.bookingFirstAvailable).toBe(true);
    expect(result?.params.timeSlot).toBeUndefined();
  });

  it('disambiguates create_booking misclassified as team availability query', () => {
    const result = rescue.rescue({
      prompt: 'Who can do facemassage today at 9?',
      action: 'create_booking',
      params: { serviceName: 'facemassage', timeSlot: '09:00' },
      employees,
    });
    expect(result?.action).toBe('check_providers_for_service');
    expect(result?.rescued).toBe(true);
  });

  it('disambiguates create_booking misclassified as staff assignment lookup', () => {
    const result = rescue.rescue({
      prompt: 'who is doing facemassage today',
      action: 'create_booking',
      params: { serviceName: 'facemassage' },
      employees,
    });
    expect(result?.action).toBe('lookup_service_assignment');
    expect(result?.rescued).toBe(true);
  });

  it('disambiguates create_booking to reschedule for move provider appointment', () => {
    const result = rescue.rescue({
      prompt: "Move Gevorg's appointment on June 1 to June 2 nearest free time",
      action: 'create_booking',
      params: {
        employeeName: 'Gevorg Gasparyan',
        customerName: 'Gevorg G',
        date: '02_06_2026',
        bookingFirstAvailable: true,
      },
      employees,
    });
    expect(result?.action).toBe('reschedule_booking');
    expect(result?.params.customerName).toBeNull();
    expect(result?.params.bookingFirstAvailable).toBe(true);
  });

  it('rescues move appointment as reschedule before create_booking', () => {
    const result = rescue.rescue({
      prompt: "Move Gevorg's appointment on June 1 to June 2 nearest free time",
      action: 'unknown',
      params: {},
      employees,
    });
    expect(result?.action).toBe('reschedule_booking');
    expect(result?.params.bookingFirstAvailable).toBe(true);
  });

  it('rescues conditional booking from unknown', () => {
    const result = rescue.rescue({
      prompt:
        'Book facemassage on Gevorg tomorrow at 9; if not available then Mary; otherwise whoever is free',
      action: 'unknown',
      params: {
        serviceName: 'facemassage',
        date: '27_05_2026',
        timeSlot: '09:00',
      },
      employees,
    });
    expect(result?.action).toBe('create_booking');
    expect(result?.params.fallbackAnyProvider).toBe(true);
    expect(result?.params.providerFallbackNames?.length).toBeGreaterThan(0);
  });

  it('rescues scheduling scenarios from unknown', () => {
    expect(
      rescue.rescue({
        prompt: 'Swap Friday schedules between Gevorg and Maria',
        action: 'unknown',
        params: {},
        employees,
      })?.action,
    ).toBe('swap_schedules');

    expect(
      rescue.rescue({
        prompt: 'Move 2 facemassage slots from Gevorg to Maria on Friday',
        action: 'unknown',
        params: {},
        employees,
      })?.action,
    ).toBe('rebalance_capacity');
  });

  it('disambiguates misclassified actions to scheduling intents', () => {
    const swap = rescue.rescue({
      prompt: 'Swap Friday schedules between Gevorg and Maria',
      action: 'apply_schedule',
      params: {
        employeeNames: ['Gevorg Gasparyan', 'Mary Torgomyan'],
        date: '06/06/2026',
      },
      employees,
    });
    expect(swap?.action).toBe('swap_schedules');
    expect(swap?.rescueReason).toBe('scheduling_intent');
  });

  it('rescues total earnings prompts to summarize_bookings revenue metric', () => {
    const result = rescue.rescue({
      prompt: 'Calculate total earnings for today',
      action: 'unknown',
      params: {},
      employees,
    });
    expect(result?.action).toBe('summarize_bookings');
    expect(result?.params.bookingMetric).toBe('revenue');
    expect(result?.rescueReason).toBe('total_earnings');
  });

  it('rescues top specialist revenue prompts to summarize_staff', () => {
    const result = rescue.rescue({
      prompt: 'Top 3 specialists by revenue last week',
      action: 'unknown',
      params: {},
      employees,
    });
    expect(result?.action).toBe('summarize_staff');
    expect(result?.params.staffMetric).toBe('most_revenue');
    expect(result?.params.limit).toBe(3);
    expect(result?.rescueReason).toBe('top_staff_revenue');
  });

  it('disambiguates list_bookings to total earnings analytics', () => {
    const result = rescue.rescue({
      prompt: 'How much did we earn last month?',
      action: 'list_bookings',
      params: { dateFrom: '01/05/2026', dateTo: '31/05/2026' },
      employees,
    });
    expect(result?.action).toBe('summarize_bookings');
    expect(result?.params.bookingMetric).toBe('revenue');
    expect(result?.rescueReason).toBe('list_to_total_earnings');
  });

  it('disambiguates list_employees to specialist revenue ranking', () => {
    const result = rescue.rescue({
      prompt: 'Which specialist had the most revenue today?',
      action: 'list_employees',
      params: {},
      employees,
    });
    expect(result?.action).toBe('summarize_staff');
    expect(result?.params.staffMetric).toBe('most_revenue');
    expect(result?.rescueReason).toBe('list_to_top_staff_revenue');
  });

  it('returns null when no rescue applies', () => {
    const result = rescue.rescue({
      prompt: 'Hello there',
      action: 'unknown',
      params: {},
      employees,
    });
    expect(result).toBeNull();
  });

  describe('update_bookings status branches (ai-cmd-provider-5.16.1)', () => {
    it.each(
      PROVIDER_UPDATE_BOOKINGS_STATUS_PROMPT_SCENARIOS.map((s) => [
        s.id,
        s.prompt,
        s.expectedStatus,
      ]),
    )('rescues %s to update_bookings with status=%s', (_id, prompt, expectedStatus) => {
      const result = rescue.rescue({
        prompt: prompt as string,
        action: 'unknown',
        params: {},
        employees,
      });
      expect(result?.action).toBe('update_bookings');
      expect(result?.params.status).toBe(expectedStatus);
    });

    it('does not misroute mark_visit_complete phrasing to confirm_my_booking_details', () => {
      // Note: at this general (dashboard-shared) rescue layer, "mark this visit
      // complete" legitimately falls through to ai-booking-depth's bare
      // mark+done/complete heuristic (mark_paid) — matching the established,
      // separately-tested "mark the visit as done" → mark_paid behavior. The
      // provider-mobile flow overrides this correctly via the dedicated
      // rescueProviderAiIntent → isMarkVisitCompletePrompt check, which runs
      // after this general pipeline (see provider-ai-intent.util.ts).
      const result = rescue.rescue({
        prompt: 'Mark this visit complete',
        action: 'unknown',
        params: {},
        employees,
      });
      expect(result?.action).not.toBe('confirm_my_booking_details');
    });
  });

  describe('mark_visit_in_progress (ai-cmd-provider-5.16.2)', () => {
    it.each(
      PROVIDER_MARK_VISIT_IN_PROGRESS_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]),
    )('rescues %s to mark_visit_in_progress', (_id, prompt) => {
      const result = rescue.rescue({
        prompt: prompt as string,
        action: 'unknown',
        params: {},
        employees,
        surface: 'provider',
      });
      expect(result?.action).toBe('mark_visit_in_progress');
      expect(result?.params.status).toBe('in_progress');
    });
  });

  describe('mark_multi_service_step_done (ai-cmd-provider-5.18.3)', () => {
    it.each(
      PROVIDER_MARK_MULTI_SERVICE_STEP_DONE_PROMPT_SCENARIOS.map((s) => [
        s.id,
        s.prompt,
      ]),
    )('rescues %s to mark_multi_service_step_done', (_id, prompt) => {
      const result = rescue.rescue({
        prompt: prompt as string,
        action: 'unknown',
        params: {},
        employees,
        surface: 'provider',
      });
      expect(result?.action).toBe('mark_multi_service_step_done');
    });

    it('extracts stepIndex from "Finish step 1 of spa day"', () => {
      const result = rescue.rescue({
        prompt: 'Finish step 1 of spa day',
        action: 'unknown',
        params: {},
        employees,
        surface: 'provider',
      });
      expect(result?.params.stepIndex).toBe(1);
    });

    it('extracts serviceName from "Complete blowdry leg"', () => {
      const result = rescue.rescue({
        prompt: 'Complete blowdry leg',
        action: 'unknown',
        params: {},
        employees,
        surface: 'provider',
      });
      expect(result?.params.serviceName).toBe('blowdry');
    });
  });

  describe('confirm_pending_booking (ai-cmd-provider-5.16.4)', () => {
    it.each(
      PROVIDER_CONFIRM_PENDING_BOOKING_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]),
    )('rescues %s to confirm_pending_booking', (_id, prompt) => {
      const result = rescue.rescue({
        prompt: prompt as string,
        action: 'unknown',
        params: {},
        employees,
        surface: 'provider',
      });
      expect(result?.action).toBe('confirm_pending_booking');
    });
  });

  describe('visit status explainers (ai-cmd-provider-5.16.5 / 5.16.6)', () => {
    it.each(
      PROVIDER_EXPLAIN_BOOKING_STATUS_BADGE_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]),
    )('rescues %s to explain_booking_status_badge', (_id, prompt) => {
      const result = rescue.rescue({
        prompt: prompt as string,
        action: 'unknown',
        params: {},
        employees,
        surface: 'provider',
      });
      expect(result?.action).toBe('explain_booking_status_badge');
    });

    it.each(
      PROVIDER_EXPLAIN_FLOOR_STATUS_PROMPT_SCENARIOS.map((s) => [s.id, s.prompt]),
    )('rescues %s to explain_floor_status', (_id, prompt) => {
      const result = rescue.rescue({
        prompt: prompt as string,
        action: 'unknown',
        params: {},
        employees,
        surface: 'provider',
      });
      expect(result?.action).toBe('explain_floor_status');
    });
  });

  describe('calendar scheduling explainers (ai-cmd-provider-5.23.2 / 5.23.4)', () => {
    it.each(
      PROVIDER_EXPLAIN_CALENDAR_UTILIZATION_BANDS_PROMPT_SCENARIOS.map((s) => [
        s.id,
        s.prompt,
      ]),
    )('rescues %s to explain_calendar_utilization_bands', (_id, prompt) => {
      const result = rescue.rescue({
        prompt: prompt as string,
        action: 'unknown',
        params: {},
        employees,
        surface: 'provider',
      });
      expect(result?.action).toBe('explain_calendar_utilization_bands');
    });

    it.each(
      PROVIDER_EXPLAIN_BLOCK_VS_TIME_OFF_PROMPT_SCENARIOS.map((s) => [
        s.id,
        s.prompt,
      ]),
    )('rescues %s to explain_block_vs_time_off', (_id, prompt) => {
      const result = rescue.rescue({
        prompt: prompt as string,
        action: 'unknown',
        params: {},
        employees,
        surface: 'provider',
      });
      expect(result?.action).toBe('explain_block_vs_time_off');
    });
  });

  describe('assistant UX explainers (ai-cmd-provider-5.24.1 / 5.24.6)', () => {
    it.each(
      PROVIDER_EXPLAIN_OFFLINE_SUGGESTIONS_PROMPT_SCENARIOS.map((s) => [
        s.id,
        s.prompt,
      ]),
    )('rescues %s to explain_offline_suggestions', (_id, prompt) => {
      const result = rescue.rescue({
        prompt: prompt as string,
        action: 'unknown',
        params: {},
        employees,
        surface: 'provider',
      });
      expect(result?.action).toBe('explain_offline_suggestions');
    });

    it.each(
      PROVIDER_EXPLAIN_ACCESSIBILITY_SETTINGS_PROMPT_SCENARIOS.map((s) => [
        s.id,
        s.prompt,
      ]),
    )('rescues %s to explain_accessibility_settings', (_id, prompt) => {
      const result = rescue.rescue({
        prompt: prompt as string,
        action: 'unknown',
        params: {},
        employees,
        surface: 'provider',
      });
      expect(result?.action).toBe('explain_accessibility_settings');
    });
  });

  describe('give_provider_ai_feedback (ai-cmd-provider-5.24.3)', () => {
    it.each(
      PROVIDER_GIVE_AI_FEEDBACK_PROMPTS.map((s) => [s.id, s.prompt]),
    )('rescues %s to give_provider_ai_feedback on provider surface', (_id, prompt) => {
      const result = rescue.rescue({
        prompt: prompt as string,
        action: 'unknown',
        params: {},
        employees,
        surface: 'provider',
      });
      expect(result?.action).toBe('give_provider_ai_feedback');
    });

    it('does not rescue to give_provider_ai_feedback on customer surface', () => {
      const result = rescue.rescue({
        prompt: 'Wrong client picked',
        action: 'unknown',
        params: {},
        employees,
        surface: 'customer',
      });
      expect(result?.action).not.toBe('give_provider_ai_feedback');
    });
  });

  describe('dashboard handoff (ai-cmd-provider-5.25.1 / 5.25.2 / 5.25.3)', () => {
    it.each(
      PROVIDER_EXPLAIN_REASSIGN_LIMIT_PROMPT_SCENARIOS.map((s) => [
        s.id,
        s.prompt,
      ]),
    )('rescues %s to explain_reassign_limit', (_id, prompt) => {
      const result = rescue.rescue({
        prompt: prompt as string,
        action: 'unknown',
        params: {},
        employees,
        surface: 'provider',
      });
      expect(result?.action).toBe('explain_reassign_limit');
    });

    it.each(
      PROVIDER_EXPLAIN_TIME_OFF_APPROVAL_PROMPT_SCENARIOS.map((s) => [
        s.id,
        s.prompt,
      ]),
    )('rescues %s to explain_time_off_approval', (_id, prompt) => {
      const result = rescue.rescue({
        prompt: prompt as string,
        action: 'unknown',
        params: {},
        employees,
        surface: 'provider',
      });
      expect(result?.action).toBe('explain_time_off_approval');
    });

    it.each(
      PROVIDER_EXPLAIN_DASHBOARD_ONLY_ACTION_PROMPT_SCENARIOS.map((s) => [
        s.id,
        s.prompt,
      ]),
    )('rescues %s to explain_dashboard_only_action', (_id, prompt) => {
      const result = rescue.rescue({
        prompt: prompt as string,
        action: 'unknown',
        params: {},
        employees,
        surface: 'provider',
      });
      expect(result?.action).toBe('explain_dashboard_only_action');
    });
  });

  describe('open_dashboard_deep_link (ai-cmd-provider-5.25.4)', () => {
    it('rescues "Open CRM for Jane" to open_dashboard_deep_link', () => {
      const result = rescue.rescue({
        prompt: 'Open CRM for Jane',
        action: 'unknown',
        params: {},
        employees,
        surface: 'provider',
      });
      expect(result?.action).toBe('open_dashboard_deep_link');
      expect(result?.params.customerName).toBe('Jane');
    });

    it('rescues "Full intake on web" to open_dashboard_deep_link', () => {
      const result = rescue.rescue({
        prompt: 'Full intake on web',
        action: 'unknown',
        params: {},
        employees,
        surface: 'provider',
      });
      expect(result?.action).toBe('open_dashboard_deep_link');
    });
  });
});
