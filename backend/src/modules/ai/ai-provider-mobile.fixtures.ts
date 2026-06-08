import { APPOINTMENT_TAX_CLASSIFIER_RULES } from './ai-appointment-tax.fixtures.js';
import { TAX_DISPLAY_EN_CLASSIFIER_RULES } from './ai-tax-display-en.fixtures.js';
import { PROVIDER_DATE_FORMAT_CLASSIFIER_RULES } from './ai-provider-date-format.fixtures.js';
import { PROVIDER_PAYMENT_CURRENCY_CLASSIFIER_RULES } from './ai-provider-payment-currency.fixtures.js';
import { PROVIDER_SESSION_TIMEOUT_CLASSIFIER_RULES } from './ai-provider-session-timeout.fixtures.js';
import { PROVIDER_CLINIC_COLLECTION_CLASSIFIER_RULES } from './ai-provider-clinic-collection.fixtures.js';
import { PROVIDER_CLINIC_COLLECTION_MULTILINGUAL_CLASSIFIER_RULES } from './ai-provider-clinic-collection-multilingual.fixtures.js';
import { PROVIDER_CLINIC_LAB_BOOKING_CLASSIFIER_RULES } from './ai-clinic-lab-booking.fixtures.js';
import { PROVIDER_PUSH_SETUP_CLASSIFIER_RULES } from './ai-provider-push-setup.fixtures.js';
import { PROVIDER_EARNINGS_CLASSIFIER_RULES } from './ai-provider-earnings.fixtures.js';

/** Classifier rules for provider mobile scoped handlers & push parity (ai-cmd-h3.5). */
export const PROVIDER_MOBILE_CLASSIFIER_RULES = `- confirm_booking_from_push: same outcome as tapping Confirm on a new-booking push — requires bookingId (from lastPush or prompt). Triggers: "confirm this booking from the push", "confirm appointment from notification". NOT update_bookings unless user names status explicitly without push context.
- suggest_reschedule_from_push: same outcome as tapping Reschedule on a new-booking push — opens AI with reschedule guidance, does not move the slot. Triggers: "reschedule from push", "help me reschedule this booking from the notification". NOT reschedule_booking when user gives a new date/time.
- mark_paid: same outcome as Mark paid on a new-booking push — single booking only. Inherit bookingId from lastPush when omitted. NOT payment_sweep (bulk day sweep).
- Scoped package/multi lists: list_package_appointments_today / list_my_package_visits / list_my_multi_service_groups are provider-self-scope only — NOT list_package_bookings or dashboard admin lists.
- Push/offline read: explain_last_push, open_booking_from_push, offline_queue_status, end_of_day_summary, new_booking_push_actions — inherit bookingId and lastPush from session.
- Provider push parity compound (one message): open_booking_from_push → confirm_booking_from_push or mark_paid; explain_last_push → open_booking_from_push. Multi-step execution is automatic — inherit bookingId across steps.
- Example compound: "Open booking from push and confirm it" → open_booking_from_push then confirm_booking_from_push with shared bookingId.
- Example compound: "Explain last push and mark paid" → explain_last_push then mark_paid when booking is linked.
- Example follow-up: after open_booking_from_push, "confirm it" / "mark paid" → confirm_booking_from_push or mark_paid, inherit bookingId from session.lastPush.
${APPOINTMENT_TAX_CLASSIFIER_RULES}
${TAX_DISPLAY_EN_CLASSIFIER_RULES}
${PROVIDER_PAYMENT_CURRENCY_CLASSIFIER_RULES}
${PROVIDER_DATE_FORMAT_CLASSIFIER_RULES}
${PROVIDER_SESSION_TIMEOUT_CLASSIFIER_RULES}
${PROVIDER_CLINIC_COLLECTION_CLASSIFIER_RULES}
${PROVIDER_CLINIC_COLLECTION_MULTILINGUAL_CLASSIFIER_RULES}
${PROVIDER_CLINIC_LAB_BOOKING_CLASSIFIER_RULES}
${PROVIDER_PUSH_SETUP_CLASSIFIER_RULES}
${PROVIDER_EARNINGS_CLASSIFIER_RULES}`;
