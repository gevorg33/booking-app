import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import {
  Booking,
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { BookingService } from '../booking/booking.service.js';
import { LlmService } from '../../engine/agent/llm.service.js';
import { ProviderMobileService } from './provider-mobile.service.js';
import type { MobileAccess } from './provider-mobile-access.js';
import {
  formatDateDisplay,
  formatTimeDisplay,
  formatTimeRangeDisplay,
  todayDisplay,
  toIsoDay,
} from '../../common/utils/date-format.util.js';
import { ProviderAiConfirmDto } from './dto/provider-ai-command.dto.js';
import { CommandCompletionPipelineService } from '../ai/command-completion.pipeline.service.js';
import {
  shouldValidateProviderAction,
  validateProviderCommand,
} from '../ai/provider-command-completion.validator.js';
import { AiEventsService } from '../ai/ai-events.service.js';
import { recordMisrouteTelemetry } from '../ai/ai-misroute-telemetry.util.js';
import { AiPromptSecurityService } from '../ai/ai-prompt-security.service.js';
import { AiSettingsService } from '../ai/ai-settings.service.js';
import { AiPromptNormalizationService } from '../ai/ai-prompt-normalization.service.js';
import { ProviderCommandUnderstandingAdapter } from '../ai/provider-command-understanding.adapter.js';
import { buildNarrowClassifierSchema } from '../ai/narrow-reclassify-schema.util.js';
import {
  buildPipelineClarifyCommandResult,
  buildUnknownIntentClarifyResult,
  shouldBlockUnknownFromHandlerSwitch,
} from '../ai/ai-unknown-intent.util.js';
import {
  findClassifierCandidate,
  pipelineRescueReason,
  pipelineResultToClassifiedIntent,
} from '../ai/command-understanding-result.util.js';
import { AiScheduleHandlersService } from '../ai/ai-schedule-handlers.service.js';
import { isIntentAllowed } from '../ai/ai-capability.matrix.js';
import {
  resolveAccessTier,
  type AccessTier,
} from '../ai/access-control.matrix.js';
import { CommandOrchestrationService } from '../ai/command-orchestration.service.js';
import { OperationalPlanBuilderService } from '../ai/operational-plan-builder.service.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import {
  WAITLIST_CUSTOMER_TAG,
  andWhereSimpleArrayTag,
} from '../customer/customer-tag-query.util.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { SchedulingEngineService } from '../../engine/scheduling/scheduling-engine.service.js';
import { findScheduleGapsInWindow } from '../schedule/helpers/schedule-gap.helpers.js';
import { resolveDateRange } from '../ai/ai-orchestration.helpers.js';
import { rescueProviderAiIntent } from './provider-ai-intent.util.js';
import { extractDaysFromPrompt } from '../ai/ai-provider-schedule-reads.util.js';
import {
  extractCustomerNameForMultiServiceStepDone,
  parseMarkMultiServiceStepDoneFromPrompt,
} from '../ai/ai-provider-mark-multi-service-step-done.util.js';
import {
  buildVisitStatusTargetClarifyDetails,
  buildVisitStatusTargetClarifySummary,
  shouldClarifyVisitStatusTarget,
  type VisitStatusAlias,
} from '../ai/ai-e2e263-visit-status-target.util.js';
import {
  extractPatientSearchQueryFromPrompt,
  formatPatientSearchResultsText,
} from '../ai/ai-provider-search-patient.util.js';
import { buildHandoffToDashboardPhiSummary } from '../ai/ai-provider-handoff-to-dashboard-phi.util.js';
import { normalizeTime24 } from '../../common/utils/time-format.util.js';
import {
  buildAfternoonAvailabilityResult,
  buildGapsAvailabilityResult,
  buildNoLinkedEmployeeAvailabilityResult,
  buildProviderBookingsListResult,
  buildSlotAvailabilityResult,
  buildUtilizationSummaryResult,
  defaultUtilizationWeekRange,
  filterBookingsForProviderList,
  mapScheduleGapLabels,
  mergeShowAppointmentsParams,
  prepareBlockScheduleParams,
  resolveAvailabilityDayBounds,
  resolveAvailabilityTimeWindow,
  resolveStatusFilter,
  shouldUseAfternoonAvailability,
} from './provider-ai-sprint19.util.js';
import {
  buildExplainTodayTimelineGapChips,
  buildExplainTodayTimelineSummary,
  buildProviderTodayTimelineView,
} from './provider-booking-today-timeline.util.js';
import { buildTeamWhosNextSummary } from './provider-team-whos-next.util.js';
import {
  applyProviderEntityMemory,
  buildCoordinateWaitlistConfirmation,
  formatProviderHistoryBlock,
  matchEmployeeByName,
  matchWaitlistCustomerByName,
  rescueCoordinationIntent,
} from './provider-ai-sprint22.util.js';
import {
  buildCoordinationDeniedSummary,
  canRunCoordinationOnProvider,
} from '../ai/ai-coordination.util.js';
import { AiPushNotificationsService } from '../ai/ai-push-notifications.service.js';
import { AiProviderBookingService } from '../ai/ai-provider-booking.service.js';
import { AiBusinessCurrencyService } from '../ai/ai-business-currency.service.js';
import { AiBusinessDateFormatService } from '../ai/ai-business-date-format.service.js';
import { AiBusinessTaxService } from '../ai/ai-business-tax.service.js';
import { AiBusinessComplianceService } from '../ai/ai-business-compliance.service.js';
import { parseExplainAppointmentTaxFromPrompt } from '../ai/ai-appointment-tax.util.js';
import { AiProviderClinicCollectionService } from '../ai/ai-provider-clinic-collection.service.js';
import { AiClinicLabBookingService } from '../ai/ai-clinic-lab-booking.service.js';
import { PROVIDER_MOBILE_CLASSIFIER_RULES } from '../ai/ai-provider-mobile.fixtures.js';
import {
  applyProviderMobilePromptHints,
  decomposeProviderMobileCompoundPrompt,
  disambiguateProviderMobileAction,
  isProviderMobileCompoundPrompt,
  mergeProviderMobileHintsIntoSessionContext,
} from '../ai/ai-provider-mobile-hints.util.js';
import {
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
} from '../ai/ai-provider-compound-recipes.util.js';
import {
  buildExplainBookingStatusBadgeSummary,
  buildExplainFloorStatusSummary,
} from '../ai/ai-provider-visit-status-explainers.util.js';
import {
  buildExplainBlockVsTimeOffSummary,
  buildExplainCalendarUtilizationBandsSummary,
} from '../ai/ai-provider-calendar-scheduling-explainers.util.js';
import {
  buildExplainAccessibilitySettingsSummary,
  buildExplainOfflineSuggestionsSummary,
} from '../ai/ai-provider-assistant-ux-explainers.util.js';
import { handleGiveProviderAiFeedback } from '../ai/ai-provider-give-ai-feedback.util.js';
import {
  buildExplainDashboardOnlyActionFallbackSummary,
  buildExplainReassignLimitSummary,
  buildExplainTimeOffApprovalSummary,
  resolveDashboardOnlyActionSummaryFromPrompt,
} from '../ai/ai-provider-dashboard-handoff.util.js';
import { ProviderPushActionService } from './provider-push-action.service.js';
import { AiProviderPushSetupService } from '../ai/ai-provider-push-setup.service.js';
import { AiProviderEarningsService } from '../ai/ai-provider-earnings.service.js';
import { AiProviderClientContextService } from '../ai/ai-provider-client-context.service.js';
import {
  extractClientNoteBodyFromPrompt,
  extractCustomerNameFromClientPrompt,
} from '../ai/ai-provider-client-context.util.js';
import { AiProviderExp2Service } from '../ai/ai-provider-exp-2.service.js';
import { isMyStatsPrompt } from '../ai/ai-provider-exp-2.util.js';
import { AiProviderTimeOffService } from '../ai/ai-provider-time-off.service.js';
import { AiProviderOpenShiftsService } from '../ai/ai-provider-open-shifts.service.js';
import { AiProviderExp3Service } from '../ai/ai-provider-exp-3.service.js';
import { AiProviderClinicTasksAndResultsService } from '../ai/ai-provider-clinic-tasks-and-results.service.js';
import { AiClinicPatientChartService } from '../ai/ai-clinic-patient-chart.service.js';
import { AiGiftFulfillmentService } from '../ai/ai-gift-fulfillment.service.js';
import { AiRetailFinanceService } from '../ai/ai-retail-finance.service.js';
import { AiScheduleResourcesService } from '../ai/ai-schedule-resources.service.js';
import { AiPaymentsService } from '../ai/ai-payments.service.js';
import { AiProductGuideService } from '../ai/ai-product-guide.service.js';
import { AiProductGuideEmptyStateService } from '../ai/ai-product-guide-empty-state.service.js';
import {
  isAppGuideIntent,
  resolveProductGuidePromptMatch,
  type AppGuideIntent,
} from '../ai/ai-product-guide.util.js';
import {
  mapCommandResultGuideNavigate,
  runProviderProductGuideIntent,
  runSurfaceProductGuideIntent,
} from '../ai/ai-product-guide-surface.logic.js';
import {
  PROVIDER_VOICE_NEXT_CLIENT_CLASSIFIER_RULES,
  buildVoiceSummarizeNextClientResult,
  isVoiceSummarizeNextClientPrompt,
  rescueVoiceSummarizeNextClientIntent,
} from '../ai/ai-provider-voice-next-client.util.js';
import { formatGuideVoiceText } from '../ai/ai-product-guide-voice.util.js';
import {
  mapProviderMobileGuideRoute,
  mergeProviderMobileGuideContext,
} from '../ai/ai-provider-guide-context.util.js';
import {
  enrichGuideTopicFromPrompt,
  rescueProductGuideIntent,
} from '../ai/ai-product-guide-rescue.util.js';
import {
  resolveProductGuideSessionContext,
  type ProductGuideSessionContext,
} from '../ai/ai-product-guide-session.util.js';
import {
  isProviderProductGuideIntent,
  type ProviderProductGuideIntent,
} from '../ai/ai-provider-product-guide.util.js';
import {
  isMetaProductGuideIntent,
  isProviderMetaGuideIntent,
  runMetaProductGuideIntent,
  type MetaProductGuideIntent,
} from '../ai/ai-meta-product-guide.util.js';
import {
  isEmptyStateGuideIntent,
  type EmptyStateGuideIntent,
} from '../ai/ai-product-guide-empty-state.util.js';
import {
  appendPostFailureGuideFallback,
  buildPostFailureGuideFallbackInput,
} from '../ai/ai-product-guide-failure-fallback.util.js';
import {
  buildAiUnavailableErrorWithGuideLink,
  runAiUnavailableStaticGuideFallback,
} from '../ai/ai-product-guide-ai-unavailable.util.js';

export interface ProviderPreviewItem {
  id: string;
  customerName: string;
  serviceName: string;
  time: string;
  initials: string;
}

export interface ProviderCommandResult {
  success: boolean;
  action: string;
  summary: string;
  details: Record<string, unknown>;
  guide?: import('../ai/command-completion.types.js').GuideResponse;
}

const BULK_CONFIRM_THRESHOLD = 2;

const PROVIDER_INTENT_SCHEMA = `You are an AI assistant for a service provider mobile app.
Classify the user's command and extract parameters. Return JSON:

{
  "action": "cancel_bookings" | "update_bookings" | "mark_no_shows" | "payment_sweep" | "list_bookings" | "show_appointments" | "voice_summarize_next_client" | "team_whos_next" | "my_stats" | "team_floor_status" | "check_in_client" | "mark_running_late" | "summarize_day" | "summarize_my_appointments" | "summarize_my_revenue" | "summarize_client" | "show_client_history" | "add_client_note" | "reschedule_booking" | "add_retail_to_booking" | "send_client_message" | "block_my_time" | "fill_unused_slots" | "suggest_waitlist_for_gap" | "check_availability" | "block_schedule" | "request_time_off" | "list_my_time_off_requests" | "summarize_utilization" | "explain_today_timeline" | "coordinate_waitlist_offer" | "list_package_appointments_today" | "list_my_package_visits" | "list_my_multi_service_groups" | "mark_paid" | "list_my_collection_queue" | "mark_specimen_collected" | "explain_specimen_recollect" | "list_patient_pending_lab_requests" | "notify_patient_book_lab" | "confirm_booking_from_push" | "suggest_reschedule_from_push" | "explain_last_push" | "open_booking_from_push" | "offline_queue_status" | "retry_offline_action" | "explain_offline_mode" | "explain_app_update_gate" | "dismiss_push" | "end_of_day_summary" | "new_booking_push_actions" | "explain_push_setup" | "enable_push_notifications" | "explain_push_registration_status" | "explain_appointment_tax" | "explain_provider_payment_currency" | "explain_provider_date_display" | "configure_provider_push_date_format" | "explain_provider_session_timeout" | "explain_staff_invite" | "explain_provider_app_tabs" | "explain_team_view_scope" | "explain_profile_settings" | "update_provider_profile" | "show_provider_profile" | "explain_assistant_confirm_swipe" | "explain_provider_compound_steps" | "explain_provider_context" | "list_upcoming_bookings" | "get_schedule_summary" | "get_calendar_month" | "list_schedule_gaps" | "open_booking_detail" | "mark_ready_now" | "mark_visit_complete" | "mark_visit_in_progress" | "mark_multi_service_step_done" | "search_patient" | "handoff_to_dashboard_phi" | "confirm_pending_booking" | "explain_booking_status_badge" | "explain_floor_status" | "explain_calendar_utilization_bands" | "explain_block_vs_time_off" | "explain_offline_suggestions" | "explain_accessibility_settings" | "give_provider_ai_feedback" | "explain_dashboard_only_action" | "explain_reassign_limit" | "explain_time_off_approval" | "open_dashboard_deep_link" | "suggest_cancel_note" | "request_client_review" | "list_reassign_options" | "reassign_booking_same_day" | "list_client_staff_notes" | "explain_client_intake" | "explain_package_visit_context" | "explain_multi_service_timeline" | "explain_booking_payment_breakdown" | "explain_deposit_balance_due" | "collect_remaining_balance" | "explain_retail_cart" | "explain_cancel_policy_for_client" | "explain_gift_card_redemption" | "explain_tour_group_on_booking" | "list_team_unpaid_today" | "explain_reviews_inbox" | "explain_request_review_flow" | "draft_review_response" | "list_waitlist_for_my_services" | "list_rebooking_candidates" | "book_walk_in_gap" | "set_retail_sales_lines" | "remove_retail_from_booking" | "search_retail_sku" | "draft_waitlist_offer_message" | "explain_message_templates" | "notify_client_ready" | "extend_my_block" | "cancel_time_off_request" | "list_push_notifications" | "mark_all_notifications_read" | "mark_booking_notifications_read" | "mark_notification_read" | "list_lab_results_queue" | "claim_clinic_task" | "complete_clinic_task" | "list_booking_lab_summaries" | "list_clinic_tasks" | "explain_clinic_task" | "open_patient_chart" | "gift_card_creation_queue" | "start_card_preparation" | "explain_gift_card_order_details" | "mark_card_ready" | "delivery_queue" | "accept_delivery" | "mark_out_for_delivery" | "mark_delivered" | "capture_delivery_proof" | "notify_delay" | "suggest_retail_upsell" | "chair_closeout" | "running_late_notify" | "gap_waitlist_fill" | "cancel_and_recover" | "pre_visit_brief" | "end_of_day_close" | "reschedule_and_notify" | "clinic_draw_flow" | "push_confirm_check_in" | "pending_confirm_day" | "check_in_start_complete" | "retail_closeout" | "gap_walk_in_book" | "no_show_recover" | "multi_service_brief" | "clinic_draw_patient" | "push_mark_paid_close" | "manager_floor_sweep" | "unknown",
  "params": {
    "bookingId": "string or null — specific booking reference",
    "customerName": "string or null — client/customer name mentioned (e.g. John)",
    "waitlistCustomerName": "string or null — waitlist customer to offer freed slot (e.g. John)",
    "employeeName": "string or null — provider name for team coordination (e.g. Maria)",
    "serviceName": "string or null — service type filter",
    "date": "DD/MM/YYYY or null — resolve relative dates from today",
    "dateFrom": "DD/MM/YYYY or null",
    "dateTo": "DD/MM/YYYY or null",
    "timeSlot": "HH:MM 24h or null — appointment start time (e.g. 13:00)",
    "timeFrom": "HH:MM or null — gap fill window start",
    "timeTo": "HH:MM or null — gap fill window end",
    "status": "completed | in_progress | no_show | confirmed | pending | null — filter for show_appointments / list_bookings",
    "statusFilter": "upcoming | completed | cancelled | no_show | null — for show_appointments",
    "paymentStatus": "paid | pending | refunded | not_applicable | null",
    "reason": "string or null — cancellation reason or note",
    "clientNote": "string or null — internal staff note body for add_client_note",
    "draft": "string or null — provider's rough draft to refine for suggest_cancel_note",
    "days": "number or null — 1-30, for list_upcoming_bookings (default 7) / get_schedule_summary (default 14)",
    "title": "string or null — new profile title for update_provider_profile",
    "avatarUrl": "string or null — new profile avatar URL for update_provider_profile",
    "period": "week | month | null — for my_stats",
    "scope": "mine | team | null — for my_stats (team requires manager)",
    "minutesLate": "number or null — minutes late for mark_running_late (default 10)",
    "allAppointments": true or false — true when user says all/every appointment for the day
  },
  "reasoning": "one sentence"
}

Rules:
- If the user is a business owner, admin, or manager (see context), they may manage any provider's appointments.
- If the user is a provider only, scope commands to their own appointments.
- "my appointments", "all my today", "cancel my schedule" → allAppointments=true, date=today.
- "mark as done" / "done" → status=completed. "no show" → no_show. "in progress" → in_progress.
- "payment done" / "paid" / "mark payment as paid" → paymentStatus=paid. "N/A" → not_applicable.
- cancel_bookings: user wants to cancel one or more appointments. Put sickness/reason in reason.
- update_bookings: change status and/or payment status without cancelling (single appointment or explicit customer/time).
- mark_visit_complete: MUTATE — dedicated shortcut for marking the current/in-progress visit as completed (single booking, no explicit payment change). Triggers: mark done, finish this appointment, wrap up this visit, done with this client. NOT mark_paid (payment status, not visit status), NOT update_bookings when the user gives an explicit customer/time to target a different appointment or also mentions payment.
- mark_visit_in_progress: MUTATE — dedicated alias of update_bookings(status=in_progress) — starts the visit now. Requires bookingId (session) and/or customerName. Triggers: begin Jane's color, start appointment now, start the service, begin this visit, mark Sam's appointment as started. NOT mark_visit_complete (finishes the visit), NOT check_in_client (arrival, before the service starts).
- mark_multi_service_step_done: MUTATE — mark one leg of a multi-service booking group complete, not the whole visit. Requires bookingId (session, any leg) plus stepIndex (1-based) or serviceName. Triggers: finish step 1 of spa day, complete blowdry leg, finish step 2. NOT mark_visit_complete (entire visit), NOT update_bookings generic status.
- confirm_pending_booking: MUTATE — confirm one or all pending appointments (bulk when "all"/"today"/no name; single when customerName is given). Filters to currently-pending only. Triggers: confirm all pending today, accept Maria's booking, confirm Jane's appointment. NOT confirm_booking_from_push (push-originated), NOT update_bookings (would touch non-pending matches).
- give_provider_ai_feedback: MUTATE — thumbs up/down on the last assistant answer with optional reason chips (Wrong action/date/client/service, Didn't understand). Triggers: Wrong client picked, That wasn't my intent, That was helpful, Not helpful. NOT give_ai_feedback (customer/public surface).
- explain_booking_status_badge: READ — explains what a booking status badge means (pending, confirmed, in progress, completed, no-show). Triggers: what does pending mean, why in progress, explain booking statuses. NOT update_bookings, NOT explain_floor_status (floor strip).
- explain_floor_status: READ — explains the check-in floor strip (waiting/checked-in vs in service vs done). Triggers: waiting vs in service, what's checked in, explain the floor status. NOT team_floor_status (live data), NOT explain_booking_status_badge.
- explain_calendar_utilization_bands: READ — explains what the calendar month view color bands mean (empty/low/medium/high). Triggers: what do the green bands mean, fully booked day, what do the calendar colors mean, explain calendar bands. NOT summarize_utilization (live percent), NOT get_calendar_month (live grid).
- explain_block_vs_time_off: READ — FAQ comparing instant block_schedule/block_my_time (no approval) vs request_time_off (needs manager approval). Triggers: block vs time off, which should I use for vacation, difference between block and time off. NOT block_schedule / block_my_time / request_time_off themselves.
- explain_offline_suggestions: READ — explains why Today's cached suggestion cards can look stale offline and when they refresh. Triggers: why stale suggestions, refresh suggestions when online, suggestions not updating. NOT offline_queue_status (live queue), NOT explain_ai_suggestions (what a chip means).
- explain_accessibility_settings: READ — explains that text size and tap targets follow the phone's OS accessibility settings, not an in-app control. Triggers: bigger text in app, larger tap targets, accessibility settings, increase font size.
- explain_dashboard_only_action: READ — explains why a feature (loyalty points, message templates, full intake answers, call client, review policy, app language) is dashboard-only. Triggers: adjust loyalty points, edit message templates, open full intake answers. NOT explain_reassign_limit / explain_time_off_approval.
- explain_reassign_limit: READ — explains why multi-service bookings can't be reassigned via the mobile assistant. Triggers: why can't AI reassign multi-service, use reassign button. NOT reassign_booking_same_day / list_reassign_options.
- explain_time_off_approval: READ — explains who approves time-off (manager) and where (dashboard). Triggers: who approves my time off, pending manager approval. NOT request_time_off / list_my_time_off_requests.
- mark_no_shows: bulk mark past missed appointments as no-show for a day or range. Use for "mark no-shows", "no shows today".
- payment_sweep: mark unpaid appointments as paid for a day or range. Use for "payment sweep", "mark unpaid as paid".
- list_bookings / show_appointments / summarize_day: view-only; no mutations. show_appointments supports serviceName and status/statusFilter.
- team_whos_next: READ — manager/owner team view only: ordered queue per provider for the next 2 hours. Triggers: who's next across the team, all providers next 2 hours. NOT show_appointments (own or single-day list).
- summarize_my_appointments: READ — count own appointments for today/tomorrow/a day/date range. Triggers: how many appointments do I have. NOT show_appointments (full list).
- summarize_my_revenue: READ — net provider earnings after tax and salon commission for a period. Triggers: how much did I make, my revenue last week. NOT explain_appointment_tax.
- summarize_client: READ — client snapshot for open booking: loyalty balance with last earn/redeem (read-only), visits, last visit, no-shows, referral, badges, recent highlights. Requires bookingId (session) and/or customerName. NOT show_client_history (visit list only), NOT adjust_loyalty.
- show_client_history: READ — recent completed visits for the booking's client. Requires bookingId and/or customerName. NOT summarize_client (narrative snapshot).
- add_client_note: MUTATE — save internal staff note on booking customer (clientNote body, max 500 chars). Requires bookingId and/or customerName. NOT update_bookings.
- check_availability: READ-ONLY — open slots and schedule blocks for own calendar (managers may query team when scoped).
- add_retail_to_booking: MUTATE — add retail product line to own active booking (productName, bookingId, and/or customerName). NOT suggest_retail_upsell (read-only suggestions).
- remove_retail_from_booking: MUTATE — remove one retail product line from own active booking (productName, bookingId, and/or customerName). Triggers: remove the serum from cart, undo product add, delete shampoo from this booking. NOT add_retail_to_booking (adds a line), NOT set_retail_sales_lines (bulk cart replace), NOT explain_retail_cart (read-only).
- suggest_retail_upsell: READ — list sellable retail products for this booking's service (or your active appointment), ranked with products linked to the service first. Triggers: what should I upsell, suggest retail for this client, what products go with this service. NOT add_retail_to_booking (actually adds a line to the cart).
- search_retail_sku: READ — navigate/search sellable retail products by name or SKU (business-wide, not booking-specific). Triggers: find SKU 12345, do we carry bond builder, is olaplex in stock. NOT suggest_retail_upsell (ranked recommendations for a booking's service), NOT add_retail_to_booking (mutate).
- send_client_message: READ — open SMS/WhatsApp with canned template for booking client (templateId, channel=sms|whatsapp). NOT add_client_note (internal note).
- explain_message_templates: READ — list the business-configured canned SMS/WhatsApp templates available to send (label + resolved preview text for this booking). Triggers: what templates can I send, show canned messages, what message templates are there. Editing templates stays dashboard-only. NOT send_client_message (actually opens the SMS/WhatsApp link).
- notify_client_ready: MUTATE — open SMS/WhatsApp telling the client their chair/turn is ready now (uses a configured "ready"/"your turn" template if one exists, otherwise a default message). Triggers: tell her chair is ready, send your turn message, let him know we're ready. NOT send_client_message (generic canned template, not the ready-specific default).
- block_my_time: MUTATE — instant lunch/break block on own calendar (date, timeFrom/timeTo). NOT request_time_off (needs approval).
- extend_my_block: MUTATE — push the end time of your own most-recent one-off block (lunch/break) later, either by a duration or to a specific time. Triggers: extend lunch 30 minutes, push break to 2:30, make my lunch longer, add 20 minutes to my break. NOT block_my_time (creates a new block).
- block_schedule: block lunch/break on own calendar only for providers; managers may block team when allowed.
- request_time_off: submit unavailable date range for manager approval (own calendar). NOT block_schedule (instant block).
- list_my_time_off_requests: READ — status of own pending/approved/denied time-off requests.
- summarize_utilization: READ-ONLY utilization % for date range — own stats for providers; team summary for managers.
- explain_today_timeline: READ — narrative walkthrough of today's own-calendar bookings in order, calling out gaps between clients. Triggers: walk me through my day, gaps between clients, what does my day look like, any breaks today. NOT summarize_day (status breakdown, not chronological), NOT show_appointments (flat list, no gap narrative), NOT fill_unused_slots (afternoon-gap mutate-adjacent offer-to-fill).
- reschedule_booking: move an appointment to a new time (own bookings only unless team view).
- fill_unused_slots: fill schedule gaps for own calendar (team view: all providers).
- suggest_waitlist_for_gap: READ — suggest waitlist customers for a specific open gap on own calendar (date + timeFrom/timeTo). Triggers: fill this gap, waitlist for this slot. NOT fill_unused_slots (creates blocks) and NOT coordinate_waitlist_offer (manager cancel flow).
- draft_waitlist_offer_message: READ — draft (copy-only, no send) SMS text offering an open gap to the top waitlist candidate (date + timeFrom/timeTo). Triggers: draft SMS for waitlist when gap opens, message top waitlist client, write a waitlist offer message. NOT suggest_waitlist_for_gap (just lists candidates, no message text), NOT send_client_message (booking-specific canned template).
- coordinate_waitlist_offer: manager team view — cancel provider appointment and offer slot to waitlist customer (e.g. "If Maria cancels, offer slot to waitlist customer John").
- list_package_appointments_today: READ-ONLY — provider-scoped package appointments on own calendar today. NOT list_package_bookings (dashboard admin).
- list_my_package_visits: READ-ONLY — provider-scoped package visits on own calendar for a date range.
- list_my_multi_service_groups: READ-ONLY — provider-scoped multi-service groups/blocks on own calendar.
- mark_paid: mark a single booking paid (own calendar unless manager team view). NOT payment_sweep (bulk). Set bookingId when known.
- collect_remaining_balance: MUTATE — collect the outstanding balance on a single booking at the chair (deposit already paid, rest due now). No Stripe Terminal integration exists — this is the same manual mark-paid mutation as mark_paid, just phrased as "charge/collect the rest". Triggers: charge the balance on file, collect the rest at chair, take the remaining payment now. NOT mark_paid (full amount not yet touched), NOT payment_sweep (bulk), NOT explain_deposit_balance_due (read-only balance question).
- explain_appointment_tax: READ — tax lines on appointment payment breakdown: inclusive vs exclusive model, per-rule amounts, and amount collected when marked paid. Optional bookingId. NOT explain_provider_payment_currency (ISO currency symbol) and NOT lookup_booking_tax_metadata (support metadata dump).
- explain_provider_payment_currency: READ — why appointment payment breakdown or POS grand total shows € / ֏ / ₽ / $ (business default vs legacy service code vs retail add-on). NOT explain_payment_status (paid/pending status) and NOT explain_appointment_tax (tax lines).
- explain_provider_date_display: READ — how provider schedule/booking cards format dates and times from auth business dateFormat/timeFormat (fmt-1.8). NOT explain_provider_payment_currency (currency) and NOT explain_last_push (push actions).
- configure_provider_push_date_format: MUTATE — wire FCM push booking times to business timeFormat when fmt-1.8 push bodies ship (confirmation required). NOT explain_provider_date_display (read-only).
- explain_provider_session_timeout: READ — clinic only: when provider mobile app auto-logs out after HIPAA inactivity timeout (compliance-1.13 provider deferred). NOT explain_provider_date_display (date formatting) and NOT dashboard explain_hipaa_session_timeout.
- list_my_collection_queue: READ — clinic only: own specimen collection worklist (draws/recollects) for today or a date. NOT list_bookings (appointments) and NOT dashboard list_test_orders.
- mark_specimen_collected: MUTATE — clinic only: mark a specimen Collected for an assigned visit. Requires customerName or specimenId or orderId. NOT mark_paid (payment) and NOT enter_test_result (dashboard).
- explain_specimen_recollect: READ — clinic only: why a specimen was flagged RecollectRequired and what to do next (draw again, then mark collected or rejected). Requires specimenId or customerName. Triggers: why recollect required, failed draw — what next. NOT mark_specimen_collected (mutate).
- search_patient: READ — clinic only: search/lookup patients across the clinic by name or phone fragment. Optional query. Triggers: find patient Jane Doe, lookup by phone ending 4521, search for patients named John. NOT open_patient_chart (already-identified patient's full chart), NOT summarize_client (booking-scoped snapshot).
- handoff_to_dashboard_phi: READ — clinic only: static explainer for why full pre-visit intake / PHI editing isn't available on mobile and requires the dashboard. Triggers: open full intake on dashboard, why can't I edit intake here. NOT explain_client_intake (reads the actual intake answers for this booking).
- confirm_booking_from_push: confirm one booking — same as Confirm on a new-booking push. Requires bookingId (inherit from lastPush).
- suggest_reschedule_from_push: open AI to reschedule — same as Reschedule on a new-booking push (guidance only, no slot move).
- Combine filters: customerName + timeSlot + date for one appointment (e.g. "John at 13:00").
- Default date to today when the user says "today" or gives no date for today's context.
- If unclear, use action "unknown".

${PROVIDER_MOBILE_CLASSIFIER_RULES}`;

interface ParsedIntent {
  action: string;
  params: Record<string, unknown>;
  reasoning: string;
}

@Injectable()
export class ProviderAiCommandService {
  private readonly logger = new Logger(ProviderAiCommandService.name);

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(SchedulingPeriod)
    private periodRepo: Repository<SchedulingPeriod>,
    private bookingService: BookingService,
    private schedulingEngine: SchedulingEngineService,
    private llm: LlmService,
    private providerMobile: ProviderMobileService,
    private completionPipeline: CommandCompletionPipelineService,
    private aiEvents: AiEventsService,
    private scheduleHandlers: AiScheduleHandlersService,
    private orchestration: CommandOrchestrationService,
    private planBuilder: OperationalPlanBuilderService,
    private promptSecurity: AiPromptSecurityService,
    private aiSettings: AiSettingsService,
    private promptNormalization: AiPromptNormalizationService,
    private providerUnderstanding: ProviderCommandUnderstandingAdapter,
    @Inject(forwardRef(() => AiPushNotificationsService))
    private pushNotifications: AiPushNotificationsService,
    @Inject(forwardRef(() => AiProviderBookingService))
    private providerBooking: AiProviderBookingService,
    @Inject(forwardRef(() => AiProviderClinicCollectionService))
    private providerClinicCollection: AiProviderClinicCollectionService,
    @Inject(forwardRef(() => AiClinicLabBookingService))
    private clinicLabBooking: AiClinicLabBookingService,
    private businessCurrency: AiBusinessCurrencyService,
    private businessDateFormat: AiBusinessDateFormatService,
    private businessTax: AiBusinessTaxService,
    private businessCompliance: AiBusinessComplianceService,
    @Inject(forwardRef(() => AiProviderPushSetupService))
    private providerPushSetup: AiProviderPushSetupService,
    @Inject(forwardRef(() => AiProviderEarningsService))
    private providerEarnings: AiProviderEarningsService,
    @Inject(forwardRef(() => AiProviderClientContextService))
    private providerClientContext: AiProviderClientContextService,
    @Inject(forwardRef(() => AiProviderExp2Service))
    private providerExp2: AiProviderExp2Service,
    @Inject(forwardRef(() => AiProviderTimeOffService))
    private providerTimeOff: AiProviderTimeOffService,
    @Inject(forwardRef(() => AiProviderOpenShiftsService))
    private providerOpenShifts: AiProviderOpenShiftsService,
    @Inject(forwardRef(() => AiProviderExp3Service))
    private providerExp3: AiProviderExp3Service,
    @Inject(forwardRef(() => AiProviderClinicTasksAndResultsService))
    private providerClinicTasksAndResults: AiProviderClinicTasksAndResultsService,
    @Inject(forwardRef(() => AiClinicPatientChartService))
    private clinicPatientChart: AiClinicPatientChartService,
    @Inject(forwardRef(() => AiGiftFulfillmentService))
    private giftFulfillment: AiGiftFulfillmentService,
    @Inject(forwardRef(() => AiRetailFinanceService))
    private retailFinance: AiRetailFinanceService,
    @Inject(forwardRef(() => AiScheduleResourcesService))
    private scheduleResources: AiScheduleResourcesService,
    @Inject(forwardRef(() => AiPaymentsService))
    private payments: AiPaymentsService,
    private pushActions: ProviderPushActionService,
    private productGuide: AiProductGuideService,
    private emptyStateGuide: AiProductGuideEmptyStateService,
  ) {}

  async executeCommand(
    businessId: string,
    userId: string,
    prompt: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    context?: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    if (!(await this.llm.isAvailableForBusiness(businessId))) {
      const fallback = await runAiUnavailableStaticGuideFallback({
        productGuide: this.productGuide,
        businessId,
        prompt,
        surface: 'provider',
        reason: 'openai_not_configured',
        session: { context },
        userId,
      });
      if (fallback) {
        return this.attachProviderSession(
          this.attachGuideVoiceDetails({
            success: fallback.success,
            action: fallback.action,
            summary: fallback.summary,
            details: fallback.details ?? {},
            guide: fallback.guide,
          }),
          context ?? {},
        );
      }
      return {
        success: false,
        action: 'error',
        summary:
          'AI assistant is not configured. Ask your business owner to add an OpenAI API key in Settings.',
        details: {},
        guide: buildAiUnavailableErrorWithGuideLink({
          surface: 'provider',
          reason: 'openai_not_configured',
          route: mapProviderMobileGuideRoute(context),
        }).guide,
      };
    }

    const access = await this.providerMobile.resolveMobileAccess(
      businessId,
      userId,
    );
    const actorTier = this.resolveProviderAccessTier(access);

    // e2e-bug.266 — my_stats phrasing (incl. HY "Ինչպե՞ս եմ…") must not be
    // stolen by early product-guide rescue.
    const skipEarlyGuideForMyStats = isMyStatsPrompt(prompt);
    const rescuedProviderGuide = skipEarlyGuideForMyStats
      ? { action: 'unknown' as const }
      : rescueProductGuideIntent(prompt, 'unknown', {
          surface: 'provider',
          assistantMode: context?.assistantMode as 'guide' | 'act' | undefined,
          route: mapProviderMobileGuideRoute(context),
          context,
        });
    if (isProviderProductGuideIntent(rescuedProviderGuide.action)) {
      return this.attachProviderSession(
        await this.dispatchProviderProductGuideIntent(
          rescuedProviderGuide.action,
          businessId,
          userId,
          prompt,
          context,
          access,
          actorTier,
        ),
        context ?? {},
      );
    }
    if (isMetaProductGuideIntent(rescuedProviderGuide.action)) {
      return this.attachProviderSession(
        await this.dispatchProviderMetaGuideIntent(
          rescuedProviderGuide.action,
          businessId,
          userId,
          prompt,
          context,
          access,
          actorTier,
        ),
        context ?? {},
      );
    }
    if (isAppGuideIntent(rescuedProviderGuide.action)) {
      return this.attachProviderSession(
        await this.dispatchProviderAppGuideIntent(
          businessId,
          userId,
          prompt,
          rescuedProviderGuide.action,
          context,
          access,
          actorTier,
        ),
        context ?? {},
      );
    }

    if (isVoiceSummarizeNextClientPrompt(prompt)) {
      return this.attachProviderSession(
        await this.handleVoiceSummarizeNextClient(
          businessId,
          access,
          prompt,
          {},
          context,
        ),
        context ?? {},
      );
    }

    const guideMatch = resolveProductGuidePromptMatch(prompt, {
      surface: 'provider',
      assistantMode: context?.assistantMode as 'guide' | 'act' | undefined,
    });
    // e2e-bug.266 — "Ինչպե՞ս եմ…" is my_stats, not a product-guide tour.
    if (
      guideMatch.matched &&
      guideMatch.intent &&
      !isMyStatsPrompt(prompt)
    ) {
      return this.attachProviderSession(
        await this.dispatchProviderAppGuideIntent(
          businessId,
          userId,
          prompt,
          guideMatch.intent,
          context,
          access,
          actorTier,
        ),
        context ?? {},
      );
    }

    const blocked = this.promptSecurity.preflightBlock(
      businessId,
      prompt,
      'provider',
      typeof context?.locale === 'string' ? context.locale : undefined,
    );
    if (blocked) {
      return {
        success: blocked.success,
        action: blocked.action,
        summary: blocked.summary,
        details: blocked.details as Record<string, unknown>,
      };
    }

    const providerName = access.employee?.name ?? 'Admin';
    const scopedEmployeeId = this.providerMobile.getScopedEmployeeId(access);

    const recipeResult = await this.dispatchProviderCompoundRecipe(
      businessId,
      userId,
      prompt,
      access,
      context,
    );
    if (recipeResult) return recipeResult;

    if (this.providerBooking.isProviderBookingCompound(prompt)) {
      const providerBookingCompound =
        await this.providerBooking.handleProviderBookingCompound(
          businessId,
          prompt,
          {
            sessionEmployeeId: scopedEmployeeId ?? undefined,
            userId,
            ...context,
          },
        );
      if (
        providerBookingCompound.success ||
        providerBookingCompound.details?.failedStep
      ) {
        return providerBookingCompound;
      }
    }

    if (this.pushNotifications.isPushNotificationsCompound(prompt)) {
      const compound =
        await this.pushNotifications.handlePushNotificationsCompound(
          businessId,
          prompt,
          {
            sessionEmployeeId: scopedEmployeeId ?? undefined,
            userId,
            lastPush: context?.lastPush,
            offlineQueueCount: context?.offlineQueueCount,
            online: context?.online,
          },
        );
      if (compound.success || compound.details?.failedStep) {
        return compound;
      }
    }

    if (this.giftFulfillment.isFulfillmentCompound(prompt)) {
      const giftFulfillmentCompound =
        await this.giftFulfillment.handleFulfillmentCompound(
          businessId,
          prompt,
          {
            sessionEmployeeId: scopedEmployeeId ?? undefined,
            ...context,
          },
          userId,
        );
      if (
        giftFulfillmentCompound.success ||
        giftFulfillmentCompound.details?.failedStep
      ) {
        return giftFulfillmentCompound;
      }
    }

    if (isProviderMobileCompoundPrompt(prompt)) {
      const mobileCompound = await this.handleProviderMobileCompound(
        businessId,
        userId,
        prompt,
        access,
        context,
        scopedEmployeeId ?? undefined,
      );
      if (mobileCompound.success || mobileCompound.details?.failedStep) {
        return mobileCompound;
      }
    }

    const aiConfig = await this.aiSettings.getSettings(businessId);
    const promptNorm = await this.promptNormalization.normalizeForClassifier(
      businessId,
      userId,
      prompt,
    );

    const understood = await this.providerUnderstanding.understand({
      businessId,
      userId,
      effectivePrompt: prompt,
      providerName,
      viewMode: access.viewMode,
      confidence: aiConfig.confidence,
      sessionConfidenceHigh: context?._confidenceHigh as number | undefined,
      lastAction: context?.lastAction as string | undefined,
      sessionContext: context,
      employees: access.employee
        ? [{ id: access.employee.id, name: access.employee.name }]
        : [],
      promptNorm,
      classify: (normalizedPrompt, contextBlock, narrowShortlist) =>
        this.classifyIntent(
          businessId,
          userId,
          normalizedPrompt,
          contextBlock,
          providerName,
          access.viewMode,
          history,
          context,
          narrowShortlist,
        ),
    });

    if (understood.status === 'blocked') {
      return {
        success: false,
        action: 'error',
        summary: 'Could not understand that command. Try rephrasing.',
        details: {
          pipelineTrace: understood.trace,
          blockReason: understood.blockReason,
        },
      };
    }

    if (understood.status === 'clarify') {
      const clarifyPayload = {
        summary:
          understood.clarifySummary ??
          'I need a bit more detail before I can run this.',
        clarifyFields: understood.clarifyFields ?? ['intentChoice'],
        suggestions: understood.clarifySuggestions ?? [],
        loweredConfidence: understood.confidence,
        ruleId:
          understood.blockReason?.replace('self_verify clarify: ', '') ??
          'unknown',
        reason: understood.blockReason ?? 'self_verify_clarify',
      };
      const clarify = buildPipelineClarifyCommandResult(
        understood,
        clarifyPayload,
      );
      this.aiEvents.emitClarify(businessId, {
        action: understood.action,
        summary: clarify.summary,
        missing: clarify.details.missing,
      });
      return this.withPostFailureGuideFallback(
        {
          success: clarify.success,
          action: clarify.action,
          summary: clarify.summary,
          details: clarify.details as Record<string, unknown>,
        },
        context,
        prompt,
      );
    }

    const parsed = pipelineResultToClassifiedIntent(understood);
    const classifierCandidate = findClassifierCandidate(understood);
    const classifierAction = classifierCandidate?.action ?? parsed.action;
    let rescueReason: string | undefined = pipelineRescueReason(understood);

    parsed.params = this.completionPipeline.mergeProviderSessionContext(
      parsed.params as Record<string, any>,
      context,
    ) as Record<string, unknown>;
    parsed.params = applyProviderEntityMemory(parsed.params, prompt, context);
    applyProviderMobilePromptHints(
      parsed.action,
      parsed.params as Record<string, any>,
      prompt,
      {
        session: context,
      },
    );
    this.completionPipeline.normalizeDateParams(
      parsed.params as Record<string, any>,
    );

    const providerHeuristic = rescueProviderAiIntent(prompt, parsed.action);
    if (providerHeuristic !== parsed.action) {
      parsed.action = providerHeuristic;
      rescueReason = 'provider_heuristic';
    }

    // e2e-bug.247 — dashboard-handoff FAQ explainers must not be stolen by later
    // client-context / Exp2 heuristics (intake read, my_stats false-positives).
    const dashboardHandoffExplainer = new Set([
      'explain_dashboard_only_action',
      'explain_reassign_limit',
      'explain_time_off_approval',
    ]);
    const lockDashboardHandoff = dashboardHandoffExplainer.has(parsed.action);

    if (!lockDashboardHandoff) {
      const clientContextRescue =
        this.providerClientContext.rescueProviderClientContextIntent(
          prompt,
          parsed.action,
        );
      if (clientContextRescue && clientContextRescue.action !== parsed.action) {
        parsed.action = clientContextRescue.action;
        rescueReason = clientContextRescue.rescueReason;
        if (clientContextRescue.action === 'add_client_note') {
          const noteBody = extractClientNoteBodyFromPrompt(prompt);
          if (noteBody) {
            (parsed.params as Record<string, unknown>).clientNote = noteBody;
          }
        }
        const customerName = extractCustomerNameFromClientPrompt(prompt);
        if (customerName) {
          (parsed.params as Record<string, unknown>).customerName =
            customerName;
        }
      }

      const providerExp2Rescue = this.providerExp2.rescueProviderExp2Intent(
        prompt,
        parsed.action,
      );
      if (providerExp2Rescue && providerExp2Rescue.action !== parsed.action) {
        parsed.action = providerExp2Rescue.action;
        rescueReason = providerExp2Rescue.rescueReason;
      }
    }

    const voiceSummarizeRescue = rescueVoiceSummarizeNextClientIntent(
      prompt,
      parsed.action,
    );
    if (voiceSummarizeRescue !== parsed.action) {
      parsed.action = voiceSummarizeRescue;
      rescueReason = 'voice_summarize_next_client';
    }

    // e2e-bug.266 — post-classify product-guide rescue must not steal my_stats
    // ("Ինչպե՞ս եմ այս ամիս" / "How am I doing…") back to guide_user_flow.
    if (!isMyStatsPrompt(prompt) && parsed.action !== 'my_stats') {
      const providerGuideRescue = rescueProductGuideIntent(
        prompt,
        parsed.action,
        {
          surface: 'provider',
          assistantMode: context?.assistantMode as 'guide' | 'act' | undefined,
          route: mapProviderMobileGuideRoute(context),
          context,
        },
      );
      if (providerGuideRescue.action !== parsed.action) {
        parsed.action = providerGuideRescue.action;
        rescueReason =
          providerGuideRescue.rescueReason ?? 'provider_product_guide';
      }
    }

    const coordination = rescueCoordinationIntent(prompt, parsed.action);
    if (coordination !== parsed.action) {
      parsed.action = coordination;
      rescueReason = 'coordination_intent';
    }

    const mobileFix = disambiguateProviderMobileAction(
      prompt,
      parsed.action,
      context,
    );
    if (mobileFix) {
      parsed.action = mobileFix.action;
      rescueReason = mobileFix.rescueReason;
    }

    if ((parsed.action as string) === 'add_retail_to_my_booking') {
      parsed.action = 'add_retail_to_booking';
      rescueReason = 'retail_action_alias';
    }

    recordMisrouteTelemetry(this.aiEvents, businessId, {
      surface: 'provider',
      prompt,
      classifierAction,
      rescuedAction: parsed.action,
      rescueReason,
      compoundStepCount: 1,
    });
    applyProviderMobilePromptHints(
      parsed.action,
      parsed.params as Record<string, any>,
      prompt,
      {
        session: context,
      },
    );

    if (shouldBlockUnknownFromHandlerSwitch(parsed.action)) {
      const clarify = buildUnknownIntentClarifyResult({
        surface: 'provider',
        prompt,
        params: parsed.params,
        reasoning: parsed.reasoning,
        confidence:
          typeof parsed.confidence === 'number' ? parsed.confidence : 0,
        trace: understood.trace,
        locale:
          typeof context?.locale === 'string' ? context.locale : undefined,
      });
      this.aiEvents.emitClarify(businessId, {
        action: 'unknown',
        summary: clarify.summary,
        missing: clarify.details.missing,
      });
      return this.withPostFailureGuideFallback(
        {
          success: clarify.success,
          action: clarify.action,
          summary: clarify.summary,
          details: clarify.details as Record<string, unknown>,
        },
        context,
        prompt,
      );
    }

    if (shouldValidateProviderAction(parsed.action)) {
      const validation = validateProviderCommand(parsed.action, {
        ...parsed.params,
        _prompt: prompt,
      });
      if (!validation.ok) {
        const clarify = this.completionPipeline.toProviderClarifyResult(
          parsed.action,
          parsed.params,
          parsed.reasoning,
          validation,
        );
        this.aiEvents.emitClarify(businessId, {
          action: parsed.action,
          summary: clarify.summary,
          missing: Array.isArray(clarify.details.missing)
            ? clarify.details.missing
            : undefined,
        });
        return this.withPostFailureGuideFallback(clarify, context, prompt);
      }
    }

    this.normalizeParams(parsed.params);

    if (!isIntentAllowed('provider', actorTier, parsed.action)) {
      return {
        success: false,
        action: parsed.action,
        summary: `Action "${parsed.action.replace(/_/g, ' ')}" is not allowed for your role (${actorTier}).`,
        details: { tier: actorTier, action: parsed.action },
      };
    }

    parsed.params = this.promptSecurity.stripParams(parsed.params);
    parsed.params = this.promptSecurity.applyStaffScope(
      actorTier,
      parsed.action,
      parsed.params,
      this.providerMobile.getScopedEmployeeId(access),
    );

    const securityDenied = this.promptSecurity.enforceAction(
      businessId,
      'provider',
      actorTier,
      parsed.action,
      prompt,
      parsed.params,
      typeof context?.locale === 'string' ? context.locale : undefined,
    );
    if (securityDenied) {
      return {
        success: securityDenied.success,
        action: securityDenied.action,
        summary: securityDenied.summary,
        details: securityDenied.details as Record<string, unknown>,
      };
    }

    this.logger.log(
      `Provider AI action="${parsed.action}" — ${parsed.reasoning}`,
    );

    if (isAppGuideIntent(parsed.action)) {
      return this.attachProviderSession(
        await this.dispatchProviderAppGuideIntent(
          businessId,
          userId,
          prompt,
          parsed.action,
          context,
          access,
          actorTier,
          parsed.params,
        ),
        mergeProviderMobileHintsIntoSessionContext(
          context ?? {},
          parsed.params,
          parsed.action,
        ),
      );
    }

    if (isMetaProductGuideIntent(parsed.action)) {
      return this.attachProviderSession(
        await this.dispatchProviderMetaGuideIntent(
          parsed.action,
          businessId,
          userId,
          prompt,
          context,
          access,
          actorTier,
          parsed.params,
        ),
        mergeProviderMobileHintsIntoSessionContext(
          context ?? {},
          parsed.params,
          parsed.action,
        ),
      );
    }

    let result: ProviderCommandResult;

    switch (parsed.action) {
      case 'cancel_bookings':
        result = await this.handleCancelBookings(
          businessId,
          access,
          parsed.params,
          userId,
          context?.confirmed === true,
        );
        break;
      case 'update_bookings':
        result = await this.handleUpdateBookings(
          businessId,
          access,
          parsed.params,
          userId,
          context?.confirmed === true,
        );
        break;
      case 'mark_visit_complete':
        result = await this.handleMarkVisitComplete(
          businessId,
          access,
          parsed.params,
          userId,
          context?.confirmed === true,
          typeof context?.bookingId === 'string' ? context.bookingId : undefined,
        );
        break;
      case 'mark_visit_in_progress':
        result = await this.handleMarkVisitInProgress(
          businessId,
          access,
          parsed.params,
          userId,
          context?.confirmed === true,
          typeof context?.bookingId === 'string' ? context.bookingId : undefined,
        );
        break;
      case 'mark_multi_service_step_done':
        result = await this.handleMarkMultiServiceStepDone(
          businessId,
          access,
          parsed.params,
          userId,
          context?.confirmed === true,
          typeof context?.bookingId === 'string' ? context.bookingId : undefined,
          prompt,
        );
        break;
      case 'search_patient':
        result = await this.handleSearchPatient(
          businessId,
          userId,
          parsed.params,
          prompt,
        );
        break;
      case 'confirm_pending_booking':
        result = await this.handleConfirmPendingBooking(
          businessId,
          access,
          parsed.params,
          userId,
          context?.confirmed === true,
        );
        break;
      case 'explain_booking_status_badge':
        result = this.handleExplainBookingStatusBadge();
        break;
      case 'explain_floor_status':
        result = this.handleExplainFloorStatus();
        break;
      case 'explain_calendar_utilization_bands':
        result = this.handleExplainCalendarUtilizationBands();
        break;
      case 'explain_block_vs_time_off':
        result = this.handleExplainBlockVsTimeOff();
        break;
      case 'explain_offline_suggestions':
        result = this.handleExplainOfflineSuggestions();
        break;
      case 'explain_accessibility_settings':
        result = this.handleExplainAccessibilitySettings();
        break;
      case 'give_provider_ai_feedback':
        result = handleGiveProviderAiFeedback(
          {
            ...parsed.params,
            ...(typeof context?.lastAction === 'string' && context.lastAction
              ? { lastAction: context.lastAction }
              : {}),
          },
          prompt,
        );
        break;
      case 'explain_dashboard_only_action':
        result = this.handleExplainDashboardOnlyAction(
          prompt,
          typeof context?.locale === 'string' ? context.locale : undefined,
        );
        break;
      case 'explain_reassign_limit':
        result = this.handleExplainReassignLimit();
        break;
      case 'explain_time_off_approval':
        result = this.handleExplainTimeOffApproval();
        break;
      case 'handoff_to_dashboard_phi':
        result = this.handleHandoffToDashboardPhi();
        break;
      case 'mark_no_shows':
        result = await this.handleMarkNoShows(
          businessId,
          access,
          parsed.params,
          userId,
          context?.confirmed === true,
        );
        break;
      case 'payment_sweep':
        result = await this.handlePaymentSweep(
          businessId,
          access,
          parsed.params,
          userId,
          context?.confirmed === true,
        );
        break;
      case 'list_bookings':
        result = await this.handleListBookings(
          businessId,
          access,
          parsed.params,
        );
        break;
      case 'summarize_day':
        result = await this.handleSummarizeDay(
          businessId,
          access,
          parsed.params,
        );
        break;
      case 'reschedule_booking':
        result = await this.handleRescheduleBooking(
          businessId,
          access,
          parsed.params,
          userId,
        );
        break;
      case 'fill_unused_slots':
        result = await this.handleFillUnusedSlots(
          businessId,
          access,
          prompt,
          parsed.params,
          userId,
        );
        break;
      case 'list_schedule_gaps':
        result = await this.handleListScheduleGaps(
          businessId,
          access,
          prompt,
          parsed.params,
        );
        break;
      case 'open_booking_detail':
        result = await this.handleOpenBookingDetail(
          businessId,
          access,
          userId,
          parsed.params,
        );
        break;
      case 'show_appointments':
        result = await this.handleShowAppointments(
          businessId,
          access,
          prompt,
          parsed.params,
        );
        break;
      case 'voice_summarize_next_client':
        result = await this.handleVoiceSummarizeNextClient(
          businessId,
          access,
          prompt,
          parsed.params,
          context,
        );
        break;
      case 'team_whos_next':
        result = await this.handleTeamWhosNext(businessId, userId, access);
        break;
      case 'check_availability':
        result = await this.handleCheckAvailability(
          businessId,
          access,
          prompt,
          parsed.params,
        );
        break;
      case 'block_schedule':
        result = await this.handleBlockSchedule(
          businessId,
          access,
          prompt,
          parsed.params,
          userId,
        );
        break;
      case 'add_retail_to_booking':
      case 'set_retail_sales_lines':
      case 'remove_retail_from_booking':
      case 'send_client_message':
      case 'explain_message_templates':
      case 'notify_client_ready':
      case 'block_my_time':
      case 'extend_my_block':
      case 'request_time_off':
        result = (await this.providerExp3.handleIntent(
          businessId,
          userId,
          parsed.action,
          parsed.params,
          prompt,
          context,
          access.employee?.id,
        )) ?? {
          success: false,
          action: parsed.action,
          summary: `Could not complete "${parsed.action}". Try rephrasing or use the booking detail screen.`,
          details: { clarify: true },
        };
        break;
      case 'suggest_retail_upsell':
        result = await this.retailFinance.handleSuggestRetailUpsell(
          businessId,
          { ...parsed.params, sessionEmployeeId: scopedEmployeeId ?? undefined },
          prompt,
        );
        break;
      case 'search_retail_sku':
        result = await this.retailFinance.handleSearchRetailSku(
          businessId,
          parsed.params,
          prompt,
        );
        break;
      case 'chair_closeout':
        result = await this.handleChairCloseout(
          businessId,
          userId,
          prompt,
          access,
          context,
        );
        break;
      case 'running_late_notify':
        result = await this.handleRunningLateNotify(
          businessId,
          userId,
          prompt,
          access,
          context,
        );
        break;
      case 'gap_waitlist_fill':
        result = await this.handleGapWaitlistFill(
          businessId,
          userId,
          prompt,
          access,
          context,
        );
        break;
      case 'cancel_and_recover':
        result = await this.handleCancelAndRecover(
          businessId,
          userId,
          prompt,
          access,
          context,
        );
        break;
      case 'pre_visit_brief':
        result = await this.handlePreVisitBrief(
          businessId,
          userId,
          prompt,
          context,
        );
        break;
      case 'end_of_day_close':
        result = await this.handleEndOfDayClose(
          businessId,
          userId,
          prompt,
          access,
          context,
        );
        break;
      case 'reschedule_and_notify':
        result = await this.handleRescheduleAndNotify(
          businessId,
          userId,
          prompt,
          access,
          context,
        );
        break;
      case 'clinic_draw_flow':
        result = await this.handleClinicDrawFlow(
          businessId,
          userId,
          prompt,
          context,
        );
        break;
      case 'push_confirm_check_in':
        result = await this.handlePushConfirmCheckIn(
          businessId,
          userId,
          prompt,
          context,
        );
        break;
      case 'pending_confirm_day':
        result = await this.handlePendingConfirmDay(
          businessId,
          userId,
          prompt,
          access,
          context,
        );
        break;
      case 'check_in_start_complete':
        result = await this.handleCheckInStartComplete(
          businessId,
          userId,
          prompt,
          access,
          context,
        );
        break;
      case 'retail_closeout':
        result = await this.handleRetailCloseout(
          businessId,
          userId,
          prompt,
          access,
          context,
        );
        break;
      case 'gap_walk_in_book':
        result = await this.handleGapWalkInBook(
          businessId,
          userId,
          prompt,
          access,
          context,
        );
        break;
      case 'no_show_recover':
        result = await this.handleNoShowRecover(
          businessId,
          userId,
          prompt,
          access,
          context,
        );
        break;
      case 'multi_service_brief':
        result = await this.handleMultiServiceBrief(
          businessId,
          userId,
          prompt,
          context,
        );
        break;
      case 'clinic_draw_patient':
        result = await this.handleClinicDrawPatient(
          businessId,
          userId,
          prompt,
          context,
        );
        break;
      case 'push_mark_paid_close':
        result = await this.handlePushMarkPaidClose(
          businessId,
          userId,
          prompt,
          access,
          context,
        );
        break;
      case 'manager_floor_sweep':
        result = await this.handleManagerFloorSweep(
          businessId,
          userId,
          prompt,
          access,
          context,
        );
        break;
      case 'my_resource_assignments':
        result = await this.scheduleResources.handleMyResourceAssignments(
          businessId,
          { ...parsed.params, sessionEmployeeId: scopedEmployeeId ?? undefined },
        );
        break;
      case 'block_resource_unavailable':
        result = await this.scheduleResources.handleBlockResourceUnavailable(
          businessId,
          parsed.params,
        );
        break;
      case 'explain_payment_status':
      case 'collect_cash_confirm':
        result = (await this.payments.dispatchIntent({
          businessId,
          action: parsed.action,
          params: parsed.params,
          prompt,
          userId,
        })) ?? {
          success: false,
          action: parsed.action,
          summary: `Could not complete "${parsed.action}".`,
          details: { clarify: true },
        };
        break;
      case 'list_my_time_off_requests':
        result = (await this.providerTimeOff.handleIntent(
          businessId,
          userId,
          parsed.action,
          parsed.params,
          'provider',
          access.employee?.id,
        )) ?? {
          success: false,
          action: parsed.action,
          summary: 'Could not load your time-off requests.',
          details: { clarify: true },
        };
        break;
      case 'cancel_time_off_request':
        result = (await this.providerTimeOff.handleIntent(
          businessId,
          userId,
          parsed.action,
          parsed.params,
          'provider',
          access.employee?.id,
        )) ?? {
          success: false,
          action: parsed.action,
          summary: 'Could not cancel your time-off request.',
          details: { clarify: true },
        };
        break;
      case 'suggest_waitlist_for_gap':
        result = (await this.providerOpenShifts.handleIntent(
          businessId,
          parsed.action,
          prompt,
          parsed.params,
          access.employee?.id,
          userId,
          context,
        )) ?? {
          success: false,
          action: 'suggest_waitlist_for_gap',
          summary:
            'Could not suggest waitlist customers for this gap. Open your provider calendar and tap Fill this gap.',
          details: { clarify: true },
        };
        break;
      case 'draft_waitlist_offer_message':
        result = (await this.providerOpenShifts.handleIntent(
          businessId,
          parsed.action,
          prompt,
          parsed.params,
          access.employee?.id,
          userId,
          context,
        )) ?? {
          success: false,
          action: 'draft_waitlist_offer_message',
          summary: 'Could not draft a waitlist offer message for this gap.',
          details: { clarify: true },
        };
        break;
      case 'list_waitlist_for_my_services':
        result = (await this.providerOpenShifts.handleIntent(
          businessId,
          parsed.action,
          prompt,
          parsed.params,
          access.employee?.id,
          userId,
          context,
        )) ?? {
          success: false,
          action: 'list_waitlist_for_my_services',
          summary: 'Could not load your waitlist.',
          details: { clarify: true },
        };
        break;
      case 'list_rebooking_candidates':
        result = (await this.providerOpenShifts.handleIntent(
          businessId,
          parsed.action,
          prompt,
          parsed.params,
          access.employee?.id,
          userId,
          context,
        )) ?? {
          success: false,
          action: 'list_rebooking_candidates',
          summary: 'Could not load rebooking candidates.',
          details: { clarify: true },
        };
        break;
      case 'book_walk_in_gap':
        result = (await this.providerOpenShifts.handleIntent(
          businessId,
          parsed.action,
          prompt,
          parsed.params,
          access.employee?.id,
          userId,
          context,
        )) ?? {
          success: false,
          action: 'book_walk_in_gap',
          summary: 'Could not book the walk-in.',
          details: { clarify: true },
        };
        break;
      case 'summarize_utilization':
        result = await this.handleSummarizeUtilization(
          businessId,
          access,
          prompt,
          parsed.params,
        );
        break;
      case 'explain_today_timeline':
        result = await this.handleExplainTodayTimeline(
          businessId,
          access,
          parsed.params,
        );
        break;
      case 'coordinate_waitlist_offer':
        result = await this.handleCoordinateWaitlistOffer(
          businessId,
          access,
          parsed.params,
          userId,
          context?.confirmed === true,
        );
        break;
      case 'explain_last_push':
        result = await this.pushNotifications.handleExplainLastPush({
          ...parsed.params,
          lastPush: parsed.params.lastPush ?? context?.lastPush,
        });
        break;
      case 'open_booking_from_push':
        result = await this.pushNotifications.handleOpenBookingFromPush(
          businessId,
          {
            ...parsed.params,
            lastPush: parsed.params.lastPush ?? context?.lastPush,
          },
          prompt,
        );
        break;
      case 'offline_queue_status':
        result = await this.pushNotifications.handleOfflineQueueStatus({
          ...parsed.params,
          offlineQueueCount:
            parsed.params.offlineQueueCount ?? context?.offlineQueueCount,
          online: parsed.params.online ?? context?.online,
        });
        break;
      case 'retry_offline_action':
        result = await this.pushNotifications.handleRetryOfflineAction({
          ...parsed.params,
          offlineQueueCount:
            parsed.params.offlineQueueCount ?? context?.offlineQueueCount,
          online: parsed.params.online ?? context?.online,
        });
        break;
      case 'explain_offline_mode':
        result = await this.pushNotifications.handleProviderExplainOfflineMode({
          ...parsed.params,
          offlineQueueCount:
            parsed.params.offlineQueueCount ?? context?.offlineQueueCount,
          online: parsed.params.online ?? context?.online,
        });
        break;
      case 'explain_app_update_gate':
        result = await this.pushNotifications.handleProviderExplainAppUpdateGate(
          parsed.params,
        );
        break;
      case 'dismiss_push':
        result = await this.pushNotifications.handleDismissPush({
          ...parsed.params,
          lastPush: parsed.params.lastPush ?? context?.lastPush,
        });
        break;
      case 'end_of_day_summary':
        result = await this.pushNotifications.handleEndOfDaySummary(
          businessId,
          {
            ...parsed.params,
            sessionEmployeeId: scopedEmployeeId ?? undefined,
          },
        );
        break;
      case 'new_booking_push_actions':
        result = await this.pushNotifications.handleNewBookingPushActions();
        break;
      case 'list_push_notifications':
        result = await this.pushNotifications.handleListPushNotifications(
          businessId,
          userId,
        );
        break;
      case 'mark_all_notifications_read':
        result = await this.pushNotifications.handleMarkAllNotificationsRead(
          businessId,
          userId,
        );
        break;
      case 'mark_booking_notifications_read':
        result =
          await this.pushNotifications.handleMarkBookingNotificationsRead(
            businessId,
            userId,
            {
              ...parsed.params,
              lastPush: parsed.params.lastPush ?? context?.lastPush,
            },
            prompt,
          );
        break;
      case 'mark_notification_read':
        result = await this.pushNotifications.handleMarkNotificationRead(
          businessId,
          userId,
          parsed.params,
        );
        break;
      case 'explain_push_setup':
      case 'enable_push_notifications':
      case 'explain_push_registration_status':
        result = (await this.providerPushSetup.handleIntent(
          businessId,
          userId,
          parsed.action,
          {
            ...parsed.params,
            nativePlatform:
              context?.nativePlatform ?? parsed.params.nativePlatform,
          },
        )) ?? {
          success: false,
          action: parsed.action,
          summary: `Provider assistant does not support "${parsed.action}" yet. Try rephrasing.`,
          details: { clarify: true },
        };
        break;
      case 'summarize_my_appointments':
      case 'summarize_my_revenue':
        result = (await this.providerEarnings.handleIntent(
          businessId,
          userId,
          parsed.action,
          parsed.params,
          prompt,
        )) ?? {
          success: false,
          action: parsed.action,
          summary: `Provider assistant does not support "${parsed.action}" yet. Try rephrasing.`,
          details: { clarify: true },
        };
        break;
      case 'summarize_client':
      case 'show_client_history':
      case 'add_client_note':
      case 'list_client_staff_notes':
      case 'explain_client_intake':
      case 'explain_package_visit_context':
      case 'explain_multi_service_timeline':
      case 'explain_booking_payment_breakdown':
      case 'explain_deposit_balance_due':
      case 'explain_retail_cart':
      case 'explain_cancel_policy_for_client':
      case 'explain_gift_card_redemption':
      case 'explain_tour_group_on_booking':
        result = (await this.providerClientContext.handleIntent(
          businessId,
          userId,
          parsed.action,
          parsed.params,
          prompt,
          context,
        )) ?? {
          success: false,
          action: parsed.action,
          summary: `Provider assistant does not support "${parsed.action}" yet. Try rephrasing.`,
          details: { clarify: true },
        };
        break;
      case 'my_stats':
      case 'team_floor_status':
      case 'check_in_client':
      case 'mark_running_late':
      case 'mark_ready_now':
      case 'suggest_cancel_note':
      case 'request_client_review':
      case 'list_reassign_options':
      case 'reassign_booking_same_day':
      case 'list_team_unpaid_today':
      case 'explain_reviews_inbox':
      case 'explain_request_review_flow':
      case 'draft_review_response':
      case 'open_dashboard_deep_link':
        result = (await this.providerExp2.handleIntent(
          businessId,
          userId,
          parsed.action,
          parsed.params,
          prompt,
          context,
        )) ?? {
          success: false,
          action: parsed.action,
          summary: `Provider assistant does not support "${parsed.action}" yet. Try rephrasing.`,
          details: { clarify: true },
        };
        break;
      case 'confirm_booking_from_push':
        result = await this.handleConfirmBookingFromPush(
          businessId,
          userId,
          parsed.params,
        );
        break;
      case 'suggest_reschedule_from_push':
        result = await this.handleSuggestRescheduleFromPush(
          businessId,
          userId,
          parsed.params,
        );
        break;
      case 'list_package_appointments_today':
        result = await this.providerBooking.handleListPackageAppointmentsToday(
          businessId,
          {
            ...parsed.params,
            sessionEmployeeId: scopedEmployeeId ?? undefined,
          },
        );
        break;
      case 'list_my_package_visits':
        result = await this.providerBooking.handleListMyPackageVisits(
          businessId,
          prompt,
          {
            ...parsed.params,
            sessionEmployeeId: scopedEmployeeId ?? undefined,
          },
        );
        break;
      case 'list_my_multi_service_groups':
        result = await this.providerBooking.handleListMyMultiServiceGroups(
          businessId,
          prompt,
          {
            ...parsed.params,
            sessionEmployeeId: scopedEmployeeId ?? undefined,
          },
        );
        break;
      case 'mark_paid':
        result = await this.providerBooking.handleMarkPaid(
          businessId,
          {
            ...parsed.params,
            sessionEmployeeId: scopedEmployeeId ?? undefined,
            _prompt: prompt,
          },
          userId,
        );
        break;
      case 'collect_remaining_balance':
        result = await this.handleCollectRemainingBalance(
          businessId,
          parsed.params,
          userId,
          prompt,
          scopedEmployeeId,
        );
        break;
      case 'explain_appointment_tax': {
        const parsedAppointmentTax = parseExplainAppointmentTaxFromPrompt(
          prompt,
          parsed.params,
        );
        result = await this.businessTax.handleExplainAppointmentTax(
          businessId,
          parsedAppointmentTax
            ? { ...parsed.params, ...parsedAppointmentTax, _prompt: prompt }
            : { ...parsed.params, _prompt: prompt },
          prompt,
          scopedEmployeeId ?? undefined,
        );
        break;
      }
      case 'explain_provider_payment_currency':
        result =
          await this.businessCurrency.handleExplainProviderPaymentCurrency(
            businessId,
          );
        break;
      case 'explain_provider_date_display':
        result =
          await this.businessDateFormat.handleExplainProviderDateDisplay(
            businessId,
          );
        break;
      case 'configure_provider_push_date_format':
        result =
          await this.businessDateFormat.handleConfigureProviderPushDateFormat(
            businessId,
            { ...parsed.params, _prompt: prompt },
            prompt,
            context?.confirmed === true,
          );
        break;
      case 'explain_provider_session_timeout':
        result =
          await this.businessCompliance.handleExplainProviderSessionTimeout(
            businessId,
          );
        break;
      case 'explain_staff_invite':
      case 'explain_provider_app_tabs':
      case 'explain_team_view_scope':
      case 'explain_profile_settings':
      case 'explain_assistant_confirm_swipe':
      case 'explain_provider_compound_steps':
        result = await this.dispatchProviderProductGuideIntent(
          parsed.action,
          businessId,
          userId,
          prompt,
          context,
          access,
          actorTier,
          parsed.params,
        );
        break;
      case 'explain_ai_suggestions':
      case 'explain_assistant_approval':
        result = await this.dispatchProviderMetaGuideIntent(
          parsed.action,
          businessId,
          userId,
          prompt,
          context,
          access,
          actorTier,
          parsed.params,
        );
        break;
      case 'explain_visibility_block':
      case 'explain_empty_catalog':
        result = await this.dispatchProviderEmptyStateGuideIntent(
          parsed.action,
          businessId,
          userId,
          prompt,
          context,
          access,
          actorTier,
          parsed.params,
        );
        break;
      case 'explain_provider_context':
        result = await this.handleExplainProviderContext(businessId, userId);
        break;
      case 'list_upcoming_bookings':
        result = await this.handleListUpcomingBookings(
          businessId,
          userId,
          parsed.params,
          prompt,
        );
        break;
      case 'get_schedule_summary':
        result = await this.handleGetScheduleSummary(
          businessId,
          userId,
          parsed.params,
          prompt,
        );
        break;
      case 'get_calendar_month':
        result = await this.handleGetCalendarMonth(
          businessId,
          userId,
          parsed.params,
        );
        break;
      case 'update_provider_profile':
        result = await this.handleUpdateProviderProfile(
          businessId,
          userId,
          parsed.params,
        );
        break;
      case 'show_provider_profile':
        result = await this.handleShowProviderProfile(businessId, userId);
        break;
      case 'list_my_collection_queue':
        result =
          await this.providerClinicCollection.handleListMyCollectionQueue(
            businessId,
            {
              ...parsed.params,
              sessionEmployeeId: scopedEmployeeId ?? undefined,
              _prompt: prompt,
            },
            prompt,
          );
        break;
      case 'mark_specimen_collected':
        result =
          await this.providerClinicCollection.handleMarkSpecimenCollected(
            businessId,
            userId,
            {
              ...parsed.params,
              sessionEmployeeId: scopedEmployeeId ?? undefined,
              _prompt: prompt,
            },
            prompt,
          );
        break;
      case 'explain_specimen_recollect':
        result =
          await this.providerClinicCollection.handleExplainSpecimenRecollect(
            businessId,
            {
              ...parsed.params,
              sessionEmployeeId: scopedEmployeeId ?? undefined,
              _prompt: prompt,
            },
            prompt,
          );
        break;
      case 'list_patient_pending_lab_requests':
        result =
          await this.clinicLabBooking.handleListPatientPendingLabRequests(
            businessId,
            userId,
            {
              ...parsed.params,
              sessionEmployeeId: scopedEmployeeId ?? undefined,
            },
          );
        break;
      case 'notify_patient_book_lab': {
        const pushResult = await this.clinicLabBooking.handlePushLabBookingToPatient(
          businessId,
          userId,
          {
            ...parsed.params,
            sessionEmployeeId: scopedEmployeeId ?? undefined,
          },
          prompt,
          context?.confirmed === true,
        );
        result = { ...pushResult, action: 'notify_patient_book_lab' };
        break;
      }
      case 'list_lab_results_queue':
        result =
          await this.providerClinicTasksAndResults.handleListLabResultsQueue(
            businessId,
            userId,
          );
        break;
      case 'list_clinic_tasks':
        result = await this.providerClinicTasksAndResults.handleListClinicTasks(
          businessId,
          userId,
        );
        break;
      case 'explain_clinic_task':
        result = await this.providerClinicTasksAndResults.handleExplainClinicTask(
          businessId,
          userId,
          parsed.params,
          prompt,
        );
        break;
      case 'open_patient_chart': {
        let chartParams = { ...parsed.params } as Record<string, unknown>;
        if (!chartParams.customerId && !chartParams.customerName) {
          const bookingId =
            (typeof context?.bookingId === 'string' &&
              context.bookingId.trim()) ||
            null;
          if (bookingId) {
            try {
              const booking = await this.providerMobile.getBookingDetail(
                businessId,
                userId,
                bookingId,
              );
              if (booking.customer?.id) {
                chartParams = {
                  ...chartParams,
                  customerId: booking.customer.id,
                };
              }
            } catch {
              // fall through — handleExplainPatientChart will ask to clarify
            }
          }
        }
        const chartResult = await this.clinicPatientChart.handleExplainPatientChart(
          businessId,
          userId,
          chartParams,
          prompt,
        );
        result = { ...chartResult, action: 'open_patient_chart' };
        break;
      }
      case 'claim_clinic_task':
        result = await this.providerClinicTasksAndResults.handleClaimClinicTask(
          businessId,
          userId,
          parsed.params,
          prompt,
        );
        break;
      case 'complete_clinic_task':
        result =
          await this.providerClinicTasksAndResults.handleCompleteClinicTask(
            businessId,
            userId,
            parsed.params,
            prompt,
          );
        break;
      case 'list_booking_lab_summaries':
        result =
          await this.providerClinicTasksAndResults.handleListBookingLabSummaries(
            businessId,
            userId,
            {
              ...parsed.params,
              bookingId: parsed.params.bookingId ?? context?.bookingId,
            },
            prompt,
          );
        break;
      case 'gift_card_creation_queue':
        result = await this.giftFulfillment.handleGiftCardCreationQueue(
          businessId,
        );
        break;
      case 'start_card_preparation':
        result = await this.giftFulfillment.handleStartCardPreparation(
          businessId,
          parsed.params,
          prompt,
        );
        break;
      case 'explain_gift_card_order_details':
        result = await this.giftFulfillment.handleExplainGiftCardOrderDetails(
          businessId,
          parsed.params,
          prompt,
        );
        break;
      case 'mark_card_ready':
        result = await this.giftFulfillment.handleMarkCardReady(
          businessId,
          parsed.params,
          userId,
          prompt,
        );
        break;
      case 'delivery_queue':
        result = await this.giftFulfillment.handleDeliveryQueue(businessId);
        break;
      case 'accept_delivery':
        result = await this.giftFulfillment.handleAcceptDelivery(
          businessId,
          parsed.params,
          userId,
          prompt,
        );
        break;
      case 'mark_out_for_delivery':
        result = await this.giftFulfillment.handleMarkOutForDelivery(
          businessId,
          parsed.params,
          userId,
          prompt,
        );
        break;
      case 'mark_delivered':
        result = await this.giftFulfillment.handleMarkDelivered(
          businessId,
          parsed.params,
          prompt,
        );
        break;
      case 'capture_delivery_proof':
        result = await this.giftFulfillment.handleCaptureDeliveryProof(
          businessId,
          parsed.params,
          prompt,
        );
        break;
      case 'notify_delay':
        result = await this.giftFulfillment.handleNotifyDelay(
          businessId,
          parsed.params,
          prompt,
        );
        break;
      default:
        result = {
          success: false,
          action: 'unknown',
          summary:
            'I can show your schedule, check availability, block breaks, summarize utilization, cancel or reschedule, fill gaps, mark no-shows, run payment sweeps, or update appointments. Try: "Who\'s next?" or "Mark all today paid".',
          details: {},
        };
    }

    return this.withPostFailureGuideFallback(
      this.attachProviderSession(
        result,
        mergeProviderMobileHintsIntoSessionContext(
          context ?? {},
          parsed.params,
          parsed.action,
        ),
      ),
      context,
      prompt,
    );
  }

  private withPostFailureGuideFallback(
    result: ProviderCommandResult,
    context?: Record<string, unknown>,
    prompt?: string,
  ): ProviderCommandResult {
    return appendPostFailureGuideFallback(
      result,
      buildPostFailureGuideFallbackInput(
        mergeProviderMobileGuideContext(context),
        'provider',
        undefined,
        prompt,
      ),
    );
  }

  /** ai-cmd-provider-5.14 — one natural-language message fans out into a fixed sequence of already-shipped provider actions. */
  private async dispatchProviderCompoundRecipe(
    businessId: string,
    userId: string,
    prompt: string,
    access: MobileAccess,
    context: Record<string, unknown> | undefined,
  ): Promise<ProviderCommandResult | null> {
    if (isPushConfirmCheckInPrompt(prompt)) {
      return this.handlePushConfirmCheckIn(businessId, userId, prompt, context);
    }
    if (isCancelAndRecoverPrompt(prompt)) {
      return this.handleCancelAndRecover(businessId, userId, prompt, access, context);
    }
    if (isClinicDrawFlowPrompt(prompt)) {
      return this.handleClinicDrawFlow(businessId, userId, prompt, context);
    }
    if (isClinicDrawPatientPrompt(prompt)) {
      return this.handleClinicDrawPatient(businessId, userId, prompt, context);
    }
    if (isPushMarkPaidClosePrompt(prompt)) {
      return this.handlePushMarkPaidClose(businessId, userId, prompt, access, context);
    }
    if (isManagerFloorSweepPrompt(prompt)) {
      return this.handleManagerFloorSweep(businessId, userId, prompt, access, context);
    }
    if (isPendingConfirmDayPrompt(prompt)) {
      return this.handlePendingConfirmDay(businessId, userId, prompt, access, context);
    }
    if (isCheckInStartCompletePrompt(prompt)) {
      return this.handleCheckInStartComplete(businessId, userId, prompt, access, context);
    }
    if (isRetailCloseoutPrompt(prompt)) {
      return this.handleRetailCloseout(businessId, userId, prompt, access, context);
    }
    if (isGapWalkInBookPrompt(prompt)) {
      return this.handleGapWalkInBook(businessId, userId, prompt, access, context);
    }
    if (isNoShowRecoverPrompt(prompt)) {
      return this.handleNoShowRecover(businessId, userId, prompt, access, context);
    }
    if (isEndOfDayClosePrompt(prompt)) {
      return this.handleEndOfDayClose(businessId, userId, prompt, access, context);
    }
    if (isGapWaitlistFillPrompt(prompt)) {
      return this.handleGapWaitlistFill(businessId, userId, prompt, access, context);
    }
    if (isRescheduleAndNotifyPrompt(prompt)) {
      return this.handleRescheduleAndNotify(businessId, userId, prompt, access, context);
    }
    if (isRunningLateNotifyPrompt(prompt)) {
      return this.handleRunningLateNotify(businessId, userId, prompt, access, context);
    }
    if (isChairCloseoutPrompt(prompt)) {
      return this.handleChairCloseout(businessId, userId, prompt, access, context);
    }
    if (isMultiServiceBriefPrompt(prompt)) {
      return this.handleMultiServiceBrief(businessId, userId, prompt, context);
    }
    if (isPreVisitBriefPrompt(prompt)) {
      return this.handlePreVisitBrief(businessId, userId, prompt, context);
    }
    return null;
  }

  private async handleChairCloseout(
    businessId: string,
    userId: string,
    prompt: string,
    access: MobileAccess,
    context: Record<string, unknown> | undefined,
  ): Promise<ProviderCommandResult> {
    const params: Record<string, unknown> = { ...context, _prompt: prompt };
    const confirmed = context?.confirmed === true;

    const visitStep = await this.handleMarkVisitComplete(
      businessId,
      access,
      { ...params },
      userId,
      confirmed,
    );
    if (!visitStep.success) return { ...visitStep, action: 'chair_closeout' };

    const paidStep = await this.providerBooking.handleMarkPaid(
      businessId,
      { ...params },
      userId,
    );
    if (!paidStep.success) {
      return {
        success: false,
        action: 'chair_closeout',
        summary: `${visitStep.summary} ${paidStep.summary}`,
        details: { visit: visitStep.details, paid: paidStep.details },
      };
    }

    const summaryParts = [visitStep.summary, paidStep.summary];
    let retailDetails: Record<string, unknown> | null = null;
    if (/\badd\s+[A-Z]/.test(prompt)) {
      const retailStep = await this.providerExp3.handleIntent(
        businessId,
        userId,
        'add_retail_to_booking',
        params,
        prompt,
        context,
        access.employee?.id,
      );
      if (retailStep) {
        summaryParts.push(retailStep.summary);
        retailDetails = retailStep.details as Record<string, unknown>;
      }
    }

    return {
      success: true,
      action: 'chair_closeout',
      summary: summaryParts.join(' '),
      details: {
        visit: visitStep.details,
        paid: paidStep.details,
        retail: retailDetails,
      },
    };
  }

  private async handleRunningLateNotify(
    businessId: string,
    userId: string,
    prompt: string,
    access: MobileAccess,
    context: Record<string, unknown> | undefined,
  ): Promise<ProviderCommandResult> {
    const params: Record<string, unknown> = { ...context, _prompt: prompt };

    const lateStep = (await this.providerExp2.handleIntent(
      businessId,
      userId,
      'mark_running_late',
      params,
      prompt,
      context,
    )) ?? {
      success: false,
      action: 'mark_running_late',
      summary: 'Could not mark you running late.',
      details: { clarify: true },
    };
    if (!lateStep.success) return { ...lateStep, action: 'running_late_notify' };

    const messageStep = (await this.providerExp3.handleIntent(
      businessId,
      userId,
      'send_client_message',
      params,
      prompt,
      context,
      access.employee?.id,
    )) ?? {
      success: false,
      action: 'send_client_message',
      summary: 'Could not text the next client.',
      details: { clarify: true },
    };

    return {
      success: lateStep.success && messageStep.success,
      action: 'running_late_notify',
      summary: `${lateStep.summary} ${messageStep.summary}`,
      details: {
        runningLate: lateStep.details,
        clientMessage: messageStep.details,
      },
    };
  }

  private async handleGapWaitlistFill(
    businessId: string,
    userId: string,
    prompt: string,
    access: MobileAccess,
    context: Record<string, unknown> | undefined,
  ): Promise<ProviderCommandResult> {
    const params: Record<string, unknown> = { ...context, _prompt: prompt };
    const confirmed = context?.confirmed === true;

    const suggestStep = (await this.providerOpenShifts.handleIntent(
      businessId,
      'suggest_waitlist_for_gap',
      prompt,
      params,
      access.employee?.id,
      userId,
      context,
    )) ?? {
      success: false,
      action: 'suggest_waitlist_for_gap',
      summary: 'Could not suggest waitlist customers for this gap.',
      details: { clarify: true },
    };
    if (!suggestStep.success) {
      return { ...suggestStep, action: 'gap_waitlist_fill' };
    }

    const draftParams = { ...params, ...(suggestStep.details ?? {}) };
    const draftStep = (await this.providerOpenShifts.handleIntent(
      businessId,
      'draft_waitlist_offer_message',
      prompt,
      draftParams,
      access.employee?.id,
      userId,
      context,
    )) ?? {
      success: false,
      action: 'draft_waitlist_offer_message',
      summary: 'Could not draft a waitlist offer message.',
      details: { clarify: true },
    };
    if (!draftStep.success) {
      return {
        success: false,
        action: 'gap_waitlist_fill',
        summary: `${suggestStep.summary} ${draftStep.summary}`,
        details: { suggest: suggestStep.details, draft: draftStep.details },
      };
    }

    const offerParams = { ...draftParams, ...(draftStep.details ?? {}) };
    const offerStep = await this.handleCoordinateWaitlistOffer(
      businessId,
      access,
      offerParams,
      userId,
      confirmed,
    );

    return {
      success: suggestStep.success && draftStep.success && offerStep.success,
      action: 'gap_waitlist_fill',
      summary: `${suggestStep.summary} ${draftStep.summary} ${offerStep.summary}`,
      details: {
        suggest: suggestStep.details,
        draft: draftStep.details,
        offer: offerStep.details,
      },
    };
  }

  private async handleCancelAndRecover(
    businessId: string,
    userId: string,
    prompt: string,
    access: MobileAccess,
    context: Record<string, unknown> | undefined,
  ): Promise<ProviderCommandResult> {
    const params: Record<string, unknown> = { ...context, _prompt: prompt };
    const confirmed = context?.confirmed === true;

    const cancelStep = await this.handleCancelBookings(
      businessId,
      access,
      { ...params },
      userId,
      confirmed,
    );
    if (!cancelStep.success) {
      return { ...cancelStep, action: 'cancel_and_recover' };
    }

    const recoverParams = { ...params, ...(cancelStep.details ?? {}) };
    const recoverStep = (await this.providerOpenShifts.handleIntent(
      businessId,
      'list_rebooking_candidates',
      prompt,
      recoverParams,
      access.employee?.id,
      userId,
      context,
    )) ?? {
      success: false,
      action: 'list_rebooking_candidates',
      summary: 'Could not load rebooking candidates.',
      details: { clarify: true },
    };

    return {
      success: cancelStep.success && recoverStep.success,
      action: 'cancel_and_recover',
      summary: `${cancelStep.summary} ${recoverStep.summary}`,
      details: { cancel: cancelStep.details, recover: recoverStep.details },
    };
  }

  private async handlePreVisitBrief(
    businessId: string,
    userId: string,
    prompt: string,
    context: Record<string, unknown> | undefined,
  ): Promise<ProviderCommandResult> {
    const params: Record<string, unknown> = { ...context, _prompt: prompt };

    const summaryStep = (await this.providerClientContext.handleIntent(
      businessId,
      userId,
      'summarize_client',
      params,
      prompt,
      context,
    )) ?? {
      success: false,
      action: 'summarize_client',
      summary: 'Could not summarize this client.',
      details: { clarify: true },
    };
    if (!summaryStep.success) {
      return { ...summaryStep, action: 'pre_visit_brief' };
    }

    const historyParams = { ...params, ...(summaryStep.details ?? {}) };
    const historyStep = (await this.providerClientContext.handleIntent(
      businessId,
      userId,
      'show_client_history',
      historyParams,
      prompt,
      context,
    )) ?? {
      success: false,
      action: 'show_client_history',
      summary: 'Could not load visit history.',
      details: { clarify: true },
    };

    const intakeStep = (await this.providerClientContext.handleIntent(
      businessId,
      userId,
      'explain_client_intake',
      historyParams,
      prompt,
      context,
    )) ?? {
      success: false,
      action: 'explain_client_intake',
      summary: 'Could not load pre-visit intake.',
      details: { clarify: true },
    };

    return {
      success: true,
      action: 'pre_visit_brief',
      summary: [summaryStep.summary, historyStep.summary, intakeStep.summary]
        .filter(Boolean)
        .join(' '),
      details: {
        summary: summaryStep.details,
        history: historyStep.details,
        intake: intakeStep.details,
      },
    };
  }

  private async handleEndOfDayClose(
    businessId: string,
    userId: string,
    prompt: string,
    access: MobileAccess,
    context: Record<string, unknown> | undefined,
  ): Promise<ProviderCommandResult> {
    const params: Record<string, unknown> = { ...context, _prompt: prompt };
    const confirmed = context?.confirmed === true;
    const scopedEmployeeId = this.providerMobile.getScopedEmployeeId(access);

    const summaryStep = await this.pushNotifications.handleEndOfDaySummary(
      businessId,
      { ...params, sessionEmployeeId: scopedEmployeeId ?? undefined },
    );

    const sweepStep = await this.handlePaymentSweep(
      businessId,
      access,
      { ...params },
      userId,
      confirmed,
    );
    if (!sweepStep.success) {
      return {
        success: false,
        action: 'end_of_day_close',
        summary: `${summaryStep.summary} ${sweepStep.summary}`,
        details: { summary: summaryStep.details, sweep: sweepStep.details },
      };
    }

    const noShowStep = await this.handleMarkNoShows(
      businessId,
      access,
      { ...params },
      userId,
      confirmed,
    );

    return {
      success: sweepStep.success && noShowStep.success,
      action: 'end_of_day_close',
      summary: `${summaryStep.summary} ${sweepStep.summary} ${noShowStep.summary}`,
      details: {
        summary: summaryStep.details,
        sweep: sweepStep.details,
        noShows: noShowStep.details,
      },
    };
  }

  private async handleRescheduleAndNotify(
    businessId: string,
    userId: string,
    prompt: string,
    access: MobileAccess,
    context: Record<string, unknown> | undefined,
  ): Promise<ProviderCommandResult> {
    const params: Record<string, unknown> = { ...context, _prompt: prompt };

    const rescheduleStep = await this.handleRescheduleBooking(
      businessId,
      access,
      { ...params },
      userId,
    );
    if (!rescheduleStep.success) {
      return { ...rescheduleStep, action: 'reschedule_and_notify' };
    }

    const messageParams = { ...params, ...(rescheduleStep.details ?? {}) };
    const messageStep = (await this.providerExp3.handleIntent(
      businessId,
      userId,
      'send_client_message',
      messageParams,
      prompt,
      context,
      access.employee?.id,
    )) ?? {
      success: false,
      action: 'send_client_message',
      summary: 'Could not text the client about the reschedule.',
      details: { clarify: true },
    };

    return {
      success: rescheduleStep.success && messageStep.success,
      action: 'reschedule_and_notify',
      summary: `${rescheduleStep.summary} ${messageStep.summary}`,
      details: {
        reschedule: rescheduleStep.details,
        clientMessage: messageStep.details,
      },
    };
  }

  private async handleClinicDrawFlow(
    businessId: string,
    userId: string,
    prompt: string,
    context: Record<string, unknown> | undefined,
  ): Promise<ProviderCommandResult> {
    const params: Record<string, unknown> = { ...context, _prompt: prompt };

    const queueStep =
      await this.providerClinicCollection.handleListMyCollectionQueue(
        businessId,
        params,
        prompt,
      );
    if (!queueStep.success) {
      return { ...queueStep, action: 'clinic_draw_flow' } as ProviderCommandResult;
    }

    const chartParams = { ...params, ...(queueStep.details ?? {}) };
    const chartStep = await this.clinicPatientChart.handleExplainPatientChart(
      businessId,
      userId,
      chartParams,
      prompt,
    );

    const collectParams = { ...chartParams, ...(chartStep.details ?? {}) };
    const collectStep =
      await this.providerClinicCollection.handleMarkSpecimenCollected(
        businessId,
        userId,
        collectParams,
        prompt,
      );

    return {
      success: queueStep.success && chartStep.success && collectStep.success,
      action: 'clinic_draw_flow',
      summary: `${queueStep.summary} ${chartStep.summary} ${collectStep.summary}`,
      details: {
        queue: queueStep.details,
        chart: chartStep.details,
        collect: collectStep.details,
      },
    } as ProviderCommandResult;
  }

  private async handlePushConfirmCheckIn(
    businessId: string,
    userId: string,
    prompt: string,
    context: Record<string, unknown> | undefined,
  ): Promise<ProviderCommandResult> {
    const params: Record<string, unknown> = {
      ...context,
      lastPush: context?.lastPush,
      _prompt: prompt,
    };

    const confirmStep = await this.handleConfirmBookingFromPush(
      businessId,
      userId,
      params,
    );
    if (!confirmStep.success) {
      return { ...confirmStep, action: 'push_confirm_check_in' };
    }

    const checkInParams = { ...params, ...(confirmStep.details ?? {}) };
    const checkInStep = (await this.providerExp2.handleIntent(
      businessId,
      userId,
      'check_in_client',
      checkInParams,
      prompt,
      context,
    )) ?? {
      success: false,
      action: 'check_in_client',
      summary: 'Confirmed the booking, but could not check the client in yet.',
      details: { clarify: true },
    };

    return {
      success: confirmStep.success && checkInStep.success,
      action: 'push_confirm_check_in',
      summary: `${confirmStep.summary} ${checkInStep.summary}`,
      details: { confirm: confirmStep.details, checkIn: checkInStep.details },
    };
  }

  /** ai-cmd-provider-5.26.1 — confirm all pending bookings, then summarize today's schedule. */
  private async handlePendingConfirmDay(
    businessId: string,
    userId: string,
    prompt: string,
    access: MobileAccess,
    context: Record<string, unknown> | undefined,
  ): Promise<ProviderCommandResult> {
    const params: Record<string, unknown> = { ...context, _prompt: prompt };
    const confirmed = context?.confirmed === true;

    const confirmStep = await this.handleConfirmPendingBooking(
      businessId,
      access,
      { ...params },
      userId,
      confirmed,
    );
    if (!confirmStep.success) {
      return { ...confirmStep, action: 'pending_confirm_day' };
    }

    const summaryStep = await this.handleSummarizeDay(businessId, access, {
      ...params,
    });

    return {
      success: confirmStep.success && summaryStep.success,
      action: 'pending_confirm_day',
      summary: `${confirmStep.summary} ${summaryStep.summary}`,
      details: { confirm: confirmStep.details, day: summaryStep.details },
    };
  }

  /** ai-cmd-provider-5.26.2 — check in, start, then complete a visit in one message. */
  private async handleCheckInStartComplete(
    businessId: string,
    userId: string,
    prompt: string,
    access: MobileAccess,
    context: Record<string, unknown> | undefined,
  ): Promise<ProviderCommandResult> {
    const params: Record<string, unknown> = { ...context, _prompt: prompt };
    const confirmed = context?.confirmed === true;

    const checkInStep = (await this.providerExp2.handleIntent(
      businessId,
      userId,
      'check_in_client',
      { ...params },
      prompt,
      context,
    )) ?? {
      success: false,
      action: 'check_in_client',
      summary: 'Could not check in the client.',
      details: { clarify: true },
    };
    if (!checkInStep.success) {
      return { ...checkInStep, action: 'check_in_start_complete' };
    }

    const progressParams = { ...params, ...(checkInStep.details ?? {}) };
    const progressStep = await this.handleMarkVisitInProgress(
      businessId,
      access,
      progressParams,
      userId,
      confirmed,
    );
    if (!progressStep.success) {
      return {
        success: false,
        action: 'check_in_start_complete',
        summary: `${checkInStep.summary} ${progressStep.summary}`,
        details: { checkIn: checkInStep.details, progress: progressStep.details },
      };
    }

    const completeParams = { ...progressParams, ...(progressStep.details ?? {}) };
    const completeStep = await this.handleMarkVisitComplete(
      businessId,
      access,
      completeParams,
      userId,
      confirmed,
    );

    return {
      success: checkInStep.success && progressStep.success && completeStep.success,
      action: 'check_in_start_complete',
      summary: `${checkInStep.summary} ${progressStep.summary} ${completeStep.summary}`,
      details: {
        checkIn: checkInStep.details,
        progress: progressStep.details,
        complete: completeStep.details,
      },
    };
  }

  /** ai-cmd-provider-5.26.3 — suggest a retail upsell, add it, then mark the booking paid. */
  private async handleRetailCloseout(
    businessId: string,
    userId: string,
    prompt: string,
    access: MobileAccess,
    context: Record<string, unknown> | undefined,
  ): Promise<ProviderCommandResult> {
    const params: Record<string, unknown> = { ...context, _prompt: prompt };
    const scopedEmployeeId = this.providerMobile.getScopedEmployeeId(access);

    const upsellStep = await this.retailFinance.handleSuggestRetailUpsell(
      businessId,
      { ...params, sessionEmployeeId: scopedEmployeeId ?? undefined },
      prompt,
    );
    if (!upsellStep.success) {
      return { ...upsellStep, action: 'retail_closeout' };
    }

    const addParams = { ...params, ...(upsellStep.details ?? {}) };
    const addStep = (await this.providerExp3.handleIntent(
      businessId,
      userId,
      'add_retail_to_booking',
      addParams,
      prompt,
      context,
      access.employee?.id,
    )) ?? {
      success: false,
      action: 'add_retail_to_booking',
      summary: 'Could not add the product to the booking.',
      details: { clarify: true },
    };
    if (!addStep.success) {
      return {
        success: false,
        action: 'retail_closeout',
        summary: `${upsellStep.summary} ${addStep.summary}`,
        details: { upsell: upsellStep.details, add: addStep.details },
      };
    }

    const paidParams = { ...addParams, ...(addStep.details ?? {}), _prompt: prompt };
    const paidStep = await this.providerBooking.handleMarkPaid(
      businessId,
      paidParams,
      userId,
    );

    return {
      success: upsellStep.success && addStep.success && paidStep.success,
      action: 'retail_closeout',
      summary: `${upsellStep.summary} ${addStep.summary} ${paidStep.summary}`,
      details: {
        upsell: upsellStep.details,
        add: addStep.details,
        paid: paidStep.details,
      },
    };
  }

  /** ai-cmd-provider-5.26.4 — book a walk-in into the next open gap, then check them in. */
  private async handleGapWalkInBook(
    businessId: string,
    userId: string,
    prompt: string,
    access: MobileAccess,
    context: Record<string, unknown> | undefined,
  ): Promise<ProviderCommandResult> {
    const params: Record<string, unknown> = { ...context, _prompt: prompt };

    const bookStep = (await this.providerOpenShifts.handleIntent(
      businessId,
      'book_walk_in_gap',
      prompt,
      { ...params },
      access.employee?.id,
      userId,
      context,
    )) ?? {
      success: false,
      action: 'book_walk_in_gap',
      summary: 'Could not book the walk-in.',
      details: { clarify: true },
    };
    if (!bookStep.success) {
      return { ...bookStep, action: 'gap_walk_in_book' };
    }

    const checkInParams = { ...params, ...(bookStep.details ?? {}) };
    const checkInStep = (await this.providerExp2.handleIntent(
      businessId,
      userId,
      'check_in_client',
      checkInParams,
      prompt,
      context,
    )) ?? {
      success: false,
      action: 'check_in_client',
      summary: 'Booked the walk-in, but could not check them in yet.',
      details: { clarify: true },
    };

    return {
      success: bookStep.success && checkInStep.success,
      action: 'gap_walk_in_book',
      summary: `${bookStep.summary} ${checkInStep.summary}`,
      details: { book: bookStep.details, checkIn: checkInStep.details },
    };
  }

  /** ai-cmd-provider-5.26.5 — mark a no-show, find rebooking candidates, then draft an offer message. */
  private async handleNoShowRecover(
    businessId: string,
    userId: string,
    prompt: string,
    access: MobileAccess,
    context: Record<string, unknown> | undefined,
  ): Promise<ProviderCommandResult> {
    const params: Record<string, unknown> = { ...context, _prompt: prompt };
    const confirmed = context?.confirmed === true;

    const noShowStep = await this.handleMarkNoShows(
      businessId,
      access,
      { ...params },
      userId,
      confirmed,
    );
    if (!noShowStep.success) {
      return { ...noShowStep, action: 'no_show_recover' };
    }

    const rebookParams = { ...params, ...(noShowStep.details ?? {}) };
    const rebookStep = (await this.providerOpenShifts.handleIntent(
      businessId,
      'list_rebooking_candidates',
      prompt,
      rebookParams,
      access.employee?.id,
      userId,
      context,
    )) ?? {
      success: false,
      action: 'list_rebooking_candidates',
      summary: 'Could not load rebooking candidates.',
      details: { clarify: true },
    };
    if (!rebookStep.success) {
      return {
        success: false,
        action: 'no_show_recover',
        summary: `${noShowStep.summary} ${rebookStep.summary}`,
        details: { noShow: noShowStep.details, rebook: rebookStep.details },
      };
    }

    const draftParams = { ...rebookParams, ...(rebookStep.details ?? {}) };
    const draftStep = (await this.providerOpenShifts.handleIntent(
      businessId,
      'draft_waitlist_offer_message',
      prompt,
      draftParams,
      access.employee?.id,
      userId,
      context,
    )) ?? {
      success: false,
      action: 'draft_waitlist_offer_message',
      summary: 'Could not draft a waitlist offer message.',
      details: { clarify: true },
    };

    return {
      success: noShowStep.success && rebookStep.success && draftStep.success,
      action: 'no_show_recover',
      summary: `${noShowStep.summary} ${rebookStep.summary} ${draftStep.summary}`,
      details: {
        noShow: noShowStep.details,
        rebook: rebookStep.details,
        draft: draftStep.details,
      },
    };
  }

  /** ai-cmd-provider-5.26.6 — multi-service groups, service timeline, then a client snapshot before a visit. */
  private async handleMultiServiceBrief(
    businessId: string,
    userId: string,
    prompt: string,
    context: Record<string, unknown> | undefined,
  ): Promise<ProviderCommandResult> {
    const params: Record<string, unknown> = { ...context, _prompt: prompt };

    const groupsStep = await this.providerBooking.handleListMyMultiServiceGroups(
      businessId,
      prompt,
      { ...params },
    );
    if (!groupsStep.success) {
      return { ...groupsStep, action: 'multi_service_brief' };
    }

    const timelineParams = { ...params, ...(groupsStep.details ?? {}) };
    const timelineStep = (await this.providerClientContext.handleIntent(
      businessId,
      userId,
      'explain_multi_service_timeline',
      timelineParams,
      prompt,
      context,
    )) ?? {
      success: false,
      action: 'explain_multi_service_timeline',
      summary: 'Could not load the multi-service order.',
      details: { clarify: true },
    };

    const clientParams = { ...timelineParams, ...(timelineStep.details ?? {}) };
    const clientStep = (await this.providerClientContext.handleIntent(
      businessId,
      userId,
      'summarize_client',
      clientParams,
      prompt,
      context,
    )) ?? {
      success: false,
      action: 'summarize_client',
      summary: 'Could not summarize this client.',
      details: { clarify: true },
    };

    return {
      success: groupsStep.success && timelineStep.success && clientStep.success,
      action: 'multi_service_brief',
      summary: `${groupsStep.summary} ${timelineStep.summary} ${clientStep.summary}`,
      details: {
        groups: groupsStep.details,
        timeline: timelineStep.details,
        client: clientStep.details,
      },
    };
  }

  /** ai-cmd-provider-5.26.8 — find a patient by name, open their chart, then mark their specimen collected. */
  private async handleClinicDrawPatient(
    businessId: string,
    userId: string,
    prompt: string,
    context: Record<string, unknown> | undefined,
  ): Promise<ProviderCommandResult> {
    const params: Record<string, unknown> = { ...context, _prompt: prompt };

    const searchStep = await this.handleSearchPatient(
      businessId,
      userId,
      { ...params },
      prompt,
    );
    if (!searchStep.success) {
      return { ...searchStep, action: 'clinic_draw_patient' };
    }

    const chartParams = { ...params, ...(searchStep.details ?? {}) };
    const chartStep = await this.clinicPatientChart.handleExplainPatientChart(
      businessId,
      userId,
      chartParams,
      prompt,
    );

    const collectParams = { ...chartParams, ...(chartStep.details ?? {}) };
    const collectStep =
      await this.providerClinicCollection.handleMarkSpecimenCollected(
        businessId,
        userId,
        collectParams,
        prompt,
      );

    return {
      success: searchStep.success && chartStep.success && collectStep.success,
      action: 'clinic_draw_patient',
      summary: `${searchStep.summary} ${chartStep.summary} ${collectStep.summary}`,
      details: {
        search: searchStep.details,
        chart: chartStep.details,
        collect: collectStep.details,
      },
    };
  }

  /** ai-cmd-provider-5.26.9 — open a booking from a push notification, mark it paid, then complete the visit. */
  private async handlePushMarkPaidClose(
    businessId: string,
    userId: string,
    prompt: string,
    access: MobileAccess,
    context: Record<string, unknown> | undefined,
  ): Promise<ProviderCommandResult> {
    const params: Record<string, unknown> = {
      ...context,
      lastPush: context?.lastPush,
      _prompt: prompt,
    };
    const confirmed = context?.confirmed === true;

    const openStep = await this.pushNotifications.handleOpenBookingFromPush(
      businessId,
      { ...params },
      prompt,
    );
    if (!openStep.success) {
      return { ...openStep, action: 'push_mark_paid_close' };
    }

    const paidParams = { ...params, ...(openStep.details ?? {}) };
    const paidStep = await this.providerBooking.handleMarkPaid(
      businessId,
      paidParams,
      userId,
    );
    if (!paidStep.success) {
      return {
        success: false,
        action: 'push_mark_paid_close',
        summary: `${openStep.summary} ${paidStep.summary}`,
        details: { open: openStep.details, paid: paidStep.details },
      };
    }

    const completeParams = { ...paidParams, ...(paidStep.details ?? {}) };
    const completeStep = await this.handleMarkVisitComplete(
      businessId,
      access,
      completeParams,
      userId,
      confirmed,
    );

    return {
      success: openStep.success && paidStep.success && completeStep.success,
      action: 'push_mark_paid_close',
      summary: `${openStep.summary} ${paidStep.summary} ${completeStep.summary}`,
      details: {
        open: openStep.details,
        paid: paidStep.details,
        complete: completeStep.details,
      },
    };
  }

  /** ai-cmd-provider-5.26.10 — manager view: floor status, today's team unpaid, then a payment sweep. */
  private async handleManagerFloorSweep(
    businessId: string,
    userId: string,
    prompt: string,
    access: MobileAccess,
    context: Record<string, unknown> | undefined,
  ): Promise<ProviderCommandResult> {
    const params: Record<string, unknown> = { ...context, _prompt: prompt };
    const confirmed = context?.confirmed === true;

    const floorStep = (await this.providerExp2.handleIntent(
      businessId,
      userId,
      'team_floor_status',
      { ...params },
      prompt,
      context,
    )) ?? {
      success: false,
      action: 'team_floor_status',
      summary: 'Could not load team floor status.',
      details: { clarify: true },
    };
    if (!floorStep.success) {
      return { ...floorStep, action: 'manager_floor_sweep' };
    }

    const unpaidParams = { ...params, ...(floorStep.details ?? {}) };
    const unpaidStep = (await this.providerExp2.handleIntent(
      businessId,
      userId,
      'list_team_unpaid_today',
      unpaidParams,
      prompt,
      context,
    )) ?? {
      success: false,
      action: 'list_team_unpaid_today',
      summary: 'Could not load team unpaid appointments.',
      details: { clarify: true },
    };

    const sweepParams = { ...unpaidParams, ...(unpaidStep.details ?? {}) };
    const sweepStep = await this.handlePaymentSweep(
      businessId,
      access,
      sweepParams,
      userId,
      confirmed,
    );

    return {
      success: floorStep.success && unpaidStep.success && sweepStep.success,
      action: 'manager_floor_sweep',
      summary: `${floorStep.summary} ${unpaidStep.summary} ${sweepStep.summary}`,
      details: {
        floor: floorStep.details,
        unpaid: unpaidStep.details,
        sweep: sweepStep.details,
      },
    };
  }

  private async handleProviderMobileCompound(
    businessId: string,
    userId: string,
    prompt: string,
    access: MobileAccess,
    context: Record<string, unknown> | undefined,
    scopedEmployeeId: string | undefined,
  ): Promise<ProviderCommandResult> {
    const steps = decomposeProviderMobileCompoundPrompt(prompt);
    if (steps.length < 2) {
      return {
        success: false,
        action: 'compound_intent',
        summary:
          'Could not split this into multiple provider commands. Try separating with "and".',
        details: { clarify: true },
      };
    }

    const results: ProviderCommandResult[] = [];
    let compoundContext: Record<string, unknown> = {
      ...context,
      sessionEmployeeId: scopedEmployeeId,
    };

    for (const step of steps.slice(0, 4)) {
      const stepParams = {
        ...compoundContext,
        ...step.params,
        _prompt: step.segment,
      };
      applyProviderMobilePromptHints(
        step.action,
        stepParams as Record<string, any>,
        step.segment,
        {
          session: compoundContext,
        },
      );

      let stepResult: ProviderCommandResult;
      switch (step.action) {
        case 'confirm_booking_from_push':
          stepResult = await this.handleConfirmBookingFromPush(
            businessId,
            userId,
            stepParams,
          );
          break;
        case 'suggest_reschedule_from_push':
          stepResult = await this.handleSuggestRescheduleFromPush(
            businessId,
            userId,
            stepParams,
          );
          break;
        case 'mark_paid': {
          const markPaid = await this.providerBooking.handleMarkPaid(
            businessId,
            stepParams as Record<string, any>,
            userId,
          );
          stepResult = {
            success: markPaid.success,
            action: markPaid.action,
            summary: markPaid.summary,
            details: markPaid.details as Record<string, unknown>,
          };
          break;
        }
        case 'set_retail_sales_lines': {
          const cartResult = (await this.providerExp3.handleIntent(
            businessId,
            userId,
            'set_retail_sales_lines',
            stepParams,
            step.segment,
            compoundContext,
            scopedEmployeeId,
          )) ?? {
            success: false,
            action: 'set_retail_sales_lines',
            summary: 'Could not update retail cart.',
            details: { clarify: true },
          };
          stepResult = cartResult;
          break;
        }
        case 'explain_last_push':
        case 'open_booking_from_push':
        case 'offline_queue_status':
        case 'retry_offline_action':
        case 'dismiss_push':
        case 'end_of_day_summary':
        case 'new_booking_push_actions':
          stepResult = await this.executeProviderPushStep(
            businessId,
            step.action,
            stepParams,
            step.segment,
            scopedEmployeeId,
          );
          break;
        case 'list_package_appointments_today':
        case 'list_my_package_visits':
        case 'list_my_multi_service_groups':
          stepResult = await this.executeProviderBookingReadStep(
            businessId,
            step.action,
            prompt,
            stepParams,
            scopedEmployeeId,
          );
          break;
        default:
          return {
            success: false,
            action: step.action,
            summary: `Unsupported provider mobile compound step: ${step.action}.`,
            details: {
              failedStep: step.action,
              completedSteps: results.length,
            },
          };
      }

      results.push(stepResult);
      compoundContext = mergeProviderMobileHintsIntoSessionContext(
        compoundContext,
        stepParams,
        step.action,
      );
      if (stepResult.details?.bookingId) {
        compoundContext.bookingId = stepResult.details.bookingId;
      }

      if (!stepResult.success && stepResult.details?.needsClarification) {
        return {
          ...stepResult,
          details: {
            ...stepResult.details,
            compoundSteps: results,
            failedStep: step.action,
          },
        };
      }
    }

    const last = results[results.length - 1];
    return {
      success: results.every((r) => r.success),
      action: 'compound_intent',
      summary: results.map((r) => r.summary).join(' → '),
      details: {
        compound: true,
        steps: results.map((r) => ({ action: r.action, summary: r.summary })),
        sessionContext: this.completionPipeline.buildProviderSessionContext(
          compoundContext as Record<string, any>,
        ),
        ...last.details,
      },
    };
  }

  private async executeProviderPushStep(
    businessId: string,
    action: string,
    params: Record<string, unknown>,
    segment: string,
    scopedEmployeeId: string | undefined,
  ): Promise<ProviderCommandResult> {
    switch (action) {
      case 'explain_last_push': {
        const r = await this.pushNotifications.handleExplainLastPush({
          ...params,
          lastPush: params.lastPush,
        });
        return {
          success: r.success,
          action: r.action,
          summary: r.summary,
          details: r.details as Record<string, unknown>,
        };
      }
      case 'open_booking_from_push': {
        const r = await this.pushNotifications.handleOpenBookingFromPush(
          businessId,
          { ...params, lastPush: params.lastPush },
          segment,
        );
        return {
          success: r.success,
          action: r.action,
          summary: r.summary,
          details: r.details as Record<string, unknown>,
        };
      }
      case 'offline_queue_status': {
        const r = await this.pushNotifications.handleOfflineQueueStatus(params);
        return {
          success: r.success,
          action: r.action,
          summary: r.summary,
          details: r.details as Record<string, unknown>,
        };
      }
      case 'retry_offline_action': {
        const r = await this.pushNotifications.handleRetryOfflineAction(params);
        return {
          success: r.success,
          action: r.action,
          summary: r.summary,
          details: r.details as Record<string, unknown>,
        };
      }
      case 'dismiss_push': {
        const r = await this.pushNotifications.handleDismissPush(params);
        return {
          success: r.success,
          action: r.action,
          summary: r.summary,
          details: r.details as Record<string, unknown>,
        };
      }
      case 'end_of_day_summary': {
        const r = await this.pushNotifications.handleEndOfDaySummary(
          businessId,
          { ...params, sessionEmployeeId: scopedEmployeeId },
        );
        return {
          success: r.success,
          action: r.action,
          summary: r.summary,
          details: r.details as Record<string, unknown>,
        };
      }
      case 'new_booking_push_actions': {
        const r = await this.pushNotifications.handleNewBookingPushActions();
        return {
          success: r.success,
          action: r.action,
          summary: r.summary,
          details: r.details as Record<string, unknown>,
        };
      }
      default:
        return {
          success: false,
          action,
          summary: `Unsupported push step: ${action}`,
          details: {},
        };
    }
  }

  private async executeProviderBookingReadStep(
    businessId: string,
    action: string,
    prompt: string,
    params: Record<string, unknown>,
    scopedEmployeeId: string | undefined,
  ): Promise<ProviderCommandResult> {
    const stepParams = {
      ...params,
      sessionEmployeeId: scopedEmployeeId,
    };
    let r;
    switch (action) {
      case 'list_package_appointments_today':
        r = await this.providerBooking.handleListPackageAppointmentsToday(
          businessId,
          stepParams as Record<string, any>,
        );
        break;
      case 'list_my_package_visits':
        r = await this.providerBooking.handleListMyPackageVisits(
          businessId,
          prompt,
          stepParams as Record<string, any>,
        );
        break;
      case 'list_my_multi_service_groups':
        r = await this.providerBooking.handleListMyMultiServiceGroups(
          businessId,
          prompt,
          stepParams as Record<string, any>,
        );
        break;
      default:
        return {
          success: false,
          action,
          summary: `Unsupported booking read step: ${action}`,
          details: {},
        };
    }
    return {
      success: r.success,
      action: r.action,
      summary: r.summary,
      details: r.details as Record<string, unknown>,
    };
  }

  private async handleConfirmBookingFromPush(
    businessId: string,
    userId: string,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    const bookingId = params.bookingId as string | undefined;
    if (!bookingId) {
      return {
        success: false,
        action: 'confirm_booking_from_push',
        summary:
          'No booking linked — open the push notification or say which appointment to confirm.',
        details: {
          needsClarification: true,
          missing: ['bookingId'],
          pushParity: 'confirm',
        },
      };
    }

    const pushResult = await this.pushActions.handleAction(businessId, userId, {
      actionId: 'confirm',
      bookingId,
      businessId,
    });
    return {
      success: pushResult.success,
      action: 'confirm_booking_from_push',
      summary: pushResult.summary,
      details: {
        bookingId,
        pushParity: 'confirm',
        pushActionId: 'confirm',
      },
    };
  }

  private async handleSuggestRescheduleFromPush(
    businessId: string,
    userId: string,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    const bookingId = params.bookingId as string | undefined;
    if (!bookingId) {
      return {
        success: false,
        action: 'suggest_reschedule_from_push',
        summary:
          'No booking linked — open the push notification or specify which appointment to reschedule.',
        details: {
          needsClarification: true,
          missing: ['bookingId'],
          pushParity: 'suggest_reschedule',
        },
      };
    }

    const pushResult = await this.pushActions.handleAction(businessId, userId, {
      actionId: 'suggest_reschedule',
      bookingId,
      businessId,
    });
    return {
      success: pushResult.success,
      action: 'suggest_reschedule_from_push',
      summary: pushResult.summary,
      details: {
        bookingId,
        pushParity: 'suggest_reschedule',
        pushActionId: 'suggest_reschedule',
        openAi: true,
      },
    };
  }

  private buildConfirmationDetails(
    bookings: Booking[],
    pendingAction: { action: string; params: Record<string, unknown> },
  ) {
    const preview = bookings.map((b) => this.bookingLabel(b));
    const previewItems = bookings.map((b) => this.toPreviewItem(b));
    return {
      requiresConfirmation: true,
      bookingIds: bookings.map((b) => b.id),
      preview,
      previewItems,
      pendingAction,
    };
  }

  private toPreviewItem(booking: Booking): ProviderPreviewItem {
    const customerName = booking.customer?.name ?? 'Walk-in';
    return {
      id: booking.id,
      customerName,
      serviceName: booking.service?.name ?? 'Appointment',
      time: formatTimeRangeDisplay(booking.startTime, booking.endTime),
      initials:
        customerName
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? '')
          .join('') || '?',
    };
  }

  private attachProviderSession(
    result: ProviderCommandResult,
    params: Record<string, unknown>,
  ): ProviderCommandResult {
    if (result.details?.needsClarification) return result;
    return {
      ...result,
      details: {
        ...result.details,
        sessionContext: this.completionPipeline.buildProviderSessionContext(
          params as Record<string, any>,
        ),
      },
    };
  }

  async confirmAction(
    businessId: string,
    userId: string,
    dto: ProviderAiConfirmDto,
  ): Promise<ProviderCommandResult> {
    const access = await this.providerMobile.resolveMobileAccess(
      businessId,
      userId,
    );
    const bookings = await this.loadOwnedBookings(
      businessId,
      this.providerMobile.getScopedEmployeeId(access),
      dto.bookingIds,
    );
    if (bookings.length !== dto.bookingIds.length) {
      throw new BadRequestException(
        'Some appointments were not found or are not yours',
      );
    }

    if (dto.action === 'cancel_bookings') {
      const result = await this.executeCancel(
        bookings,
        String(dto.params?.reason ?? 'Cancelled by provider'),
        userId,
      );
      this.aiEvents.emitTaskCompleted(businessId, {
        action: 'cancel_bookings',
        success: result.success,
        summary: result.summary,
      });
      return result;
    }
    if (
      dto.action === 'update_bookings' ||
      dto.action === 'mark_no_shows' ||
      dto.action === 'payment_sweep'
    ) {
      const result = await this.executeUpdate(
        bookings,
        dto.action === 'mark_no_shows'
          ? { status: BookingStatus.NO_SHOW }
          : dto.action === 'payment_sweep'
            ? { paymentStatus: PaymentStatus.PAID }
            : (dto.params ?? {}),
        userId,
      );
      this.aiEvents.emitTaskCompleted(businessId, {
        action: dto.action,
        success: result.success,
        summary: result.summary,
      });
      return { ...result, action: dto.action };
    }
    throw new BadRequestException('Unsupported action');
  }

  private async handleExplainProviderContext(
    businessId: string,
    userId: string,
  ): Promise<ProviderCommandResult> {
    const ctx = await this.providerMobile.getContext(businessId, userId);
    const viewLabel = ctx.viewMode === 'team' ? 'team view' : 'your own view';
    const enabledFeatures = [
      ctx.labFeaturesEnabled ? 'clinic lab' : null,
      ctx.retailPosEnabled ? 'retail POS' : null,
      ctx.whatsappContactEnabled ? 'WhatsApp contact' : null,
    ].filter((feature): feature is string => Boolean(feature));

    const summaryParts = [
      `You're in ${viewLabel} as ${ctx.membershipRole}${ctx.employee ? ` (${ctx.employee.name})` : ''}`,
      enabledFeatures.length
        ? `${enabledFeatures.join(', ')} enabled`
        : 'no extra features enabled for this business',
    ];

    return {
      success: true,
      action: 'explain_provider_context',
      summary: `${summaryParts.join(' — ')}.`,
      details: { context: ctx },
    };
  }

  private async handleListUpcomingBookings(
    businessId: string,
    userId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<ProviderCommandResult> {
    const days =
      typeof params.days === 'number'
        ? params.days
        : (extractDaysFromPrompt(prompt) ?? 7);
    const view = await this.providerMobile.getUpcomingBookings(
      businessId,
      userId,
      days,
    );
    return {
      success: true,
      action: 'list_upcoming_bookings',
      summary: view.bookings.length
        ? `${view.bookings.length} upcoming booking(s) from ${view.from} to ${view.to}.`
        : `No upcoming bookings from ${view.from} to ${view.to}.`,
      details: { ...view },
    };
  }

  private async handleGetScheduleSummary(
    businessId: string,
    userId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<ProviderCommandResult> {
    const days =
      typeof params.days === 'number'
        ? params.days
        : (extractDaysFromPrompt(prompt) ?? 14);
    const summary = await this.providerMobile.getScheduleSummary(
      businessId,
      userId,
      days,
    );
    const totalAvailable = summary.days.reduce(
      (sum, d) => sum + d.available,
      0,
    );
    const totalBooked = summary.days.reduce((sum, d) => sum + d.booked, 0);
    return {
      success: true,
      action: 'get_schedule_summary',
      summary: `Next ${days} day(s): ${totalBooked} booked, ${totalAvailable} available slot(s).`,
      details: { ...summary },
    };
  }

  private resolveRequestedCalendarMonthKey(
    params: Record<string, unknown>,
  ): string | undefined {
    if (typeof params.month === 'string' && params.month.trim()) {
      return params.month.trim();
    }
    return undefined;
  }

  private async handleGetCalendarMonth(
    businessId: string,
    userId: string,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    const month = this.resolveRequestedCalendarMonthKey(params);
    const view = await this.providerMobile.getCalendarMonthSummary(
      businessId,
      userId,
      month,
    );
    const counts = { empty: 0, low: 0, medium: 0, high: 0 };
    for (const day of view.days) counts[day.utilizationBand] += 1;
    const highDays = view.days
      .filter((d) => d.utilizationBand === 'high')
      .map((d) => d.date);

    return {
      success: true,
      action: 'get_calendar_month',
      summary: [
        `${view.month}: ${counts.high} fully booked, ${counts.medium} medium, ${counts.low} low, ${counts.empty} empty day(s).`,
        ...(highDays.length ? [`Fully booked: ${highDays.join(', ')}.`] : []),
      ].join(' '),
      details: { ...view, counts },
    };
  }

  private async handleUpdateProviderProfile(
    businessId: string,
    userId: string,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    const title =
      typeof params.title === 'string' ? params.title.trim() : undefined;
    const avatarUrl =
      typeof params.avatarUrl === 'string'
        ? params.avatarUrl.trim()
        : undefined;
    if (title === undefined && avatarUrl === undefined) {
      return {
        success: false,
        action: 'update_provider_profile',
        summary:
          'What should I update on your profile — title or avatar URL?',
        details: { clarify: true, missing: ['title', 'avatarUrl'] },
      };
    }

    const profile = await this.providerMobile.updateProviderProfile(
      businessId,
      userId,
      { title, avatarUrl },
    );
    const updatedFields = [
      title !== undefined ? 'title' : null,
      avatarUrl !== undefined ? 'avatar' : null,
    ].filter((field): field is string => Boolean(field));

    return {
      success: true,
      action: 'update_provider_profile',
      summary: `Updated your ${updatedFields.join(' and ')}.`,
      details: { profile },
    };
  }

  private async handleShowProviderProfile(
    businessId: string,
    userId: string,
  ): Promise<ProviderCommandResult> {
    const profile = await this.providerMobile.getProviderProfile(
      businessId,
      userId,
    );
    const parts = [
      `Name: ${profile.name}`,
      `Title: ${profile.title ?? 'not set'}`,
      profile.avatarUrl ? 'Avatar: set' : 'Avatar: not set',
    ];
    return {
      success: true,
      action: 'show_provider_profile',
      summary: parts.join(', '),
      details: { profile },
    };
  }

  private async classifyIntent(
    businessId: string,
    userId: string,
    prompt: string,
    contextBlock: string,
    providerName: string,
    viewMode: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    sessionContext?: Record<string, unknown>,
    narrowShortlist?: readonly string[],
  ): Promise<ParsedIntent | null> {
    const historyBlock = formatProviderHistoryBlock(history);
    const schemaHeader = narrowShortlist?.length
      ? buildNarrowClassifierSchema('provider', narrowShortlist)
      : PROVIDER_INTENT_SCHEMA;

    const result = await this.llm.completeJson<ParsedIntent>(
      businessId,
      `${schemaHeader}\n\n${contextBlock}${historyBlock}`,
      prompt,
      {
        surface: 'provider_mobile',
        operation: 'classify_intent',
        actorType: viewMode === 'team' ? 'manager' : 'provider',
        userId,
      },
      0.1,
    );
    return result?.action ? result : null;
  }

  private async handleCancelBookings(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    userId: string,
    confirmed: boolean,
  ): Promise<ProviderCommandResult> {
    if (!params.date) params.date = toIsoDay(todayDisplay());
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const bookings = await this.findMatchingBookings(
      businessId,
      employeeId,
      params,
      {
        excludeTerminal: true,
      },
    );

    if (bookings.length === 0) {
      return {
        success: true,
        action: 'cancel_bookings',
        summary: this.noMatchMessage('cancel', params),
        details: { matchedCount: 0 },
      };
    }

    const reason = String(params.reason ?? 'Cancelled by provider');

    if (bookings.length >= BULK_CONFIRM_THRESHOLD && !confirmed) {
      return {
        success: true,
        action: 'cancel_bookings',
        summary: `Cancel ${bookings.length} appointments${reason ? ` with note: "${reason}"` : ''}?`,
        details: this.buildConfirmationDetails(bookings, {
          action: 'cancel_bookings',
          params: { reason },
        }),
      };
    }

    return this.executeCancel(bookings, reason, userId);
  }

  private async handleUpdateBookings(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    userId: string,
    confirmed: boolean,
  ): Promise<ProviderCommandResult> {
    if (!params.date) params.date = toIsoDay(todayDisplay());
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const status = this.normalizeStatus(params.status);
    const paymentStatus = this.normalizePaymentStatus(params.paymentStatus);

    if (!status && !paymentStatus) {
      return {
        success: false,
        action: 'update_bookings',
        summary:
          'Tell me what to change — e.g. mark as done, set payment to paid.',
        details: {},
      };
    }

    const bookings = await this.findMatchingBookings(
      businessId,
      employeeId,
      params,
      {
        excludeCancelled: true,
      },
    );

    if (bookings.length === 0) {
      return {
        success: true,
        action: 'update_bookings',
        summary: this.noMatchMessage('update', params),
        details: { matchedCount: 0 },
      };
    }

    const changeParts = [
      status ? `status → ${status}` : null,
      paymentStatus ? `payment → ${paymentStatus}` : null,
    ].filter(Boolean);

    if (bookings.length >= BULK_CONFIRM_THRESHOLD && !confirmed) {
      return {
        success: true,
        action: 'update_bookings',
        summary: `Update ${bookings.length} appointments (${changeParts.join(', ')})?`,
        details: this.buildConfirmationDetails(bookings, {
          action: 'update_bookings',
          params: { status, paymentStatus },
        }),
      };
    }

    return this.executeUpdate(bookings, { status, paymentStatus }, userId);
  }

  /** ai-cmd-provider-5.2.7 — dedicated shortcut for update_bookings(status=completed). */
  private async handleMarkVisitComplete(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    userId: string,
    _confirmed: boolean,
    sessionBookingId?: string,
  ): Promise<ProviderCommandResult> {
    return this.handleVisitStatusAlias(
      businessId,
      access,
      params,
      userId,
      'mark_visit_complete',
      BookingStatus.COMPLETED,
      sessionBookingId,
    );
  }

  /** ai-cmd-provider-5.16.2 — thin alias to update_bookings(status=in_progress); dedicated action name so "Begin Jane's color" resolves unambiguously without needing the generic status-branch matching. */
  private async handleMarkVisitInProgress(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    userId: string,
    _confirmed: boolean,
    sessionBookingId?: string,
  ): Promise<ProviderCommandResult> {
    return this.handleVisitStatusAlias(
      businessId,
      access,
      params,
      userId,
      'mark_visit_in_progress',
      BookingStatus.IN_PROGRESS,
      sessionBookingId,
    );
  }

  /**
   * e2e-bug.263 — visit-status aliases never bulk-mutate the day.
   * Require a unique match (bookingId / customerName / timeSlot filter, or
   * exactly one appointment today). Multi-match → clarify, even if confirmed.
   */
  private async handleVisitStatusAlias(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    userId: string,
    action: VisitStatusAlias,
    status: BookingStatus,
    sessionBookingId?: string,
  ): Promise<ProviderCommandResult> {
    const merged: Record<string, unknown> = {
      ...params,
      status,
    };
    if (
      !(typeof merged.bookingId === 'string' && merged.bookingId.trim()) &&
      typeof sessionBookingId === 'string' &&
      sessionBookingId.trim()
    ) {
      merged.bookingId = sessionBookingId.trim();
    }
    if (!merged.date) merged.date = toIsoDay(todayDisplay());

    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const bookings = await this.findMatchingBookings(
      businessId,
      employeeId,
      merged,
      { excludeCancelled: true },
    );

    if (bookings.length === 0) {
      return {
        success: true,
        action,
        summary: this.noMatchMessage('update', merged),
        details: { matchedCount: 0 },
      };
    }

    if (shouldClarifyVisitStatusTarget(bookings.length)) {
      return {
        success: false,
        action,
        summary: buildVisitStatusTargetClarifySummary(bookings.length),
        details: buildVisitStatusTargetClarifyDetails(action, bookings.length),
      };
    }

    const result = await this.executeUpdate(bookings, { status }, userId);
    return { ...result, action };
  }

  /** Prefer exact / longest service-name match when selecting a multi-service leg. */
  private pickMultiServiceLegByServiceName(
    siblings: Booking[],
    serviceName: string,
  ): Booking | undefined {
    const query = serviceName.toLowerCase().trim();
    if (!query) return undefined;

    const scored = siblings
      .map((booking) => {
        const name = (booking.service?.name ?? '').toLowerCase().trim();
        if (!name) return { booking, score: 0 };
        if (name === query) return { booking, score: 100 };
        if (name.startsWith(query) || query.startsWith(name)) {
          return { booking, score: 80 + Math.min(query.length, name.length) };
        }
        if (name.includes(query)) return { booking, score: 50 + query.length };
        if (query.includes(name) && name.length >= 4) {
          return { booking, score: 30 + name.length };
        }
        return { booking, score: 0 };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score);

    if (!scored.length) return undefined;
    if (scored.length > 1 && scored[0].score === scored[1].score) {
      return undefined;
    }
    return scored[0].booking;
  }

  /**
   * e2e-bug.264 — resolve a multi-service group anchor from customerName when
   * no bookingId/session booking is open.
   */
  private async resolveMultiServiceStepAnchorBookingId(
    businessId: string,
    employeeId: string | undefined,
    customerName: string,
  ): Promise<
    | { bookingId: string }
    | { clarify: ProviderCommandResult }
    | null
  > {
    const day = toIsoDay(todayDisplay());
    const range = this.resolveDateRange({ date: day });
    if (!range) return null;

    const where: Record<string, unknown> = {
      businessId,
      startTime: Between(range.start, range.end),
      status: Not(
        In([
          BookingStatus.CANCELLED,
          BookingStatus.COMPLETED,
          BookingStatus.NO_SHOW,
        ]),
      ),
    };
    if (employeeId) where.employeeId = employeeId;

    const candidates = await this.bookingRepo.find({
      where,
      relations: { customer: true },
      order: { startTime: 'ASC' },
    });

    const needle = customerName.toLowerCase();
    const withGroup = candidates.filter(
      (b) =>
        !!b.multiServiceGroupId &&
        !!b.customer?.name &&
        b.customer.name.toLowerCase().includes(needle),
    );
    if (!withGroup.length) return null;

    const groupIds = [
      ...new Set(
        withGroup
          .map((b) => b.multiServiceGroupId)
          .filter((id): id is string => !!id),
      ),
    ];
    if (groupIds.length > 1) {
      return {
        clarify: {
          success: false,
          action: 'mark_multi_service_step_done',
          summary: `I found ${groupIds.length} multi-service visits for ${customerName}. Open one or specify a time.`,
          details: {
            clarify: true,
            matchedGroupCount: groupIds.length,
            missing: ['bookingId'],
          },
        },
      };
    }

    return { bookingId: withGroup[0].id };
  }

  /** ai-cmd-provider-5.18.3 — mark one leg of a multi-service booking group done (per-leg status), not the whole visit. */
  private async handleMarkMultiServiceStepDone(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    userId: string,
    confirmed: boolean,
    sessionBookingId?: string,
    prompt?: string,
  ): Promise<ProviderCommandResult> {
    let anchorBookingId =
      (typeof params.bookingId === 'string' && params.bookingId.trim()) ||
      (typeof sessionBookingId === 'string' && sessionBookingId.trim()) ||
      null;

    // e2e-bug.264 — fall back to customerName → unique multi-service group today.
    if (!anchorBookingId) {
      const customerName = extractCustomerNameForMultiServiceStepDone(
        prompt ?? '',
        params,
      );
      if (customerName) {
        const employeeId = this.providerMobile.getScopedEmployeeId(access);
        const resolved = await this.resolveMultiServiceStepAnchorBookingId(
          businessId,
          employeeId,
          customerName,
        );
        if (resolved && 'clarify' in resolved) {
          return resolved.clarify;
        }
        if (resolved && 'bookingId' in resolved) {
          anchorBookingId = resolved.bookingId;
        } else {
          return {
            success: false,
            action: 'mark_multi_service_step_done',
            summary: `No multi-service visit found for ${customerName} today. Open the booking or check the name.`,
            details: { clarify: true, customerName },
          };
        }
      }
    }

    if (!anchorBookingId) {
      return {
        success: false,
        action: 'mark_multi_service_step_done',
        summary: 'Open the multi-service booking and try again.',
        details: { clarify: true },
      };
    }

    const anchor = await this.bookingRepo.findOne({
      where: { id: anchorBookingId, businessId },
    });
    if (!anchor?.multiServiceGroupId) {
      return {
        success: false,
        action: 'mark_multi_service_step_done',
        summary: 'This booking is not part of a multi-service group.',
        details: {},
      };
    }

    const siblings = await this.bookingRepo.find({
      where: { businessId, multiServiceGroupId: anchor.multiServiceGroupId },
      relations: { service: true, customer: true },
      order: { startTime: 'ASC' },
    });

    const parsedFromPrompt = parseMarkMultiServiceStepDoneFromPrompt(
      prompt ?? '',
    );
    // Prefer deterministic prompt parse over LLM params (e2e-bug.264 live:
    // classifier sometimes invents the wrong leg — e.g. stepIndex:2 while the
    // prompt says "Complete hairdrying leg").
    const promptHasStep = parsedFromPrompt?.stepIndex != null;
    const promptHasService = !!parsedFromPrompt?.serviceName;
    const stepIndex = promptHasStep
      ? parsedFromPrompt!.stepIndex!
      : promptHasService
        ? null
        : typeof params.stepIndex === 'number'
          ? params.stepIndex
          : null;
    const serviceName = promptHasService
      ? parsedFromPrompt!.serviceName
      : promptHasStep
        ? undefined
        : typeof params.serviceName === 'string' && params.serviceName.trim()
          ? params.serviceName
          : undefined;

    let target: Booking | undefined;
    if (stepIndex != null && stepIndex >= 1 && stepIndex <= siblings.length) {
      target = siblings[stepIndex - 1];
    } else if (serviceName) {
      target = this.pickMultiServiceLegByServiceName(siblings, serviceName);
    }

    if (!target) {
      return {
        success: true,
        action: 'mark_multi_service_step_done',
        summary: 'Which step? Say the step number or the service name.',
        details: {
          clarify: true,
          steps: siblings.map(
            (booking, index) => `${index + 1}. ${booking.service?.name}`,
          ),
        },
      };
    }

    const result = await this.handleUpdateBookings(
      businessId,
      access,
      { bookingId: target.id, status: 'completed' },
      userId,
      confirmed,
    );
    return { ...result, action: 'mark_multi_service_step_done' };
  }

  /** ai-cmd-provider-5.19.1 — search/lookup patients by name or phone across the clinic. */
  private async handleSearchPatient(
    businessId: string,
    userId: string,
    params: Record<string, unknown>,
    prompt?: string,
  ): Promise<ProviderCommandResult> {
    const query =
      (typeof params.query === 'string' && params.query.trim()) ||
      extractPatientSearchQueryFromPrompt(prompt ?? '') ||
      null;
    if (!query) {
      return {
        success: false,
        action: 'search_patient',
        summary: 'Who are you looking for? Give a name or phone number.',
        details: { clarify: true },
      };
    }

    const result = await this.providerMobile.searchProviderPatients(
      businessId,
      userId,
      query,
    );
    if (!result.labFeaturesEnabled) {
      return {
        success: false,
        action: 'search_patient',
        summary: 'Patient search is only available for clinic businesses.',
        details: { clinicOnly: true },
      };
    }

    return {
      success: true,
      action: 'search_patient',
      summary: formatPatientSearchResultsText(query, result.patients),
      details: { query, patients: result.patients, count: result.patients.length },
    };
  }

  /** ai-cmd-provider-5.16.4 — confirm pending booking(s): bulk ("Confirm all pending today") or single ("Accept Maria's booking"). Filters to currently-PENDING bookings only, unlike the generic update_bookings(status=confirmed) branch which would touch any non-cancelled match. */
  private async handleConfirmPendingBooking(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    userId: string,
    confirmed: boolean,
  ): Promise<ProviderCommandResult> {
    if (!params.date) params.date = toIsoDay(todayDisplay());
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const matched = await this.findMatchingBookings(businessId, employeeId, params, {
      excludeCancelled: true,
    });
    const bookings = matched.filter((b) => b.status === BookingStatus.PENDING);

    if (bookings.length === 0) {
      return {
        success: true,
        action: 'confirm_pending_booking',
        summary: 'No pending appointments found to confirm.',
        details: { matchedCount: 0 },
      };
    }

    if (bookings.length >= BULK_CONFIRM_THRESHOLD && !confirmed) {
      return {
        success: true,
        action: 'confirm_pending_booking',
        summary: `Confirm ${bookings.length} pending appointment(s)?`,
        details: this.buildConfirmationDetails(bookings, {
          action: 'confirm_pending_booking',
          params: { status: 'confirmed' },
        }),
      };
    }

    const result = await this.executeUpdate(
      bookings,
      { status: 'confirmed' },
      userId,
    );
    return { ...result, action: 'confirm_pending_booking' };
  }

  /** ai-cmd-provider-5.16.5 — static explainer, no live data needed. */
  private handleExplainBookingStatusBadge(): ProviderCommandResult {
    return {
      success: true,
      action: 'explain_booking_status_badge',
      summary: buildExplainBookingStatusBadgeSummary(),
      details: {},
    };
  }

  /** ai-cmd-provider-5.19.6 — static explainer, no live data needed. */
  private handleHandoffToDashboardPhi(): ProviderCommandResult {
    return {
      success: true,
      action: 'handoff_to_dashboard_phi',
      summary: buildHandoffToDashboardPhiSummary(),
      details: {},
    };
  }

  /** ai-cmd-provider-5.16.6 — static explainer, no live data needed. */
  private handleExplainFloorStatus(): ProviderCommandResult {
    return {
      success: true,
      action: 'explain_floor_status',
      summary: buildExplainFloorStatusSummary(),
      details: {},
    };
  }

  /** ai-cmd-provider-5.23.2 — static explainer, no live data needed. */
  private handleExplainCalendarUtilizationBands(): ProviderCommandResult {
    return {
      success: true,
      action: 'explain_calendar_utilization_bands',
      summary: buildExplainCalendarUtilizationBandsSummary(),
      details: {},
    };
  }

  /** ai-cmd-provider-5.23.4 — static explainer, no live data needed. */
  private handleExplainBlockVsTimeOff(): ProviderCommandResult {
    return {
      success: true,
      action: 'explain_block_vs_time_off',
      summary: buildExplainBlockVsTimeOffSummary(),
      details: {},
    };
  }

  /** ai-cmd-provider-5.24.1 — static explainer, no live data needed. */
  private handleExplainOfflineSuggestions(): ProviderCommandResult {
    return {
      success: true,
      action: 'explain_offline_suggestions',
      summary: buildExplainOfflineSuggestionsSummary(),
      details: {},
    };
  }

  /** ai-cmd-provider-5.24.6 — static explainer, no live data needed (local OS setting). */
  private handleExplainAccessibilitySettings(): ProviderCommandResult {
    return {
      success: true,
      action: 'explain_accessibility_settings',
      summary: buildExplainAccessibilitySettingsSummary(),
      details: {},
    };
  }

  /** ai-cmd-provider-5.25.1 — static lookup over PROVIDER_EXP_UI_AI_PARITY's dashboard-only rows. */
  private handleExplainDashboardOnlyAction(
    prompt: string,
    locale?: string,
  ): ProviderCommandResult {
    const summary =
      resolveDashboardOnlyActionSummaryFromPrompt(prompt, locale) ??
      buildExplainDashboardOnlyActionFallbackSummary(locale, prompt);
    return {
      success: true,
      action: 'explain_dashboard_only_action',
      summary,
      details: {},
    };
  }

  /** ai-cmd-provider-5.25.2 — static explainer, no live data needed. */
  private handleExplainReassignLimit(): ProviderCommandResult {
    return {
      success: true,
      action: 'explain_reassign_limit',
      summary: buildExplainReassignLimitSummary(),
      details: {},
    };
  }

  /** ai-cmd-provider-5.25.3 — static explainer, no live data needed. */
  private handleExplainTimeOffApproval(): ProviderCommandResult {
    return {
      success: true,
      action: 'explain_time_off_approval',
      summary: buildExplainTimeOffApprovalSummary(),
      details: {},
    };
  }

  /** ai-cmd-provider-5.3.6 — thin alias to mark_paid; no Stripe Terminal integration exists, so
   * collection is always manual (cash/card-on-file recorded elsewhere) and this just flips
   * paymentStatus like the mark_paid push-parity action does. */
  private async handleCollectRemainingBalance(
    businessId: string,
    params: Record<string, unknown>,
    userId: string,
    prompt: string,
    scopedEmployeeId?: string | null,
  ): Promise<ProviderCommandResult> {
    const result = await this.providerBooking.handleMarkPaid(
      businessId,
      {
        ...params,
        sessionEmployeeId: scopedEmployeeId ?? undefined,
        _prompt: prompt,
      },
      userId,
    );
    return { ...result, action: 'collect_remaining_balance' };
  }

  private resolveProviderAccessTier(access: MobileAccess): AccessTier {
    if (access.viewMode === 'team') {
      return resolveAccessTier(access.membershipRole);
    }
    return 'staff';
  }

  /** ai-guide-1.4.1 — build session context for provider guide playbooks. */
  private buildProviderGuideSessionContext(
    context: Record<string, unknown> | undefined,
    access: MobileAccess,
    actorTier: AccessTier,
  ): ProductGuideSessionContext {
    return resolveProductGuideSessionContext(
      {
        context: {
          ...mergeProviderMobileGuideContext(context),
          _accessTier: actorTier,
          roleProfile: access.viewMode === 'team' ? 'manager' : 'provider',
          vertical: context?.businessType,
          retailPosEnabled: context?.retailPosEnabled,
          enabledModules: context?.enabledModules,
        },
      },
      'provider',
    );
  }

  /** ai-guide-1.8.7 — provider meta-AI guide intents → AiProductGuideService playbooks. */
  private async dispatchProviderMetaGuideIntent(
    action: MetaProductGuideIntent,
    businessId: string,
    userId: string,
    prompt: string,
    context: Record<string, unknown> | undefined,
    access: MobileAccess,
    actorTier: AccessTier,
    params: Record<string, unknown> = {},
  ): Promise<ProviderCommandResult> {
    if (!isProviderMetaGuideIntent(action)) {
      return {
        success: false,
        action,
        summary: 'Unsupported meta guide intent on provider mobile.',
        details: {},
      };
    }
    const guideContext = this.buildProviderGuideSessionContext(
      context,
      access,
      actorTier,
    );
    const guideResult = mapCommandResultGuideNavigate(
      await runMetaProductGuideIntent({
        productGuide: this.productGuide,
        businessId,
        prompt,
        metaIntent: action,
        surface: 'provider',
        userId,
        params,
        session: { context: mergeProviderMobileGuideContext(context) },
        sessionContext: guideContext,
      }),
    );
    return this.attachGuideVoiceDetails({
      success: guideResult.success,
      action: guideResult.action,
      summary: guideResult.summary,
      details: guideResult.details ?? {},
      guide: guideResult.guide,
    });
  }

  /** ai-guide-1.8.6 — generic app guide intents (multiturn nav, heuristics) on provider mobile. */
  private async dispatchProviderAppGuideIntent(
    businessId: string,
    userId: string,
    prompt: string,
    intent: AppGuideIntent,
    context: Record<string, unknown> | undefined,
    access: MobileAccess,
    actorTier: AccessTier,
    params: Record<string, unknown> = {},
  ): Promise<ProviderCommandResult> {
    const guideContext = this.buildProviderGuideSessionContext(
      context,
      access,
      actorTier,
    );
    const topicId = enrichGuideTopicFromPrompt(prompt, {
      surface: 'provider',
      route: guideContext.route,
      topicId: params.topicId,
    });
    const guideParams = topicId ? { ...params, topicId } : params;
    const guideResult = mapCommandResultGuideNavigate(
      await runSurfaceProductGuideIntent({
        productGuide: this.productGuide,
        businessId,
        prompt,
        intent,
        surface: 'provider',
        userId,
        params: guideParams,
        session: { context: mergeProviderMobileGuideContext(context) },
        sessionContext: guideContext,
      }),
    );
    return this.attachGuideVoiceDetails({
      success: guideResult.success,
      action: guideResult.action,
      summary: guideResult.summary,
      details: guideResult.details ?? {},
      guide: guideResult.guide,
    });
  }

  /** ai-guide-1.8.9 — provider live permission / empty-state guides. */
  private async dispatchProviderEmptyStateGuideIntent(
    action: EmptyStateGuideIntent,
    businessId: string,
    userId: string,
    prompt: string,
    context: Record<string, unknown> | undefined,
    access: MobileAccess,
    actorTier: AccessTier,
    params: Record<string, unknown> = {},
  ): Promise<ProviderCommandResult> {
    if (
      !isEmptyStateGuideIntent(action) ||
      action === 'explain_stripe_not_connected'
    ) {
      return {
        success: false,
        action,
        summary: 'Unsupported empty-state guide intent on provider mobile.',
        details: {},
      };
    }
    const guideContext = this.buildProviderGuideSessionContext(
      context,
      access,
      actorTier,
    );
    const guideResult = mapCommandResultGuideNavigate(
      await this.emptyStateGuide.runIntent({
        businessId,
        intent: action,
        surface: 'provider',
        prompt,
        params,
        session: { context: mergeProviderMobileGuideContext(context) },
        sessionContext: guideContext,
        locale: guideContext.locale,
        linkedEmployeeId: access.employee?.id ?? undefined,
      }),
    );
    return this.attachGuideVoiceDetails({
      success: guideResult.success,
      action: guideResult.action,
      summary: guideResult.summary,
      details: guideResult.details ?? {},
      guide: guideResult.guide,
    });
  }

  /** ai-guide-1.4.1 — provider FAQ intents → AiProductGuideService playbooks. */
  private async dispatchProviderProductGuideIntent(
    action: ProviderProductGuideIntent,
    businessId: string,
    userId: string,
    prompt: string,
    context: Record<string, unknown> | undefined,
    access: MobileAccess,
    actorTier: AccessTier,
    params: Record<string, unknown> = {},
  ): Promise<ProviderCommandResult> {
    const guideContext = this.buildProviderGuideSessionContext(
      context,
      access,
      actorTier,
    );
    const topicId = enrichGuideTopicFromPrompt(prompt, {
      surface: 'provider',
      route: guideContext.route,
      topicId: params.topicId,
      providerIntent: action,
    });
    const guideParams = topicId ? { ...params, topicId } : params;
    const guideResult = mapCommandResultGuideNavigate(
      await runProviderProductGuideIntent({
        productGuide: this.productGuide,
        businessId,
        prompt,
        providerIntent: action,
        userId,
        params: guideParams,
        session: { context },
        sessionContext: guideContext,
      }),
    );
    return this.attachGuideVoiceDetails({
      success: guideResult.success,
      action: guideResult.action,
      summary: guideResult.summary,
      details: guideResult.details ?? {},
      guide: guideResult.guide,
    });
  }

  private attachGuideVoiceDetails(
    result: ProviderCommandResult,
  ): ProviderCommandResult {
    if (!result.guide) return result;
    return {
      ...result,
      details: {
        ...result.details,
        voiceSummary: formatGuideVoiceText(result.guide, result.summary),
      },
    };
  }

  private async handleVoiceSummarizeNextClient(
    businessId: string,
    access: MobileAccess,
    prompt: string,
    params: Record<string, unknown> = {},
    context?: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    const mergedParams = mergeShowAppointmentsParams(prompt, {
      ...params,
      statusFilter: 'upcoming',
      date: params.date ?? toIsoDay(todayDisplay()),
    });
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const bookings = filterBookingsForProviderList(
      await this.findMatchingBookings(businessId, employeeId, mergedParams, {}),
      'upcoming',
      Date.now(),
      (value) => this.normalizeStatus(value),
    );

    return buildVoiceSummarizeNextClientResult({
      bookings,
      formatLabel: (booking) => this.bookingLabel(booking as Booking),
      formatTime: (booking) => formatTimeDisplay(booking.startTime),
      locale: typeof context?.locale === 'string' ? context.locale : undefined,
      emptySummary: this.noMatchMessage('show', mergedParams),
    });
  }

  private async handleMarkNoShows(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    userId: string,
    confirmed: boolean,
  ): Promise<ProviderCommandResult> {
    if (!params.date && !params.dateFrom)
      params.date = toIsoDay(todayDisplay());
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const bookings = await this.findNoShowCandidates(
      businessId,
      employeeId,
      params,
    );

    if (bookings.length === 0) {
      return {
        success: true,
        action: 'mark_no_shows',
        summary: 'No eligible past appointments found to mark as no-show.',
        details: { matchedCount: 0 },
      };
    }

    if (bookings.length >= BULK_CONFIRM_THRESHOLD && !confirmed) {
      return {
        success: true,
        action: 'mark_no_shows',
        summary: `Mark ${bookings.length} appointment(s) as no-show?`,
        details: this.buildConfirmationDetails(bookings, {
          action: 'mark_no_shows',
          params: { status: BookingStatus.NO_SHOW },
        }),
      };
    }

    const result = await this.executeUpdate(
      bookings,
      { status: BookingStatus.NO_SHOW },
      userId,
    );
    return { ...result, action: 'mark_no_shows' };
  }

  private async handlePaymentSweep(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    userId: string,
    confirmed: boolean,
  ): Promise<ProviderCommandResult> {
    if (!params.date && !params.dateFrom)
      params.date = toIsoDay(todayDisplay());
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const bookings = await this.findUnpaidBookings(
      businessId,
      employeeId,
      params,
    );

    if (bookings.length === 0) {
      return {
        success: true,
        action: 'payment_sweep',
        summary: 'No unpaid appointments found for the given filters.',
        details: { matchedCount: 0 },
      };
    }

    if (bookings.length >= BULK_CONFIRM_THRESHOLD && !confirmed) {
      return {
        success: true,
        action: 'payment_sweep',
        summary: `Mark ${bookings.length} unpaid appointment(s) as paid?`,
        details: this.buildConfirmationDetails(bookings, {
          action: 'payment_sweep',
          params: { paymentStatus: PaymentStatus.PAID },
        }),
      };
    }

    const result = await this.executeUpdate(
      bookings,
      { paymentStatus: PaymentStatus.PAID },
      userId,
    );
    return { ...result, action: 'payment_sweep' };
  }

  private async findNoShowCandidates(
    businessId: string,
    employeeId: string | undefined,
    params: Record<string, unknown>,
  ): Promise<Booking[]> {
    const bookings = await this.findMatchingBookings(
      businessId,
      employeeId,
      params,
      {
        excludeCancelled: true,
      },
    );
    const now = Date.now();
    return bookings.filter(
      (b) =>
        b.startTime.getTime() <= now &&
        b.status !== BookingStatus.NO_SHOW &&
        b.status !== BookingStatus.COMPLETED,
    );
  }

  private async findUnpaidBookings(
    businessId: string,
    employeeId: string | undefined,
    params: Record<string, unknown>,
  ): Promise<Booking[]> {
    const bookings = await this.findMatchingBookings(
      businessId,
      employeeId,
      params,
      {
        excludeCancelled: true,
      },
    );
    return bookings.filter(
      (b) =>
        b.paymentStatus === PaymentStatus.PENDING &&
        [
          BookingStatus.CONFIRMED,
          BookingStatus.IN_PROGRESS,
          BookingStatus.COMPLETED,
        ].includes(b.status),
    );
  }

  private async executeCancel(
    bookings: Booking[],
    reason: string,
    userId: string,
  ): Promise<ProviderCommandResult> {
    let cancelled = 0;
    for (const booking of bookings) {
      if (booking.status === BookingStatus.CANCELLED) continue;
      await this.bookingService.cancel(booking.id, reason, userId);
      cancelled += 1;
    }
    return {
      success: true,
      action: 'cancel_bookings',
      summary:
        cancelled === 0
          ? 'No appointments needed cancelling.'
          : `Cancelled ${cancelled} appointment${cancelled === 1 ? '' : 's'}.`,
      details: {
        cancelledCount: cancelled,
        bookingIds: bookings.map((b) => b.id),
      },
    };
  }

  private async executeUpdate(
    bookings: Booking[],
    params: Record<string, unknown>,
    userId: string,
  ): Promise<ProviderCommandResult> {
    const status = this.normalizeStatus(params.status);
    const paymentStatus = this.normalizePaymentStatus(params.paymentStatus);
    let updated = 0;

    for (const booking of bookings) {
      if (booking.status === BookingStatus.CANCELLED) continue;
      const payload: { status?: BookingStatus; paymentStatus?: PaymentStatus } =
        {};
      if (status) payload.status = status;
      if (paymentStatus) payload.paymentStatus = paymentStatus;
      if (!Object.keys(payload).length) continue;
      await this.bookingService.update(booking.id, payload, userId);
      updated += 1;
    }

    const changeParts = [
      status ? `status set to ${status}` : null,
      paymentStatus ? `payment set to ${paymentStatus}` : null,
    ].filter(Boolean);

    return {
      success: true,
      action: 'update_bookings',
      summary:
        updated === 0
          ? 'No appointments were updated.'
          : `Updated ${updated} appointment${updated === 1 ? '' : 's'} (${changeParts.join(', ')}).`,
      details: { updatedCount: updated, bookingIds: bookings.map((b) => b.id) },
    };
  }

  private async handleListBookings(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    return this.formatBookingsList(
      businessId,
      access,
      params,
      'list_bookings',
      this.noMatchMessage('list', params),
    );
  }

  private async handleShowAppointments(
    businessId: string,
    access: MobileAccess,
    prompt: string,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    return this.formatBookingsList(
      businessId,
      access,
      mergeShowAppointmentsParams(prompt, params),
      'show_appointments',
      this.noMatchMessage('show', params),
    );
  }

  private async handleTeamWhosNext(
    businessId: string,
    userId: string,
    access: MobileAccess,
  ): Promise<ProviderCommandResult> {
    if (access.viewMode !== 'team') {
      return {
        success: false,
        action: 'team_whos_next',
        summary:
          'Team queue is available to managers only. Ask about your own schedule instead.',
        details: { viewMode: access.viewMode },
      };
    }

    const queue = await this.providerMobile.getTeamWhosNext(businessId, userId);
    const summary = buildTeamWhosNextSummary(queue.columns, (iso) =>
      formatTimeDisplay(iso),
    );

    return {
      success: true,
      action: 'team_whos_next',
      summary,
      details: {
        windowHours: queue.windowHours,
        windowStart: queue.windowStart,
        windowEnd: queue.windowEnd,
        totalQueued: queue.totalQueued,
        columns: queue.columns.map((column) => ({
          employeeId: column.employeeId,
          employeeName: column.employeeName,
          nextBookingId: column.nextBookingId,
          queueLength: column.queue.length,
        })),
      },
    };
  }

  private async formatBookingsList(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    action: 'list_bookings' | 'show_appointments',
    emptySummary: string,
  ): Promise<ProviderCommandResult> {
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const allBookings = filterBookingsForProviderList(
      await this.findMatchingBookings(businessId, employeeId, params, {}),
      resolveStatusFilter(params),
      Date.now(),
      (value) => this.normalizeStatus(value),
    );
    const bookings =
      params.nextOnly === true ? allBookings.slice(0, 1) : allBookings;

    return buildProviderBookingsListResult({
      bookings,
      params,
      statusFilter: resolveStatusFilter(params),
      action,
      emptySummary,
      formatLabel: (b) => this.bookingLabel(b),
    });
  }

  private async handleCheckAvailability(
    businessId: string,
    access: MobileAccess,
    prompt: string,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    if (!employeeId) {
      return buildNoLinkedEmployeeAvailabilityResult();
    }

    const isoDay = params.date
      ? toIsoDay(String(params.date))
      : toIsoDay(todayDisplay());
    const { day, dayEnd } = resolveAvailabilityDayBounds(isoDay);

    const periods = await this.periodRepo.find({
      where: {
        businessId,
        employeeId,
        startTime: Between(day, dayEnd),
      },
      order: { startTime: 'ASC' },
    });

    const { timeFrom, timeTo } = resolveAvailabilityTimeWindow(params);
    const gaps = mapScheduleGapLabels(
      findScheduleGapsInWindow(day, timeFrom, timeTo, periods),
    );
    const displayDay = formatDateDisplay(isoDay);

    if (params.timeSlot) {
      return buildSlotAvailabilityResult({
        displayDay,
        slot: normalizeTime24(String(params.timeSlot)),
        gaps,
      });
    }

    if (shouldUseAfternoonAvailability(prompt, params)) {
      return buildAfternoonAvailabilityResult({
        displayDay,
        gaps,
        timeFrom,
        timeTo,
      });
    }

    return buildGapsAvailabilityResult({ displayDay, gaps, timeFrom, timeTo });
  }

  private async handleBlockSchedule(
    businessId: string,
    access: MobileAccess,
    prompt: string,
    params: Record<string, unknown>,
    userId: string,
  ): Promise<ProviderCommandResult> {
    const scopedEmployeeId = this.providerMobile.getScopedEmployeeId(access);
    const employees = await this.employeeRepo.find({
      where: { businessId, isActive: true },
    });
    const targets = scopedEmployeeId
      ? employees.filter((e) => e.id === scopedEmployeeId)
      : employees;

    const blockParams = prepareBlockScheduleParams(prompt, params, {
      scopedEmployeeId,
      employeeName: targets[0]?.name ?? null,
    });

    const result = await this.scheduleHandlers.handleBlockSchedule(
      businessId,
      prompt,
      blockParams as Record<string, any>,
      targets,
      userId,
    );

    return {
      success: result.success,
      action: 'block_schedule',
      summary: result.summary,
      details: (result.details ?? {}) as Record<string, unknown>,
    };
  }

  private async handleSummarizeUtilization(
    businessId: string,
    access: MobileAccess,
    prompt: string,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    const scopedEmployeeId = this.providerMobile.getScopedEmployeeId(access);
    const employees = await this.employeeRepo.find({
      where: { businessId, isActive: true },
    });
    const targets = scopedEmployeeId
      ? employees.filter((e) => e.id === scopedEmployeeId)
      : employees;

    const range =
      resolveDateRange(params, prompt) ?? defaultUtilizationWeekRange();

    const start = new Date(range.start);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(range.end);
    end.setUTCHours(23, 59, 59, 999);

    const rows = await Promise.all(
      targets.map(async (e) => ({
        employeeName: e.name,
        ...(await this.schedulingEngine.getEmployeeUtilization(
          e.id,
          start,
          end,
        )),
      })),
    );

    return buildUtilizationSummaryResult({
      scopedEmployeeId,
      range,
      rows,
    });
  }

  private async handleExplainTodayTimeline(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const isoDay = params.date
      ? toIsoDay(String(params.date))
      : toIsoDay(todayDisplay());
    const { day, dayEnd } = resolveAvailabilityDayBounds(isoDay);

    const where: Record<string, unknown> = {
      businessId,
      startTime: Between(day, dayEnd),
      status: Not(In([BookingStatus.CANCELLED])),
    };
    if (employeeId) where.employeeId = employeeId;

    const bookings = await this.bookingRepo.find({
      where,
      relations: { customer: true },
      order: { startTime: 'ASC' },
    });

    const timeline = buildProviderTodayTimelineView({
      enabled: true,
      date: isoDay,
      bookings: bookings.map((b) => ({
        id: b.id,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
        customer: b.customer ? { name: b.customer.name } : null,
      })),
    });

    const formatTime = (iso: string) => formatTimeDisplay(new Date(iso));

    return {
      success: true,
      action: 'explain_today_timeline',
      summary: buildExplainTodayTimelineSummary(timeline, formatTime),
      details: {
        segments: timeline.segments,
        gaps: buildExplainTodayTimelineGapChips(timeline, formatTime),
        nextClient: timeline.nextClient,
      },
    };
  }

  private async handleCoordinateWaitlistOffer(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    userId: string,
    confirmed: boolean,
  ): Promise<ProviderCommandResult> {
    if (!canRunCoordinationOnProvider(access.viewMode)) {
      return {
        success: false,
        action: 'coordinate_waitlist_offer',
        summary: buildCoordinationDeniedSummary(access.viewMode),
        details: { viewMode: access.viewMode },
      };
    }

    const employees = await this.employeeRepo.find({
      where: { businessId, isActive: true },
    });
    const employee = matchEmployeeByName(
      employees,
      String(params.employeeName ?? ''),
    );
    if (!employee) {
      return {
        success: false,
        action: 'coordinate_waitlist_offer',
        summary: `No provider found matching "${params.employeeName ?? 'unknown'}".`,
        details: { params },
      };
    }

    const waitlistQb = this.customerRepo
      .createQueryBuilder('c')
      .where('c.business_id = :businessId', { businessId })
      .orderBy('c.name', 'ASC');
    andWhereSimpleArrayTag(
      waitlistQb,
      'c',
      WAITLIST_CUSTOMER_TAG,
      'waitlistTag',
    );
    const waitlist = await waitlistQb.getMany();

    const waitlistCustomer = matchWaitlistCustomerByName(
      waitlist,
      String(params.waitlistCustomerName ?? params.customerName ?? ''),
    );
    if (!waitlistCustomer) {
      return {
        success: false,
        action: 'coordinate_waitlist_offer',
        summary: waitlist.length
          ? `No waitlist customer found matching "${params.waitlistCustomerName ?? params.customerName}". Tag customers with "waitlist" in CRM.`
          : 'No waitlist customers found. Tag customers with "waitlist" in CRM.',
        details: { waitlistCount: waitlist.length },
      };
    }

    const bookings = await this.findMatchingBookings(
      businessId,
      employee.id,
      params,
      {
        excludeTerminal: true,
      },
    );

    if (bookings.length === 0) {
      return {
        success: true,
        action: 'coordinate_waitlist_offer',
        summary: `No upcoming appointments found for ${employee.name} to coordinate.`,
        details: { matchedCount: 0, employeeName: employee.name },
      };
    }

    if (!confirmed || bookings.length >= BULK_CONFIRM_THRESHOLD) {
      return buildCoordinateWaitlistConfirmation({
        employeeName: employee.name,
        waitlistCustomerName: waitlistCustomer.name,
        bookings: bookings.map((booking) => ({
          id: booking.id,
          label: this.bookingLabel(booking),
        })),
        params,
      });
    }

    const target = bookings[0];
    const slot = {
      bookingId: target.id,
      employeeId: target.employeeId,
      serviceId: target.serviceId,
      startTime: target.startTime.toISOString(),
      customerName: target.customer?.name,
    };

    const cancelResult = await this.executeCancel(
      [target],
      String(params.reason ?? 'Cancelled for waitlist coordination'),
      userId,
    );
    if (!cancelResult.success) return cancelResult;

    const plan = this.planBuilder.buildFillSlotFromWaitlistPlan({
      businessId,
      slot,
      candidate: {
        customerId: waitlistCustomer.id,
        customerName: waitlistCustomer.name,
      },
      userId,
    });

    const orch = await this.orchestration.executePlan({
      plan,
      businessId,
      userId,
      autoExecute: true,
    });

    return {
      success: orch.success,
      action: 'coordinate_waitlist_offer',
      summary: orch.success
        ? `Cancelled ${employee.name}'s appointment and offered the slot to waitlist customer ${waitlistCustomer.name}.`
        : (orch.summary ?? 'Waitlist offer could not be completed.'),
      details: {
        cancelledBookingId: target.id,
        waitlistCustomerId: waitlistCustomer.id,
        employeeName: employee.name,
        orchestration: orch.details,
      },
    };
  }

  private async handleSummarizeDay(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    const merged = { ...params, allAppointments: true };
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const bookings = await this.findMatchingBookings(
      businessId,
      employeeId,
      merged,
      {},
    );
    const dateLabel = params.date
      ? formatDateDisplay(String(params.date))
      : todayDisplay();

    if (bookings.length === 0) {
      return {
        success: true,
        action: 'summarize_day',
        summary: `No appointments on ${dateLabel}.`,
        details: { matchedCount: 0 },
      };
    }

    const byStatus = new Map<string, number>();
    for (const b of bookings) {
      byStatus.set(b.status, (byStatus.get(b.status) ?? 0) + 1);
    }
    const statusSummary = [...byStatus.entries()]
      .map(([s, n]) => `${n} ${s}`)
      .join(', ');
    return {
      success: true,
      action: 'summarize_day',
      summary: `${bookings.length} appointment${bookings.length === 1 ? '' : 's'} on ${dateLabel}: ${statusSummary}.`,
      details: {
        matchedCount: bookings.length,
        appointments: bookings.map((b) => this.bookingLabel(b)),
      },
    };
  }

  private async findMatchingBookings(
    businessId: string,
    employeeId: string | undefined,
    params: Record<string, unknown>,
    options: { excludeTerminal?: boolean; excludeCancelled?: boolean },
  ): Promise<Booking[]> {
    const where: Record<string, unknown> = { businessId };
    if (employeeId) where.employeeId = employeeId;

    if (options.excludeTerminal) {
      where.status = Not(
        In([
          BookingStatus.CANCELLED,
          BookingStatus.COMPLETED,
          BookingStatus.NO_SHOW,
        ]),
      );
    } else if (options.excludeCancelled) {
      where.status = Not(In([BookingStatus.CANCELLED]));
    }

    const hasExplicitBookingId =
      typeof params.bookingId === 'string' && params.bookingId.trim().length > 0;
    if (hasExplicitBookingId) {
      where.id = params.bookingId;
    } else {
      const dateRange = this.resolveDateRange(params);
      if (dateRange) {
        where.startTime = Between(dateRange.start, dateRange.end);
      }
    }

    let bookings = await this.bookingRepo.find({
      where: where,
      relations: { customer: true, service: true },
      order: { startTime: 'ASC' },
    });

    if (hasExplicitBookingId) {
      return bookings;
    }

    if (params.customerName) {
      const name = String(params.customerName).toLowerCase();
      bookings = bookings.filter((b) =>
        b.customer?.name.toLowerCase().includes(name),
      );
    }

    if (params.serviceName) {
      const svc = String(params.serviceName).toLowerCase();
      bookings = bookings.filter((b) =>
        b.service?.name.toLowerCase().includes(svc),
      );
    }

    if (params.timeSlot) {
      const slot = this.normalizeTime(String(params.timeSlot));
      bookings = bookings.filter(
        (b) => formatTimeDisplay(b.startTime) === slot,
      );
    }

    if (
      params.allAppointments !== true &&
      !params.customerName &&
      !params.timeSlot &&
      !params.serviceName
    ) {
      // Single ambiguous match without "all" — if multiple on day, prefer requiring explicit all
      if (
        bookings.length > 1 &&
        (params.status || params.paymentStatus || params.reason)
      ) {
        // bulk intent implied by mutation params
        return bookings;
      }
    }

    return bookings;
  }

  private async handleRescheduleBooking(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    userId: string,
  ): Promise<ProviderCommandResult> {
    const scopedEmployeeId = this.providerMobile.getScopedEmployeeId(access);
    const bookings = await this.findMatchingBookings(
      businessId,
      scopedEmployeeId,
      params,
      {
        excludeTerminal: true,
      },
    );

    const booking = bookings[0];
    if (!booking) {
      return {
        success: false,
        action: 'reschedule_booking',
        summary: this.noMatchMessage('reschedule', params),
        details: { matchedCount: 0 },
      };
    }

    if (!params.date && !params.timeSlot) {
      return {
        success: false,
        action: 'reschedule_booking',
        summary:
          'Specify the new date and/or time (e.g. "Reschedule to 16:00").',
        details: { bookingId: booking.id },
      };
    }

    const isoDay = toIsoDay(
      String(params.date ?? booking.startTime.toISOString().split('T')[0]),
    );
    const timeSlot = params.timeSlot
      ? this.normalizeTime(String(params.timeSlot))
      : formatTimeDisplay(booking.startTime);
    const startTime = `${isoDay}T${timeSlot}:00.000Z`;

    const plan = this.planBuilder.buildRescheduleBookingPlan({
      businessId,
      bookingId: booking.id,
      startTime,
      employeeId: scopedEmployeeId ?? booking.employeeId,
      serviceId: booking.serviceId,
      userId,
      label: `Reschedule ${booking.customer?.name ?? 'walk-in'} to ${formatDateDisplay(isoDay)} ${timeSlot}`,
    });

    const orch = await this.orchestration.executePlan({
      plan,
      businessId,
      userId,
      autoExecute: true,
    });

    return {
      success: orch.success,
      action: 'reschedule_booking',
      summary: orch.summary,
      details: {
        taskId: orch.taskId,
        bookingId: booking.id,
        requiresApproval: orch.requiresApproval,
      },
    };
  }

  private async handleFillUnusedSlots(
    businessId: string,
    access: MobileAccess,
    prompt: string,
    params: Record<string, unknown>,
    userId: string,
  ): Promise<ProviderCommandResult> {
    const [employees, services] = await Promise.all([
      this.employeeRepo.find({ where: { businessId, isActive: true } }),
      this.serviceRepo.find({ where: { businessId } }),
    ]);

    const scopedEmployeeId = this.providerMobile.getScopedEmployeeId(access);
    const scopedEmployees = scopedEmployeeId
      ? employees.filter((e) => e.id === scopedEmployeeId)
      : employees;

    const fillParams = {
      ...params,
      employeeName: scopedEmployeeId
        ? employees.find((e) => e.id === scopedEmployeeId)?.name
        : params.employeeName,
      allProviders: !scopedEmployeeId && access.viewMode === 'team',
    };

    const result = await this.scheduleHandlers.handleFillScheduleGaps(
      businessId,
      prompt,
      fillParams as Record<string, any>,
      scopedEmployees,
      services,
      userId,
    );

    return {
      success: result.success,
      action: 'fill_unused_slots',
      summary: result.summary,
      details: result.details as Record<string, unknown>,
    };
  }

  private async handleListScheduleGaps(
    businessId: string,
    access: MobileAccess,
    prompt: string,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    const employees = await this.employeeRepo.find({
      where: { businessId, isActive: true },
    });

    const scopedEmployeeId = this.providerMobile.getScopedEmployeeId(access);
    const scopedEmployees = scopedEmployeeId
      ? employees.filter((e) => e.id === scopedEmployeeId)
      : employees;

    const gapParams = {
      ...params,
      employeeName: scopedEmployeeId
        ? employees.find((e) => e.id === scopedEmployeeId)?.name
        : params.employeeName,
      allProviders: !scopedEmployeeId && access.viewMode === 'team',
    };

    const result = await this.scheduleHandlers.handleListScheduleGaps(
      businessId,
      prompt,
      gapParams as Record<string, any>,
      scopedEmployees,
    );

    return {
      success: result.success,
      action: 'list_schedule_gaps',
      summary: result.summary,
      details: result.details as Record<string, unknown>,
    };
  }

  private async handleOpenBookingDetail(
    businessId: string,
    access: MobileAccess,
    userId: string,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    let bookingId =
      typeof params.bookingId === 'string' ? params.bookingId.trim() : '';

    if (!bookingId) {
      const employeeId = this.providerMobile.getScopedEmployeeId(access);
      const matches = await this.findMatchingBookings(
        businessId,
        employeeId,
        params,
        { excludeCancelled: true },
      );
      if (matches.length === 0) {
        return {
          success: false,
          action: 'open_booking_detail',
          summary: this.noMatchMessage('open', params),
          details: { clarify: true },
        };
      }
      if (matches.length > 1) {
        return {
          success: false,
          action: 'open_booking_detail',
          summary:
            'Multiple appointments match — specify a time or the customer name.',
          details: { clarify: true, matchedCount: matches.length },
        };
      }
      bookingId = matches[0].id;
    }

    const detail = await this.providerMobile.getBookingDetail(
      businessId,
      userId,
      bookingId,
    );
    const url = `/provider/bookings/${bookingId}`;

    return {
      success: true,
      action: 'open_booking_detail',
      summary: `Open ${detail.customer?.name ?? 'appointment'} — ${detail.service?.name ?? 'service'} at ${formatTimeDisplay(new Date(detail.startTime))}.`,
      details: {
        bookingId,
        url,
        deepLink: url,
        booking: detail,
      },
    };
  }

  private async loadOwnedBookings(
    businessId: string,
    employeeId: string | undefined,
    bookingIds: string[],
  ): Promise<Booking[]> {
    const where: Record<string, unknown> = { businessId, id: In(bookingIds) };
    if (employeeId) where.employeeId = employeeId;
    return this.bookingRepo.find({
      where: where,
      relations: { customer: true, service: true },
    });
  }

  private bookingLabel(booking: Booking): string {
    const customer = booking.customer?.name ?? 'Walk-in';
    const service = booking.service?.name ?? 'Appointment';
    return `${formatTimeRangeDisplay(booking.startTime, booking.endTime)} ${customer} (${service})`;
  }

  private noMatchMessage(
    _verb: string,
    params: Record<string, unknown>,
  ): string {
    const parts = [
      params.date ? `on ${formatDateDisplay(String(params.date))}` : null,
      params.customerName ? `for ${params.customerName}` : null,
      params.timeSlot ? `at ${params.timeSlot}` : null,
    ].filter(Boolean);
    return `No matching appointments found${parts.length ? ` ${parts.join(' ')}` : ''}.`;
  }

  private normalizeParams(params: Record<string, unknown>) {
    if (params.date) params.date = toIsoDay(String(params.date));
    if (params.timeSlot)
      params.timeSlot = this.normalizeTime(String(params.timeSlot));
    if (!params.date && params.allAppointments) {
      params.date = toIsoDay(todayDisplay());
    }
  }

  private normalizeTime(value: string): string {
    const m = value.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return value;
    return `${String(Number(m[1])).padStart(2, '0')}:${m[2]}`;
  }

  private normalizeStatus(value: unknown): BookingStatus | undefined {
    if (!value) return undefined;
    const map: Record<string, BookingStatus> = {
      done: BookingStatus.COMPLETED,
      completed: BookingStatus.COMPLETED,
      complete: BookingStatus.COMPLETED,
      in_progress: BookingStatus.IN_PROGRESS,
      'in progress': BookingStatus.IN_PROGRESS,
      no_show: BookingStatus.NO_SHOW,
      'no show': BookingStatus.NO_SHOW,
      confirmed: BookingStatus.CONFIRMED,
      pending: BookingStatus.PENDING,
      booked: BookingStatus.PENDING,
    };
    return (
      map[String(value).toLowerCase()] ??
      (Object.values(BookingStatus).includes(value as BookingStatus)
        ? (value as BookingStatus)
        : undefined)
    );
  }

  private normalizePaymentStatus(value: unknown): PaymentStatus | undefined {
    if (!value) return undefined;
    const map: Record<string, PaymentStatus> = {
      done: PaymentStatus.PAID,
      paid: PaymentStatus.PAID,
      pending: PaymentStatus.PENDING,
      partially_paid: PaymentStatus.PARTIALLY_PAID,
      partial: PaymentStatus.PARTIALLY_PAID,
      refunded: PaymentStatus.REFUNDED,
      not_applicable: PaymentStatus.NOT_APPLICABLE,
      na: PaymentStatus.NOT_APPLICABLE,
      n_a: PaymentStatus.NOT_APPLICABLE,
    };
    return (
      map[String(value).toLowerCase()] ??
      (Object.values(PaymentStatus).includes(value as PaymentStatus)
        ? (value as PaymentStatus)
        : undefined)
    );
  }

  private resolveDateRange(
    params: Record<string, unknown>,
  ): { start: Date; end: Date } | null {
    if (!params.date) return null;
    const d = new Date(String(params.date));
    if (Number.isNaN(d.getTime())) return null;
    const start = new Date(d);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setUTCHours(23, 59, 59, 999);
    return { start, end };
  }
}
