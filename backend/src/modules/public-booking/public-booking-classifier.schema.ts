import { PUBLIC_CHECK_AND_BOOK_CLASSIFIER_RULES } from '../ai/ai-check-and-book.fixtures.js';
import { CLASSIFIER_MULTILINGUAL_RULES } from '../ai/ai-prompt-i18n.js';
import { CHECKOUT_CURRENCY_CLASSIFIER_RULES } from '../ai/ai-checkout-currency.fixtures.js';
import { CHECKOUT_TAX_CLASSIFIER_RULES } from '../ai/ai-checkout-tax.fixtures.js';
import { CHECKOUT_TAX_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-checkout-tax-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_DEPOSIT_FORFEITURE_CLASSIFIER_RULES } from '../ai/ai-explain-deposit-forfeiture.util.js';
import { EXPLAIN_DEPOSIT_FORFEITURE_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-deposit-forfeiture-multilingual.fixtures.js';
import { BOOKING_LANGUAGES_CLASSIFIER_RULES } from '../ai/ai-booking-languages.fixtures.js';
import { BOOKING_DATE_FORMAT_CLASSIFIER_RULES } from '../ai/ai-booking-date-format.fixtures.js';
import { PUBLIC_PACKAGE_DISPLAY_NAME_CLASSIFIER_RULES } from '../ai/ai-package-display-name.fixtures.js';
import { TOUR_BOOKING_CLASSIFIER_RULES } from '../ai/ai-tour-booking.fixtures.js';
import { TOUR_DAY_SLOTS_CLASSIFIER_RULES } from '../ai/ai-tour-day-slots.fixtures.js';
import { TOUR_MEETING_POINT_CLASSIFIER_RULES } from '../ai/ai-tour-meeting-point.fixtures.js';
import { EXPLAIN_TOUR_MEETING_POINT_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-tour-meeting-point-multilingual.fixtures.js';
import { PACKAGE_CURRENCY_CLASSIFIER_RULES } from '../ai/ai-package-currency.fixtures.js';
import { STRIPE_CHECKOUT_CURRENCY_CLASSIFIER_RULES } from '../ai/ai-stripe-checkout-currency.fixtures.js';
import { TOUR_CAPACITY_CLASSIFIER_RULES } from '../ai/ai-tour-capacity.fixtures.js';
import { CHECKOUT_RECOMMENDATIONS_CLASSIFIER_RULES } from '../ai/ai-checkout-recommendations.fixtures.js';
import { CHECKOUT_RECOMMENDATIONS_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-checkout-recommendations-multilingual.fixtures.js';
import { DATA_RIGHTS_CLASSIFIER_RULES } from '../ai/ai-data-rights.fixtures.js';
import { PUBLIC_CLINIC_TEST_RESULTS_CLASSIFIER_APPENDIX } from '../ai/ai-clinic-v2-6.fixtures.js';
import { CONSUMER_CLINIC_TEST_RESULTS_CLASSIFIER_RULES } from '../ai/ai-consumer-clinic-test-results.fixtures.js';
import { PUBLIC_CLINIC_LAB_BOOKING_CLASSIFIER_APPENDIX } from '../ai/ai-clinic-lab-booking.fixtures.js';
import { CONSUMER_CLINIC_LAB_BOOKING_CLASSIFIER_RULES } from '../ai/ai-clinic-lab-booking.fixtures.js';
import { PUBLIC_BOOK_LAB_COLLECTION_NEAREST_CLASSIFIER_RULES } from '../ai/ai-book-lab-collection-nearest.fixtures.js';
import { BOOK_LAB_COLLECTION_NEAREST_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-book-lab-collection-nearest-multilingual.fixtures.js';
import { PUBLIC_BOOK_TOUR_NEAREST_DEPARTURE_CLASSIFIER_RULES } from '../ai/ai-book-tour-nearest-departure.fixtures.js';
import { BOOK_TOUR_NEAREST_DEPARTURE_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-book-tour-nearest-departure-multilingual.fixtures.js';
import { CLINIC_BOOKING_CLASSIFIER_RULES } from '../ai/ai-clinic-booking.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_LAB_PREP_CLASSIFIER_RULES } from '../ai/ai-explain-lab-prep.fixtures.js';
import { EXPLAIN_LAB_PREP_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-lab-prep-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_CLINIC_BOOKING_FIELDS_CLASSIFIER_RULES } from '../ai/ai-explain-clinic-booking-fields.fixtures.js';
import { EXPLAIN_CLINIC_BOOKING_FIELDS_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-clinic-booking-fields-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_PUBLIC_INTAKE_FORM_CLASSIFIER_RULES } from '../ai/ai-explain-public-intake-form.fixtures.js';
import { EXPLAIN_PUBLIC_INTAKE_FORM_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-public-intake-form-multilingual.fixtures.js';
import { PUBLIC_COMPLETE_INTAKE_AND_BOOK_CLASSIFIER_RULES } from '../ai/ai-complete-intake-and-book.fixtures.js';
import { COMPLETE_INTAKE_AND_BOOK_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-complete-intake-and-book-multilingual.fixtures.js';
import { INTAKE_LAB_BOOK_PAY_CLASSIFIER_RULES } from '../ai/ai-intake-lab-book-pay-compound.fixtures.js';
import { INTAKE_LAB_BOOK_PAY_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-intake-lab-book-pay-compound-multilingual.fixtures.js';
import { TOUR_GROUP_CHECKOUT_CLASSIFIER_RULES } from '../ai/ai-tour-group-checkout-compound.fixtures.js';
import { TOUR_GROUP_CHECKOUT_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-tour-group-checkout-compound-multilingual.fixtures.js';
import { BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES } from '../ai/ai-budget-service-discovery.fixtures.js';
import { CUSTOMER_PUBLIC_FIND_SERVICES_UNDER_BUDGET_CLASSIFIER_RULES } from '../ai/ai-find-services-under-budget.fixtures.js';
import { FIND_SERVICES_UNDER_BUDGET_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-find-services-under-budget-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_FIND_EVENING_WEEKEND_SLOTS_CLASSIFIER_RULES } from '../ai/ai-find-evening-weekend-slots.fixtures.js';
import { FIND_EVENING_WEEKEND_SLOTS_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-find-evening-weekend-slots-multilingual.fixtures.js';
import { DISCOVER_BOOK_AND_PAY_CLASSIFIER_RULES } from '../ai/ai-discover-book-and-pay-compound.fixtures.js';
import { FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES } from '../ai/ai-flexible-availability.fixtures.js';
import { SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES } from '../ai/ai-service-rank-discovery.fixtures.js';
import { PUBLIC_AVAILABILITY_DISAMBIGUATION_RULES } from '../ai/ai-intent-disambiguation.fixtures.js';
import {
  PUBLIC_BOOKING_HELP_CLASSIFIER_RULES,
  PUBLIC_APP_GUIDE_CLASSIFIER_RULES,
} from '../ai/ai-public-booking-guide.util.js';
import { PUBLIC_EMPTY_STATE_GUIDE_CLASSIFIER_RULES } from '../ai/ai-product-guide-empty-state.fixtures.js';
import { CUSTOMER_PUBLIC_PREPAYMENT_EXPLAIN_CLASSIFIER_RULES } from '../ai/ai-explain-prepayment.util.js';
import { CUSTOMER_PUBLIC_CASH_PAYMENT_CLASSIFIER_RULES } from '../ai/ai-cash-payment-checkout.util.js';
import { CUSTOMER_PUBLIC_PAY_ONLINE_CLASSIFIER_RULES } from '../ai/ai-pay-online-checkout.util.js';
import { CUSTOMER_PUBLIC_DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CLASSIFIER_RULES } from '../ai/ai-diagnose-stripe-checkout-failure.util.js';
import { DIAGNOSE_STRIPE_CHECKOUT_FAILURE_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-diagnose-stripe-checkout-failure-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_PAY_AT_VENUE_FALLBACK_CLASSIFIER_RULES } from '../ai/ai-pay-at-venue-fallback.util.js';
import { PAY_AT_VENUE_FALLBACK_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-pay-at-venue-fallback-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_RESUME_BOOKING_DRAFT_CLASSIFIER_RULES } from '../ai/ai-resume-booking-draft.util.js';
import { RESUME_BOOKING_DRAFT_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-resume-booking-draft-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_SLOT_NO_LONGER_AVAILABLE_CLASSIFIER_RULES } from '../ai/ai-explain-slot-no-longer-available.util.js';
import { EXPLAIN_SLOT_NO_LONGER_AVAILABLE_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-slot-no-longer-available-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_VOICE_INPUT_CLASSIFIER_RULES } from '../ai/ai-explain-voice-input.util.js';
import { EXPLAIN_VOICE_INPUT_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-voice-input-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_SPEAK_ASSISTANT_REPLY_CLASSIFIER_RULES } from '../ai/ai-speak-assistant-reply.util.js';
import { SPEAK_ASSISTANT_REPLY_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-speak-assistant-reply-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_GIVE_AI_FEEDBACK_CLASSIFIER_RULES } from '../ai/ai-give-ai-feedback.util.js';
import { GIVE_AI_FEEDBACK_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-give-ai-feedback-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_RTL_LAYOUT_CLASSIFIER_RULES } from '../ai/ai-explain-rtl-layout.util.js';
import { EXPLAIN_RTL_LAYOUT_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-rtl-layout-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_MULTI_SERVICE_CLASSIFIER_RULES } from '../ai/ai-multi-service-customer-public.util.js';
import { CUSTOMER_PUBLIC_APPLY_PROMO_CODE_CHECKOUT_CLASSIFIER_RULES } from '../ai/ai-apply-promo-code-checkout.util.js';
import { CUSTOMER_PUBLIC_PROMO_CODE_HELP_CLASSIFIER_RULES } from '../ai/ai-promo-code-help-customer-public.util.js';
import { CUSTOMER_PUBLIC_EXPLAIN_SERVICE_PRICE_CLASSIFIER_RULES } from '../ai/ai-explain-service-price.util.js';
import { EXPLAIN_SERVICE_PRICE_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-service-price-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_CLASSIFIER_RULES } from '../ai/ai-explain-payment-options-for-service.util.js';
import { EXPLAIN_PAYMENT_OPTIONS_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-payment-options-for-service-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_FIND_SOONEST_APPOINTMENT_CLASSIFIER_RULES } from '../ai/ai-find-soonest-appointment.util.js';
import { FIND_SOONEST_APPOINTMENT_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-find-soonest-appointment-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_CUSTOMER_WAITLIST_CLASSIFIER_RULES } from '../ai/ai-customer-waitlist.util.js';
import { CUSTOMER_WAITLIST_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-customer-waitlist-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_COMPARE_SERVICES_CLASSIFIER_RULES } from '../ai/ai-compare-services.util.js';
import { COMPARE_SERVICES_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-compare-services-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_PACKAGE_SAVINGS_CLASSIFIER_RULES } from '../ai/ai-explain-package-savings.fixtures.js';
import { EXPLAIN_PACKAGE_SAVINGS_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-package-savings-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_CLASSIFIER_RULES } from '../ai/ai-explain-subscription-vs-one-time.fixtures.js';
import { EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-subscription-vs-one-time-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_FILTER_SERVICES_NO_PREPAYMENT_CLASSIFIER_RULES } from '../ai/ai-filter-services-no-prepayment.util.js';
import { FILTER_SERVICES_NO_PREPAYMENT_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-filter-services-no-prepayment-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_AMOUNT_DUE_NOW_CLASSIFIER_RULES } from '../ai/ai-explain-amount-due-now.util.js';
import { EXPLAIN_AMOUNT_DUE_NOW_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-amount-due-now-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_GUEST_CHECKOUT_FIELDS_CLASSIFIER_RULES } from '../ai/ai-explain-guest-checkout-fields.util.js';
import { EXPLAIN_GUEST_CHECKOUT_FIELDS_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-guest-checkout-fields-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_WHY_SIGN_IN_CLASSIFIER_RULES } from '../ai/ai-explain-why-sign-in.util.js';
import { CUSTOMER_PUBLIC_EXPLAIN_MANAGE_BOOKING_PAGE_CLASSIFIER_RULES } from '../ai/ai-explain-manage-booking-page.fixtures.js';
import { EXPLAIN_MANAGE_BOOKING_PAGE_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-manage-booking-page-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_SIGN_IN_TO_MANAGE_BOOKING_CLASSIFIER_RULES } from '../ai/ai-sign-in-to-manage-booking.util.js';
import { CUSTOMER_PUBLIC_RECOVER_LOST_MANAGE_LINK_CLASSIFIER_RULES } from '../ai/ai-recover-lost-manage-link.util.js';
import { EXPLAIN_WHY_SIGN_IN_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-why-sign-in-multilingual.fixtures.js';
import { SIGN_IN_TO_MANAGE_BOOKING_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-sign-in-to-manage-booking-multilingual.fixtures.js';
import { RECOVER_LOST_MANAGE_LINK_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-recover-lost-manage-link-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_FIX_CHECKOUT_VALIDATION_ERROR_CLASSIFIER_RULES } from '../ai/ai-fix-checkout-validation-error.util.js';
import { FIX_CHECKOUT_VALIDATION_ERROR_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-fix-checkout-validation-error-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_CONFIRM_MY_BOOKING_DETAILS_CLASSIFIER_RULES } from '../ai/ai-confirm-my-booking-details.util.js';
import { CONFIRM_MY_BOOKING_DETAILS_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-confirm-my-booking-details-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_ADD_BOOKING_TO_CALENDAR_CLASSIFIER_RULES } from '../ai/ai-add-booking-to-calendar.util.js';
import { ADD_BOOKING_TO_CALENDAR_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-add-booking-to-calendar-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_GET_DIRECTIONS_TO_SALON_CLASSIFIER_RULES } from '../ai/ai-get-directions-to-salon.util.js';
import { CUSTOMER_PUBLIC_EXPLAIN_PREPARATION_NOTES_CLASSIFIER_RULES } from '../ai/ai-explain-preparation-notes.util.js';
import { GET_DIRECTIONS_TO_SALON_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-get-directions-to-salon-multilingual.fixtures.js';
import { EXPLAIN_PREPARATION_NOTES_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-preparation-notes-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_BOOK_ANOTHER_SERVICE_CLASSIFIER_RULES } from '../ai/ai-book-another-service.util.js';
import { BOOK_ANOTHER_SERVICE_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-book-another-service-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_BUSINESS_HOURS_AND_LOCATION_CLASSIFIER_RULES } from '../ai/ai-explain-business-hours-and-location.util.js';
import { EXPLAIN_BUSINESS_HOURS_AND_LOCATION_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-business-hours-and-location-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_SALON_PROFILE_CLASSIFIER_RULES } from '../ai/ai-explain-salon-profile.fixtures.js';
import { EXPLAIN_SALON_PROFILE_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-salon-profile-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_PROVIDER_SPECIALTY_CLASSIFIER_RULES } from '../ai/ai-explain-provider-specialty.util.js';
import { EXPLAIN_PROVIDER_SPECIALTY_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-provider-specialty-multilingual.fixtures.js';
import { EXPLAIN_ANY_PROVIDER_OPTION_CLASSIFIER_RULES } from '../ai/ai-explain-any-provider-option.fixtures.js';
import { EXPLAIN_ANY_PROVIDER_OPTION_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-any-provider-option-multilingual.fixtures.js';
import { PICK_PROVIDER_FOR_SERVICE_CLASSIFIER_RULES } from '../ai/ai-pick-provider-for-service.fixtures.js';
import { PICK_PROVIDER_FOR_SERVICE_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-pick-provider-for-service-multilingual.fixtures.js';
import { EXPLAIN_PROVIDER_AVAILABILITY_CLASSIFIER_RULES } from '../ai/ai-explain-provider-availability.fixtures.js';
import { EXPLAIN_PROVIDER_AVAILABILITY_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-provider-availability-multilingual.fixtures.js';
import { SWITCH_PROVIDER_SAME_TIME_CLASSIFIER_RULES } from '../ai/ai-switch-provider-same-time.fixtures.js';
import { SWITCH_PROVIDER_SAME_TIME_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-switch-provider-same-time-multilingual.fixtures.js';
import { EXPLAIN_PROFESSIONAL_PROFILE_CLASSIFIER_RULES } from '../ai/ai-explain-professional-profile.fixtures.js';
import { EXPLAIN_PROFESSIONAL_PROFILE_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-explain-professional-profile-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_HOW_TO_DOWNLOAD_APP_CLASSIFIER_RULES } from '../ai/ai-how-to-download-app.fixtures.js';
import { HOW_TO_DOWNLOAD_APP_MULTILINGUAL_CLASSIFIER_RULES } from '../ai/ai-how-to-download-app-multilingual.fixtures.js';

export function buildPublicClassifierSchema(): string {
  return `You are a friendly booking assistant for a customer-facing online appointment page.
Classify the user's message and extract ALL parameters needed to execute the request. Return JSON:

{
  "action": "list_providers" | "list_services" | "find_services_under_budget" | "find_evening_weekend_slots" | "check_availability" | "explain_provider_availability" | "recommend_specialists" | "business_info" | "explain_salon_profile" | "book_appointment" | "booking_help" | "explain_app_feature" | "guide_user_flow" | "explain_current_screen" | "explain_empty_catalog" | "explain_stripe_not_connected" | "explain_checkout_currency" | "explain_checkout_tax" | "explain_deposit_forfeiture" | "explain_stripe_checkout_currency" | "explain_package_currency" | "explain_booking_languages" | "explain_booking_date_format" | "explain_package_display_name" | "explain_tour_booking" | "explain_tour_day_slots" | "explain_tour_meeting_point" | "diagnose_tour_capacity" | "explain_checkout_recommendations" | "explain_data_rights" | "explain_clinic_booking" | "explain_lab_prep" | "explain_clinic_booking_fields" | "explain_public_intake_form" | "complete_intake_and_book" | "explain_guest_checkout_fields" | "explain_why_sign_in" | "explain_manage_booking_page" | "sign_in_to_manage_booking" | "recover_lost_manage_link" | "fix_checkout_validation_error" | "confirm_my_booking_details" | "add_booking_to_calendar" | "book_another_service" | "explain_preparation_notes" | "get_directions_to_salon" | "explain_why_stripe_required" | "diagnose_stripe_checkout_failure" | "pay_at_venue_fallback" | "resume_booking_draft" | "explain_slot_no_longer_available" | "explain_voice_input" | "speak_assistant_reply" | "give_ai_feedback" | "explain_rtl_layout" | "explain_checkout_total" | "explain_amount_due_now" | "explain_service_price" | "explain_payment_options_for_service" | "find_soonest_appointment" | "join_waitlist" | "check_waitlist_status" | "compare_services" | "explain_package_savings" | "explain_subscription_vs_one_time" | "filter_services_no_prepayment" | "explain_business_hours_and_location" | "explain_provider_specialty" | "explain_professional_profile" | "explain_any_provider_option" | "pick_provider_for_service" | "switch_provider_same_time" | "choose_payment_method" | "pay_cash_at_visit" | "pay_online" | "book_multi_service" | "check_multi_service_availability" | "add_services_to_cart" | "how_to_download_app" | "list_my_test_results" | "explain_result_status" | "list_my_lab_booking_requests" | "book_lab_collection" | "unknown",
  "params": {
    "employeeName": "string or null — one specialist from the Providers list",
    "employeeRole": "string or null — specialist role/title from the Providers list (e.g. cosmetologist, massage specialist) when the user asks for top/best rated by job title",
    "serviceName": "string or null — one exact or closest catalog service name",
    "serviceCategory": "string or null — keyword to filter SERVICE TYPE NAMES in the catalog (e.g. 'massage' matches Swedish massage, facemassage); NOT a catalog category entity — never include words like specialist/therapist/provider",
    "serviceNames": ["string"] or null — explicit list of catalog service names when user wants multiple related services,
    "date": "DD/MM/YYYY or null",
    "dateFrom": "DD/MM/YYYY or null",
    "dateTo": "DD/MM/YYYY or null",
    "weekdays": ["monday", "friday", etc.] or null — when user names weekdays without exact calendar dates",
    "timeSlot": "HH:MM 24h or null — omit when bookingFirstAvailable=true",
    "timeFrom": "HH:MM or null — earliest time when user says after 16:00 or for flexible booking",
    "timeOfDay": "morning | afternoon | evening | null — tonight counts as evening",
    "availabilityWindows": [{"date": "DD/MM/YYYY or null", "weekdays": ["monday", "friday", etc.] or null, "timeOfDay": "morning | afternoon | evening | null", "timeFrom": "HH:MM or null", "timeSlot": "HH:MM or null", "employeeName": "string or null — named specialist for that OR window only"}] or null — OR alternatives when user says tomorrow evening OR Friday afternoon; each window scanned independently",
    "bookingFirstAvailable": boolean or null,
    "allProviders": boolean or null — true when any specialist is acceptable",
    "providerFallbackNames": ["string"] or null,
    "fallbackAnyProvider": boolean or null,
    "maxPrice": number or null — inclusive catalog display-price ceiling when the user states a budget (under $X, I have $X, etc.),
    "serviceRank": "highest_price" | "lowest_price" | "most_popular" | null — rank catalog services for list_services (premium/cheapest/popular service, not specialist ratings),
    "packageName": "string or null — named package/bundle/spa day for explain_package_savings or package booking",
    "aspect": "named_provider | specialty_match | what_it_means | assignment | picker | hours | location | parking | hours_and_location | directions | fasting | preparation | what_to_bring | meeting_point | checkout | confirmation | service_list | all | null — explain_provider_specialty, explain_any_provider_option, explain_business_hours_and_location, get_directions_to_salon, explain_preparation_notes, or explain_checkout_tax when clear",
    "providerName": "string or null — named provider for explain_provider_specialty (Tell me about Anna)",
    "specialtyTopic": "string or null — hair/skin/service topic for explain_provider_specialty (curly hair, balayage)",
    "serviceTier": "standard" | "premium" | null — filter catalog rows by entity metadata tier (premium tier services for color)",
    "customerName": "string or null",
    "customerEmail": "string or null",
    "customerPhone": "string or null",
    "topicId": "string or null — optional public guide playbook id (public-booking-professionals, public-booking-services, public-checkout) for explain_app_feature / guide_user_flow / explain_current_screen; bookingStep in session selects playbook when omitted"
  },
  "reasoning": "one short sentence"
}

You MUST resolve relative dates yourself using Today's date from context (tomorrow, this week, Monday, next Friday → concrete DD/MM/YYYY or dateFrom/dateTo/weekdays). When the user mentions dates or weekdays in THIS message, set fresh date fields — ignore stale session dates for availability/recommend queries.

Action rules:
- recommend_specialists: best/top/highest-rated/suggested specialists. Set employeeRole when the user names a job title (cosmetologist, massage specialist, stylist). Set serviceCategory for broad service-type requests ('massage', 'hair') OR serviceName for one service OR serviceNames for an explicit set from the catalog. Set date/dateFrom/dateTo/weekdays for the period. allProviders=true.
- check_availability: open times / who is free. serviceName or serviceCategory as above. allProviders=true unless one specialist is named. Set availabilityWindows when the user lists OR alternatives (tomorrow evening or Friday afternoon). Set weekdays for "Monday and Friday" with the SAME timeOfDay (AND — not OR). Set timeOfDay for morning/afternoon/evening/tonight on single-window prompts.
- list_providers: who works here (not ratings/availability).
- list_services: prices, durations, catalog. Set serviceCategory for type questions ("what massages do you have" → serviceCategory: "massage") to filter service TYPE NAMES containing that keyword; only list matches — no catalog category named massage is required. Set maxPrice when the user states a spending limit. Set serviceRank when they ask for premium/luxury/cheapest/most popular service (catalog rank — not specialist ratings). Set serviceTier when they ask for premium tier or standard tier services (entity metadata filter — not serviceRank).
- find_services_under_budget: budget discover chip and focused "under $X" catalog browse — set maxPrice; same handler as list_services budget filter but use this action for one-tap chip "Services under $50" and short ceiling prompts ("Anything under $50?").
- find_evening_weekend_slots: evening/weekend discover chip and focused OR availability scan — set availabilityWindows with evening timeOfDay OR saturday/sunday weekdays; same handler as check_availability but use this action for one-tap chip "Evening or weekend slots for {service}" and short evening/weekend-only prompts ("Evening or weekend only", "After 6pm Saturday").
- explain_salon_profile: open salon profile page with overview, photos/map embed, social links, and stylist reviews entry — triggers like "Tell me about this salon", "Show photos and reviews", "Salon profile"; set aspect overview|photos|reviews|social|all. NOT business_info (inline info without profile navigation), NOT explain_business_hours_and_location (hours/address/parking).
- book_appointment: reserve/schedule. bookingFirstAvailable=true for nearest/soonest/next/earliest/ASAP/any specialist — leave timeSlot null. providerFallbackNames + fallbackAnyProvider for "Gevorg at 9, else Mary, else anyone". When the user picks a slot from a prior recommendation (e.g. "book facemassage on Karo at 9:30"), set employeeName, serviceName, timeSlot, and date from that context (including assistant messages in history).
- Check-then-book compound prompts (who is free + book nearest/soonest/ASAP) are executed as multi-step flows automatically — never return book_appointment without timeSlot unless bookingFirstAvailable=true.
- business_info: hours, location, contact, description; READ only. Prefer explain_salon_profile when the user wants the salon profile page ("Tell me about this salon", "Salon profile").
${PUBLIC_BOOKING_HELP_CLASSIFIER_RULES}
${PUBLIC_APP_GUIDE_CLASSIFIER_RULES}
${PUBLIC_EMPTY_STATE_GUIDE_CLASSIFIER_RULES}
- explain_checkout_currency: why prices show € / ֏ / ₽ / $ on this booking page; READ only.
${CHECKOUT_TAX_CLASSIFIER_RULES}
${CHECKOUT_TAX_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_DEPOSIT_FORFEITURE_CLASSIFIER_RULES}
${EXPLAIN_DEPOSIT_FORFEITURE_MULTILINGUAL_CLASSIFIER_RULES}
- explain_stripe_checkout_currency: why online Stripe checkout charges in € / ֏ / ₽ / $; when stripeCurrencySupported is false use cash/pay-at-venue; READ only.
- explain_package_currency: why package or gift-card totals use business default vs legacy bundled service currency; READ only.
- explain_booking_languages: why the language menu only shows certain locales on this booking page; READ only.
- explain_booking_date_format: why dates show DD/MM vs MM/DD (or ISO) on this booking page; READ only.
${PUBLIC_PACKAGE_DISPLAY_NAME_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_PREPAYMENT_EXPLAIN_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_CASH_PAYMENT_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_PAY_ONLINE_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CLASSIFIER_RULES}
${DIAGNOSE_STRIPE_CHECKOUT_FAILURE_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_PAY_AT_VENUE_FALLBACK_CLASSIFIER_RULES}
${PAY_AT_VENUE_FALLBACK_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_RESUME_BOOKING_DRAFT_CLASSIFIER_RULES}
${RESUME_BOOKING_DRAFT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_SLOT_NO_LONGER_AVAILABLE_CLASSIFIER_RULES}
${EXPLAIN_SLOT_NO_LONGER_AVAILABLE_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_VOICE_INPUT_CLASSIFIER_RULES}
${EXPLAIN_VOICE_INPUT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_SPEAK_ASSISTANT_REPLY_CLASSIFIER_RULES}
${SPEAK_ASSISTANT_REPLY_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_GIVE_AI_FEEDBACK_CLASSIFIER_RULES}
${GIVE_AI_FEEDBACK_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_RTL_LAYOUT_CLASSIFIER_RULES}
${EXPLAIN_RTL_LAYOUT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_MULTI_SERVICE_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_PROMO_CODE_HELP_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_APPLY_PROMO_CODE_CHECKOUT_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_SERVICE_PRICE_CLASSIFIER_RULES}
${EXPLAIN_SERVICE_PRICE_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_CLASSIFIER_RULES}
${EXPLAIN_PAYMENT_OPTIONS_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_FIND_SOONEST_APPOINTMENT_CLASSIFIER_RULES}
${FIND_SOONEST_APPOINTMENT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_CUSTOMER_WAITLIST_CLASSIFIER_RULES}
${CUSTOMER_WAITLIST_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_COMPARE_SERVICES_CLASSIFIER_RULES}
${COMPARE_SERVICES_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_PACKAGE_SAVINGS_CLASSIFIER_RULES}
${EXPLAIN_PACKAGE_SAVINGS_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_CLASSIFIER_RULES}
${EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_FILTER_SERVICES_NO_PREPAYMENT_CLASSIFIER_RULES}
${FILTER_SERVICES_NO_PREPAYMENT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_AMOUNT_DUE_NOW_CLASSIFIER_RULES}
${EXPLAIN_AMOUNT_DUE_NOW_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_GUEST_CHECKOUT_FIELDS_CLASSIFIER_RULES}
${EXPLAIN_GUEST_CHECKOUT_FIELDS_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_WHY_SIGN_IN_CLASSIFIER_RULES}
${EXPLAIN_WHY_SIGN_IN_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_MANAGE_BOOKING_PAGE_CLASSIFIER_RULES}
${EXPLAIN_MANAGE_BOOKING_PAGE_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_SIGN_IN_TO_MANAGE_BOOKING_CLASSIFIER_RULES}
${SIGN_IN_TO_MANAGE_BOOKING_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_RECOVER_LOST_MANAGE_LINK_CLASSIFIER_RULES}
${RECOVER_LOST_MANAGE_LINK_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_FIX_CHECKOUT_VALIDATION_ERROR_CLASSIFIER_RULES}
${FIX_CHECKOUT_VALIDATION_ERROR_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_CONFIRM_MY_BOOKING_DETAILS_CLASSIFIER_RULES}
${CONFIRM_MY_BOOKING_DETAILS_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_ADD_BOOKING_TO_CALENDAR_CLASSIFIER_RULES}
${ADD_BOOKING_TO_CALENDAR_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_BOOK_ANOTHER_SERVICE_CLASSIFIER_RULES}
${BOOK_ANOTHER_SERVICE_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_GET_DIRECTIONS_TO_SALON_CLASSIFIER_RULES}
${GET_DIRECTIONS_TO_SALON_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_PREPARATION_NOTES_CLASSIFIER_RULES}
${EXPLAIN_PREPARATION_NOTES_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_BUSINESS_HOURS_AND_LOCATION_CLASSIFIER_RULES}
${EXPLAIN_BUSINESS_HOURS_AND_LOCATION_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_PROVIDER_SPECIALTY_CLASSIFIER_RULES}
${EXPLAIN_PROVIDER_SPECIALTY_MULTILINGUAL_CLASSIFIER_RULES}
${EXPLAIN_ANY_PROVIDER_OPTION_CLASSIFIER_RULES}
${EXPLAIN_ANY_PROVIDER_OPTION_MULTILINGUAL_CLASSIFIER_RULES}
${PICK_PROVIDER_FOR_SERVICE_CLASSIFIER_RULES}
${PICK_PROVIDER_FOR_SERVICE_MULTILINGUAL_CLASSIFIER_RULES}
${EXPLAIN_PROVIDER_AVAILABILITY_CLASSIFIER_RULES}
${EXPLAIN_PROVIDER_AVAILABILITY_MULTILINGUAL_CLASSIFIER_RULES}
${SWITCH_PROVIDER_SAME_TIME_CLASSIFIER_RULES}
${SWITCH_PROVIDER_SAME_TIME_MULTILINGUAL_CLASSIFIER_RULES}
${EXPLAIN_PROFESSIONAL_PROFILE_CLASSIFIER_RULES}
${EXPLAIN_PROFESSIONAL_PROFILE_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_HOW_TO_DOWNLOAD_APP_CLASSIFIER_RULES}
${HOW_TO_DOWNLOAD_APP_MULTILINGUAL_CLASSIFIER_RULES}

Service extraction (critical):
- "massage specialist" / "best rated massage" / "what kinds of massage" → serviceCategory: "massage" — keyword on service type names, NOT serviceName "massage specialist".
- "Swedish massage" → serviceName: "Swedish massage".
- Never invent services — only names from the Services list in context.
- Multi-turn: fill missing employeeName/serviceName/date/timeSlot from Active session when the user omits them, EXCEPT bookingFirstAvailable (always fresh) and EXCEPT when this message sets new dates/weekdays.

Examples:
- "free slots on Monday for Gevorg" → check_availability, employeeName: Gevorg, weekdays: ["monday"]
- "best rated massage this week" → recommend_specialists, serviceCategory: "massage", dateFrom/dateTo: this week
- "book nearest facemassage on any specialist after 16:00" → book_appointment, serviceName: facemassage, bookingFirstAvailable: true, allProviders: true, timeFrom: "16:00"

Normalize all dates to DD/MM/YYYY.
${PUBLIC_CHECK_AND_BOOK_CLASSIFIER_RULES}
${PUBLIC_AVAILABILITY_DISAMBIGUATION_RULES}
${BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_FIND_SERVICES_UNDER_BUDGET_CLASSIFIER_RULES}
${FIND_SERVICES_UNDER_BUDGET_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_FIND_EVENING_WEEKEND_SLOTS_CLASSIFIER_RULES}
${FIND_EVENING_WEEKEND_SLOTS_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_SALON_PROFILE_CLASSIFIER_RULES}
${EXPLAIN_SALON_PROFILE_MULTILINGUAL_CLASSIFIER_RULES}
${DISCOVER_BOOK_AND_PAY_CLASSIFIER_RULES}
${FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES}
${SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES}
${CHECKOUT_CURRENCY_CLASSIFIER_RULES}
${STRIPE_CHECKOUT_CURRENCY_CLASSIFIER_RULES}
${PACKAGE_CURRENCY_CLASSIFIER_RULES}
${BOOKING_LANGUAGES_CLASSIFIER_RULES}
${BOOKING_DATE_FORMAT_CLASSIFIER_RULES}
${TOUR_BOOKING_CLASSIFIER_RULES}
${TOUR_DAY_SLOTS_CLASSIFIER_RULES}
${TOUR_MEETING_POINT_CLASSIFIER_RULES}
${EXPLAIN_TOUR_MEETING_POINT_MULTILINGUAL_CLASSIFIER_RULES}
${TOUR_CAPACITY_CLASSIFIER_RULES}
${PUBLIC_BOOK_TOUR_NEAREST_DEPARTURE_CLASSIFIER_RULES}
${BOOK_TOUR_NEAREST_DEPARTURE_MULTILINGUAL_CLASSIFIER_RULES}
${CHECKOUT_RECOMMENDATIONS_CLASSIFIER_RULES}
${CHECKOUT_RECOMMENDATIONS_MULTILINGUAL_CLASSIFIER_RULES}
${DATA_RIGHTS_CLASSIFIER_RULES}
${CONSUMER_CLINIC_TEST_RESULTS_CLASSIFIER_RULES}
${CONSUMER_CLINIC_LAB_BOOKING_CLASSIFIER_RULES}
${PUBLIC_BOOK_LAB_COLLECTION_NEAREST_CLASSIFIER_RULES}
${BOOK_LAB_COLLECTION_NEAREST_MULTILINGUAL_CLASSIFIER_RULES}
${CLINIC_BOOKING_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_LAB_PREP_CLASSIFIER_RULES}
${EXPLAIN_LAB_PREP_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_CLINIC_BOOKING_FIELDS_CLASSIFIER_RULES}
${EXPLAIN_CLINIC_BOOKING_FIELDS_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_PUBLIC_INTAKE_FORM_CLASSIFIER_RULES}
${EXPLAIN_PUBLIC_INTAKE_FORM_MULTILINGUAL_CLASSIFIER_RULES}
${PUBLIC_COMPLETE_INTAKE_AND_BOOK_CLASSIFIER_RULES}
${COMPLETE_INTAKE_AND_BOOK_MULTILINGUAL_CLASSIFIER_RULES}
${INTAKE_LAB_BOOK_PAY_CLASSIFIER_RULES}
${INTAKE_LAB_BOOK_PAY_MULTILINGUAL_CLASSIFIER_RULES}
${TOUR_GROUP_CHECKOUT_CLASSIFIER_RULES}
${TOUR_GROUP_CHECKOUT_MULTILINGUAL_CLASSIFIER_RULES}
${PUBLIC_CLINIC_TEST_RESULTS_CLASSIFIER_APPENDIX}
${PUBLIC_CLINIC_LAB_BOOKING_CLASSIFIER_APPENDIX}

${CLASSIFIER_MULTILINGUAL_RULES}`;
}
