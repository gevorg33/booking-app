import { APPOINTMENT_TAX_CLASSIFIER_RULES } from './ai-appointment-tax.fixtures.js';
import { TAX_DISPLAY_EN_CLASSIFIER_RULES } from './ai-tax-display-en.fixtures.js';
import { PROVIDER_DATE_FORMAT_CLASSIFIER_RULES } from './ai-provider-date-format.fixtures.js';
import { PROVIDER_PAYMENT_CURRENCY_CLASSIFIER_RULES } from './ai-provider-payment-currency.fixtures.js';
import { PROVIDER_SESSION_TIMEOUT_CLASSIFIER_RULES } from './ai-provider-session-timeout.fixtures.js';
import { PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-provider-session-timeout-multilingual.fixtures.js';
import { PROVIDER_CLINIC_COLLECTION_CLASSIFIER_RULES } from './ai-provider-clinic-collection.fixtures.js';
import { PROVIDER_CLINIC_COLLECTION_MULTILINGUAL_CLASSIFIER_RULES } from './ai-provider-clinic-collection-multilingual.fixtures.js';
import { PROVIDER_CLINIC_LAB_BOOKING_CLASSIFIER_RULES } from './ai-clinic-lab-booking.fixtures.js';
import { PROVIDER_PUSH_SETUP_CLASSIFIER_RULES } from './ai-provider-push-setup.fixtures.js';
import { PROVIDER_EARNINGS_CLASSIFIER_RULES } from './ai-provider-earnings.fixtures.js';
import { PROVIDER_CLIENT_CONTEXT_CLASSIFIER_RULES } from './ai-provider-client-context.fixtures.js';
import { PROVIDER_EXP_2_CLASSIFIER_RULES } from './ai-provider-exp-2.fixtures.js';
import { PROVIDER_TIME_OFF_CLASSIFIER_RULES } from '../provider-mobile/provider-time-off.fixtures.js';
import { PROVIDER_OPEN_SHIFTS_CLASSIFIER_RULES } from '../provider-mobile/provider-open-shifts.fixtures.js';
import { PROVIDER_OPEN_SHIFTS_MULTILINGUAL_CLASSIFIER_RULES } from './ai-provider-open-shifts-multilingual.fixtures.js';
import { PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-provider-team-whos-next-multilingual.fixtures.js';
import { PROVIDER_TIME_OFF_LIST_MULTILINGUAL_CLASSIFIER_RULES } from './ai-provider-time-off-list-multilingual.fixtures.js';
import { PROVIDER_DATE_FORMAT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-provider-date-format-multilingual.fixtures.js';
import { PROVIDER_EXP_3_CLASSIFIER_RULES } from './ai-provider-exp-3.fixtures.js';
import { PROVIDER_APP_GUIDE_CLASSIFIER_RULES } from './ai-provider-product-guide.fixtures.js';
import { PROVIDER_META_GUIDE_CLASSIFIER_RULES } from './ai-meta-product-guide.fixtures.js';
import { PROVIDER_EMPTY_STATE_GUIDE_CLASSIFIER_RULES } from './ai-product-guide-empty-state.fixtures.js';
import { PROVIDER_VOICE_NEXT_CLIENT_CLASSIFIER_RULES } from './ai-provider-voice-next-client.util.js';
import { PROVIDER_EXPLAIN_CONTEXT_CLASSIFIER_RULES } from './ai-explain-provider-context.fixtures.js';
import { PROVIDER_SCHEDULE_READS_CLASSIFIER_RULES } from './ai-provider-schedule-reads.fixtures.js';
import { PROVIDER_OPEN_BOOKING_DETAIL_CLASSIFIER_RULES } from './ai-provider-open-booking-detail.fixtures.js';
import { PROVIDER_MARK_VISIT_IN_PROGRESS_CLASSIFIER_RULES } from './ai-provider-mark-visit-in-progress.fixtures.js';
import { PROVIDER_MARK_MULTI_SERVICE_STEP_DONE_CLASSIFIER_RULES } from './ai-provider-mark-multi-service-step-done.fixtures.js';
import { PROVIDER_CONFIRM_PENDING_BOOKING_CLASSIFIER_RULES } from './ai-provider-confirm-pending-booking.fixtures.js';
import { PROVIDER_GIVE_AI_FEEDBACK_CLASSIFIER_RULES } from './ai-provider-give-ai-feedback.fixtures.js';
import { PROVIDER_VISIT_STATUS_EXPLAINERS_CLASSIFIER_RULES } from './ai-provider-visit-status-explainers.fixtures.js';
import { PROVIDER_CALENDAR_SCHEDULING_EXPLAINERS_CLASSIFIER_RULES } from './ai-provider-calendar-scheduling-explainers.fixtures.js';
import { PROVIDER_ASSISTANT_UX_EXPLAINERS_CLASSIFIER_RULES } from './ai-provider-assistant-ux-explainers.fixtures.js';
import { PROVIDER_DASHBOARD_HANDOFF_CLASSIFIER_RULES } from './ai-provider-dashboard-handoff.fixtures.js';

/** Classifier rules for provider mobile scoped handlers & push parity (ai-cmd-h3.5). */
export const PROVIDER_MOBILE_CLASSIFIER_RULES = `- confirm_booking_from_push: same outcome as tapping Confirm on a new-booking push — requires bookingId (from lastPush or prompt). Triggers: "confirm this booking from the push", "confirm appointment from notification". NOT update_bookings unless user names status explicitly without push context.
- suggest_reschedule_from_push: same outcome as tapping Reschedule on a new-booking push — opens AI with reschedule guidance, does not move the slot. Triggers: "reschedule from push", "help me reschedule this booking from the notification". NOT reschedule_booking when user gives a new date/time.
- mark_paid: same outcome as Mark paid on a new-booking push — single booking only. Inherit bookingId from lastPush when omitted. NOT payment_sweep (bulk day sweep).
- Scoped package/multi lists: list_package_appointments_today / list_my_package_visits / list_my_multi_service_groups are provider-self-scope only — NOT list_package_bookings or dashboard admin lists.
- Push/offline read: explain_last_push, open_booking_from_push, offline_queue_status, end_of_day_summary, new_booking_push_actions — inherit bookingId and lastPush from session.
- list_push_notifications: READ — open your notification center inbox (unread count + recent items). Triggers: "show my notifications", "open notification center", "what notifications do I have". NOT explain_last_push (single most-recent push detail), NOT dismiss_push.
- mark_all_notifications_read: MUTATE — bulk-clear every unread notification in your inbox. Triggers: "mark all notifications as read", "clear everything as read". NOT dismiss_push (single push), NOT mark_booking_notifications_read (one booking only).
- mark_booking_notifications_read: MUTATE — mark every notification tied to one booking as read. Requires bookingId (from lastPush, session, or prompt). Triggers: "mark this booking's notifications as read", "mark Jane's notifications read". NOT mark_all_notifications_read (whole inbox).
- Provider push parity compound (one message): open_booking_from_push → confirm_booking_from_push or mark_paid; explain_last_push → open_booking_from_push. Multi-step execution is automatic — inherit bookingId across steps.
- Example compound: "Open booking from push and confirm it" → open_booking_from_push then confirm_booking_from_push with shared bookingId.
- Example compound: "Explain last push and mark paid" → explain_last_push then mark_paid when booking is linked.
- Example follow-up: after open_booking_from_push, "confirm it" / "mark paid" → confirm_booking_from_push or mark_paid, inherit bookingId from session.lastPush.
${APPOINTMENT_TAX_CLASSIFIER_RULES}
${TAX_DISPLAY_EN_CLASSIFIER_RULES}
${PROVIDER_PAYMENT_CURRENCY_CLASSIFIER_RULES}
${PROVIDER_DATE_FORMAT_CLASSIFIER_RULES}
${PROVIDER_SESSION_TIMEOUT_CLASSIFIER_RULES}
${PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_CLASSIFIER_RULES}
${PROVIDER_CLINIC_COLLECTION_CLASSIFIER_RULES}
${PROVIDER_CLINIC_COLLECTION_MULTILINGUAL_CLASSIFIER_RULES}
${PROVIDER_CLINIC_LAB_BOOKING_CLASSIFIER_RULES}
${PROVIDER_PUSH_SETUP_CLASSIFIER_RULES}
${PROVIDER_EARNINGS_CLASSIFIER_RULES}
${PROVIDER_CLIENT_CONTEXT_CLASSIFIER_RULES}
${PROVIDER_EXP_2_CLASSIFIER_RULES}
${PROVIDER_TIME_OFF_CLASSIFIER_RULES}
${PROVIDER_OPEN_SHIFTS_CLASSIFIER_RULES}
${PROVIDER_OPEN_SHIFTS_MULTILINGUAL_CLASSIFIER_RULES}
${PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_CLASSIFIER_RULES}
${PROVIDER_TIME_OFF_LIST_MULTILINGUAL_CLASSIFIER_RULES}
${PROVIDER_DATE_FORMAT_MULTILINGUAL_CLASSIFIER_RULES}
${PROVIDER_EXP_3_CLASSIFIER_RULES}
${PROVIDER_APP_GUIDE_CLASSIFIER_RULES}
${PROVIDER_META_GUIDE_CLASSIFIER_RULES}
${PROVIDER_EMPTY_STATE_GUIDE_CLASSIFIER_RULES}
${PROVIDER_VOICE_NEXT_CLIENT_CLASSIFIER_RULES}
${PROVIDER_EXPLAIN_CONTEXT_CLASSIFIER_RULES}
${PROVIDER_SCHEDULE_READS_CLASSIFIER_RULES}
${PROVIDER_OPEN_BOOKING_DETAIL_CLASSIFIER_RULES}
${PROVIDER_MARK_VISIT_IN_PROGRESS_CLASSIFIER_RULES}
${PROVIDER_MARK_MULTI_SERVICE_STEP_DONE_CLASSIFIER_RULES}
${PROVIDER_CONFIRM_PENDING_BOOKING_CLASSIFIER_RULES}
${PROVIDER_GIVE_AI_FEEDBACK_CLASSIFIER_RULES}
${PROVIDER_VISIT_STATUS_EXPLAINERS_CLASSIFIER_RULES}
${PROVIDER_CALENDAR_SCHEDULING_EXPLAINERS_CLASSIFIER_RULES}
${PROVIDER_ASSISTANT_UX_EXPLAINERS_CLASSIFIER_RULES}
${PROVIDER_DASHBOARD_HANDOFF_CLASSIFIER_RULES}`;
