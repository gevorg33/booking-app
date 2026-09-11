import { describe, expect, it } from '@jest/globals';
import {
  PROVIDER_COMPOUND_RECIPE_INTENTS,
  isChairCloseoutPrompt,
  isCancelAndRecoverPrompt,
  isCheckInStartCompletePrompt,
  isClinicDrawFlowPrompt,
  isClinicDrawPatientPrompt,
  isEndOfDayClosePrompt,
  isGapWaitlistFillPrompt,
  isGapWalkInBookPrompt,
  isManagerFloorSweepPrompt,
  isMultiServiceBriefPrompt,
  isNoShowRecoverPrompt,
  isPendingConfirmDayPrompt,
  isPreVisitBriefPrompt,
  isPushConfirmCheckInPrompt,
  isPushMarkPaidClosePrompt,
  isRescheduleAndNotifyPrompt,
  isRetailCloseoutPrompt,
  isRunningLateNotifyPrompt,
  isProviderCompoundRecipeIntent,
  rescueProviderCompoundRecipeIntent,
} from './ai-provider-compound-recipes.util.js';

describe('ai-provider-compound-recipes.util (ai-cmd-provider-5.14 / 5.26)', () => {
  it('exports the 18 recipe intents', () => {
    expect(PROVIDER_COMPOUND_RECIPE_INTENTS.length).toBe(18);
    expect(isProviderCompoundRecipeIntent('chair_closeout')).toBe(true);
    expect(isProviderCompoundRecipeIntent('manager_floor_sweep')).toBe(true);
    expect(isProviderCompoundRecipeIntent('mark_paid')).toBe(false);
  });

  it('detects chair_closeout (5.14.1)', () => {
    expect(
      isChairCloseoutPrompt('Finish Jane, mark paid cash, add Olaplex'),
    ).toBe(true);
    expect(isChairCloseoutPrompt('Wrap up this visit and mark paid')).toBe(
      true,
    );
    expect(isChairCloseoutPrompt('Mark this visit complete')).toBe(false);
  });

  it('detects running_late_notify (5.14.2)', () => {
    expect(isRunningLateNotifyPrompt("I'm 15 late — text my next client")).toBe(
      true,
    );
    expect(
      isRunningLateNotifyPrompt('Running behind — let my next client know'),
    ).toBe(true);
    expect(isRunningLateNotifyPrompt("I'm running 10 minutes late")).toBe(
      false,
    );
  });

  it('detects gap_waitlist_fill (5.14.3)', () => {
    expect(isGapWaitlistFillPrompt('Fill my 3pm gap from waitlist')).toBe(true);
    expect(isGapWaitlistFillPrompt('Offer my open slot to the waitlist')).toBe(
      true,
    );
    expect(isGapWaitlistFillPrompt('Who is on the waitlist?')).toBe(false);
  });

  it('detects cancel_and_recover (5.14.4)', () => {
    expect(isCancelAndRecoverPrompt('Cancel 2pm and message waitlist')).toBe(
      true,
    );
    expect(
      isCancelAndRecoverPrompt('Cancel this booking and check the waitlist'),
    ).toBe(true);
    expect(isCancelAndRecoverPrompt('Cancel my time off request')).toBe(false);
  });

  it('detects pre_visit_brief (5.14.5)', () => {
    expect(isPreVisitBriefPrompt('Brief me before Jane at 2')).toBe(true);
    expect(
      isPreVisitBriefPrompt('Give me the full rundown on this client'),
    ).toBe(true);
    expect(isPreVisitBriefPrompt('Summarize this client')).toBe(false);
  });

  it('detects end_of_day_close (5.14.6)', () => {
    expect(isEndOfDayClosePrompt('Wrap today — mark paid and no-shows')).toBe(
      true,
    );
    expect(isEndOfDayClosePrompt('Close out my day — paid and no-shows')).toBe(
      true,
    );
    expect(isEndOfDayClosePrompt('Give me my end of day summary')).toBe(false);
  });

  it('detects reschedule_and_notify (5.14.7)', () => {
    expect(isRescheduleAndNotifyPrompt('Move Maria to 4pm and text her')).toBe(
      true,
    );
    expect(
      isRescheduleAndNotifyPrompt(
        'Reschedule Jane to tomorrow and let her know',
      ),
    ).toBe(true);
    expect(isRescheduleAndNotifyPrompt('Move Maria to 4pm')).toBe(false);
  });

  it('detects clinic_draw_flow (5.14.8)', () => {
    expect(
      isClinicDrawFlowPrompt('Next draw — open chart and mark collected'),
    ).toBe(true);
    expect(isClinicDrawFlowPrompt('Start my next draw')).toBe(true);
    expect(isClinicDrawFlowPrompt('Open the patient chart for Jane')).toBe(
      false,
    );
  });

  it('detects push_confirm_check_in (5.14.9)', () => {
    expect(
      isPushConfirmCheckInPrompt(
        'Confirm push booking and check in when she arrives',
      ),
    ).toBe(true);
    expect(
      isPushConfirmCheckInPrompt(
        'Confirm this push notification and check her in',
      ),
    ).toBe(true);
    expect(isPushConfirmCheckInPrompt('Confirm the push booking')).toBe(false);
  });

  it('rescues each recipe with a matching rescueReason', () => {
    const cases: Array<[string, string]> = [
      ['Finish Jane, mark paid cash, add Olaplex', 'chair_closeout'],
      ["I'm 15 late — text my next client", 'running_late_notify'],
      ['Fill my 3pm gap from waitlist', 'gap_waitlist_fill'],
      ['Cancel 2pm and message waitlist', 'cancel_and_recover'],
      ['Brief me before Jane at 2', 'pre_visit_brief'],
      ['Wrap today — mark paid and no-shows', 'end_of_day_close'],
      ['Move Maria to 4pm and text her', 'reschedule_and_notify'],
      ['Next draw — open chart and mark collected', 'clinic_draw_flow'],
      [
        'Confirm push booking and check in when she arrives',
        'push_confirm_check_in',
      ],
    ];
    for (const [prompt, action] of cases) {
      expect(rescueProviderCompoundRecipeIntent(prompt, 'unknown')).toEqual({
        action,
        rescueReason: action,
      });
    }
  });

  it('does not rescue when the action is already a known recipe', () => {
    expect(
      rescueProviderCompoundRecipeIntent(
        'Finish Jane, mark paid',
        'chair_closeout',
      ),
    ).toBeNull();
  });

  it('detects pending_confirm_day (5.26.1)', () => {
    expect(
      isPendingConfirmDayPrompt('Confirm all pending then summarize today'),
    ).toBe(true);
    expect(
      isPendingConfirmDayPrompt(
        "Confirm my pending bookings and give me today's rundown",
      ),
    ).toBe(true);
    expect(isPendingConfirmDayPrompt('Confirm all pending')).toBe(false);
  });

  it('detects check_in_start_complete (5.26.2)', () => {
    expect(
      isCheckInStartCompletePrompt('Check in Jane, start service, mark done'),
    ).toBe(true);
    expect(
      isCheckInStartCompletePrompt('Check her in start and complete the visit'),
    ).toBe(true);
    expect(isCheckInStartCompletePrompt('Check in Jane')).toBe(false);
  });

  it('detects retail_closeout (5.26.3)', () => {
    expect(
      isRetailCloseoutPrompt('Recommend product and close with cash'),
    ).toBe(true);
    expect(
      isRetailCloseoutPrompt('Suggest an upsell add it and mark paid'),
    ).toBe(true);
    expect(isRetailCloseoutPrompt('Suggest a retail upsell')).toBe(false);
  });

  it('detects gap_walk_in_book (5.26.4)', () => {
    expect(isGapWalkInBookPrompt('Book walk-in in 2pm gap and check in')).toBe(
      true,
    );
    expect(
      isGapWalkInBookPrompt('Quick book a walk-in and check them in now'),
    ).toBe(true);
    expect(isGapWalkInBookPrompt('Book a walk-in Haircut now')).toBe(false);
  });

  it('detects no_show_recover (5.26.5)', () => {
    expect(
      isNoShowRecoverPrompt('No-show at 2 — who should I offer slot to?'),
    ).toBe(true);
    expect(
      isNoShowRecoverPrompt('Mark this a no-show and find someone to fill it'),
    ).toBe(true);
    expect(isNoShowRecoverPrompt('Mark all no-shows today')).toBe(false);
  });

  it('detects multi_service_brief (5.26.6)', () => {
    expect(isMultiServiceBriefPrompt('Brief me on spa day client at 3')).toBe(
      true,
    );
    expect(
      isMultiServiceBriefPrompt(
        "Walk me through this package client's multi-service order",
      ),
    ).toBe(true);
    expect(isMultiServiceBriefPrompt('Brief me before Jane at 2')).toBe(false);
  });

  it('detects clinic_draw_patient (5.26.8)', () => {
    expect(
      isClinicDrawPatientPrompt('Find Jane, open chart, mark draw done'),
    ).toBe(true);
    expect(
      isClinicDrawPatientPrompt(
        'Look up Maria open chart mark specimen collected',
      ),
    ).toBe(true);
    expect(
      isClinicDrawPatientPrompt('Next draw — open chart and mark collected'),
    ).toBe(false);
  });

  it('detects push_mark_paid_close (5.26.9)', () => {
    expect(
      isPushMarkPaidClosePrompt('From notification — mark paid and complete'),
    ).toBe(true);
    expect(
      isPushMarkPaidClosePrompt('Open the push booking mark it paid and done'),
    ).toBe(true);
    expect(isPushMarkPaidClosePrompt('Open booking from push')).toBe(false);
  });

  it('detects manager_floor_sweep (5.26.10)', () => {
    expect(
      isManagerFloorSweepPrompt('Floor status then sweep team unpaid'),
    ).toBe(true);
    expect(
      isManagerFloorSweepPrompt(
        'Check the floor and sweep unpaid appointments',
      ),
    ).toBe(true);
    expect(isManagerFloorSweepPrompt('Team floor status')).toBe(false);
  });

  it('rescues each 5.26 recipe with a matching rescueReason', () => {
    const cases: Array<[string, string]> = [
      ['Confirm all pending then summarize today', 'pending_confirm_day'],
      ['Check in Jane, start service, mark done', 'check_in_start_complete'],
      ['Recommend product and close with cash', 'retail_closeout'],
      ['Book walk-in in 2pm gap and check in', 'gap_walk_in_book'],
      ['No-show at 2 — who should I offer slot to?', 'no_show_recover'],
      ['Brief me on spa day client at 3', 'multi_service_brief'],
      ['Find Jane, open chart, mark draw done', 'clinic_draw_patient'],
      ['From notification — mark paid and complete', 'push_mark_paid_close'],
      ['Floor status then sweep team unpaid', 'manager_floor_sweep'],
    ];
    for (const [prompt, action] of cases) {
      expect(rescueProviderCompoundRecipeIntent(prompt, 'unknown')).toEqual({
        action,
        rescueReason: action,
      });
    }
  });
});
