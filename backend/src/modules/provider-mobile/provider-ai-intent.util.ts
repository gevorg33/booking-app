import { isTeamWhosNextPrompt } from './provider-team-whos-next.util.js';
import { isSummarizeDayPrompt } from '../ai/ai-provider-summarize-day.util.js';
import { isSummarizeUtilizationPrompt } from '../ai/ai-provider-summarize-utilization.util.js';
import { isShowAppointmentsPrompt } from '../ai/ai-provider-show-appointments.util.js';
import { isWhoIsNextPrompt } from '../ai/ai-provider-who-is-next.util.js';
import { isExplainTodayTimelinePrompt } from '../ai/ai-provider-explain-today-timeline.util.js';
import { isEndOfDaySummaryPrompt } from '../ai/ai-provider-end-of-day-summary.util.js';
import { isMarkVisitCompletePrompt } from '../ai/ai-provider-mark-visit-complete.util.js';
import { isMarkVisitInProgressPrompt } from '../ai/ai-provider-mark-visit-in-progress.util.js';
import { isConfirmPendingBookingPrompt } from '../ai/ai-provider-confirm-pending-booking.util.js';
import { isMarkMultiServiceStepDonePrompt } from '../ai/ai-provider-mark-multi-service-step-done.util.js';
import { isSearchPatientPrompt } from '../ai/ai-provider-search-patient.util.js';
import { isShowProviderProfilePrompt } from '../ai/ai-provider-show-profile.util.js';
import { isHandoffToDashboardPhiPrompt } from '../ai/ai-provider-handoff-to-dashboard-phi.util.js';
import {
  isExplainBookingStatusBadgePrompt,
  isExplainFloorStatusPrompt,
} from '../ai/ai-provider-visit-status-explainers.util.js';
import {
  isExplainBlockVsTimeOffPrompt,
  isExplainCalendarUtilizationBandsPrompt,
} from '../ai/ai-provider-calendar-scheduling-explainers.util.js';
import {
  isExplainAccessibilitySettingsPrompt,
  isExplainOfflineSuggestionsPrompt,
} from '../ai/ai-provider-assistant-ux-explainers.util.js';
import { isGiveProviderAiFeedbackPrompt } from '../ai/ai-provider-give-ai-feedback.util.js';
import {
  isExplainDashboardOnlyActionPrompt,
  isExplainReassignLimitPrompt,
  isExplainTimeOffApprovalPrompt,
} from '../ai/ai-provider-dashboard-handoff.util.js';

/** Heuristic intent rescue for provider mobile commands (Sprint 19). */
export function rescueProviderAiIntent(prompt: string, action: string): string {
  const lower = prompt.toLowerCase();

  if (isTeamWhosNextPrompt(prompt)) {
    return 'team_whos_next';
  }

  if (
    /payment\s+sweep|mark\s+(?:all\s+)?(?:today(?:'s)?\s+)?(?:as\s+)?paid|mark\s+unpaid|collect\s+outstanding/.test(
      lower,
    )
  ) {
    return 'payment_sweep';
  }
  if (
    /mark\s+no[\s-]?shows?|no[\s-]?shows?\s+for|no[\s-]?shows?\s+today/.test(
      lower,
    ) &&
    !/cancel/.test(lower)
  ) {
    return 'mark_no_shows';
  }
  if (isMarkVisitCompletePrompt(prompt)) {
    return 'mark_visit_complete';
  }
  if (isMarkVisitInProgressPrompt(prompt)) {
    return 'mark_visit_in_progress';
  }
  if (isMarkMultiServiceStepDonePrompt(prompt)) {
    return 'mark_multi_service_step_done';
  }
  if (isSearchPatientPrompt(prompt)) {
    return 'search_patient';
  }
  if (isShowProviderProfilePrompt(prompt)) {
    return 'show_provider_profile';
  }
  if (isHandoffToDashboardPhiPrompt(prompt)) {
    return 'handoff_to_dashboard_phi';
  }
  if (isConfirmPendingBookingPrompt(prompt)) {
    return 'confirm_pending_booking';
  }
  if (isExplainBookingStatusBadgePrompt(prompt)) {
    return 'explain_booking_status_badge';
  }
  if (isExplainFloorStatusPrompt(prompt)) {
    return 'explain_floor_status';
  }
  if (isExplainCalendarUtilizationBandsPrompt(prompt)) {
    return 'explain_calendar_utilization_bands';
  }
  if (isExplainBlockVsTimeOffPrompt(prompt)) {
    return 'explain_block_vs_time_off';
  }
  if (isExplainOfflineSuggestionsPrompt(prompt)) {
    return 'explain_offline_suggestions';
  }
  if (isExplainAccessibilitySettingsPrompt(prompt)) {
    return 'explain_accessibility_settings';
  }
  if (isGiveProviderAiFeedbackPrompt(prompt)) {
    return 'give_provider_ai_feedback';
  }
  if (isExplainReassignLimitPrompt(prompt)) {
    return 'explain_reassign_limit';
  }
  if (isExplainTimeOffApprovalPrompt(prompt)) {
    return 'explain_time_off_approval';
  }
  if (isExplainDashboardOnlyActionPrompt(prompt)) {
    return 'explain_dashboard_only_action';
  }
  if (
    /who'?s\s+next|who\s+is\s+next|next\s+(?:appointment|client|booking)/.test(
      lower,
    ) ||
    isWhoIsNextPrompt(prompt)
  ) {
    return 'show_appointments';
  }
  if (isSummarizeUtilizationPrompt(prompt)) {
    return 'summarize_utilization';
  }
  if (isExplainTodayTimelinePrompt(prompt)) {
    return 'explain_today_timeline';
  }
  if (
    /\b(block\s+my\b|my\s+lunch\b|block\s+my\s+(?:break|lunch|time))\b/.test(
      lower,
    )
  ) {
    return 'block_my_time';
  }
  if (
    /block\s+(?:my\s+)?lunch|lunch\s+break|block\s+.+break|block\s+\d{1,2}:\d{2}/.test(
      lower,
    ) &&
    !/\bblock\s+my\b/.test(lower)
  ) {
    return 'block_schedule';
  }
  if (
    /(?:any\s+)?gaps?\s+(?:this\s+)?afternoon|afternoon\s+gaps?|open\s+slots?\s+(?:this\s+)?afternoon/.test(
      lower,
    )
  ) {
    return 'fill_unused_slots';
  }
  if (
    /fill\s+(?:this\s+)?gap|suggest\s+waitlist.*gap|waitlist.*fill.*gap/.test(
      lower,
    )
  ) {
    return 'suggest_waitlist_for_gap';
  }
  if (
    /(?:check\s+)?availability|(?:am\s+i|are\s+there)\s+(?:open|free)\s+slots?|what\s+(?:slots?|times?)\s+(?:are\s+)?(?:open|free)/.test(
      lower,
    ) &&
    !/fill\s+(?:gaps?|slots?)/.test(lower)
  ) {
    return 'check_availability';
  }
  if (
    /show\s+(?:my\s+)?appointments|list\s+(?:my\s+)?appointments|what'?s\s+on\s+(?:my\s+)?schedule/.test(
      lower,
    ) ||
    isShowAppointmentsPrompt(prompt)
  ) {
    return 'show_appointments';
  }
  if (
    /\bhow many\b/i.test(lower) &&
    /\bappointments?\b/i.test(lower) &&
    /\b(my|mine|do i have|i have)\b/i.test(lower)
  ) {
    return 'summarize_my_appointments';
  }
  if (
    /\b(how much|my revenue|my earnings|did i make|what did i make)\b/i.test(
      lower,
    ) &&
    /\b(my|mine|today|tomorrow|week|month|revenue|earnings?|made)\b/i.test(
      lower,
    )
  ) {
    return 'summarize_my_revenue';
  }
  if (isEndOfDaySummaryPrompt(prompt)) {
    return 'end_of_day_summary';
  }
  if (isSummarizeDayPrompt(prompt)) {
    return 'summarize_day';
  }

  return action;
}

export const PROVIDER_MOBILE_READ_ACTIONS = new Set([
  'list_bookings',
  'show_appointments',
  'team_whos_next',
  'summarize_day',
  'summarize_my_appointments',
  'summarize_my_revenue',
  'check_availability',
  'summarize_utilization',
  'suggest_waitlist_for_gap',
  'explain_today_timeline',
  'end_of_day_summary',
]);
