import { Injectable } from '@nestjs/common';
import {
  isClearSchedulePrompt,
  isDeleteScheduleBlockPrompt,
  isScheduleTemplateCreationPrompt,
  isProviderOwnServicesPrompt,
} from './ai-orchestration.helpers.js';
import {
  isAnyProviderBookingPrompt,
  isFirstAvailableBookingPrompt,
  enrichBookingTimeHintsFromPrompt,
  extractStatusFiltersFromPrompt,
  isBulkAllAppointmentsPrompt,
  extractBookingStatusFromPrompt,
  extractPaymentStatusFromPrompt,
  extractLimitFromPrompt,
  rescueUnscopedCustomerCountIntent,
  rescueCustomerRetentionRateIntent,
} from './ai-intent-heuristics.js';
import { applyBookingRescheduleActionHints } from './ai-booking-reschedule-hints.util.js';
import {
  applyScheduleOpsPromptHints,
  disambiguateClearScheduleVsHideCalendar,
  isFillGapsFollowUpPrompt,
  isHideAppointmentsFromCalendarPrompt,
} from './ai-schedule-ops-hints.util.js';
import {
  applyPackageMultiServicePromptHints,
  disambiguateStaffPackageMultiBooking,
} from './ai-package-multi-service-hints.util.js';
import {
  applyGiftCardPaymentsPromptHints,
  disambiguateGiftCardPaymentsAction,
} from './ai-gift-card-payments-hints.util.js';
import { enrichServiceOnlinePaymentParamsFromPrompt } from './ai-service-online-payment.util.js';
import { enrichServiceDepositPolicyParamsFromPrompt } from './ai-service-deposit-policy.util.js';
import { enrichExplainServicePriceParamsFromPrompt } from './ai-explain-service-price.util.js';
import { enrichExplainPaymentOptionsParamsFromPrompt } from './ai-explain-payment-options-for-service.util.js';
import {
  enrichFindSoonestParamsFromPrompt,
  isFindSoonestAppointmentPrompt,
  isRescheduleExistingAppointmentPrompt,
} from './ai-find-soonest-appointment.util.js';
import { enrichCompareServicesParamsFromPrompt } from './ai-compare-services.util.js';
import {
  enrichFilterServicesNoPrepaymentParamsFromPrompt,
  rescueFilterServicesNoPrepaymentIntent,
} from './ai-filter-services-no-prepayment.util.js';
import { enrichExplainBusinessHoursLocationParamsFromPrompt } from './ai-explain-business-hours-and-location.util.js';
import {
  enrichCreateServicePrepaymentParamsFromPrompt,
  enrichCreateServicesPrepaymentParamsFromPrompt,
  rescueCreateServicePrepaymentIntent,
} from './ai-create-service-prepayment.util.js';
import {
  enrichListServicesPaymentFilterParamsFromPrompt,
  rescueListServicesPaymentFilterIntent,
} from './ai-list-services-payment-filters.util.js';
import { enrichConfigureServiceFeaturedParamsFromPrompt } from './ai-configure-service-featured.util.js';
import { enrichBulkAssignServicesCategoryParamsFromPrompt } from './ai-bulk-assign-services-category.util.js';
import { enrichConfigurePackageOnlinePaymentParamsFromPrompt } from './ai-configure-package-online-payment.util.js';
import {
  enrichDeactivateServiceCategoryScopeParamsFromPrompt,
  isDeactivateServiceCategoryScopePrompt,
} from './ai-deactivate-service-category-scope.util.js';
import { enrichServiceDurationBufferParamsFromPrompt } from './ai-service-duration-buffer.util.js';
import {
  isTotalEarningsPrompt,
  isTopStaffRevenuePrompt,
} from './dashboard-revenue-analytics.util.js';
import { rescueSummarizeBookingsIntent } from './ai-dashboard-summarize-bookings.logic.js';
import {
  extractCustomerBookingContextFromPrompt,
  extractSingleProviderNameFromPrompt,
  extractUpcomingAppointmentScope,
  extractLookupCustomerNameFromPrompt,
  isCustomerBookingContextPrompt,
  isCustomerRetentionPrompt,
  isListCustomersPrompt,
  isLookupCustomerPrompt,
  isSingleProviderRevenuePrompt,
  isUpcomingAppointmentsPrompt,
} from './ai-dashboard-ops.util.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  isCapacityRebalancePrompt,
  rescueSchedulingIntent,
} from './ai-scheduling.util.js';
import { rescueOperationsIntent } from './ai-operations.util.js';
import {
  isAssignCategoryToProviderPrompt,
  isTransferServicesBetweenProvidersPrompt,
  isUnassignServicesFromProviderPrompt,
  rescueAssignCategoryToProviderIntent,
  rescueTransferServicesBetweenProvidersIntent,
  rescueUnassignServicesFromProviderIntent,
} from './ai-category-assignment.util.js';
import { rescueBookingDepthIntent } from './ai-booking-depth.util.js';
import {
  enrichServiceCategoryRescueParams,
  extractDeactivateServiceNameFromPrompt,
  isDeactivateServicePrompt,
  rescueCatalogIntent,
} from './ai-catalog.util.js';
import { enrichCatalogNotifyRescueParams } from './ai-catalog-notify.util.js';
import { rescueCustomerCrmIntent } from './ai-customer-crm.util.js';
import { rescuePrivacyDeleteConfirmIntent } from './ai-privacy-delete.util.js';
import { rescueCancelAllUpcomingConfirmIntent } from './ai-cancel-all-upcoming-bookings.util.js';
import { rescueExplainMySubscriptionIntent } from './ai-explain-my-subscription.util.js';
import { rescueScheduleResourceIntent } from './ai-schedule-resources.util.js';
import { rescueGiftFulfillmentIntent } from './ai-gift-fulfillment.util.js';
import { rescueIntegrationsIntent } from './ai-integrations.util.js';
import { rescueExplainSupportInboxIntent } from './ai-explain-support-inbox.util.js';
import {
  extractBusinessEmailOnCustomerChangeToggleFromPrompt,
  isToggleBusinessEmailOnCustomerChangePrompt,
  rescuePushNotificationsIntent,
} from './ai-push-notifications.util.js';
import { rescueReschedulePackageVisitSelfIntent } from './ai-reschedule-package-visit-self.util.js';
import { rescueCancelPackageVisitSelfIntent } from './ai-cancel-package-visit-self.util.js';
import {
  isMultiServiceAvailabilityDiscoveryPrompt,
  rescueSelfServiceBookingIntent,
} from './ai-self-service-booking.util.js';
import { rescueCancelAndRebookCompoundIntent } from './ai-cancel-and-rebook-compound.util.js';
import { rescueCancelPackageRebookSingleCompoundIntent } from './ai-cancel-package-rebook-single-compound.util.js';
import { rescueProviderBookingIntent } from './ai-provider-booking.util.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';
import { parseCreatePromoCodeFromPrompt } from './ai-create-promo-code.util.js';
import { parseConfigureLoyaltySettingsFromPrompt } from './ai-configure-loyalty-settings.util.js';
import { enrichConfigureStripeConnectParamsFromPrompt } from './ai-stripe-connect.util.js';
import { enrichApplyLoyaltyAtCheckoutParamsFromPrompt } from './ai-apply-loyalty-at-checkout.util.js';
import { parseConfigureCheckoutDefaultsFromPrompt } from './ai-checkout-defaults.util.js';
import { parseExplainPushPermissionFromPrompt } from './ai-explain-push-permission.util.js';
import { enrichNotificationSettingsParamsFromPrompt } from './ai-notification-settings.util.js';
import { parseExplainIntegrationHealthFromPrompt } from './ai-explain-integration-health.util.js';
import { enrichOpenaiIntegrationParamsFromPrompt } from './ai-openai-integration.util.js';
import { enrichWhatsappIntegrationParamsFromPrompt } from './ai-whatsapp-integration.util.js';
import {
  enrichCreateProductParamsFromPrompt,
  enrichDeleteExpenseParamsFromPrompt,
  enrichRecordExpenseParamsFromPrompt,
  isCreateProductPrompt,
  parseCreateCommissionRuleFromPrompt,
  parseExportAnalyticsReportFromPrompt,
  rescueRetailFinanceIntent,
} from './ai-retail-finance.util.js';
import {
  parseCreateLocationFromPrompt,
  parseUpdateLocationFromPrompt,
  rescueLocationsIntent,
} from './ai-locations.util.js';
import { rescueAgentOpsIntent } from './ai-agent-ops.util.js';
import { rescueMetaOpsIntent } from './ai-meta-ops.util.js';
import {
  isBookNearestSlotPrompt,
  isCheckProvidersForServicePrompt,
  rescuePaymentsIntent,
  extractAmountFromPrompt,
  extractServiceNameFromPrompt,
} from './ai-payments.util.js';
import {
  enrichPayOnlineParamsFromPrompt,
  rescuePayOnlineCheckoutIntent,
} from './ai-pay-online-checkout.util.js';
import { parseExplainServiceOnlinePaymentSetupFromPrompt } from './ai-service-online-payment-setup.util.js';
import { parseAuditServicesMissingOnlinePaymentFromPrompt } from './ai-audit-services-missing-online-payment.util.js';
import {
  enrichFindServicesUnderBudgetParamsFromPrompt,
  parseFindServicesUnderBudgetFromPrompt,
  rescueFindServicesUnderBudgetIntent,
} from './ai-find-services-under-budget.util.js';
import {
  parseFindEveningWeekendSlotsFromPrompt,
  rescueFindEveningWeekendSlotsIntent,
} from './ai-find-evening-weekend-slots.util.js';
import {
  rescueBudgetServiceDiscoveryIntent,
  enrichBudgetFromPrompt,
} from './ai-budget-service-discovery.util.js';
import { rescueProductGuideMisroute } from './ai-product-guide.util.js';
import type { AssistantMode } from './ai-assistant-mode.util.js';
import {
  disambiguateMisclassifiedAvailabilityIntent,
  resolveAvailabilityIntentFromPrompt,
  type AvailabilityDisambiguationSurface,
} from './ai-intent-disambiguation.util.js';
import {
  parseCurrencyFromPrompt,
  rescueBusinessCurrencyIntent,
} from './ai-business-currency.util.js';
import {
  parseBusinessTaxFromPrompt,
  parseSetServiceTaxRateFromPrompt,
  rescueBusinessTaxIntent,
} from './ai-business-tax.util.js';
import {
  parseConfigureStackedTaxRulesFromPrompt,
  rescueStackedTaxIntent,
} from './ai-stacked-tax.util.js';
import { rescueStripeTaxChargeIntent } from './ai-stripe-tax-charge.util.js';
import { rescueLookupBookingTaxMetadataIntent } from './ai-lookup-booking-tax-metadata.util.js';
import { rescueQuoteStaffBookingTaxIntent } from './ai-quote-staff-booking-tax.util.js';
import { rescueSummarizeCustomerTaxPaidIntent } from './ai-summarize-customer-tax-paid.util.js';
import { rescueCheckoutCurrencyIntent } from './ai-checkout-currency.util.js';
import {
  parseExplainCheckoutTaxFromPrompt,
  rescueCheckoutTaxIntent,
} from './ai-checkout-tax.util.js';
import { rescuePackageCurrencyIntent } from './ai-package-currency.util.js';
import { rescueNotificationCurrencyIntent } from './ai-notification-currency.util.js';
import { rescueStripeCheckoutCurrencyIntent } from './ai-stripe-checkout-currency.util.js';
import { rescueStripeCurrencyWarningIntent } from './ai-stripe-currency-warning.util.js';
import {
  isDiagnoseStripeCheckoutFailurePrompt,
  rescueStripeCheckoutFailureIntent,
} from './ai-stripe-checkout-failure.util.js';
import { rescueReportsCurrencyIntent } from './ai-reports-currency.util.js';
import { rescueRevenueKpisIntent } from './ai-revenue-kpis.util.js';
import {
  parseBusinessLanguagesFromPrompt,
  rescueBusinessLanguagesIntent,
  rescueExplainBusinessLanguagesIntent,
  rescueBulkStripDisabledLocaleTranslationsIntent,
} from './ai-business-languages.util.js';
import {
  extractMigrationSurfaceId,
  parseBusinessDateFormatFromPrompt,
  rescueBusinessDateFormatIntent,
} from './ai-business-date-format.util.js';
import {
  parseDateStringsFromPrompt,
  rescueDateInputFormatIntent,
} from './ai-date-input-format.util.js';
import {
  isConfigureProviderPushDateFormatPrompt,
  parseProviderPushTimeFormatFromPrompt,
  rescueProviderDateFormatIntent,
} from './ai-provider-date-format.util.js';
import {
  parseNotificationMessageKind,
  parsePatientResultReadyParams,
  rescueNotificationDateFormatIntent,
} from './ai-notification-date-format.util.js';
import { rescueBookingLanguagesIntent } from './ai-booking-languages.util.js';
import { rescueExplainBusinessHoursAndLocationIntent } from './ai-explain-business-hours-and-location.util.js';
import {
  enrichExplainSalonProfileParamsFromPrompt,
  rescueExplainSalonProfileIntent,
} from './ai-explain-salon-profile.util.js';
import {
  enrichExplainProviderSpecialtyParamsFromPrompt,
  rescueExplainProviderSpecialtyIntent,
} from './ai-explain-provider-specialty.util.js';
import {
  enrichExplainProfessionalProfileParamsFromPrompt,
  rescueExplainProfessionalProfileIntent,
} from './ai-explain-professional-profile.util.js';
import {
  parseExplainAnyProviderOptionFromPrompt,
  rescueExplainAnyProviderOptionIntent,
} from './ai-explain-any-provider-option.util.js';
import {
  enrichPickProviderForServiceParamsFromPrompt,
  rescuePickProviderForServiceIntent,
} from './ai-pick-provider-for-service.util.js';
import {
  enrichSwitchProviderSameTimeParamsFromPrompt,
  rescueSwitchProviderSameTimeIntent,
} from './ai-switch-provider-same-time.util.js';
import {
  enrichExplainProviderAvailabilityParamsFromPrompt,
  rescueExplainProviderAvailabilityIntent,
} from './ai-explain-provider-availability.util.js';
import { rescueBookingDateFormatIntent } from './ai-booking-date-format.util.js';
import {
  parsePackageLocalizedNamesFromPrompt,
  rescuePackageLocalizedNamesIntent,
} from './ai-package-localized-names.util.js';
import {
  parsePackageDisplayNameExplainFromPrompt,
  rescuePackageDisplayNameIntent,
} from './ai-package-display-name.util.js';
import {
  isExplainTourBookingRecordPrompt,
  parseExplainTourBookingRecordFromPrompt,
  rescueExplainTourBookingRecordIntent,
} from './ai-tour-booking-record.util.js';
import {
  isExplainTourCalendarSpanPrompt,
  parseExplainTourCalendarSpanFromPrompt,
  rescueExplainTourCalendarSpanIntent,
} from './ai-tour-calendar-span.util.js';
import {
  isListTourCalendarWeekPrompt,
  parseListTourCalendarWeekFromPrompt,
  rescueListTourCalendarWeekIntent,
} from './ai-tour-calendar-week.util.js';
import {
  isListUpcomingTourDeparturesPrompt,
  parseListUpcomingTourDeparturesFromPrompt,
  rescueListUpcomingTourDeparturesIntent,
} from './ai-upcoming-tour-departures.util.js';
import {
  isExplainTourServicesPrompt,
  parseConfigureTourServiceFromPrompt,
  parseExplainTourServicesFromPrompt,
  rescueApplyTourPlaybookIntent,
  rescueConfigureTourServiceIntent,
  rescueExplainTourServicesIntent,
} from './ai-tour-service.util.js';
import {
  parseConfigureClinicServiceFromPrompt,
  parseExplainClinicServicesFromPrompt,
  rescueApplyClinicPlaybookIntent,
  rescueConfigureClinicServiceIntent,
  rescueExplainClinicServicesIntent,
} from './ai-clinic-service.util.js';
import {
  parseExplainClinicBookingFromPrompt,
  rescueExplainClinicBookingIntent,
} from './ai-clinic-booking.util.js';
import {
  parseExplainLabPrepFromPrompt,
  rescueExplainLabPrepIntent,
} from './ai-explain-lab-prep.util.js';
import {
  parseExplainClinicBookingFieldsFromPrompt,
  rescueExplainClinicBookingFieldsIntent,
} from './ai-explain-clinic-booking-fields.util.js';
import {
  enrichExplainPublicIntakeFormParamsFromPrompt,
  parseExplainPublicIntakeFormFromPrompt,
  rescueExplainPublicIntakeFormIntent,
} from './ai-explain-public-intake-form.util.js';
import {
  parseExplainGuestCheckoutFieldsFromPrompt,
  rescueExplainGuestCheckoutFieldsIntent,
} from './ai-explain-guest-checkout-fields.util.js';
import {
  parseExplainWhySignInFromPrompt,
  rescueExplainWhySignInIntent,
} from './ai-explain-why-sign-in.util.js';
import { rescueMyLocaleIntent } from './ai-my-locale.util.js';
import {
  parseFixCheckoutValidationErrorFromPrompt,
  rescueFixCheckoutValidationErrorIntent,
} from './ai-fix-checkout-validation-error.util.js';
import {
  parseConfirmMyBookingDetailsFromPrompt,
  rescueConfirmMyBookingDetailsIntent,
} from './ai-confirm-my-booking-details.util.js';
import {
  isProviderAvailabilityOpenCheckPrompt,
  parseAddBookingToCalendarFromPrompt,
  rescueAddBookingToCalendarIntent,
} from './ai-add-booking-to-calendar.util.js';
import {
  enrichExplainSubscriptionVsOneTimeParamsFromPrompt,
  rescueExplainSubscriptionVsOneTimeIntent,
} from './ai-explain-subscription-vs-one-time.util.js';
import {
  enrichGetDirectionsToSalonParamsFromPrompt,
  parseGetDirectionsToSalonFromPrompt,
  rescueGetDirectionsToSalonIntent,
} from './ai-get-directions-to-salon.util.js';
import {
  enrichExplainPreparationNotesParamsFromPrompt,
  parseExplainPreparationNotesFromPrompt,
  rescueExplainPreparationNotesIntent,
} from './ai-explain-preparation-notes.util.js';
import {
  parseBookAnotherServiceFromPrompt,
  rescueBookAnotherServiceIntent,
} from './ai-book-another-service.util.js';
import {
  parseShareMyBookingFromPrompt,
  rescueShareMyBookingIntent,
} from './ai-share-my-booking.util.js';
import {
  parseListMyUpcomingAppointmentsFromPrompt,
  rescueListMyUpcomingAppointmentsIntent,
} from './ai-list-my-upcoming-appointments.util.js';
import {
  parseExplainCancelPolicyFromPrompt,
  rescueExplainCancelPolicyIntent,
} from './ai-explain-cancel-policy.util.js';
import {
  parseExplainDepositForfeitureFromPrompt,
  rescueExplainDepositForfeitureIntent,
} from './ai-explain-deposit-forfeiture.util.js';
import {
  enrichExplainPackageVisitRulesParamsFromPrompt,
  parseExplainPackageVisitRulesFromPrompt,
  rescueExplainPackageVisitRulesIntent,
} from './ai-explain-package-visit-rules.util.js';
import {
  parseGetManageLinkFromPrompt,
  rescueGetManageLinkIntent,
} from './ai-get-manage-link.util.js';
import {
  parseRecoverLostManageLinkFromPrompt,
  rescueRecoverLostManageLinkIntent,
} from './ai-recover-lost-manage-link.util.js';
import {
  parseSignInToManageBookingFromPrompt,
  rescueSignInToManageBookingIntent,
} from './ai-sign-in-to-manage-booking.util.js';
import {
  parseNotifyRunningLateFromPrompt,
  rescueNotifyRunningLateIntent,
} from './ai-notify-running-late.util.js';
import {
  parseLeaveVisitReviewFromPrompt,
  rescueLeaveVisitReviewIntent,
} from './ai-leave-visit-review.util.js';
import {
  parseExplainPostVisitReviewPromptFromPrompt,
  rescueExplainPostVisitReviewPromptIntent,
} from './ai-explain-post-visit-review-prompt.util.js';
import {
  parseExplainShareRewardFromPrompt,
  rescueExplainShareRewardIntent,
} from './ai-explain-share-reward.util.js';
import {
  parseReportBookingProblemFromPrompt,
  rescueReportBookingProblemIntent,
} from './ai-report-booking-problem.util.js';
import {
  parseSignInAfterBookingFromPrompt,
  rescueSignInAfterBookingIntent,
} from './ai-sign-in-after-booking.util.js';
import { rescueResumePendingPaymentIntent } from './ai-resume-pending-payment.util.js';
import { rescueResumeBookingDraftIntent } from './ai-resume-booking-draft.util.js';
import { rescueExplainSlotNoLongerAvailableIntent } from './ai-explain-slot-no-longer-available.util.js';
import { rescueExplainMultiServicePaymentReturnIntent } from './ai-explain-multi-service-payment-return.util.js';
import { rescueRetryFailedNetworkActionIntent } from './ai-retry-failed-network-action.util.js';
import { rescueExplainVoiceInputIntent } from './ai-explain-voice-input.util.js';
import { rescueSpeakAssistantReplyIntent } from './ai-speak-assistant-reply.util.js';
import { rescueGiveAiFeedbackIntent } from './ai-give-ai-feedback.util.js';
import { rescueExplainRtlLayoutIntent } from './ai-explain-rtl-layout.util.js';
import {
  parseDiagnoseTourCapacityFromPrompt,
  rescueDiagnoseTourCapacityIntent,
} from './ai-tour-capacity.util.js';
import {
  isExplainTourBookingPrompt,
  parseExplainTourBookingFromPrompt,
  rescueTourBookingIntent,
} from './ai-tour-booking.util.js';
import {
  isExplainTourDaySlotsPrompt,
  parseExplainTourDaySlotsFromPrompt,
  rescueTourDaySlotsIntent,
} from './ai-tour-day-slots.util.js';
import {
  parseExplainTourMeetingPointFromPrompt,
  rescueExplainTourMeetingPointIntent,
} from './ai-tour-meeting-point.util.js';
import { rescueProviderPaymentCurrencyIntent } from './ai-provider-payment-currency.util.js';
import { rescueAppointmentTaxIntent } from './ai-appointment-tax.util.js';
import { rescueBusinessComplianceIntent } from './ai-business-compliance.util.js';
import {
  parseCreateTestOrderFromPrompt,
  parseListTestOrdersFromPrompt,
  rescueClinicTestOrderIntent,
} from './ai-clinic-test-order.util.js';
import { rescueClinicCompoundIntent } from './ai-clinic-compound.util.js';
import { rescueClinicLabDayCloseCompoundIntent } from './ai-clinic-lab-day-close-compound.util.js';
import { rescueClinicLabReviewCompoundIntent } from './ai-clinic-lab-review-compound.util.js';
import { rescueBudgetDiscoverAndBookCompoundIntent } from './ai-budget-discover-and-book-compound.util.js';
import { rescueRescheduleThenCreateBookingCompoundIntent } from './ai-reschedule-then-create-booking-compound.util.js';
import { rescueDiscoverBookAndPayCompoundIntent } from './ai-discover-book-and-pay-compound.util.js';
import { rescueGiftCardCheckoutCompoundIntent } from './ai-gift-card-checkout-compound.util.js';
import { rescueMultiServiceDayCompoundIntent } from './ai-multi-service-day-compound.util.js';
import { rescueProviderSameDayMultiCompoundIntent } from './ai-provider-same-day-multi-compound.util.js';
import { rescueGuestBookAndManageCompoundIntent } from './ai-guest-book-and-manage-compound.util.js';
import { rescueGuestPayCashManageCompoundIntent } from './ai-guest-pay-cash-manage-compound.util.js';
import { rescueGuestManageVisitCompoundIntent } from './ai-guest-manage-visit-compound.util.js';
import { rescuePublicAssistantCompoundIntent } from './ai-public-assistant-compound.util.js';
import {
  extractManageLinkCredentialsFromPrompt,
  rescueManageBookingWithTokenIntent,
} from './ai-manage-booking-with-token.util.js';
import { rescueRankDiscoverAndBookCompoundIntent } from './ai-rank-discover-and-book-compound.util.js';
import { rescueSetupSalonCheckoutCompoundIntent } from './ai-setup-salon-checkout-compound.util.js';
import { rescueConfigureServicesPaymentMatrixCompoundIntent } from './ai-configure-services-payment-matrix-compound.util.js';
import { rescueCashAndOnlinePaymentCompoundIntent } from './ai-cash-online-payment-compound.util.js';
import { rescueDeclineOnlinePaymentCategoryCompoundIntent } from './ai-decline-online-payment-category-compound.util.js';
import { rescueOnboardSalonNotificationsCompoundIntent } from './ai-onboard-salon-notifications-compound.util.js';
import { rescueLaunchConsumerAppGrowthCompoundIntent } from './ai-launch-consumer-app-growth-compound.util.js';
import {
  enrichServiceRankFromPrompt,
  rescueServiceRankDiscoveryIntent,
} from './ai-service-rank-discovery.util.js';
import {
  enrichListProviderReviewsParamsFromPrompt,
  rescueListProviderReviewsIntent,
} from './ai-list-provider-reviews.util.js';
import { rescueListProvidersIntent } from './ai-list-providers.util.js';
import { isConcreteTimedBookAppointmentPrompt } from './ai-intent-disambiguation.util.js';
import { enrichBookAppointmentParamsFromPrompt } from './ai-book-appointment-params.util.js';
import {
  parseEnterTestResultFromPrompt,
  parseReleaseTestResultFromPrompt,
  rescueClinicTestResultIntent,
} from './ai-clinic-test-result.util.js';
import {
  parseConfigureTestReferenceRangeFromPrompt,
  parseExplainPatientResultsFromPrompt,
  parseUploadPatientResultFromPrompt,
} from './ai-clinic-test-result-ext.util.js';
import {
  enrichStaffOperationsRescueParams,
  isCreateBookingNotEmployeePrompt,
  rescueStaffOperationsIntent,
} from './ai-staff-operations.util.js';
import {
  enrichBillingLoyaltyRescueParams,
  rescueBillingLoyaltyDashboardIntent,
} from './ai-billing-loyalty-dashboard.util.js';
import {
  enrichWaitlistDashboardRescueParams,
  rescueWaitlistDashboardIntent,
} from './ai-waitlist-dashboard.util.js';
import {
  parseExplainPatientChartFromPrompt,
  rescueClinicPatientChartIntent,
} from './ai-clinic-patient-chart.util.js';
import {
  parseExplainResultStatusFromPrompt,
  parseListMyTestResultsFromPrompt,
  rescueConsumerClinicTestResultsIntent,
} from './ai-consumer-clinic-test-results.util.js';
import {
  enrichListMyDocumentsParamsFromPrompt,
  parseListMyDocumentsFromPrompt,
  rescueListMyDocumentsIntent,
} from './ai-list-my-documents.util.js';
import {
  enrichExplainAbnormalResultFlagParamsFromPrompt,
  rescueExplainAbnormalResultFlagIntent,
} from './ai-explain-abnormal-result-flag.util.js';
import {
  enrichNotifyWhenResultsReadyParamsFromPrompt,
  rescueNotifyWhenResultsReadyIntent,
} from './ai-notify-when-results-ready.util.js';
import {
  parseTrackLabOrderStatusFromPrompt,
  rescueTrackLabOrderStatusIntent,
} from './ai-track-lab-order-status.util.js';
import {
  parseListMyCollectionQueueFromPrompt,
  parseMarkSpecimenCollectedFromPrompt,
  rescueProviderClinicCollectionIntent,
} from './ai-provider-clinic-collection.util.js';
import {
  extractBookingIdForLabSummariesFromPrompt,
  extractClinicTaskIdFromPrompt,
  rescueProviderClinicTasksAndResultsIntent,
} from './ai-provider-clinic-tasks-and-results.util.js';
import {
  parseBookLabCollectionFromPrompt,
  parseListMyLabBookingRequestsFromPrompt,
  parsePushLabBookingFromPrompt,
  parseStaffBookLabCollectionFromPrompt,
  rescueConsumerClinicLabBookingIntent,
  rescueDashboardClinicLabBookingIntent,
  rescueProviderClinicLabBookingIntent,
} from './ai-clinic-lab-booking.util.js';
import { rescueBookLabCollectionNearestCompoundIntent } from './ai-book-lab-collection-nearest.util.js';
import { parseBookLabFromOrderFromPrompt } from './ai-book-lab-from-order.util.js';
import { rescueCompleteIntakeAndBookCompoundIntent } from './ai-complete-intake-and-book.util.js';
import { rescueIntakeLabBookPayCompoundIntent } from './ai-intake-lab-book-pay-compound.util.js';
import {
  rescueBookTourNearestDepartureCompoundIntent,
  isBookTourNearestDepartureCompoundPrompt,
  extractTourServiceNameFromBookingPrompt,
  extractLeadingTourNamePrompt,
} from './ai-book-tour-nearest-departure.util.js';
import {
  rescueTourGroupCheckoutCompoundIntent,
  isTourGroupCheckoutCompoundPrompt,
} from './ai-tour-group-checkout-compound.util.js';
import {
  parseAdminDeleteCustomerDataFromPrompt,
  parseConfigureGranularConsentFromPrompt,
  parseConfigurePrivacyRetentionFromPrompt,
  parseAcceptHipaaBaaFromPrompt,
  parseConfigureHipaaSessionTimeoutFromPrompt,
  parseEnableHipaaModeFromPrompt,
  parseExplainComplianceStatusFromPrompt,
  parseExplainGdprChecklistFromPrompt,
  parseExplainHipaaSessionTimeoutFromPrompt,
  parseListSubProcessorsFromPrompt,
  parseExplainMinimumNecessaryPhiAccessFromPrompt,
  parseExplainPhiEncryptionStatusFromPrompt,
  parseListBreachIncidentsFromPrompt,
  parseReportDataBreachFromPrompt,
  parseSendBreachNotificationFromPrompt,
  parseOpenComplianceDashboardFromPrompt,
  parseViewPhiAccessAuditFromPrompt,
} from './ai-business-compliance.util.js';
import { rescueProviderSessionTimeoutIntent } from './ai-provider-session-timeout.util.js';
import { rescueProviderPushSetupIntent } from './ai-provider-push-setup.util.js';
import { rescueExplainProviderContextIntent } from './ai-explain-provider-context.util.js';
import { rescueProviderScheduleReadsIntent } from './ai-provider-schedule-reads.util.js';
import { rescueOpenBookingDetailIntent } from './ai-provider-open-booking-detail.util.js';
import { rescueShowProviderProfileIntent } from './ai-provider-show-profile.util.js';
import {
  extractClientNoteBodyFromPrompt,
  extractCustomerNameFromClientPrompt,
  matchProviderClientContextScenario,
  rescueProviderClientContextIntent,
} from './ai-provider-client-context.util.js';
import { rescueProviderEarningsIntent } from './ai-provider-earnings.util.js';
import {
  extractBookingActionCustomerName,
  extractReassignEmployeeName,
  extractRunningLateMinutesFromPrompt,
  inferMyStatsPeriodFromPrompt,
  inferMyStatsScopeFromPrompt,
  rescueProviderExp2Intent,
} from './ai-provider-exp-2.util.js';
import { rescueSummarizeDayIntent } from './ai-provider-summarize-day.util.js';
import { rescueSummarizeUtilizationIntent } from './ai-provider-summarize-utilization.util.js';
import {
  isShowAppointmentsPrompt,
  rescueShowAppointmentsIntent,
} from './ai-provider-show-appointments.util.js';
import { rescueWhoIsNextIntent } from './ai-provider-who-is-next.util.js';
import { rescueExplainTodayTimelineIntent } from './ai-provider-explain-today-timeline.util.js';
import { rescueEndOfDaySummaryIntent } from './ai-provider-end-of-day-summary.util.js';
import { rescueMarkVisitCompleteIntent } from './ai-provider-mark-visit-complete.util.js';
import { rescueMarkVisitInProgressIntent } from './ai-provider-mark-visit-in-progress.util.js';
import { rescueMarkMultiServiceStepDoneIntent } from './ai-provider-mark-multi-service-step-done.util.js';
import {
  extractPatientSearchQueryFromPrompt,
  rescueSearchPatientIntent,
} from './ai-provider-search-patient.util.js';
import { rescueHandoffToDashboardPhiIntent } from './ai-provider-handoff-to-dashboard-phi.util.js';
import { rescueConfirmPendingBookingIntent } from './ai-provider-confirm-pending-booking.util.js';
import { rescueVisitStatusExplainersIntent } from './ai-provider-visit-status-explainers.util.js';
import { rescueCalendarSchedulingExplainersIntent } from './ai-provider-calendar-scheduling-explainers.util.js';
import { rescueAssistantUxExplainersIntent } from './ai-provider-assistant-ux-explainers.util.js';
import { rescueDashboardHandoffIntent } from './ai-provider-dashboard-handoff.util.js';
import { rescueProviderBlockScheduleIntent } from './ai-provider-block-schedule.util.js';
import { rescueGiveProviderAiFeedbackIntent } from './ai-provider-give-ai-feedback.util.js';
import {
  extractBlockWindowFromPrompt,
  extractMessageTemplateHint,
  extractRetailProductName,
  extractSendMessageChannel,
  matchProviderExp3Scenario,
  rescueProviderExp3Intent,
} from './ai-provider-exp-3.util.js';
import {
  matchProviderOpenShiftsScenario,
  rescueProviderOpenShiftsIntent,
} from './ai-provider-open-shifts.util.js';
import {
  matchProviderTeamWhosNextScenario,
  rescueProviderTeamWhosNextIntent,
} from './ai-provider-team-whos-next.util.js';
import {
  matchProviderTimeOffScenario,
  rescueProviderTimeOffIntent,
} from './ai-provider-time-off.util.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import {
  enrichClaimReferralCodeParamsFromPrompt,
  rescueClaimReferralCodeIntent,
} from './ai-rewards-and-referral-claim.util.js';
import {
  parseExplainDataRightsFromPrompt,
  rescueExplainDataRightsIntent,
} from './ai-data-rights.util.js';
import { rescueTenantCurrencyIntent } from './ai-tenant-currency.util.js';
import {
  parseExplainCheckoutRecommendationsFromPrompt,
  rescueExplainCheckoutRecommendationsIntent,
} from './ai-checkout-recommendations.util.js';
import {
  enrichDismissRecommendationsParamsFromPrompt,
  parseDismissRecommendationsFromPrompt,
  rescueDismissRecommendationsIntent,
} from './ai-dismiss-recommendations.util.js';
import {
  parseExplainConsumerCheckoutSuccessFromPrompt,
  rescueExplainConsumerCheckoutSuccessIntent,
} from './ai-consumer-checkout-success.util.js';
import {
  parseExplainConsumerCheckoutTaxFromPrompt,
  rescueExplainConsumerCheckoutTaxIntent,
} from './ai-consumer-checkout-tax.util.js';
import {
  parseExplainRecommendationAnalyticsFromPrompt,
  rescueExplainRecommendationAnalyticsIntent,
} from './ai-recommendation-analytics.util.js';
import {
  parseSummarizeRecommendationPerformanceFromPrompt,
  rescueSummarizeRecommendationPerformanceIntent,
} from './ai-recommendation-performance.util.js';
import {
  parseConfigureRecommendationProductFromPrompt,
  parseExplainRecommendationSetupFromPrompt,
  parseLinkRecommendedProductsFromPrompt,
  rescueConfigureRecommendationProductIntent,
  rescueExplainRecommendationSetupIntent,
  rescueLinkRecommendedProductsIntent,
} from './ai-recommendation-product.util.js';
import {
  runIntentRescuePipeline,
  type RescuePipelineContext,
} from './ai-intent-rescue-pipeline.util.js';
import { RESCUE_PIPELINE_BOUNDARY_MARKER } from './ai-intent-rescue.boundary.js';

/** pipe-1.5.1 — domain rescues only; semantic match is a pipeline stage. */
const _RESCUE_PIPELINE_BOUNDARY = RESCUE_PIPELINE_BOUNDARY_MARKER;

export interface IntentRescueInput {
  prompt: string;
  action: string;
  params: Record<string, any>;
  reasoning?: string;
  employees?: Array<{ id: string; name: string }>;
  customers?: Array<{ id: string; name: string }>;
  timeZone?: string;
  /** When set, budget discovery rescue uses surface-specific misroute mapping. */
  surface?: 'dashboard' | 'customer' | 'public' | 'provider';
  /** ai-guide-1.0.3 — explicit guide vs act routing from request or inference. */
  assistantMode?: AssistantMode;
  /**
   * pipe-1.5.2 — param hints from semantic_match winner only.
   * Never used to pick or override rescue action.
   */
  semanticParamHints?: Record<string, unknown>;
}

export interface IntentRescueResult {
  action: string;
  params: Record<string, any>;
  reasoning?: string;
  rescued: boolean;
  rescueReason: string;
}

const READ_ONLY_ACTIONS = new Set([
  'list_bookings',
  'show_appointments',
  'check_availability',
  'summarize_day',
  'summarize_bookings',
  'analyze_appointments',
  'analyze_services',
  'summarize_staff',
  'lookup_customer',
  'list_customers',
  'summarize_waitlist',
  'lookup_service_assignment',
  'list_services',
  'list_employees',
  'list_templates',
  'list_schedule_blocks',
  'get_provider_calendar',
  'list_schedule_gaps',
  'summarize_utilization',
  'summarize_customers',
  'check_schedule_compliance',
  'revenue_forecast',
  'summarize_ai_briefing',
  'summarize_ai_weekly_report',
  'explain_ai_audit_log',
  'explain_ai_usage_analytics',
  'explain_ai_capabilities',
  'summarize_ai_settings',
  'list_cash_pending_bookings',
  'list_package_bookings',
  'list_multi_service_bookings',
  'explain_booking_policy',
  'list_packages',
  'list_subscription_plans',
  'list_customer_subscriptions',
  'subscription_usage_history',
  'list_customer_gift_cards',
  'list_customer_bookings',
  'customer_no_show_history',
  'my_profile',
  'my_appointments',
  'my_subscriptions',
  'subscription_usage',
  'my_gift_cards',
  'gift_card_balance',
  'gift_card_redemption_history',
  'track_physical_gift_card_order',
  'discover_packages',
  'discover_subscription_plans',
  'discover_gift_card_products',
  'list_scheduling_resources',
  'list_service_resource_requirements',
  'list_resource_conflicts',
  'explain_resource_conflict',
  'my_resource_assignments',
  'check_multi_service_block_availability',
  'check_package_line_availability',
  'earliest_slot_all_services',
  'providers_available_later_days',
  'explain_why_no_slots',
  'summarize_unpaid',
  'validate_gift_card',
  'export_accounting',
  'export_commissions',
  'explain_checkout_total',
  'explain_amount_due_now',
  'explain_guest_checkout_fields',
  'explain_why_sign_in',
  'fix_checkout_validation_error',
  'confirm_my_booking_details',
  'add_booking_to_calendar',
  'get_directions_to_salon',
  'book_another_service',
  'explain_preparation_notes',
  'resume_pending_payment',
  'diagnose_stripe_checkout_failure',
  'pay_at_venue_fallback',
  'resume_booking_draft',
  'explain_slot_no_longer_available',
  'explain_multi_service_payment_return',
  'retry_failed_network_action',
  'explain_voice_input',
  'speak_assistant_reply',
  'give_ai_feedback',
  'explain_rtl_layout',
  'explain_service_price',
  'explain_payment_options_for_service',
  'find_soonest_appointment',
  'compare_services',
  'filter_services_no_prepayment',
  'explain_business_hours_and_location',
  'explain_provider_specialty',
  'explain_professional_profile',
  'explain_any_provider_option',
  'explain_provider_availability',
  'list_subscription_revenue',
  'explain_business_currency',
  'explain_checkout_currency',
  'explain_tenant_currency',
  'explain_package_currency',
  'explain_provider_payment_currency',
  'explain_notification_currency',
  'explain_stripe_currency_warning',
  'diagnose_stripe_checkout_failure',
  'explain_reports_currency',
  'explain_business_languages',
  'explain_booking_languages',
  'explain_booking_date_format',
  'summarize_revenue_kpis',
  'explain_stripe_checkout_currency',
  'check_providers_for_service',
  'book_nearest_slot',
  'apply_gift_card_code',
  'check_gift_card_balance',
  'buy_gift_card',
  'buy_gift_card_physical',
  'choose_payment_method',
  'pay_online',
  'pay_cash_at_visit',
  'purchase_subscription_checkout',
  'explain_why_stripe_required',
  'receipt_status',
  'explain_payment_status',
  'list_gift_card_orders',
  'filter_awaiting_creation',
  'print_packing_slip',
  'gift_card_creation_queue',
  'list_package_appointments_today',
  'list_my_package_visits',
  'list_my_multi_service_groups',
  'delivery_queue',
  'track_gift_card_shipment',
  'shipping_method_quote',
  'order_status_notifications',
]);

@Injectable()
export class AiIntentRescueService {
  rescue(input: IntentRescueInput): IntentRescueResult | null {
    return runIntentRescuePipeline(this, input);
  }

  /** pipe-1.5.1 — provider surface domain rescues */
  runRescueProviderPhase(input: IntentRescueInput): IntentRescueResult | null {
    const { prompt, action } = input;
    if (input.surface !== 'provider') return null;
    const productGuideMisroute = this.tryRescueProductGuideMisroute(
      prompt,
      action,
      input.surface,
      input.assistantMode,
    );
    if (productGuideMisroute) return productGuideMisroute;
    const providerBookingExact = this.tryRescueProviderBooking(prompt, action);
    if (providerBookingExact) return providerBookingExact;
    const providerClientContextExact = this.tryRescueProviderClientContextExact(
      prompt,
      action,
    );
    if (providerClientContextExact) return providerClientContextExact;
    const providerExp3Exact = this.tryRescueProviderExp3Exact(prompt, action);
    if (providerExp3Exact) return providerExp3Exact;
    const providerOpenShiftsExact = this.tryRescueProviderOpenShiftsExact(
      prompt,
      action,
    );
    if (providerOpenShiftsExact) return providerOpenShiftsExact;
    const providerTeamWhosNextExact = this.tryRescueProviderTeamWhosNextExact(
      prompt,
      action,
    );
    if (providerTeamWhosNextExact) return providerTeamWhosNextExact;
    const providerTimeOffExact = this.tryRescueProviderTimeOffExact(
      prompt,
      action,
    );
    if (providerTimeOffExact) return providerTimeOffExact;
    return null;
  }

  /** pipe-1.5.1 — classified action domain disambiguation */
  runRescueClassifiedPhase(
    input: IntentRescueInput,
    ctx: RescuePipelineContext,
  ): IntentRescueResult | null {
    const { prompt, action, params } = input;
    const { employees, customers, timeZone, budgetSurface } = ctx;
    // e2e-bug.159 / e2e-bug.252 — owner cancel/reschedule email alert before
    // booking/reschedule disambiguation (and before react_agent unknown fallthrough).
    if (input.surface === 'dashboard') {
      const ownerAlertEarly = this.tryRescuePushNotifications(prompt, action);
      if (
        ownerAlertEarly?.action === 'toggle_business_email_on_customer_change'
      ) {
        return ownerAlertEarly;
      }
    }
    // e2e-bug.295 — consumer adoption (home-screen widget, push, offline, …)
    // before product-guide / calendar / list_my_upcoming steals. Home-tab tours
    // stay safe: isExplainHomeScreenWidgetPrompt excludes "Home tab".
    if (input.surface === 'customer' || input.surface === 'public') {
      const consumerAdoptionClassifiedEarly = this.tryRescueConsumerAdoption(
        prompt,
        action,
      );
      if (consumerAdoptionClassifiedEarly) {
        return consumerAdoptionClassifiedEarly;
      }
    }
    const productGuideMisroute = this.tryRescueProductGuideMisroute(
      prompt,
      action,
      input.surface,
      input.assistantMode,
    );
    if (productGuideMisroute) return productGuideMisroute;
    const summarizeDayEarly = this.tryRescueSummarizeDay(prompt, action);
    if (summarizeDayEarly) return summarizeDayEarly;
    const summarizeUtilizationEarly = this.tryRescueSummarizeUtilization(
      prompt,
      action,
    );
    if (summarizeUtilizationEarly) return summarizeUtilizationEarly;
    // e2e-bug.154 — unscoped booking totals must not stay on show_appointments /
    // list_bookings / unknown and fall through to react_agent empty-day counts.
    const summarizeBookingsEarly = this.tryRescueSummarizeBookings(
      prompt,
      action,
      params,
    );
    if (summarizeBookingsEarly) return summarizeBookingsEarly;
    // e2e-bug.153 — "how many customers?" must not stay on most_no_shows rankings.
    const unscopedCustomerCountEarly = this.tryRescueUnscopedCustomerCount(
      prompt,
      action,
      params,
    );
    if (unscopedCustomerCountEarly) return unscopedCustomerCountEarly;
    // e2e-bug.137 — "customer retention rate" has no react_agent tool at all.
    const customerRetentionRateEarly = this.tryRescueCustomerRetentionRate(
      prompt,
      action,
      params,
    );
    if (customerRetentionRateEarly) return customerRetentionRateEarly;
    const createServicePrepaymentEarly = this.tryRescueCreateServicePrepayment(
      prompt,
      action,
    );
    if (createServicePrepaymentEarly) return createServicePrepaymentEarly;
    const listServicesPaymentFilterEarly =
      this.tryRescueListServicesPaymentFilter(prompt, action);
    if (listServicesPaymentFilterEarly) return listServicesPaymentFilterEarly;
    // e2e-bug.132 — cancel-policy before budget "deal" → discover_packages steal.
    const explainCancelPolicyBeforeBudget =
      input.surface === 'provider'
        ? null
        : this.tryRescueExplainCancelPolicy(prompt, action);
    if (explainCancelPolicyBeforeBudget) return explainCancelPolicyBeforeBudget;
    // e2e-bug.148 — create_product before budget-discovery's price-mention steal.
    const createProductBeforeBudget = this.tryRescueCreateProductEarly(
      prompt,
      action,
    );
    if (createProductBeforeBudget) return createProductBeforeBudget;
    // e2e-bug.284 — move+then-book-another before budget / single-intent steals.
    const rescheduleThenCreateEarly =
      input.surface === 'dashboard' || input.surface == null
        ? this.tryRescueRescheduleThenCreateBookingCompound(prompt, action)
        : null;
    if (rescheduleThenCreateEarly) return rescheduleThenCreateEarly;
    const budgetDiscoveryEarly =
      input.surface === 'provider'
        ? null
        : this.tryRescueBudgetServiceDiscovery(prompt, action, budgetSurface);
    if (budgetDiscoveryEarly) return budgetDiscoveryEarly;
    const rankDiscoveryEarly = this.tryRescueRankServiceDiscovery(
      prompt,
      action,
      budgetSurface,
    );
    if (rankDiscoveryEarly) return rankDiscoveryEarly;
    const salonCheckoutEarly = this.tryRescueSetupSalonCheckoutCompound(
      prompt,
      action,
      budgetSurface,
    );
    if (salonCheckoutEarly) return salonCheckoutEarly;
    const paymentMatrixEarly =
      this.tryRescueConfigureServicesPaymentMatrixCompound(
        prompt,
        action,
        budgetSurface,
      );
    if (paymentMatrixEarly) return paymentMatrixEarly;
    const cashOnlineEarly = this.tryRescueCashAndOnlinePaymentCompound(
      prompt,
      action,
      budgetSurface,
    );
    if (cashOnlineEarly) return cashOnlineEarly;
    const declineCategoryEarly =
      this.tryRescueDeclineOnlinePaymentCategoryCompound(
        prompt,
        action,
        budgetSurface,
      );
    if (declineCategoryEarly) return declineCategoryEarly;
    const salonNotificationsEarly =
      this.tryRescueOnboardSalonNotificationsCompound(
        prompt,
        action,
        budgetSurface,
      );
    if (salonNotificationsEarly) return salonNotificationsEarly;
    const consumerAppGrowthEarly =
      this.tryRescueLaunchConsumerAppGrowthCompound(
        prompt,
        action,
        budgetSurface,
      );
    if (consumerAppGrowthEarly) return consumerAppGrowthEarly;
    // e2e-bug.92/93 — named-provider + collapse escapes before availability disambiguation.
    const providerNameReadsBeforeDisambiguation =
      input.surface === 'customer' || input.surface === 'public'
        ? this.tryRescueNamedProviderReadIntents(prompt, action)
        : null;
    if (providerNameReadsBeforeDisambiguation) {
      return providerNameReadsBeforeDisambiguation;
    }
    const checkProvidersCollapseBeforeDisambiguation =
      input.surface === 'customer' || input.surface === 'public'
        ? this.tryRescueCheckProvidersCollapseIntents(
            prompt,
            action,
            input.surface,
          )
        : null;
    if (checkProvidersCollapseBeforeDisambiguation) {
      return checkProvidersCollapseBeforeDisambiguation;
    }
    const rankDiscoveryBeforeDisambiguation =
      budgetSurface === 'customer' || budgetSurface === 'public'
        ? this.tryRescueRankServiceDiscovery(prompt, action, budgetSurface)
        : null;
    if (rankDiscoveryBeforeDisambiguation) {
      return rankDiscoveryBeforeDisambiguation;
    }
    const disambiguated = this.disambiguateMisclassified(
      prompt,
      action,
      params,
      employees,
      customers,
      timeZone,
      input.surface,
    );
    if (disambiguated) return disambiguated;
    const clinicCompoundEarly = this.tryRescueClinicCompound(prompt, action);
    if (clinicCompoundEarly) return clinicCompoundEarly;
    const explainTourMeetingPointEarly = this.tryRescueExplainTourMeetingPoint(
      prompt,
      action,
    );
    if (explainTourMeetingPointEarly) return explainTourMeetingPointEarly;
    const explainTourBookingRecordEarly =
      this.tryRescueExplainTourBookingRecord(prompt, action);
    if (explainTourBookingRecordEarly) return explainTourBookingRecordEarly;
    const fixCheckoutValidationErrorEarly =
      this.tryRescueFixCheckoutValidationError(prompt, action);
    if (fixCheckoutValidationErrorEarly) return fixCheckoutValidationErrorEarly;
    const getDirectionsToSalonEarly = this.tryRescueGetDirectionsToSalon(
      prompt,
      action,
    );
    if (getDirectionsToSalonEarly) return getDirectionsToSalonEarly;
    const explainLabPrepEarly = this.tryRescueExplainLabPrep(prompt, action);
    if (explainLabPrepEarly) return explainLabPrepEarly;
    const explainPublicIntakeFormEarly = this.tryRescueExplainPublicIntakeForm(
      prompt,
      action,
    );
    if (explainPublicIntakeFormEarly) return explainPublicIntakeFormEarly;
    const explainClinicBookingFieldsEarly =
      this.tryRescueExplainClinicBookingFields(prompt, action);
    if (explainClinicBookingFieldsEarly) return explainClinicBookingFieldsEarly;
    const explainPreparationNotesEarly = this.tryRescueExplainPreparationNotes(
      prompt,
      action,
    );
    if (explainPreparationNotesEarly) return explainPreparationNotesEarly;
    const explainCalendarSpanClassifiedEarly =
      this.tryRescueExplainTourCalendarSpan(prompt, action);
    if (explainCalendarSpanClassifiedEarly) {
      return explainCalendarSpanClassifiedEarly;
    }
    const listCalendarWeekClassifiedEarly = this.tryRescueListTourCalendarWeek(
      prompt,
      action,
    );
    if (listCalendarWeekClassifiedEarly) {
      return listCalendarWeekClassifiedEarly;
    }
    // e2e-bug.78 — affirmative after cancel-all preview before other steals.
    const cancelAllUpcomingConfirmEarly =
      input.surface === 'customer' || input.surface === 'public'
        ? this.tryRescueCancelAllUpcomingConfirm(prompt, action, params)
        : null;
    if (cancelAllUpcomingConfirmEarly) return cancelAllUpcomingConfirmEarly;
    // e2e-bug.79 — before add_booking_to_calendar steals "get … or … visit".
    const explainSubscriptionVsOneTimeEarly =
      input.surface === 'customer' || input.surface === 'public'
        ? this.tryRescueExplainSubscriptionVsOneTime(prompt, action)
        : null;
    if (explainSubscriptionVsOneTimeEarly) {
      return explainSubscriptionVsOneTimeEarly;
    }
    const addBookingToCalendarEarly = this.tryRescueAddBookingToCalendar(
      prompt,
      action,
      input.surface,
    );
    if (addBookingToCalendarEarly) return addBookingToCalendarEarly;
    const bookAnotherServiceEarly = this.tryRescueBookAnotherService(
      prompt,
      action,
    );
    if (bookAnotherServiceEarly) return bookAnotherServiceEarly;
    const explainShareRewardEarly = this.tryRescueExplainShareReward(
      prompt,
      action,
    );
    if (explainShareRewardEarly) return explainShareRewardEarly;
    const shareMyBookingEarly = this.tryRescueShareMyBooking(prompt, action);
    if (shareMyBookingEarly) return shareMyBookingEarly;
    const explainPackageVisitRulesEarly =
      this.tryRescueExplainPackageVisitRules(prompt, action);
    if (explainPackageVisitRulesEarly) return explainPackageVisitRulesEarly;
    const explainDepositForfeitureEarly =
      input.surface === 'provider'
        ? null
        : this.tryRescueExplainDepositForfeiture(prompt, action);
    if (explainDepositForfeitureEarly) return explainDepositForfeitureEarly;
    const explainCancelPolicyEarly =
      input.surface === 'provider'
        ? null
        : this.tryRescueExplainCancelPolicy(prompt, action);
    if (explainCancelPolicyEarly) return explainCancelPolicyEarly;
    const signInToManageBookingEarly = this.tryRescueSignInToManageBooking(
      prompt,
      action,
    );
    if (signInToManageBookingEarly) return signInToManageBookingEarly;
    const recoverLostManageLinkEarly = this.tryRescueRecoverLostManageLink(
      prompt,
      action,
    );
    if (recoverLostManageLinkEarly) return recoverLostManageLinkEarly;
    const getManageLinkEarly = this.tryRescueGetManageLink(prompt, action);
    if (getManageLinkEarly) return getManageLinkEarly;
    const reportBookingProblemEarly = this.tryRescueReportBookingProblem(
      prompt,
      action,
    );
    if (reportBookingProblemEarly) return reportBookingProblemEarly;
    const checkoutTaxEarly = this.tryRescueCheckoutTax(prompt, action);
    if (checkoutTaxEarly) return checkoutTaxEarly;
    const consumerCheckoutTaxEarly = this.tryRescueConsumerCheckoutTax(
      prompt,
      action,
    );
    if (consumerCheckoutTaxEarly) return consumerCheckoutTaxEarly;
    const signInAfterBookingEarly = this.tryRescueSignInAfterBooking(
      prompt,
      action,
    );
    if (signInAfterBookingEarly) return signInAfterBookingEarly;
    const explainPostVisitReviewPromptEarly =
      this.tryRescueExplainPostVisitReviewPrompt(prompt, action);
    if (explainPostVisitReviewPromptEarly) {
      return explainPostVisitReviewPromptEarly;
    }
    // e2e-bug.146 — configure_business_tax before leave_visit_review ("tax rate" ≠ review).
    const businessTaxBeforeReviewEarly = this.tryRescueBusinessTaxEarly(
      prompt,
      action,
    );
    if (businessTaxBeforeReviewEarly) return businessTaxBeforeReviewEarly;
    const leaveVisitReviewEarly =
      input.surface === 'provider'
        ? null
        : this.tryRescueLeaveVisitReview(prompt, action);
    if (leaveVisitReviewEarly) return leaveVisitReviewEarly;
    const notifyRunningLateEarly =
      input.surface === 'provider'
        ? null
        : this.tryRescueNotifyRunningLate(prompt, action);
    if (notifyRunningLateEarly) return notifyRunningLateEarly;
    // e2e-bug.88 — pay_online before list/confirm steals "pay … for my booking".
    const payOnlineEarly =
      input.surface === 'provider'
        ? null
        : this.tryRescuePayOnline(prompt, action);
    if (payOnlineEarly) return payOnlineEarly;
    const listMyUpcomingAppointmentsEarly =
      input.surface === 'provider'
        ? null
        : this.tryRescueListMyUpcomingAppointments(prompt, action);
    if (listMyUpcomingAppointmentsEarly) return listMyUpcomingAppointmentsEarly;
    const confirmMyBookingDetailsEarly =
      input.surface === 'provider'
        ? null
        : this.tryRescueConfirmMyBookingDetails(prompt, action);
    if (confirmMyBookingDetailsEarly) return confirmMyBookingDetailsEarly;
    // e2e-bug.76 — locale before explain_why_sign_in ("what" + "account").
    const myLocaleEarly =
      input.surface === 'provider'
        ? null
        : this.tryRescueMyLocale(prompt, action);
    if (myLocaleEarly) return myLocaleEarly;
    const explainWhySignInEarly = this.tryRescueExplainWhySignIn(
      prompt,
      action,
    );
    if (explainWhySignInEarly) return explainWhySignInEarly;
    // e2e-bug.93 — named provider availability/profile/specialty before guest-checkout steal.
    const providerNameReadsEarly =
      input.surface === 'customer' || input.surface === 'public'
        ? this.tryRescueNamedProviderReadIntents(prompt, action)
        : null;
    if (providerNameReadsEarly) return providerNameReadsEarly;
    // e2e-bug.92 — reviews / any-provider / timed book before check_providers collapse.
    const checkProvidersCollapseEarly =
      input.surface === 'customer' || input.surface === 'public'
        ? this.tryRescueCheckProvidersCollapseIntents(
            prompt,
            action,
            input.surface,
          )
        : null;
    if (checkProvidersCollapseEarly) return checkProvidersCollapseEarly;
    const explainGuestCheckoutFieldsEarly =
      this.tryRescueExplainGuestCheckoutFields(prompt, action);
    if (explainGuestCheckoutFieldsEarly) return explainGuestCheckoutFieldsEarly;
    const resumePendingPaymentEarly = this.tryRescueResumePendingPayment(
      prompt,
      action,
      input.surface,
    );
    if (resumePendingPaymentEarly) return resumePendingPaymentEarly;
    const explainLabPrepBeforeClinicEarly = this.tryRescueExplainLabPrep(
      prompt,
      action,
    );
    if (explainLabPrepBeforeClinicEarly) return explainLabPrepBeforeClinicEarly;
    const explainClinicBookingEarly = this.tryRescueExplainClinicBooking(
      prompt,
      action,
    );
    if (explainClinicBookingEarly) return explainClinicBookingEarly;
    const scheduling = this.tryRescueScheduling(prompt, action, params);
    if (scheduling) return scheduling;
    // e2e-bug.146 — location mutates before business-hours/location reads nested
    // inside tryRescueBusinessCurrency (bare "location"/"address" cues).
    const locationsBeforeHoursEarly = this.tryRescueLocations(prompt, action);
    if (locationsBeforeHoursEarly) return locationsBeforeHoursEarly;
    const businessCurrencyEarly = this.tryRescueBusinessCurrency(
      prompt,
      action,
      input.surface,
    );
    if (businessCurrencyEarly) return businessCurrencyEarly;
    const clinicTestResultEarly = this.tryRescueClinicTestResult(
      prompt,
      action,
    );
    if (clinicTestResultEarly) return clinicTestResultEarly;
    const notificationDateEarly = this.tryRescueNotificationDateFormat(
      prompt,
      action,
    );
    if (notificationDateEarly) return notificationDateEarly;
    const clinicPatientChartEarly = this.tryRescueClinicPatientChart(
      prompt,
      action,
      input.surface,
    );
    if (clinicPatientChartEarly) return clinicPatientChartEarly;
    const providerClinicCollectionEarly =
      this.tryRescueProviderClinicCollection(prompt, action);
    if (providerClinicCollectionEarly) return providerClinicCollectionEarly;
    // e2e-bug.139 — support tickets / unread messages before agent-ops steals.
    const supportInboxBeforeAgentOps = this.tryRescueExplainSupportInbox(
      prompt,
      action,
    );
    if (supportInboxBeforeAgentOps) return supportInboxBeforeAgentOps;
    // e2e-bug.152 — agent-ops before clinic tasks so "pending AI agent tasks"
    // cannot be stolen by broad clinic pending+tasks matching.
    const agentOpsBeforeClinicEarly = this.tryRescueAgentOps(prompt, action);
    if (agentOpsBeforeClinicEarly) return agentOpsBeforeClinicEarly;
    const providerClinicTasksAndResultsEarly =
      this.tryRescueProviderClinicTasksAndResults(prompt, action);
    if (providerClinicTasksAndResultsEarly)
      return providerClinicTasksAndResultsEarly;
    const providerClinicLabBookingEarly =
      this.tryRescueProviderClinicLabBooking(prompt, action);
    if (providerClinicLabBookingEarly) return providerClinicLabBookingEarly;
    const trackLabOrderStatusEarly = this.tryRescueTrackLabOrderStatus(
      prompt,
      action,
    );
    if (trackLabOrderStatusEarly) return trackLabOrderStatusEarly;
    const listMyDocumentsEarly = this.tryRescueListMyDocuments(prompt, action);
    if (listMyDocumentsEarly) return listMyDocumentsEarly;
    const explainAbnormalResultFlagEarly =
      this.tryRescueExplainAbnormalResultFlag(prompt, action);
    if (explainAbnormalResultFlagEarly) return explainAbnormalResultFlagEarly;
    const notifyWhenResultsReadyEarly = this.tryRescueNotifyWhenResultsReady(
      prompt,
      action,
    );
    if (notifyWhenResultsReadyEarly) return notifyWhenResultsReadyEarly;
    // e2e-bug.133 — tour capacity-gated booking before clinic result-status steal.
    const tourGroupBeforeClinicEarly =
      this.tryRescueBookTourNearestDepartureCompound(prompt, action);
    if (tourGroupBeforeClinicEarly) return tourGroupBeforeClinicEarly;
    const tourConsumerBeforeClinicEarly = this.tryRescueTourConsumer(
      prompt,
      action,
    );
    if (tourConsumerBeforeClinicEarly) return tourConsumerBeforeClinicEarly;
    // e2e-bug.94 — soonest/next-available appointment before clinic/marketing steal.
    const findSoonestBeforeClinicEarly =
      input.surface === 'customer' || input.surface === 'public'
        ? this.tryRescueFindSoonestAppointment(prompt, action)
        : null;
    if (findSoonestBeforeClinicEarly) return findSoonestBeforeClinicEarly;
    const consumerClinicTestResultsEarly =
      this.tryRescueConsumerClinicTestResults(prompt, action);
    if (consumerClinicTestResultsEarly) return consumerClinicTestResultsEarly;
    const consumerClinicLabBookingEarly =
      this.tryRescueConsumerClinicLabBooking(prompt, action);
    if (consumerClinicLabBookingEarly) return consumerClinicLabBookingEarly;
    // e2e-bug.77 — dashboard clinic lab (push_lab_booking_to_patient) never on customer/public.
    const dashboardClinicLabBookingEarly =
      input.surface === 'customer' || input.surface === 'public'
        ? null
        : this.tryRescueDashboardClinicLabBooking(prompt, action);
    if (dashboardClinicLabBookingEarly) return dashboardClinicLabBookingEarly;
    const clinicTestOrderEarly = this.tryRescueClinicTestOrder(prompt, action);
    if (clinicTestOrderEarly) return clinicTestOrderEarly;
    const dismissRecommendationsEarly = this.tryRescueDismissRecommendations(
      prompt,
      action,
    );
    if (dismissRecommendationsEarly) return dismissRecommendationsEarly;
    const consumerCheckoutSuccessEarly = this.tryRescueConsumerCheckoutSuccess(
      prompt,
      action,
    );
    if (consumerCheckoutSuccessEarly) return consumerCheckoutSuccessEarly;
    const recommendationProductEarly = this.tryRescueRecommendationProduct(
      prompt,
      action,
    );
    if (recommendationProductEarly) return recommendationProductEarly;
    const checkoutRecommendationsEarly = this.tryRescueCheckoutRecommendations(
      prompt,
      action,
    );
    if (checkoutRecommendationsEarly) return checkoutRecommendationsEarly;
    // e2e-bug.129 — dashboard SaaS billing only; never steal customer
    // "visits left on my plan" → open_billing_settings on customer/public.
    const billingLoyaltyEarly =
      input.surface === 'dashboard'
        ? this.tryRescueBillingLoyaltyDashboard(prompt, action)
        : null;
    if (billingLoyaltyEarly) return billingLoyaltyEarly;
    // e2e-bug.144 — catalog soft-delete before staff/ops steals
    // (delete/remove service ≠ deactivate_employee / unassign_employee_services).
    const catalogDeactivateEarly = this.tryRescueCatalogDeactivateService(
      prompt,
      action,
    );
    if (catalogDeactivateEarly) return catalogDeactivateEarly;
    // e2e-bug.286 — "Create a booking for the first available…" before
    // create_employee steals via Create + any provider.
    const createBookingNotEmployeeEarly =
      this.tryRescueCreateBookingNotEmployee(prompt, action, params);
    if (createBookingNotEmployeeEarly) return createBookingNotEmployeeEarly;
    const staffOperationsEarly = this.tryRescueStaffOperations(prompt, action);
    if (staffOperationsEarly) return staffOperationsEarly;
    const waitlistDashboardEarly =
      input.surface === 'provider'
        ? null
        : this.tryRescueWaitlistDashboard(prompt, action);
    if (waitlistDashboardEarly) return waitlistDashboardEarly;
    const operations = this.tryRescueOperations(prompt, action, params);
    if (operations) return operations;
    const providerBookingEarly = this.tryRescueProviderBooking(prompt, action);
    if (providerBookingEarly) return providerBookingEarly;
    const catalogBeforeClientContext = this.tryRescueCatalog(prompt, action);
    if (catalogBeforeClientContext) return catalogBeforeClientContext;
    const providerPushSetupEarly = this.tryRescueProviderPushSetup(
      prompt,
      action,
    );
    if (providerPushSetupEarly) return providerPushSetupEarly;
    // e2e-bug.244–247 — provider FAQ explainers before Exp2/Exp3 so live
    // mutate/read intents (floor, reassign, time-off list, etc.) cannot steal.
    if (input.surface === 'provider') {
      const visitStatusExplainersBeforeExp2 =
        this.tryRescueVisitStatusExplainers(prompt, action, params);
      if (visitStatusExplainersBeforeExp2) {
        return visitStatusExplainersBeforeExp2;
      }
      const calendarSchedulingExplainersBeforeExp2 =
        this.tryRescueCalendarSchedulingExplainers(prompt, action, params);
      if (calendarSchedulingExplainersBeforeExp2) {
        return calendarSchedulingExplainersBeforeExp2;
      }
      const assistantUxExplainersBeforeExp2 =
        this.tryRescueAssistantUxExplainers(prompt, action, params);
      if (assistantUxExplainersBeforeExp2) {
        return assistantUxExplainersBeforeExp2;
      }
      const dashboardHandoffBeforeExp2 = this.tryRescueDashboardHandoff(
        prompt,
        action,
        params,
      );
      if (dashboardHandoffBeforeExp2) return dashboardHandoffBeforeExp2;
    }
    const providerExp2Early = this.tryRescueProviderExp2(prompt, action);
    if (providerExp2Early) return providerExp2Early;
    // e2e-bug.131 — provider retail/cart rescues must not steal customer/public cart.
    const providerExp3Early =
      input.surface === 'provider'
        ? this.tryRescueProviderExp3(prompt, action)
        : null;
    if (providerExp3Early) return providerExp3Early;
    const providerOpenShiftsEarly = this.tryRescueProviderOpenShifts(
      prompt,
      action,
    );
    if (providerOpenShiftsEarly) return providerOpenShiftsEarly;
    const providerTeamWhosNextEarly = this.tryRescueProviderTeamWhosNext(
      prompt,
      action,
    );
    if (providerTeamWhosNextEarly) return providerTeamWhosNextEarly;
    if (input.surface === 'provider') {
      // Per-leg multi-service before whole-visit complete (e2e-bug.241)
      const markMultiServiceStepDoneEarly =
        this.tryRescueMarkMultiServiceStepDone(prompt, action, params);
      if (markMultiServiceStepDoneEarly) return markMultiServiceStepDoneEarly;
      const markVisitCompleteEarly = this.tryRescueMarkVisitComplete(
        prompt,
        action,
        params,
      );
      if (markVisitCompleteEarly) return markVisitCompleteEarly;
      const markVisitInProgressEarly = this.tryRescueMarkVisitInProgress(
        prompt,
        action,
        params,
      );
      if (markVisitInProgressEarly) return markVisitInProgressEarly;
      const searchPatientEarly = this.tryRescueSearchPatient(
        prompt,
        action,
        params,
      );
      if (searchPatientEarly) return searchPatientEarly;
      const handoffToDashboardPhiEarly = this.tryRescueHandoffToDashboardPhi(
        prompt,
        action,
        params,
      );
      if (handoffToDashboardPhiEarly) return handoffToDashboardPhiEarly;
      const confirmPendingBookingEarly = this.tryRescueConfirmPendingBooking(
        prompt,
        action,
        params,
      );
      if (confirmPendingBookingEarly) return confirmPendingBookingEarly;
      const visitStatusExplainersEarly = this.tryRescueVisitStatusExplainers(
        prompt,
        action,
        params,
      );
      if (visitStatusExplainersEarly) return visitStatusExplainersEarly;
      const calendarSchedulingExplainersEarly =
        this.tryRescueCalendarSchedulingExplainers(prompt, action, params);
      if (calendarSchedulingExplainersEarly) {
        return calendarSchedulingExplainersEarly;
      }
      const assistantUxExplainersEarly = this.tryRescueAssistantUxExplainers(
        prompt,
        action,
        params,
      );
      if (assistantUxExplainersEarly) return assistantUxExplainersEarly;
      const dashboardHandoffEarly = this.tryRescueDashboardHandoff(
        prompt,
        action,
        params,
      );
      if (dashboardHandoffEarly) return dashboardHandoffEarly;
      const providerBlockScheduleEarly = this.tryRescueProviderBlockSchedule(
        prompt,
        action,
        params,
        input.surface,
      );
      if (providerBlockScheduleEarly) return providerBlockScheduleEarly;
      const endOfDaySummaryEarly = this.tryRescueEndOfDaySummary(
        prompt,
        action,
      );
      if (endOfDaySummaryEarly) return endOfDaySummaryEarly;
      const explainTodayTimelineEarly = this.tryRescueExplainTodayTimeline(
        prompt,
        action,
      );
      if (explainTodayTimelineEarly) return explainTodayTimelineEarly;
      const whoIsNextEarly = this.tryRescueWhoIsNext(prompt, action, params);
      if (whoIsNextEarly) return whoIsNextEarly;
      const showAppointmentsEarly = this.tryRescueShowAppointments(
        prompt,
        action,
        params,
      );
      if (showAppointmentsEarly) return showAppointmentsEarly;
    }
    const providerTimeOffEarly = this.tryRescueProviderTimeOff(prompt, action);
    if (providerTimeOffEarly) return providerTimeOffEarly;
    // Provider-mobile client context only — e2e-bug.129: must not steal
    // customer/public "visits left on my plan" → explain_package_visit_context.
    const providerClientContextEarly =
      input.surface === 'provider'
        ? this.tryRescueProviderClientContext(prompt, action)
        : null;
    if (providerClientContextEarly) return providerClientContextEarly;
    const providerEarningsEarly =
      input.surface === 'provider'
        ? this.tryRescueProviderEarnings(prompt, action)
        : null;
    if (providerEarningsEarly) return providerEarningsEarly;
    const agentOpsEarly = this.tryRescueAgentOps(prompt, action);
    if (agentOpsEarly) return agentOpsEarly;
    // e2e-bug.129 — customer membership explain before meta-ops AI-quota
    // ("how many … left on my plan") and dashboard billing steals.
    const explainMySubscriptionEarly =
      input.surface === 'customer' || input.surface === 'public'
        ? this.tryRescueExplainMySubscription(prompt, action)
        : null;
    if (explainMySubscriptionEarly) return explainMySubscriptionEarly;
    const metaOpsEarly = this.tryRescueMetaOps(prompt, action);
    if (metaOpsEarly) return metaOpsEarly;
    // e2e-bug.134 — before booking-depth / policy steals "can I cancel" + manage URL.
    // e2e-bug.103 — also accept bookingId+manageToken already in request params.
    const manageBookingWithTokenEarly =
      input.surface === 'customer' || input.surface === 'public'
        ? this.tryRescueManageBookingWithToken(prompt, action, params)
        : null;
    if (manageBookingWithTokenEarly) return manageBookingWithTokenEarly;
    // e2e-bug.103 / e2e-bug.77 — booking-depth intents are dashboard staff-only;
    // never rescue customer/public prompts into create_package_booking etc.
    const bookingDepthEarly =
      input.surface === 'customer' || input.surface === 'public'
        ? null
        : this.tryRescueBookingDepth(prompt, action, employees, customers);
    if (bookingDepthEarly) return bookingDepthEarly;
    const cancelPackageVisitSelfEarly = this.tryRescueCancelPackageVisitSelf(
      prompt,
      action,
    );
    if (cancelPackageVisitSelfEarly) return cancelPackageVisitSelfEarly;
    const reschedulePackageVisitSelfEarly =
      this.tryRescueReschedulePackageVisitSelf(prompt, action);
    if (reschedulePackageVisitSelfEarly) return reschedulePackageVisitSelfEarly;
    const resumeBookingDraftEarly = this.tryRescueResumeBookingDraft(
      prompt,
      action,
    );
    if (resumeBookingDraftEarly) return resumeBookingDraftEarly;
    const explainSlotNoLongerAvailableEarly =
      this.tryRescueExplainSlotNoLongerAvailable(prompt, action);
    if (explainSlotNoLongerAvailableEarly)
      return explainSlotNoLongerAvailableEarly;
    const explainMultiServicePaymentReturnEarly =
      this.tryRescueExplainMultiServicePaymentReturn(prompt, action);
    if (explainMultiServicePaymentReturnEarly) {
      return explainMultiServicePaymentReturnEarly;
    }
    const retryFailedNetworkActionEarly =
      this.tryRescueRetryFailedNetworkAction(prompt, action);
    if (retryFailedNetworkActionEarly) return retryFailedNetworkActionEarly;
    const speakAssistantReplyEarly = this.tryRescueSpeakAssistantReply(
      prompt,
      action,
    );
    if (speakAssistantReplyEarly) return speakAssistantReplyEarly;
    // Provider feedback before customer give_ai_feedback (e2e-bug.243)
    const giveProviderAiFeedbackEarly =
      input.surface === 'provider'
        ? this.tryRescueGiveProviderAiFeedback(prompt, action)
        : null;
    if (giveProviderAiFeedbackEarly) return giveProviderAiFeedbackEarly;
    const giveAiFeedbackEarly = this.tryRescueGiveAiFeedback(prompt, action);
    if (giveAiFeedbackEarly) return giveAiFeedbackEarly;
    const explainRtlLayoutEarly = this.tryRescueExplainRtlLayout(
      prompt,
      action,
    );
    if (explainRtlLayoutEarly) return explainRtlLayoutEarly;
    const explainVoiceInputEarly = this.tryRescueExplainVoiceInput(
      prompt,
      action,
    );
    if (explainVoiceInputEarly) return explainVoiceInputEarly;
    const selfServiceBooking = this.tryRescueSelfServiceBooking(
      prompt,
      action,
      input.surface,
    );
    if (selfServiceBooking) return selfServiceBooking;
    const pushNotifications = this.tryRescuePushNotifications(prompt, action);
    if (pushNotifications) return pushNotifications;
    // e2e-bug.232 — claim referral before marketing apply_promo_code_checkout
    // steals "redeem/apply referral code" (promo extractor used to treat
    // "referral" as promoCode).
    const claimReferralCode = this.tryRescueClaimReferralCode(prompt, action);
    if (claimReferralCode) return claimReferralCode;
    const marketingGrowth = this.tryRescueMarketingGrowth(prompt, action);
    if (marketingGrowth) return marketingGrowth;
    // e2e-bug.77 — dashboard/provider retail-finance (search_retail_sku) never on customer/public.
    const retailFinance =
      input.surface === 'customer' || input.surface === 'public'
        ? null
        : this.tryRescueRetailFinance(prompt, action, params);
    if (retailFinance) return retailFinance;
    const locations = this.tryRescueLocations(prompt, action);
    if (locations) return locations;
    const integrations = this.tryRescueIntegrations(prompt, action);
    if (integrations) return integrations;
    // e2e-bug.77 — dashboard gift-fulfillment mutates (cancel_gift_card_order) never on customer/public.
    const giftFulfillment =
      input.surface === 'customer' || input.surface === 'public'
        ? null
        : this.tryRescueGiftFulfillment(prompt, action);
    if (giftFulfillment) return giftFulfillment;
    // e2e-bug.83 — before payments apply_gift_card_code steals "redeem referral code".
    // (claim_referral already attempted above for promo; keep for gift-card ordering.)
    const claimReferralCodeLate = this.tryRescueClaimReferralCode(
      prompt,
      action,
    );
    if (claimReferralCodeLate) return claimReferralCodeLate;
    const payments = this.tryRescuePayments(prompt, action);
    if (payments) return payments;
    const scheduleResources = this.tryRescueScheduleResources(prompt, action);
    if (scheduleResources) return scheduleResources;
    const customerCrm = this.tryRescueCustomerCrm(prompt, action, params);
    if (customerCrm) return customerCrm;
    const dashboardCustomerRead = this.tryRescueDashboardCustomerRead(
      prompt,
      action,
      params,
    );
    if (dashboardCustomerRead) return dashboardCustomerRead;
    return null;
  }

  /** pipe-1.5.1 — unknown intent domain rescue chain */
  runRescueUnknownPhase(
    input: IntentRescueInput,
    ctx: RescuePipelineContext,
  ): IntentRescueResult | null {
    const { prompt, action, params, reasoning } = input;
    const { employees, customers, timeZone, budgetSurface } = ctx;

    // e2e-bug.280 — short give_ai_feedback cues ("Helpful", "Bad answer", …)
    // classify as unknown, so runRescueClassifiedPhase is skipped. Mirror the
    // classified-phase early rescues here for customer/public.
    if (input.surface === 'customer' || input.surface === 'public') {
      const speakAssistantReplyUnknownEarly = this.tryRescueSpeakAssistantReply(
        prompt,
        action,
      );
      if (speakAssistantReplyUnknownEarly) {
        return speakAssistantReplyUnknownEarly;
      }
      const giveAiFeedbackUnknownEarly = this.tryRescueGiveAiFeedback(
        prompt,
        action,
      );
      if (giveAiFeedbackUnknownEarly) return giveAiFeedbackUnknownEarly;
      const explainRtlLayoutUnknownEarly = this.tryRescueExplainRtlLayout(
        prompt,
        action,
      );
      if (explainRtlLayoutUnknownEarly) return explainRtlLayoutUnknownEarly;
      const explainVoiceInputUnknownEarly = this.tryRescueExplainVoiceInput(
        prompt,
        action,
      );
      if (explainVoiceInputUnknownEarly) return explainVoiceInputUnknownEarly;
    }

    // e2e-bug.252 — owner alert toggle before unknown→react_agent fallthrough.
    if (input.surface === 'dashboard') {
      const ownerAlertUnknownEarly = this.tryRescuePushNotifications(
        prompt,
        action,
      );
      if (
        ownerAlertUnknownEarly?.action ===
        'toggle_business_email_on_customer_change'
      ) {
        return ownerAlertUnknownEarly;
      }
    }

    // e2e-bug.134 — a pasted manage link combined with a concrete date/time
    // ("Reschedule my booking to Friday 2pm https://.../manage?bookingId=book-9&...")
    // must still reach tryRescueManageBookingWithToken, not get stolen into
    // book_appointment by the timed-book heuristic below (its bare `\bbook\b`
    // regex matches the literal "book-9" bookingId value inside the URL).
    const manageLinkCredsForUnknownPhase =
      extractManageLinkCredentialsFromPrompt(prompt);
    if (
      manageLinkCredsForUnknownPhase.bookingId &&
      manageLinkCredsForUnknownPhase.manageToken
    ) {
      const manageTokenUnknown = this.tryRescueManageBookingWithToken(
        prompt,
        action,
        params,
      );
      if (manageTokenUnknown) return manageTokenUnknown;
    }

    const summarizeDayUnknownEarly = this.tryRescueSummarizeDay(prompt, action);
    if (summarizeDayUnknownEarly) return summarizeDayUnknownEarly;
    const summarizeUtilizationUnknownEarly = this.tryRescueSummarizeUtilization(
      prompt,
      action,
    );
    if (summarizeUtilizationUnknownEarly)
      return summarizeUtilizationUnknownEarly;
    const reportsCurrencyUnknown = this.tryRescueReportsCurrency(
      prompt,
      action,
    );
    if (reportsCurrencyUnknown) return reportsCurrencyUnknown;

    const createServicePrepaymentUnknown =
      this.tryRescueCreateServicePrepayment(prompt, action);
    if (createServicePrepaymentUnknown) return createServicePrepaymentUnknown;

    const explainPackageVisitRulesUnknownEarly =
      this.tryRescueExplainPackageVisitRules(prompt, action);
    if (explainPackageVisitRulesUnknownEarly) {
      return explainPackageVisitRulesUnknownEarly;
    }

    const explainDepositForfeitureUnknownEarly =
      input.surface === 'provider'
        ? null
        : this.tryRescueExplainDepositForfeiture(prompt, action);
    if (explainDepositForfeitureUnknownEarly) {
      return explainDepositForfeitureUnknownEarly;
    }

    const explainCancelPolicyUnknownEarly =
      input.surface === 'provider'
        ? null
        : this.tryRescueExplainCancelPolicy(prompt, action);
    if (explainCancelPolicyUnknownEarly) return explainCancelPolicyUnknownEarly;

    const signInToManageBookingUnknownEarly =
      this.tryRescueSignInToManageBooking(prompt, action);
    if (signInToManageBookingUnknownEarly)
      return signInToManageBookingUnknownEarly;

    const recoverLostManageLinkUnknownEarly =
      this.tryRescueRecoverLostManageLink(prompt, action);
    if (recoverLostManageLinkUnknownEarly)
      return recoverLostManageLinkUnknownEarly;

    const getManageLinkUnknownEarly = this.tryRescueGetManageLink(
      prompt,
      action,
    );
    if (getManageLinkUnknownEarly) return getManageLinkUnknownEarly;

    const reportBookingProblemUnknownEarly = this.tryRescueReportBookingProblem(
      prompt,
      action,
    );
    if (reportBookingProblemUnknownEarly)
      return reportBookingProblemUnknownEarly;

    const checkoutTaxUnknownEarly = this.tryRescueCheckoutTax(prompt, action);
    if (checkoutTaxUnknownEarly) return checkoutTaxUnknownEarly;

    const consumerCheckoutTaxUnknownEarly = this.tryRescueConsumerCheckoutTax(
      prompt,
      action,
    );
    if (consumerCheckoutTaxUnknownEarly) return consumerCheckoutTaxUnknownEarly;

    const signInAfterBookingUnknownEarly = this.tryRescueSignInAfterBooking(
      prompt,
      action,
    );
    if (signInAfterBookingUnknownEarly) return signInAfterBookingUnknownEarly;

    const explainPostVisitReviewPromptUnknownEarly =
      this.tryRescueExplainPostVisitReviewPrompt(prompt, action);
    if (explainPostVisitReviewPromptUnknownEarly) {
      return explainPostVisitReviewPromptUnknownEarly;
    }

    // e2e-bug.146 — configure_business_tax before leave_visit_review ("tax rate" ≠ review).
    const businessTaxBeforeReviewUnknown = this.tryRescueBusinessTaxEarly(
      prompt,
      action,
    );
    if (businessTaxBeforeReviewUnknown) return businessTaxBeforeReviewUnknown;
    // e2e-bug.137 — same "bare `rate`" steal as e2e-bug.146, this time for
    // "customer retention rate" landing on leave_visit_review's REVIEW_CUE.
    const customerRetentionRateBeforeReviewUnknown =
      this.tryRescueCustomerRetentionRate(prompt, action, params);
    if (customerRetentionRateBeforeReviewUnknown) {
      return customerRetentionRateBeforeReviewUnknown;
    }
    const leaveVisitReviewUnknownEarly =
      input.surface === 'provider'
        ? null
        : this.tryRescueLeaveVisitReview(prompt, action);
    if (leaveVisitReviewUnknownEarly) return leaveVisitReviewUnknownEarly;

    const notifyRunningLateUnknownEarly =
      input.surface === 'provider'
        ? null
        : this.tryRescueNotifyRunningLate(prompt, action);
    if (notifyRunningLateUnknownEarly) return notifyRunningLateUnknownEarly;

    const listServicesPaymentFilterUnknown =
      this.tryRescueListServicesPaymentFilter(prompt, action);
    if (listServicesPaymentFilterUnknown)
      return listServicesPaymentFilterUnknown;

    // e2e-bug.148 — create_product before budget-discovery's price-mention steal.
    const createProductBeforeBudgetUnknown = this.tryRescueCreateProductEarly(
      prompt,
      action,
    );
    if (createProductBeforeBudgetUnknown)
      return createProductBeforeBudgetUnknown;

    const budgetDiscoveryUnknown =
      input.surface === 'provider'
        ? null
        : this.tryRescueBudgetServiceDiscovery(prompt, action, budgetSurface);
    if (budgetDiscoveryUnknown) return budgetDiscoveryUnknown;

    const rankDiscoveryUnknown = this.tryRescueRankServiceDiscovery(
      prompt,
      action,
      budgetSurface,
    );
    if (rankDiscoveryUnknown) return rankDiscoveryUnknown;

    const revenueKpisUnknown = this.tryRescueRevenueKpis(prompt, action);
    if (revenueKpisUnknown) return revenueKpisUnknown;

    if (isTopStaffRevenuePrompt(prompt)) {
      return {
        action: 'summarize_staff',
        params: {
          ...params,
          staffMetric: 'most_revenue',
          limit: extractLimitFromPrompt(prompt),
        },
        reasoning:
          'Rank specialists/providers by revenue for the requested period.',
        rescued: true,
        rescueReason: 'top_staff_revenue',
      };
    }

    const summarizeBookingsUnknown = this.tryRescueSummarizeBookings(
      prompt,
      action,
      params,
    );
    if (summarizeBookingsUnknown) return summarizeBookingsUnknown;

    const unscopedCustomerCountUnknown = this.tryRescueUnscopedCustomerCount(
      prompt,
      action,
      params,
    );
    if (unscopedCustomerCountUnknown) return unscopedCustomerCountUnknown;

    const summarizeCustomerTaxPaidUnknown =
      rescueSummarizeCustomerTaxPaidIntent(prompt, action);
    if (summarizeCustomerTaxPaidUnknown) {
      return {
        action: summarizeCustomerTaxPaidUnknown.action,
        params: {},
        reasoning: `Customer tax paid summary rescue → ${summarizeCustomerTaxPaidUnknown.action}`,
        rescued: true,
        rescueReason: summarizeCustomerTaxPaidUnknown.rescueReason,
      };
    }

    const clinicCompoundUnknown = this.tryRescueClinicCompound(prompt, action);
    if (clinicCompoundUnknown) return clinicCompoundUnknown;

    const notificationDateBeforeClinic = this.tryRescueNotificationDateFormat(
      prompt,
      action,
    );
    if (notificationDateBeforeClinic) return notificationDateBeforeClinic;

    const providerPushSetupBeforeClinic = this.tryRescueProviderPushSetup(
      prompt,
      action,
    );
    if (providerPushSetupBeforeClinic) return providerPushSetupBeforeClinic;

    // e2e-bug.77 — dashboard clinic lab never on customer/public.
    const dashboardClinicLabBookingBeforeResults =
      input.surface === 'customer' || input.surface === 'public'
        ? null
        : this.tryRescueDashboardClinicLabBooking(prompt, action);
    if (dashboardClinicLabBookingBeforeResults) {
      return dashboardClinicLabBookingBeforeResults;
    }

    const clinicTestResultUnknown = this.tryRescueClinicTestResult(
      prompt,
      action,
    );
    if (clinicTestResultUnknown) return clinicTestResultUnknown;

    const clinicPatientChartUnknown = this.tryRescueClinicPatientChart(
      prompt,
      action,
      input.surface,
    );
    if (clinicPatientChartUnknown) return clinicPatientChartUnknown;

    const providerClinicCollectionUnknown =
      this.tryRescueProviderClinicCollection(prompt, action);
    if (providerClinicCollectionUnknown) return providerClinicCollectionUnknown;

    // e2e-bug.152 — same ordering as classified phase (agent-ops before clinic tasks).
    const supportInboxBeforeAgentOpsUnknown = this.tryRescueExplainSupportInbox(
      prompt,
      action,
    );
    if (supportInboxBeforeAgentOpsUnknown) {
      return supportInboxBeforeAgentOpsUnknown;
    }
    const agentOpsBeforeClinicUnknown = this.tryRescueAgentOps(prompt, action);
    if (agentOpsBeforeClinicUnknown) return agentOpsBeforeClinicUnknown;

    const providerClinicTasksAndResultsUnknown =
      this.tryRescueProviderClinicTasksAndResults(prompt, action);
    if (providerClinicTasksAndResultsUnknown)
      return providerClinicTasksAndResultsUnknown;

    const providerClinicLabBookingUnknown =
      this.tryRescueProviderClinicLabBooking(prompt, action);
    if (providerClinicLabBookingUnknown) return providerClinicLabBookingUnknown;

    const trackLabOrderStatusUnknown = this.tryRescueTrackLabOrderStatus(
      prompt,
      action,
    );
    if (trackLabOrderStatusUnknown) return trackLabOrderStatusUnknown;

    const listMyDocumentsUnknown = this.tryRescueListMyDocuments(
      prompt,
      action,
    );
    if (listMyDocumentsUnknown) return listMyDocumentsUnknown;

    const explainAbnormalResultFlagUnknown =
      this.tryRescueExplainAbnormalResultFlag(prompt, action);
    if (explainAbnormalResultFlagUnknown)
      return explainAbnormalResultFlagUnknown;

    const notifyWhenResultsReadyUnknown = this.tryRescueNotifyWhenResultsReady(
      prompt,
      action,
    );
    if (notifyWhenResultsReadyUnknown) return notifyWhenResultsReadyUnknown;

    // e2e-bug.133 — tour group/nearest before clinic explain_result_status.
    const tourGroupBeforeClinicUnknown =
      this.tryRescueBookTourNearestDepartureCompound(prompt, action);
    if (tourGroupBeforeClinicUnknown) return tourGroupBeforeClinicUnknown;
    const tourConsumerBeforeClinicUnknown = this.tryRescueTourConsumer(
      prompt,
      action,
    );
    if (tourConsumerBeforeClinicUnknown) return tourConsumerBeforeClinicUnknown;

    // e2e-bug.94 — soonest/next-available before clinic/marketing steal.
    const findSoonestBeforeClinicUnknown =
      input.surface === 'customer' || input.surface === 'public'
        ? this.tryRescueFindSoonestAppointment(prompt, action)
        : null;
    if (findSoonestBeforeClinicUnknown) return findSoonestBeforeClinicUnknown;

    const consumerClinicTestResultsUnknown =
      this.tryRescueConsumerClinicTestResults(prompt, action);
    if (consumerClinicTestResultsUnknown)
      return consumerClinicTestResultsUnknown;

    const consumerClinicLabBookingUnknown =
      this.tryRescueConsumerClinicLabBooking(prompt, action);
    if (consumerClinicLabBookingUnknown) return consumerClinicLabBookingUnknown;

    // e2e-bug.77 — dashboard clinic lab never on customer/public.
    const dashboardClinicLabBookingUnknown =
      input.surface === 'customer' || input.surface === 'public'
        ? null
        : this.tryRescueDashboardClinicLabBooking(prompt, action);
    if (dashboardClinicLabBookingUnknown)
      return dashboardClinicLabBookingUnknown;

    const fixCheckoutValidationErrorUnknown =
      this.tryRescueFixCheckoutValidationError(prompt, action);
    if (fixCheckoutValidationErrorUnknown)
      return fixCheckoutValidationErrorUnknown;

    const getDirectionsToSalonUnknown = this.tryRescueGetDirectionsToSalon(
      prompt,
      action,
    );
    if (getDirectionsToSalonUnknown) return getDirectionsToSalonUnknown;

    const explainLabPrepUnknown = this.tryRescueExplainLabPrep(prompt, action);
    if (explainLabPrepUnknown) return explainLabPrepUnknown;

    const explainPublicIntakeFormUnknown =
      this.tryRescueExplainPublicIntakeForm(prompt, action);
    if (explainPublicIntakeFormUnknown) return explainPublicIntakeFormUnknown;

    const explainClinicBookingFieldsUnknown =
      this.tryRescueExplainClinicBookingFields(prompt, action);
    if (explainClinicBookingFieldsUnknown)
      return explainClinicBookingFieldsUnknown;

    const explainPreparationNotesUnknown =
      this.tryRescueExplainPreparationNotes(prompt, action);
    if (explainPreparationNotesUnknown) return explainPreparationNotesUnknown;

    const explainCalendarSpanBeforeSelfService =
      this.tryRescueExplainTourCalendarSpan(prompt, action);
    if (explainCalendarSpanBeforeSelfService) {
      return explainCalendarSpanBeforeSelfService;
    }

    const listCalendarWeekBeforeSelfService =
      this.tryRescueListTourCalendarWeek(prompt, action);
    if (listCalendarWeekBeforeSelfService) {
      return listCalendarWeekBeforeSelfService;
    }

    // e2e-bug.78 — affirmative after cancel-all preview before other steals.
    const cancelAllUpcomingConfirmUnknown =
      input.surface === 'customer' || input.surface === 'public'
        ? this.tryRescueCancelAllUpcomingConfirm(prompt, action, params)
        : null;
    if (cancelAllUpcomingConfirmUnknown) {
      return cancelAllUpcomingConfirmUnknown;
    }
    // e2e-bug.79 — before add_booking_to_calendar steals "get … or … visit".
    const explainSubscriptionVsOneTimeUnknown =
      input.surface === 'customer' || input.surface === 'public'
        ? this.tryRescueExplainSubscriptionVsOneTime(prompt, action)
        : null;
    if (explainSubscriptionVsOneTimeUnknown) {
      return explainSubscriptionVsOneTimeUnknown;
    }
    // e2e-bug.295 — adoption before calendar/list steals on unknown phase.
    if (input.surface === 'customer' || input.surface === 'public') {
      const consumerAdoptionBeforeCalendarUnknown =
        this.tryRescueConsumerAdoption(prompt, action);
      if (consumerAdoptionBeforeCalendarUnknown) {
        return consumerAdoptionBeforeCalendarUnknown;
      }
    }
    const addBookingToCalendarUnknown = this.tryRescueAddBookingToCalendar(
      prompt,
      action,
      input.surface,
    );
    if (addBookingToCalendarUnknown) return addBookingToCalendarUnknown;

    const bookAnotherServiceUnknown = this.tryRescueBookAnotherService(
      prompt,
      action,
    );
    if (bookAnotherServiceUnknown) return bookAnotherServiceUnknown;

    const explainShareRewardUnknown = this.tryRescueExplainShareReward(
      prompt,
      action,
    );
    if (explainShareRewardUnknown) return explainShareRewardUnknown;

    const shareMyBookingUnknown = this.tryRescueShareMyBooking(prompt, action);
    if (shareMyBookingUnknown) return shareMyBookingUnknown;

    const explainPackageVisitRulesUnknown =
      this.tryRescueExplainPackageVisitRules(prompt, action);
    if (explainPackageVisitRulesUnknown) return explainPackageVisitRulesUnknown;

    const explainCancelPolicyUnknown =
      input.surface === 'provider'
        ? null
        : this.tryRescueExplainCancelPolicy(prompt, action);
    if (explainCancelPolicyUnknown) return explainCancelPolicyUnknown;

    // e2e-bug.88 — pay_online before list/confirm steals "pay … for my booking".
    const payOnlineUnknown =
      input.surface === 'provider'
        ? null
        : this.tryRescuePayOnline(prompt, action);
    if (payOnlineUnknown) return payOnlineUnknown;

    const listMyUpcomingAppointmentsUnknown =
      input.surface === 'provider'
        ? null
        : this.tryRescueListMyUpcomingAppointments(prompt, action);
    if (listMyUpcomingAppointmentsUnknown)
      return listMyUpcomingAppointmentsUnknown;

    const explainProviderAvailabilityUnknown =
      rescueExplainProviderAvailabilityIntent(prompt, action);
    if (explainProviderAvailabilityUnknown) {
      return {
        action: explainProviderAvailabilityUnknown.action,
        params: enrichExplainProviderAvailabilityParamsFromPrompt({}, prompt),
        reasoning: `Explain provider availability rescue → ${explainProviderAvailabilityUnknown.action}`,
        rescued: true,
        rescueReason: explainProviderAvailabilityUnknown.rescueReason,
      };
    }

    const switchProviderSameTimeUnknown = rescueSwitchProviderSameTimeIntent(
      prompt,
      action,
    );
    if (switchProviderSameTimeUnknown) {
      return {
        action: switchProviderSameTimeUnknown.action,
        params: enrichSwitchProviderSameTimeParamsFromPrompt({}, prompt),
        reasoning: `Switch provider same time rescue → ${switchProviderSameTimeUnknown.action}`,
        rescued: true,
        rescueReason: switchProviderSameTimeUnknown.rescueReason,
      };
    }

    const professionalProfileUnknown = rescueExplainProfessionalProfileIntent(
      prompt,
      action,
    );
    if (professionalProfileUnknown) {
      return {
        action: professionalProfileUnknown.action,
        params: enrichExplainProfessionalProfileParamsFromPrompt({}, prompt),
        reasoning: `Professional profile rescue → ${professionalProfileUnknown.action}`,
        rescued: true,
        rescueReason: professionalProfileUnknown.rescueReason,
      };
    }

    const providerSameDayMultiUnknown =
      rescueProviderSameDayMultiCompoundIntent(prompt, action);
    if (providerSameDayMultiUnknown) {
      return {
        action: providerSameDayMultiUnknown.action,
        params: {},
        reasoning:
          'Provider same day multi compound — pick stylist, check multi-service block, book.',
        rescued: true,
        rescueReason: providerSameDayMultiUnknown.rescueReason,
      };
    }

    const pickProviderUnknown = rescuePickProviderForServiceIntent(
      prompt,
      action,
    );
    if (pickProviderUnknown) {
      return {
        action: pickProviderUnknown.action,
        params: enrichPickProviderForServiceParamsFromPrompt({}, prompt),
        reasoning: `Pick provider for service rescue → ${pickProviderUnknown.action}`,
        rescued: true,
        rescueReason: pickProviderUnknown.rescueReason,
      };
    }

    const anyProviderOptionUnknown = rescueExplainAnyProviderOptionIntent(
      prompt,
      action,
    );
    if (anyProviderOptionUnknown) {
      return {
        action: anyProviderOptionUnknown.action,
        params: parseExplainAnyProviderOptionFromPrompt(prompt) ?? {},
        reasoning: `Any provider option explain rescue → ${anyProviderOptionUnknown.action}`,
        rescued: true,
        rescueReason: anyProviderOptionUnknown.rescueReason,
      };
    }

    const confirmMyBookingDetailsUnknown =
      input.surface === 'provider'
        ? null
        : this.tryRescueConfirmMyBookingDetails(prompt, action);
    if (confirmMyBookingDetailsUnknown) return confirmMyBookingDetailsUnknown;

    // e2e-bug.76 — locale before explain_why_sign_in ("what" + "account").
    const myLocaleUnknown =
      input.surface === 'provider'
        ? null
        : this.tryRescueMyLocale(prompt, action);
    if (myLocaleUnknown) return myLocaleUnknown;

    const explainWhySignInUnknown = this.tryRescueExplainWhySignIn(
      prompt,
      action,
    );
    if (explainWhySignInUnknown) return explainWhySignInUnknown;

    // e2e-bug.93 — named provider reads before guest-checkout / check_providers steal.
    const providerNameReadsUnknown =
      input.surface === 'customer' || input.surface === 'public'
        ? this.tryRescueNamedProviderReadIntents(prompt, action)
        : null;
    if (providerNameReadsUnknown) return providerNameReadsUnknown;

    // e2e-bug.92 — reviews / any-provider / timed book before check_providers collapse.
    const checkProvidersCollapseUnknown =
      input.surface === 'customer' || input.surface === 'public'
        ? this.tryRescueCheckProvidersCollapseIntents(
            prompt,
            action,
            input.surface,
          )
        : null;
    if (checkProvidersCollapseUnknown) return checkProvidersCollapseUnknown;

    const explainGuestCheckoutFieldsUnknown =
      this.tryRescueExplainGuestCheckoutFields(prompt, action);
    if (explainGuestCheckoutFieldsUnknown)
      return explainGuestCheckoutFieldsUnknown;

    const resumePendingPaymentUnknown = this.tryRescueResumePendingPayment(
      prompt,
      action,
      input.surface,
    );
    if (resumePendingPaymentUnknown) return resumePendingPaymentUnknown;

    const explainClinicBookingUnknown = this.tryRescueExplainClinicBooking(
      prompt,
      action,
    );
    if (explainClinicBookingUnknown) return explainClinicBookingUnknown;

    const explainClinicServicesUnknown = this.tryRescueExplainClinicServices(
      prompt,
      action,
    );
    if (explainClinicServicesUnknown) return explainClinicServicesUnknown;

    const clinicServiceUnknown = this.tryRescueClinicService(prompt, action);
    if (clinicServiceUnknown) return clinicServiceUnknown;

    const clinicTestOrderUnknown = this.tryRescueClinicTestOrder(
      prompt,
      action,
    );
    if (clinicTestOrderUnknown) return clinicTestOrderUnknown;

    const businessComplianceEarly = rescueBusinessComplianceIntent(
      prompt,
      action,
    );
    if (businessComplianceEarly?.action === 'admin_delete_customer_data') {
      const params: Record<string, unknown> = {};
      const parsed = parseAdminDeleteCustomerDataFromPrompt(prompt);
      if (parsed?.customerName) {
        params.customerName = parsed.customerName;
      }
      return {
        action: businessComplianceEarly.action,
        params,
        reasoning: `Business compliance rescue → ${businessComplianceEarly.action}`,
        rescued: true,
        rescueReason: businessComplianceEarly.rescueReason,
      };
    }

    const staffOperationsBeforeCustomerPre =
      this.tryRescueCreateBookingNotEmployee(prompt, action, params);
    if (staffOperationsBeforeCustomerPre) {
      return staffOperationsBeforeCustomerPre;
    }
    const staffOperationsBeforeCustomer = this.tryRescueStaffOperations(
      prompt,
      action,
    );
    if (staffOperationsBeforeCustomer) return staffOperationsBeforeCustomer;

    const waitlistDashboardBeforeCustomer =
      input.surface === 'provider'
        ? null
        : this.tryRescueWaitlistDashboard(prompt, action);
    if (waitlistDashboardBeforeCustomer) return waitlistDashboardBeforeCustomer;

    const explainProviderAvailabilityBeforeCustomerContext =
      rescueExplainProviderAvailabilityIntent(prompt, action);
    if (explainProviderAvailabilityBeforeCustomerContext) {
      return {
        action: explainProviderAvailabilityBeforeCustomerContext.action,
        params: enrichExplainProviderAvailabilityParamsFromPrompt({}, prompt),
        reasoning: `Explain provider availability rescue → ${explainProviderAvailabilityBeforeCustomerContext.action}`,
        rescued: true,
        rescueReason:
          explainProviderAvailabilityBeforeCustomerContext.rescueReason,
      };
    }

    const switchProviderSameTimeBeforeCustomerContext =
      rescueSwitchProviderSameTimeIntent(prompt, action);
    if (switchProviderSameTimeBeforeCustomerContext) {
      return {
        action: switchProviderSameTimeBeforeCustomerContext.action,
        params: enrichSwitchProviderSameTimeParamsFromPrompt({}, prompt),
        reasoning: `Switch provider same time rescue → ${switchProviderSameTimeBeforeCustomerContext.action}`,
        rescued: true,
        rescueReason: switchProviderSameTimeBeforeCustomerContext.rescueReason,
      };
    }

    const providerSameDayMultiBeforeCustomerContext =
      rescueProviderSameDayMultiCompoundIntent(prompt, action);
    if (providerSameDayMultiBeforeCustomerContext) {
      return {
        action: providerSameDayMultiBeforeCustomerContext.action,
        params: {},
        reasoning:
          'Provider same day multi compound — pick stylist, check multi-service block, book.',
        rescued: true,
        rescueReason: providerSameDayMultiBeforeCustomerContext.rescueReason,
      };
    }

    const pickProviderBeforeCustomerContext =
      rescuePickProviderForServiceIntent(prompt, action);
    if (pickProviderBeforeCustomerContext) {
      return {
        action: pickProviderBeforeCustomerContext.action,
        params: enrichPickProviderForServiceParamsFromPrompt({}, prompt),
        reasoning: `Pick provider for service rescue → ${pickProviderBeforeCustomerContext.action}`,
        rescued: true,
        rescueReason: pickProviderBeforeCustomerContext.rescueReason,
      };
    }

    const anyProviderOptionBeforeCustomerContext =
      rescueExplainAnyProviderOptionIntent(prompt, action);
    if (anyProviderOptionBeforeCustomerContext) {
      return {
        action: anyProviderOptionBeforeCustomerContext.action,
        params: parseExplainAnyProviderOptionFromPrompt(prompt) ?? {},
        reasoning: `Any provider option explain rescue → ${anyProviderOptionBeforeCustomerContext.action}`,
        rescued: true,
        rescueReason: anyProviderOptionBeforeCustomerContext.rescueReason,
      };
    }

    const dashboardCustomerReadUnknown = this.tryRescueDashboardCustomerRead(
      prompt,
      action,
      params,
    );
    if (dashboardCustomerReadUnknown) return dashboardCustomerReadUnknown;
    const customerBookingContext = this.lookupCustomerWithBookingContext(
      prompt,
      params,
    );
    if (customerBookingContext) return customerBookingContext;

    const applyTourPlaybookUnknown = this.tryRescueApplyTourPlaybook(
      prompt,
      action,
    );
    if (applyTourPlaybookUnknown) return applyTourPlaybookUnknown;

    const dismissRecommendationsUnknown = this.tryRescueDismissRecommendations(
      prompt,
      action,
    );
    if (dismissRecommendationsUnknown) return dismissRecommendationsUnknown;

    const consumerCheckoutSuccessUnknown =
      this.tryRescueConsumerCheckoutSuccess(prompt, action);
    if (consumerCheckoutSuccessUnknown) return consumerCheckoutSuccessUnknown;

    const providerPushDateFormatBeforeAdoption =
      this.tryRescueConfigureProviderPushDateFormat(prompt, action);
    if (providerPushDateFormatBeforeAdoption) {
      return providerPushDateFormatBeforeAdoption;
    }

    const notificationCurrencyUnknownEarly = this.tryRescueNotificationCurrency(
      prompt,
      action,
    );
    if (notificationCurrencyUnknownEarly) {
      return notificationCurrencyUnknownEarly;
    }

    const checkoutRecommendationsUnknown =
      this.tryRescueCheckoutRecommendations(prompt, action);
    if (checkoutRecommendationsUnknown) return checkoutRecommendationsUnknown;

    const pushNotificationsUnknownEarly = this.tryRescuePushNotifications(
      prompt,
      action,
    );
    if (pushNotificationsUnknownEarly) return pushNotificationsUnknownEarly;

    const consumerAdoptionUnknownEarly = this.tryRescueConsumerAdoption(
      prompt,
      action,
    );
    if (consumerAdoptionUnknownEarly) return consumerAdoptionUnknownEarly;

    const recommendationProductUnknownBeforeCheckout =
      this.tryRescueRecommendationProduct(prompt, action);
    if (recommendationProductUnknownBeforeCheckout) {
      return recommendationProductUnknownBeforeCheckout;
    }

    const tourCompoundEarly = this.tryRescueBookTourNearestDepartureCompound(
      prompt,
      action,
    );
    if (tourCompoundEarly) return tourCompoundEarly;

    const tourConsumerEarly = this.tryRescueTourConsumer(prompt, action);
    if (tourConsumerEarly) return tourConsumerEarly;

    const explainTourMeetingPointUnknown =
      this.tryRescueExplainTourMeetingPoint(prompt, action);
    if (explainTourMeetingPointUnknown) return explainTourMeetingPointUnknown;

    const explainTourRecordUnknown = this.tryRescueExplainTourBookingRecord(
      prompt,
      action,
    );
    if (explainTourRecordUnknown) return explainTourRecordUnknown;

    const listDeparturesUnknown = this.tryRescueListUpcomingTourDepartures(
      prompt,
      action,
    );
    if (listDeparturesUnknown) return listDeparturesUnknown;

    const explainToursUnknown = this.tryRescueExplainTourServices(
      prompt,
      action,
    );
    if (explainToursUnknown) return explainToursUnknown;

    const providerTeamWhosNextBeforeAppointments =
      this.tryRescueProviderTeamWhosNext(prompt, action);
    if (providerTeamWhosNextBeforeAppointments) {
      return providerTeamWhosNextBeforeAppointments;
    }

    if (input.surface === 'provider') {
      // Per-leg multi-service before whole-visit complete (e2e-bug.241)
      const markMultiServiceStepDoneUnknownEarly =
        this.tryRescueMarkMultiServiceStepDone(prompt, action, params);
      if (markMultiServiceStepDoneUnknownEarly) {
        return markMultiServiceStepDoneUnknownEarly;
      }
      const markVisitCompleteUnknownEarly = this.tryRescueMarkVisitComplete(
        prompt,
        action,
        params,
      );
      if (markVisitCompleteUnknownEarly) return markVisitCompleteUnknownEarly;
      const markVisitInProgressUnknownEarly = this.tryRescueMarkVisitInProgress(
        prompt,
        action,
        params,
      );
      if (markVisitInProgressUnknownEarly) {
        return markVisitInProgressUnknownEarly;
      }
      const searchPatientUnknownEarly = this.tryRescueSearchPatient(
        prompt,
        action,
        params,
      );
      if (searchPatientUnknownEarly) return searchPatientUnknownEarly;
      const handoffToDashboardPhiUnknownEarly =
        this.tryRescueHandoffToDashboardPhi(prompt, action, params);
      if (handoffToDashboardPhiUnknownEarly) {
        return handoffToDashboardPhiUnknownEarly;
      }
      const confirmPendingBookingUnknownEarly =
        this.tryRescueConfirmPendingBooking(prompt, action, params);
      if (confirmPendingBookingUnknownEarly) {
        return confirmPendingBookingUnknownEarly;
      }
      const visitStatusExplainersUnknownEarly =
        this.tryRescueVisitStatusExplainers(prompt, action, params);
      if (visitStatusExplainersUnknownEarly) {
        return visitStatusExplainersUnknownEarly;
      }
      const calendarSchedulingExplainersUnknownEarly =
        this.tryRescueCalendarSchedulingExplainers(prompt, action, params);
      if (calendarSchedulingExplainersUnknownEarly) {
        return calendarSchedulingExplainersUnknownEarly;
      }
      const assistantUxExplainersUnknownEarly =
        this.tryRescueAssistantUxExplainers(prompt, action, params);
      if (assistantUxExplainersUnknownEarly) {
        return assistantUxExplainersUnknownEarly;
      }
      const dashboardHandoffUnknownEarly = this.tryRescueDashboardHandoff(
        prompt,
        action,
        params,
      );
      if (dashboardHandoffUnknownEarly) return dashboardHandoffUnknownEarly;
      const providerBlockScheduleUnknownEarly =
        this.tryRescueProviderBlockSchedule(
          prompt,
          action,
          params,
          input.surface,
        );
      if (providerBlockScheduleUnknownEarly) {
        return providerBlockScheduleUnknownEarly;
      }
      const giveProviderAiFeedbackUnknownEarly =
        this.tryRescueGiveProviderAiFeedback(prompt, action);
      if (giveProviderAiFeedbackUnknownEarly) {
        return giveProviderAiFeedbackUnknownEarly;
      }
      const endOfDaySummaryUnknownEarly = this.tryRescueEndOfDaySummary(
        prompt,
        action,
      );
      if (endOfDaySummaryUnknownEarly) return endOfDaySummaryUnknownEarly;
      const explainTodayTimelineUnknownEarly =
        this.tryRescueExplainTodayTimeline(prompt, action);
      if (explainTodayTimelineUnknownEarly) {
        return explainTodayTimelineUnknownEarly;
      }
      const whoIsNextUnknownEarly = this.tryRescueWhoIsNext(
        prompt,
        action,
        params,
      );
      if (whoIsNextUnknownEarly) return whoIsNextUnknownEarly;
      const showAppointmentsUnknownEarly = this.tryRescueShowAppointments(
        prompt,
        action,
        params,
      );
      if (showAppointmentsUnknownEarly) return showAppointmentsUnknownEarly;
    }

    // e2e-bug.77 — dashboard/provider show_appointments must not steal customer/public.
    if (
      input.surface !== 'customer' &&
      input.surface !== 'public' &&
      isUpcomingAppointmentsPrompt(prompt)
    ) {
      const scope = extractUpcomingAppointmentScope(prompt);
      return {
        action: 'show_appointments',
        params: {
          ...params,
          upcomingOnly: true,
          allProviders: scope.allProviders,
          employeeNames: scope.employeeNames.length
            ? scope.employeeNames
            : params.employeeNames,
          date: params.date ?? 'today',
        },
        reasoning: 'List upcoming appointments for selected provider scope.',
        rescued: true,
        rescueReason: 'upcoming_appointments',
      };
    }

    if (isSingleProviderRevenuePrompt(prompt)) {
      const employeeName =
        extractSingleProviderNameFromPrompt(prompt) ?? params.employeeName;
      return {
        action: 'summarize_staff',
        params: {
          ...params,
          staffMetric: 'most_revenue',
          employeeName,
          limit: employeeName
            ? 1
            : Math.min(extractLimitFromPrompt(prompt), 10),
        },
        reasoning: 'Provider revenue summary for the requested period.',
        rescued: true,
        rescueReason: 'single_provider_revenue',
      };
    }

    if (isTransferServicesBetweenProvidersPrompt(prompt)) {
      const transfer = rescueTransferServicesBetweenProvidersIntent(
        prompt,
        action,
        params,
      );
      if (transfer) {
        return {
          action: transfer.action,
          params: transfer.params,
          reasoning: 'Move provider skills from one team member to another.',
          rescued: true,
          rescueReason: transfer.rescueReason,
        };
      }
    }

    if (isUnassignServicesFromProviderPrompt(prompt)) {
      const unassign = rescueUnassignServicesFromProviderIntent(
        prompt,
        action,
        params,
      );
      if (unassign) {
        return {
          action: unassign.action,
          params: unassign.params,
          reasoning: 'Remove provider skills from a named team member.',
          rescued: true,
          rescueReason: unassign.rescueReason,
        };
      }
    }

    if (isAssignCategoryToProviderPrompt(prompt)) {
      const categoryAssign = rescueAssignCategoryToProviderIntent(
        prompt,
        action,
        params,
      );
      if (categoryAssign) {
        return {
          action: categoryAssign.action,
          params: categoryAssign.params,
          reasoning: 'Assign all services in a category to a named provider.',
          rescued: true,
          rescueReason: categoryAssign.rescueReason,
        };
      }
    }

    const schedulingUnknown = this.tryRescueScheduling(prompt, action, params);
    if (schedulingUnknown) return schedulingUnknown;
    // e2e-bug.146 — location mutates before business-hours/location reads.
    const locationsBeforeHoursUnknown = this.tryRescueLocations(prompt, action);
    if (locationsBeforeHoursUnknown) return locationsBeforeHoursUnknown;
    const businessCurrencyUnknown = this.tryRescueBusinessCurrency(
      prompt,
      action,
      input.surface,
    );
    if (businessCurrencyUnknown) return businessCurrencyUnknown;
    const recommendationProductUnknownEarly =
      this.tryRescueRecommendationProduct(prompt, action);
    if (recommendationProductUnknownEarly) {
      return recommendationProductUnknownEarly;
    }
    // e2e-bug.129 — dashboard SaaS billing only (see classified-phase twin).
    const billingLoyaltyUnknown =
      input.surface === 'dashboard'
        ? this.tryRescueBillingLoyaltyDashboard(prompt, action)
        : null;
    if (billingLoyaltyUnknown) return billingLoyaltyUnknown;
    // e2e-bug.144 — catalog soft-delete before staff/ops steals.
    const catalogDeactivateUnknown = this.tryRescueCatalogDeactivateService(
      prompt,
      action,
    );
    if (catalogDeactivateUnknown) return catalogDeactivateUnknown;
    const createBookingNotEmployeeUnknown =
      this.tryRescueCreateBookingNotEmployee(prompt, action, params);
    if (createBookingNotEmployeeUnknown) return createBookingNotEmployeeUnknown;
    const staffOperationsUnknown = this.tryRescueStaffOperations(
      prompt,
      action,
    );
    if (staffOperationsUnknown) return staffOperationsUnknown;
    const waitlistDashboardUnknown =
      input.surface === 'provider'
        ? null
        : this.tryRescueWaitlistDashboard(prompt, action);
    if (waitlistDashboardUnknown) return waitlistDashboardUnknown;
    const operationsUnknown = this.tryRescueOperations(prompt, action, params);
    if (operationsUnknown) return operationsUnknown;
    const providerBookingUnknownEarly = this.tryRescueProviderBooking(
      prompt,
      action,
    );
    if (providerBookingUnknownEarly) return providerBookingUnknownEarly;
    const catalogUnknownEarly = this.tryRescueCatalog(prompt, action);
    if (catalogUnknownEarly) return catalogUnknownEarly;
    const providerPushSetupUnknownEarly = this.tryRescueProviderPushSetup(
      prompt,
      action,
    );
    if (providerPushSetupUnknownEarly) return providerPushSetupUnknownEarly;
    // e2e-bug.244–247 — twin of classified-phase explainers before Exp2.
    if (input.surface === 'provider') {
      const visitStatusExplainersUnknownBeforeExp2 =
        this.tryRescueVisitStatusExplainers(prompt, action, params);
      if (visitStatusExplainersUnknownBeforeExp2) {
        return visitStatusExplainersUnknownBeforeExp2;
      }
      const calendarSchedulingExplainersUnknownBeforeExp2 =
        this.tryRescueCalendarSchedulingExplainers(prompt, action, params);
      if (calendarSchedulingExplainersUnknownBeforeExp2) {
        return calendarSchedulingExplainersUnknownBeforeExp2;
      }
      const assistantUxExplainersUnknownBeforeExp2 =
        this.tryRescueAssistantUxExplainers(prompt, action, params);
      if (assistantUxExplainersUnknownBeforeExp2) {
        return assistantUxExplainersUnknownBeforeExp2;
      }
      const dashboardHandoffUnknownBeforeExp2 = this.tryRescueDashboardHandoff(
        prompt,
        action,
        params,
      );
      if (dashboardHandoffUnknownBeforeExp2) {
        return dashboardHandoffUnknownBeforeExp2;
      }
    }
    const providerExp2UnknownEarly = this.tryRescueProviderExp2(prompt, action);
    if (providerExp2UnknownEarly) return providerExp2UnknownEarly;
    // e2e-bug.131 — provider Exp3 only on provider surface (classified + unknown).
    const providerExp3UnknownEarly =
      input.surface === 'provider'
        ? this.tryRescueProviderExp3(prompt, action)
        : null;
    if (providerExp3UnknownEarly) return providerExp3UnknownEarly;
    const providerOpenShiftsUnknownEarly = this.tryRescueProviderOpenShifts(
      prompt,
      action,
    );
    if (providerOpenShiftsUnknownEarly) return providerOpenShiftsUnknownEarly;
    const providerTeamWhosNextUnknownEarly = this.tryRescueProviderTeamWhosNext(
      prompt,
      action,
    );
    if (providerTeamWhosNextUnknownEarly)
      return providerTeamWhosNextUnknownEarly;
    const providerTimeOffUnknownEarly = this.tryRescueProviderTimeOff(
      prompt,
      action,
    );
    if (providerTimeOffUnknownEarly) return providerTimeOffUnknownEarly;
    const providerClientContextUnknownEarly =
      input.surface === 'provider'
        ? this.tryRescueProviderClientContext(prompt, action)
        : null;
    if (providerClientContextUnknownEarly)
      return providerClientContextUnknownEarly;
    const providerEarningsUnknownEarly =
      input.surface === 'provider'
        ? this.tryRescueProviderEarnings(prompt, action)
        : null;
    if (providerEarningsUnknownEarly) return providerEarningsUnknownEarly;
    const agentOpsUnknownEarly = this.tryRescueAgentOps(prompt, action);
    if (agentOpsUnknownEarly) return agentOpsUnknownEarly;
    // e2e-bug.129 — twin of classified-phase early membership explain.
    const explainMySubscriptionUnknown =
      input.surface === 'customer' || input.surface === 'public'
        ? this.tryRescueExplainMySubscription(prompt, action)
        : null;
    if (explainMySubscriptionUnknown) return explainMySubscriptionUnknown;
    const metaOpsUnknownEarly = this.tryRescueMetaOps(prompt, action);
    if (metaOpsUnknownEarly) return metaOpsUnknownEarly;
    const manageBookingWithTokenUnknown =
      input.surface === 'customer' || input.surface === 'public'
        ? this.tryRescueManageBookingWithToken(prompt, action, params)
        : null;
    if (manageBookingWithTokenUnknown) return manageBookingWithTokenUnknown;
    const cancelPackageVisitSelfUnknown = this.tryRescueCancelPackageVisitSelf(
      prompt,
      action,
    );
    if (cancelPackageVisitSelfUnknown) return cancelPackageVisitSelfUnknown;
    const reschedulePackageVisitSelfUnknown =
      this.tryRescueReschedulePackageVisitSelf(prompt, action);
    if (reschedulePackageVisitSelfUnknown)
      return reschedulePackageVisitSelfUnknown;
    const selfServiceBookingUnknown = this.tryRescueSelfServiceBooking(
      prompt,
      action,
      input.surface,
    );
    if (selfServiceBookingUnknown) return selfServiceBookingUnknown;
    const pushNotificationsUnknown = this.tryRescuePushNotifications(
      prompt,
      action,
    );
    if (pushNotificationsUnknown) return pushNotificationsUnknown;
    // e2e-bug.232 — claim referral before marketing promo steal (unknown phase).
    const claimReferralCodeUnknownEarly = this.tryRescueClaimReferralCode(
      prompt,
      action,
    );
    if (claimReferralCodeUnknownEarly) return claimReferralCodeUnknownEarly;
    const marketingGrowthUnknown = this.tryRescueMarketingGrowth(
      prompt,
      action,
    );
    if (marketingGrowthUnknown) return marketingGrowthUnknown;
    // e2e-bug.77 — dashboard/provider retail-finance never on customer/public.
    const retailFinanceUnknown =
      input.surface === 'customer' || input.surface === 'public'
        ? null
        : this.tryRescueRetailFinance(prompt, action, params);
    if (retailFinanceUnknown) return retailFinanceUnknown;
    const locationsUnknown = this.tryRescueLocations(prompt, action);
    if (locationsUnknown) return locationsUnknown;
    const integrationsUnknown = this.tryRescueIntegrations(prompt, action);
    if (integrationsUnknown) return integrationsUnknown;
    // e2e-bug.77 — dashboard gift-fulfillment never on customer/public.
    const giftFulfillmentUnknown =
      input.surface === 'customer' || input.surface === 'public'
        ? null
        : this.tryRescueGiftFulfillment(prompt, action);
    if (giftFulfillmentUnknown) return giftFulfillmentUnknown;
    // e2e-bug.83 — also correct a misclassified apply_gift_card_code.
    const claimReferralCodeUnknown = this.tryRescueClaimReferralCode(
      prompt,
      action,
    );
    if (claimReferralCodeUnknown) return claimReferralCodeUnknown;
    const paymentsUnknown = this.tryRescuePayments(prompt, action);
    if (paymentsUnknown) return paymentsUnknown;
    const scheduleResourcesUnknown = this.tryRescueScheduleResources(
      prompt,
      action,
    );
    if (scheduleResourcesUnknown) return scheduleResourcesUnknown;
    const customerCrmUnknown = this.tryRescueCustomerCrm(
      prompt,
      action,
      params,
    );
    if (customerCrmUnknown) return customerCrmUnknown;
    // e2e-bug.103 / e2e-bug.77 — dashboard booking-depth must not steal customer/public.
    const bookingDepthUnknown =
      input.surface === 'customer' || input.surface === 'public'
        ? null
        : this.tryRescueBookingDepth(prompt, action, employees, customers);
    if (bookingDepthUnknown) return bookingDepthUnknown;

    if (isCapacityRebalancePrompt(prompt)) {
      return {
        action: 'rebalance_capacity',
        params,
        reasoning: 'Move booked capacity between providers.',
        rescued: true,
        rescueReason: 'rebalance_capacity_pattern',
      };
    }

    // e2e-bug.136 — unblock / remove block before clear_schedule ("remove" steals).
    if (isDeleteScheduleBlockPrompt(prompt)) {
      const rescuedParams = { ...params };
      applyScheduleOpsPromptHints(
        'delete_schedule_block',
        rescuedParams,
        prompt,
        { employees },
      );
      return {
        action: 'delete_schedule_block',
        params: rescuedParams,
        reasoning:
          reasoning ?? 'Delete/unblock a schedule block (not applied periods)',
        rescued: true,
        rescueReason: 'delete_schedule_block_heuristic',
      };
    }

    if (isClearSchedulePrompt(prompt)) {
      const rescuedParams = { ...params };
      applyScheduleOpsPromptHints('clear_schedule', rescuedParams, prompt, {
        employees,
      });
      return {
        action: 'clear_schedule',
        params: rescuedParams,
        reasoning: reasoning ?? 'Clear applied schedule for provider(s)',
        rescued: true,
        rescueReason: 'clear_schedule_heuristic',
      };
    }

    if (isScheduleTemplateCreationPrompt(prompt)) {
      return {
        action: 'create_schedule_template',
        params: {
          ...params,
          templateName: params.templateName ?? params.name,
        },
        reasoning:
          'Create a reusable schedule template from the described hours.',
        rescued: true,
        rescueReason: 'create_schedule_template_pattern',
      };
    }

    if (/\b(mark|flag|set).+no[\s-]?show/i.test(prompt)) {
      return {
        action: 'mark_no_shows',
        params,
        reasoning: 'Mark missed past appointments as no-show.',
        rescued: true,
        rescueReason: 'mark_no_shows_pattern',
      };
    }

    if (
      /\b(payment sweep|unpaid|collect payment|outstanding payment)/i.test(
        prompt,
      ) ||
      (/[԰-֏]/.test(prompt) &&
        /(հավաքիր|ավլիր)/i.test(prompt) &&
        /չվճարված/i.test(prompt)) ||
      (/[Ѐ-ӿ]/.test(prompt) &&
        /(собери|сбор|зачист)/i.test(prompt) &&
        /неоплачен/i.test(prompt))
    ) {
      return {
        action: 'payment_sweep',
        params,
        reasoning: 'Sweep unpaid appointments and mark as paid.',
        rescued: true,
        rescueReason: 'payment_sweep_pattern',
      };
    }

    if (/\b(replan|redo|fix).+(?:day|schedule|calendar)/i.test(prompt)) {
      return {
        action: 'day_replan',
        params,
        reasoning: 'Analyze and replan the schedule for the requested day.',
        rescued: true,
        rescueReason: 'day_replan_pattern',
      };
    }

    // e2e-bug.248 — reschedule (incl. nearest/soonest free time) before availability
    // soonest steal via resolveAvailabilityIntentFromPrompt.
    // e2e-bug.252 — skip owner "alert me when customers reschedule" prefs.
    if (
      /\b(reschedule|move|change time|shift)\b/i.test(prompt) &&
      !/\bmove\s+\d+\s+.+(?:slot|appointment)/i.test(prompt) &&
      !isToggleBusinessEmailOnCustomerChangePrompt(prompt)
    ) {
      const rescuedParams = { ...params };
      applyBookingRescheduleActionHints(
        'reschedule_booking',
        rescuedParams,
        prompt,
        { employees, customers, timeZone },
      );
      return {
        action: 'reschedule_booking',
        params: rescuedParams,
        reasoning: 'Rescheduling appointment.',
        rescued: true,
        rescueReason: 'reschedule_pattern',
      };
    }

    const availability = resolveAvailabilityIntentFromPrompt(
      'dashboard',
      prompt,
    );
    if (
      availability &&
      !/\b(book|schedule|reserve|create appointment)\b/i.test(prompt)
    ) {
      return {
        action: availability.action,
        params: { ...params, ...availability.params },
        reasoning: 'Availability intent from disambiguation matrix.',
        rescued: true,
        rescueReason: availability.rescueReason,
      };
    }

    if (
      /\b(show|list|display|view).+(appointment|booking)/i.test(prompt) ||
      isShowAppointmentsPrompt(prompt)
    ) {
      const explainTourRecordListing = this.tryRescueExplainTourBookingRecord(
        prompt,
        action,
      );
      if (explainTourRecordListing) return explainTourRecordListing;

      const explainToursListing = this.tryRescueExplainTourServices(
        prompt,
        action,
      );
      if (explainToursListing) return explainToursListing;

      const showAppointmentsUnknown = this.tryRescueShowAppointments(
        prompt,
        action,
        params,
      );
      if (showAppointmentsUnknown) return showAppointmentsUnknown;

      const statuses = extractStatusFiltersFromPrompt(prompt);
      return {
        action: 'show_appointments',
        params: {
          ...params,
          statusFilters: statuses.length ? statuses : params.statusFilters,
        },
        reasoning: 'Listing appointments.',
        rescued: true,
        rescueReason: 'show_appointments_pattern',
      };
    }

    if (
      /\b(book|schedule|reserve|appointment)\b/i.test(prompt) &&
      !/\b(cancel|hide|clear)\b/i.test(prompt) &&
      !(
        /\b(mark|set|start|begin)\b.{0,30}\b(in[\s-]?progress|confirmed|pending|complete|completed|done)\b/i.test(
          prompt,
        ) ||
        /\b(start|begin)\b.{0,20}\b(service|appointment|visit)\b/i.test(
          prompt,
        ) ||
        /\b(confirm|accept|approve)\b.{0,40}\b(pending|booking|appointment)\b/i.test(
          prompt,
        )
      )
    ) {
      // e2e-bug.92 — public/customer must not land on dashboard create_booking.
      if (input.surface === 'public' || input.surface === 'customer') {
        return {
          action: 'book_appointment',
          params: {
            ...params,
            ...enrichBookAppointmentParamsFromPrompt(prompt, params),
          },
          reasoning: 'Customer/public timed book rescue → book_appointment',
          rescued: true,
          rescueReason: isConcreteTimedBookAppointmentPrompt(prompt)
            ? 'public_timed_book'
            : 'book_appointment_pattern',
        };
      }
      const rescuedParams = { ...params };
      applyBookingRescheduleActionHints(
        'create_booking',
        rescuedParams,
        prompt,
        { employees, customers, timeZone },
      );
      return {
        action: 'create_booking',
        params: rescuedParams,
        reasoning: 'Booking appointment from rescue heuristics.',
        rescued: true,
        rescueReason: 'create_booking_pattern',
      };
    }

    if (isHideAppointmentsFromCalendarPrompt(prompt)) {
      const rescuedParams = { ...params };
      applyScheduleOpsPromptHints(
        'hide_appointments_from_calendar',
        rescuedParams,
        prompt,
        { employees },
      );
      return {
        action: 'hide_appointments_from_calendar',
        params: rescuedParams,
        reasoning: 'Hiding appointments from calendar.',
        rescued: true,
        rescueReason: 'hide_calendar_pattern',
      };
    }

    if (/\b(cancel|remove).+(appointment|booking)/i.test(prompt)) {
      const rescuedParams = { ...params };
      if (isBulkAllAppointmentsPrompt(prompt)) {
        rescuedParams.allAppointments = true;
        delete rescuedParams.serviceName;
        rescuedParams.serviceNames = null;
      }
      return {
        action: 'cancel_bookings',
        params: rescuedParams,
        reasoning: 'Cancelling appointments.',
        rescued: true,
        rescueReason: 'cancel_bookings_pattern',
      };
    }

    if (
      /\b(mark|set|update)\b.+\b(done|completed|no[\s-]?show|paid|payment|n\/a|not applicable|in[\s-]?progress|confirmed|pending)\b/i.test(
        prompt,
      ) ||
      /\b(start|begin)\b.+\b(service|appointment|visit)\b/i.test(prompt)
    ) {
      const rescuedParams = { ...params };
      if (isBulkAllAppointmentsPrompt(prompt)) {
        rescuedParams.allAppointments = true;
        delete rescuedParams.serviceName;
        rescuedParams.serviceNames = null;
      }
      const status = extractBookingStatusFromPrompt(prompt);
      const paymentStatus = extractPaymentStatusFromPrompt(prompt);
      if (status && status !== BookingStatus.CANCELLED)
        rescuedParams.status = status;
      if (paymentStatus) rescuedParams.paymentStatus = paymentStatus;
      if (status === BookingStatus.CANCELLED) {
        return {
          action: 'cancel_bookings',
          params: rescuedParams,
          reasoning: 'Cancelling appointments.',
          rescued: true,
          rescueReason: 'cancel_from_update_pattern',
        };
      }
      return {
        action: 'update_bookings',
        params: rescuedParams,
        reasoning: 'Updating appointment status and/or payment.',
        rescued: true,
        rescueReason: 'update_bookings_pattern',
      };
    }

    if (
      /\b(fill|optimize).+(gap|slot|utilization)/i.test(prompt) ||
      isFillGapsFollowUpPrompt(prompt)
    ) {
      const rescuedParams = { ...params };
      applyScheduleOpsPromptHints('fill_unused_slots', rescuedParams, prompt, {
        employees,
      });
      return {
        action: 'fill_unused_slots',
        params: rescuedParams,
        reasoning: 'Filling schedule gaps.',
        rescued: true,
        rescueReason: 'fill_gaps_pattern',
      };
    }

    if (isProviderOwnServicesPrompt(prompt)) {
      return {
        action: 'assign_employee_services',
        params,
        reasoning: 'Assigning services to provider.',
        rescued: true,
        rescueReason: 'assign_services_pattern',
      };
    }

    return null;
  }

  private tryRescueScheduling(
    prompt: string,
    action: string,
    params: Record<string, any>,
  ): IntentRescueResult | null {
    const rescued = rescueSchedulingIntent(prompt, action, params);
    if (!rescued) return null;
    const paramsChanged =
      JSON.stringify(rescued.params) !== JSON.stringify(params);
    if (rescued.action === action && !paramsChanged) return null;
    return {
      action: rescued.action,
      params: rescued.params,
      rescued: true,
      rescueReason: 'scheduling_intent',
    };
  }

  private tryRescueBillingLoyaltyDashboard(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueBillingLoyaltyDashboardIntent(prompt, action);
    if (!rescued) return null;
    const params = enrichBillingLoyaltyRescueParams(rescued.action, {}, prompt);
    return {
      action: rescued.action,
      params,
      reasoning: `Billing/loyalty rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueCreateBookingNotEmployee(
    prompt: string,
    action: string,
    params: Record<string, unknown>,
  ): IntentRescueResult | null {
    // e2e-bug.286 — classifier/rescue "Create a booking…" → create_employee.
    if (!isCreateBookingNotEmployeePrompt(prompt)) return null;
    if (
      action !== 'create_employee' &&
      action !== 'unknown' &&
      action !== 'invite_staff_member'
    ) {
      return null;
    }
    const rescuedParams = { ...params };
    enrichBookingTimeHintsFromPrompt('create_booking', rescuedParams, prompt);
    if (
      /\bfirst\s+available\b/i.test(prompt) ||
      /\b(?:nearest|soonest|next\s+available)\b/i.test(prompt) ||
      isFirstAvailableBookingPrompt(prompt)
    ) {
      rescuedParams.bookingFirstAvailable = true;
      delete rescuedParams.timeSlot;
    }
    if (isAnyProviderBookingPrompt(prompt)) {
      rescuedParams.allProviders = true;
    }
    return {
      action: 'create_booking',
      params: rescuedParams,
      reasoning:
        'Create booking for a slot — not create_employee (e2e-bug.286).',
      rescued: true,
      rescueReason: 'create_booking_not_employee',
    };
  }

  private tryRescueStaffOperations(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueStaffOperationsIntent(prompt, action);
    if (!rescued) return null;
    const params = enrichStaffOperationsRescueParams(
      rescued.action,
      {},
      prompt,
    );
    return {
      action: rescued.action,
      params,
      reasoning: `Staff operations rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueWaitlistDashboard(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueWaitlistDashboardIntent(prompt, action);
    if (!rescued) return null;
    const params = enrichWaitlistDashboardRescueParams(
      rescued.action,
      {},
      prompt,
    );
    return {
      action: rescued.action,
      params,
      reasoning: `Waitlist dashboard rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueOperations(
    prompt: string,
    action: string,
    params: Record<string, any>,
  ): IntentRescueResult | null {
    const transfer = rescueTransferServicesBetweenProvidersIntent(
      prompt,
      action,
      params,
    );
    if (transfer) {
      return {
        action: transfer.action,
        params: transfer.params,
        reasoning: 'Move provider skills from one team member to another.',
        rescued: true,
        rescueReason: transfer.rescueReason,
      };
    }
    const unassign = rescueUnassignServicesFromProviderIntent(
      prompt,
      action,
      params,
    );
    if (unassign) {
      return {
        action: unassign.action,
        params: unassign.params,
        reasoning: 'Remove provider skills from a named team member.',
        rescued: true,
        rescueReason: unassign.rescueReason,
      };
    }
    const categoryAssign = rescueAssignCategoryToProviderIntent(
      prompt,
      action,
      params,
    );
    if (categoryAssign) {
      return {
        action: categoryAssign.action,
        params: categoryAssign.params,
        reasoning: 'Assign all services in a category to a named provider.',
        rescued: true,
        rescueReason: categoryAssign.rescueReason,
      };
    }
    const rescued = rescueOperationsIntent(prompt, action, params);
    if (!rescued) return null;
    // e2e-bug.287 — do not lock check_availability via timeOfDay enrich when
    // the prompt is indefinite anybody/anyone/who-is-open. Availability
    // disambiguation must remap to check_providers_for_service on
    // dashboard/customer (named "is Gevorg open…" stays check_availability).
    if (
      rescued.action === 'check_availability' &&
      action === 'check_availability' &&
      isCheckProvidersForServicePrompt(prompt)
    ) {
      return null;
    }
    const paramsChanged =
      JSON.stringify(rescued.params) !== JSON.stringify(params);
    if (rescued.action === action && !paramsChanged) return null;
    return {
      action: rescued.action,
      params: rescued.params,
      rescued: true,
      rescueReason: rescued.rescueReason ?? 'operations_booking_ops',
    };
  }

  private tryRescueBookingDepth(
    prompt: string,
    action: string,
    employees: Array<{ id: string; name: string }> = [],
    customers: Array<{ id: string; name: string }> = [],
  ): IntentRescueResult | null {
    const rescued = rescueBookingDepthIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    const rescuedParams: Record<string, any> = {};
    applyPackageMultiServicePromptHints(rescued.action, rescuedParams, prompt, {
      employees,
      customers,
    });
    return {
      action: rescued.action,
      params: rescuedParams,
      reasoning: `Booking command rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderBooking(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueProviderBookingIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Provider booking rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderClientContextExact(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = matchProviderClientContextScenario(prompt);
    if (!rescued || rescued.action === action) return null;
    return this.buildProviderClientContextRescueResult(rescued, prompt);
  }

  private buildProviderClientContextRescueResult(
    rescued: { action: string; rescueReason: string },
    prompt: string,
  ): IntentRescueResult {
    const params: Record<string, unknown> = {};
    if (rescued.action === 'add_client_note') {
      const noteBody = extractClientNoteBodyFromPrompt(prompt);
      if (noteBody) params.clientNote = noteBody;
    }
    const customerName = extractCustomerNameFromClientPrompt(prompt);
    if (customerName) params.customerName = customerName;
    return {
      action: rescued.action,
      params,
      reasoning: `Provider client context rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderClientContext(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueProviderClientContextIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return this.buildProviderClientContextRescueResult(rescued, prompt);
  }

  private tryRescueProviderEarnings(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueProviderEarningsIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Provider earnings rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderExp3Exact(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = matchProviderExp3Scenario(prompt);
    if (!rescued || rescued.action === action) return null;
    return this.buildProviderExp3RescueResult(rescued, prompt);
  }

  private buildProviderExp3RescueResult(
    rescued: { action: string; rescueReason: string },
    prompt: string,
  ): IntentRescueResult {
    const params: Record<string, unknown> = {};
    if (rescued.action === 'add_retail_to_booking') {
      const productName = extractRetailProductName(prompt, params);
      if (productName) params.productName = productName;
      const customerName = extractBookingActionCustomerName(prompt, params);
      if (customerName) params.customerName = customerName;
    }
    if (rescued.action === 'send_client_message') {
      params.channel = extractSendMessageChannel(prompt, params);
      const templateHint = extractMessageTemplateHint(prompt, params);
      if (templateHint) params.messageTemplate = templateHint;
      const customerName = extractBookingActionCustomerName(prompt, params);
      if (customerName) params.customerName = customerName;
    }
    if (rescued.action === 'block_my_time') {
      const window = extractBlockWindowFromPrompt(prompt);
      if (window.startTime) params.startTime = window.startTime;
      if (window.endTime) params.endTime = window.endTime;
    }
    return {
      action: rescued.action,
      params,
      reasoning: `Provider exp-3 rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderExp3(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueProviderExp3Intent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return this.buildProviderExp3RescueResult(rescued, prompt);
  }

  private tryRescueProviderOpenShiftsExact(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = matchProviderOpenShiftsScenario(prompt);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Provider open shifts rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderOpenShifts(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueProviderOpenShiftsIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Provider open shifts rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderTeamWhosNextExact(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = matchProviderTeamWhosNextScenario(prompt);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Provider team whos next rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderTeamWhosNext(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueProviderTeamWhosNextIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Provider team whos next rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderTimeOffExact(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = matchProviderTimeOffScenario(prompt);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Provider time-off rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderTimeOff(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueProviderTimeOffIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Provider time-off rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueSummarizeDay(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueSummarizeDayIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Provider summarize-day rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueSummarizeUtilization(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueSummarizeUtilizationIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Provider summarize-utilization rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueShowAppointments(
    prompt: string,
    action: string,
    params: Record<string, unknown>,
  ): IntentRescueResult | null {
    const rescued = rescueShowAppointmentsIntent(prompt, action, params);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: rescued.params,
      reasoning: 'Provider show-appointments rescue → show_appointments',
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueWhoIsNext(
    prompt: string,
    action: string,
    params: Record<string, unknown>,
  ): IntentRescueResult | null {
    const rescued = rescueWhoIsNextIntent(prompt, action, params);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: rescued.params,
      reasoning: 'Provider who-is-next rescue → show_appointments (next slot)',
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainTodayTimeline(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainTodayTimelineIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Provider explain-today-timeline rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueEndOfDaySummary(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueEndOfDaySummaryIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Provider end-of-day-summary rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueMarkVisitComplete(
    prompt: string,
    action: string,
    params: Record<string, unknown>,
  ): IntentRescueResult | null {
    const rescued = rescueMarkVisitCompleteIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: { ...params, ...rescued.params },
      reasoning: `Provider mark-visit-complete rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueMarkVisitInProgress(
    prompt: string,
    action: string,
    params: Record<string, unknown>,
  ): IntentRescueResult | null {
    const rescued = rescueMarkVisitInProgressIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: { ...params, ...rescued.params },
      reasoning: `Provider mark-visit-in-progress rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueMarkMultiServiceStepDone(
    prompt: string,
    action: string,
    params: Record<string, unknown>,
  ): IntentRescueResult | null {
    const rescued = rescueMarkMultiServiceStepDoneIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: { ...params, ...rescued.params },
      reasoning: `Provider mark-multi-service-step-done rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueSearchPatient(
    prompt: string,
    action: string,
    params: Record<string, unknown>,
  ): IntentRescueResult | null {
    const rescued = rescueSearchPatientIntent(prompt, action);
    if (!rescued) return null;
    const query = extractPatientSearchQueryFromPrompt(prompt);
    return {
      action: rescued.action,
      params: { ...params, ...(query ? { query } : {}) },
      reasoning: `Provider search-patient rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueHandoffToDashboardPhi(
    prompt: string,
    action: string,
    params: Record<string, unknown>,
  ): IntentRescueResult | null {
    const rescued = rescueHandoffToDashboardPhiIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params,
      reasoning: `Provider handoff-to-dashboard-phi rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueConfirmPendingBooking(
    prompt: string,
    action: string,
    params: Record<string, unknown>,
  ): IntentRescueResult | null {
    const rescued = rescueConfirmPendingBookingIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: { ...params, ...rescued.params },
      reasoning: `Provider confirm-pending-booking rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueVisitStatusExplainers(
    prompt: string,
    action: string,
    params: Record<string, unknown>,
  ): IntentRescueResult | null {
    const rescued = rescueVisitStatusExplainersIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params,
      reasoning: `Provider visit-status-explainers rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueCalendarSchedulingExplainers(
    prompt: string,
    action: string,
    params: Record<string, unknown>,
  ): IntentRescueResult | null {
    const rescued = rescueCalendarSchedulingExplainersIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params,
      reasoning: `Provider calendar-scheduling-explainers rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueAssistantUxExplainers(
    prompt: string,
    action: string,
    params: Record<string, unknown>,
  ): IntentRescueResult | null {
    const rescued = rescueAssistantUxExplainersIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params,
      reasoning: `Provider assistant-ux-explainers rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueDashboardHandoff(
    prompt: string,
    action: string,
    params: Record<string, unknown>,
  ): IntentRescueResult | null {
    const rescued = rescueDashboardHandoffIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params,
      reasoning: `Provider dashboard-handoff rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderBlockSchedule(
    prompt: string,
    action: string,
    params: Record<string, unknown>,
    surface?: IntentRescueInput['surface'],
  ): IntentRescueResult | null {
    if (surface !== 'provider') return null;
    const rescued = rescueProviderBlockScheduleIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params,
      reasoning: `Provider block_schedule rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueGiveProviderAiFeedback(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueGiveProviderAiFeedbackIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: { ...rescued.params },
      reasoning: `Provider give-ai-feedback rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderExp2(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueProviderExp2Intent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    const params: Record<string, unknown> = {};
    if (rescued.action === 'my_stats') {
      params.period = inferMyStatsPeriodFromPrompt(prompt, params);
      const scope = inferMyStatsScopeFromPrompt(prompt, params);
      if (scope === 'team') params.scope = 'team';
    }
    if (
      rescued.action === 'check_in_client' ||
      rescued.action === 'mark_running_late' ||
      rescued.action === 'mark_ready_now' ||
      rescued.action === 'suggest_cancel_note' ||
      rescued.action === 'request_client_review' ||
      rescued.action === 'open_dashboard_deep_link'
    ) {
      const customerName = extractBookingActionCustomerName(prompt, params);
      if (customerName) params.customerName = customerName;
    }
    if (rescued.action === 'mark_running_late') {
      const minutesLate = extractRunningLateMinutesFromPrompt(prompt, params);
      if (minutesLate != null) params.minutesLate = minutesLate;
    }
    if (rescued.action === 'reassign_booking_same_day') {
      const employeeName = extractReassignEmployeeName(prompt, params);
      if (employeeName) params.employeeName = employeeName;
    }
    return {
      action: rescued.action,
      params,
      reasoning: `Provider exp-2 rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueClaimReferralCode(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueClaimReferralCodeIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: enrichClaimReferralCodeParamsFromPrompt(prompt),
      reasoning: `Claim referral code rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueConsumerAdoption(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueConsumerAdoptionIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    const params: Record<string, unknown> =
      rescued.action === 'explain_push_permission'
        ? { ...(parseExplainPushPermissionFromPrompt(prompt) ?? {}) }
        : rescued.action === 'claim_referral_code'
          ? enrichClaimReferralCodeParamsFromPrompt(prompt)
          : {};
    return {
      action: rescued.action,
      params,
      reasoning: `Consumer adoption rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderPushSetup(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueProviderPushSetupIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Provider push setup rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueReschedulePackageVisitSelf(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueReschedulePackageVisitSelfIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning:
        'Customer package visit reschedule — move one bundle visit block.',
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueCancelPackageVisitSelf(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueCancelPackageVisitSelfIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: 'Customer package visit cancel — cancel one bundle visit.',
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueResumeBookingDraft(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueResumeBookingDraftIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning:
        'Customer/public booking draft resume — restore abandoned booking.',
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainSlotNoLongerAvailable(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainSlotNoLongerAvailableIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning:
        'Customer/public checkout — explain why a selected slot disappeared and refresh availability.',
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainMultiServicePaymentReturn(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainMultiServicePaymentReturnIntent(
      prompt,
      action,
    );
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning:
        'Customer multi-service checkout — explain Stripe browser return and confirm step.',
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueRetryFailedNetworkAction(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueRetryFailedNetworkActionIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning:
        'Customer network retry — replay offline queue or tap Try again after load/booking failure.',
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainRtlLayout(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainRtlLayoutIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning:
        'Customer/public assistant — explain RTL reading direction and adoption-a11y layout.',
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueGiveAiFeedback(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueGiveAiFeedbackIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning:
        'Customer/public assistant — thumbs up/down on last answer with reason chips.',
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueSpeakAssistantReply(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueSpeakAssistantReplyIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning:
        'Customer/public assistant — read the last answer aloud with text-to-speech.',
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainVoiceInput(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainVoiceInputIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning:
        'Customer/public assistant — explain Voice input mic usage or speech recognition errors.',
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueSelfServiceBooking(
    prompt: string,
    action: string,
    surface?: IntentRescueInput['surface'],
  ): IntentRescueResult | null {
    // e2e-bug.171: this whole chain rescues into customer-checkout-only intents
    // (cancel/rebook, multi-service cart, availability discovery, etc.) — never
    // let it fire for dashboard/provider-surface prompts, however tempting a
    // keyword match looks, or a staff scheduling command can get silently
    // hijacked into an unrelated customer booking flow.
    if (surface !== 'customer' && surface !== 'public') return null;

    const cancelPackageRebookSingle =
      rescueCancelPackageRebookSingleCompoundIntent(prompt, action);
    if (cancelPackageRebookSingle) {
      return {
        action: cancelPackageRebookSingle.action,
        params: {},
        reasoning:
          'Cancel package rebook single compound — cancel package visit, book standalone service instead.',
        rescued: true,
        rescueReason: cancelPackageRebookSingle.rescueReason,
      };
    }
    const cancelAndRebook = rescueCancelAndRebookCompoundIntent(prompt, action);
    if (cancelAndRebook) {
      return {
        action: cancelAndRebook.action,
        params: {},
        reasoning:
          'Cancel and rebook compound — cancel upcoming visit, book nearest slot.',
        rescued: true,
        rescueReason: cancelAndRebook.rescueReason,
      };
    }
    const providerSameDayMulti = rescueProviderSameDayMultiCompoundIntent(
      prompt,
      action,
    );
    if (providerSameDayMulti) {
      return {
        action: providerSameDayMulti.action,
        params: {},
        reasoning:
          'Provider same day multi compound — pick stylist, check multi-service block, book.',
        rescued: true,
        rescueReason: providerSameDayMulti.rescueReason,
      };
    }
    const skipMultiServiceDayCompoundOnPublic =
      surface === 'public' && isMultiServiceAvailabilityDiscoveryPrompt(prompt);
    if (!skipMultiServiceDayCompoundOnPublic) {
      const multiServiceDay = rescueMultiServiceDayCompoundIntent(
        prompt,
        action,
      );
      if (multiServiceDay) {
        return {
          action: multiServiceDay.action,
          params: {},
          reasoning:
            'Multi-service day compound — add to cart, check availability, book visit.',
          rescued: true,
          rescueReason: multiServiceDay.rescueReason,
        };
      }
    }
    const guestPayCashManage = rescueGuestPayCashManageCompoundIntent(
      prompt,
      action,
    );
    if (guestPayCashManage) {
      return {
        action: guestPayCashManage.action,
        params: {},
        reasoning:
          'Guest pay cash manage compound — guest checkout booking, pay cash at visit, then deliver manage link.',
        rescued: true,
        rescueReason: guestPayCashManage.rescueReason,
      };
    }
    const guestBookAndManage = rescueGuestBookAndManageCompoundIntent(
      prompt,
      action,
    );
    if (guestBookAndManage) {
      return {
        action: guestBookAndManage.action,
        params: {},
        reasoning:
          'Guest book and manage compound — guest checkout booking then deliver manage link.',
        rescued: true,
        rescueReason: guestBookAndManage.rescueReason,
      };
    }
    const guestManageVisit = rescueGuestManageVisitCompoundIntent(
      prompt,
      action,
    );
    if (guestManageVisit) {
      return {
        action: guestManageVisit.action,
        params: {},
        reasoning:
          'Guest manage visit compound — look up manage link by guest contact, then cancel/reschedule with token.',
        rescued: true,
        rescueReason: guestManageVisit.rescueReason,
      };
    }
    if (surface === 'public' || surface === 'customer') {
      // e2e-bug.196 — /public/:slug/assistant uses surface:customer; public
      // assistant compound recipes must still rescue before single-intent steals
      // (explain_multi_service_cart / book_multi_service / …).
      const publicAssistantCompound = rescuePublicAssistantCompoundIntent(
        prompt,
        action,
      );
      if (publicAssistantCompound) {
        return {
          action: publicAssistantCompound.action,
          params: {},
          reasoning:
            'Public assistant compound — browse/list then availability, specialists, or business info.',
          rescued: true,
          rescueReason: publicAssistantCompound.rescueReason,
        };
      }
    }
    const rescued = rescueSelfServiceBookingIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    const manageCredParams = this.isManageBookingWithTokenRescueReason(
      rescued.rescueReason,
    )
      ? extractManageLinkCredentialsFromPrompt(prompt)
      : {};
    return {
      action: rescued.action,
      params: manageCredParams,
      reasoning: `Customer booking rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  /** e2e-bug.134 — guest manage-link cancel/reschedule/explain before CRM/policy steals. */
  private tryRescueManageBookingWithToken(
    prompt: string,
    action: string,
    session?: Record<string, unknown> | null,
  ): IntentRescueResult | null {
    const rescued = rescueManageBookingWithTokenIntent(prompt, action, session);
    if (!rescued || rescued.action === action) return null;
    const fromPrompt = extractManageLinkCredentialsFromPrompt(prompt);
    const bookingId =
      fromPrompt.bookingId ??
      (typeof session?.bookingId === 'string' ? session.bookingId : undefined);
    const manageToken =
      fromPrompt.manageToken ??
      (typeof session?.manageToken === 'string'
        ? session.manageToken
        : undefined);
    return {
      action: rescued.action,
      params: {
        ...(bookingId ? { bookingId } : {}),
        ...(manageToken ? { manageToken } : {}),
      },
      reasoning: `Manage-link token rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private isManageBookingWithTokenRescueReason(reason: string): boolean {
    return (
      reason === 'cancel_booking_with_token' ||
      reason === 'reschedule_booking_with_token' ||
      reason === 'cancel_package_visit_with_token' ||
      reason === 'reschedule_package_visit_with_token' ||
      reason === 'explain_manage_booking_context'
    );
  }

  private tryRescuePushNotifications(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const salonNotifications = rescueOnboardSalonNotificationsCompoundIntent(
      prompt,
      action,
    );
    if (salonNotifications) {
      return {
        action: salonNotifications.action,
        params: {},
        reasoning:
          'Salon notification onboarding compound — notification settings, WhatsApp integration, test push.',
        rescued: true,
        rescueReason: salonNotifications.rescueReason,
      };
    }

    const rescued = rescuePushNotificationsIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    let params: Record<string, unknown> = {};
    if ((rescued.action as string) === 'configure_notification_settings') {
      params = enrichNotificationSettingsParamsFromPrompt({}, prompt);
    } else if (
      (rescued.action as string) === 'configure_whatsapp_integration'
    ) {
      params = enrichWhatsappIntegrationParamsFromPrompt({}, prompt);
    } else if (
      (rescued.action as string) === 'toggle_business_email_on_customer_change'
    ) {
      // e2e-bug.159 — "Notify me whenever…" must enable, not read-only status.
      const enabled =
        extractBusinessEmailOnCustomerChangeToggleFromPrompt(prompt);
      if (enabled !== null) params = { enabled };
    }
    return {
      action: rescued.action,
      params,
      reasoning: `Push/notifications rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueMarketingGrowth(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const consumerAppGrowth = rescueLaunchConsumerAppGrowthCompoundIntent(
      prompt,
      action,
    );
    if (consumerAppGrowth) {
      return {
        action: consumerAppGrowth.action,
        params: {},
        reasoning:
          'Consumer app growth launch compound — explain install QR, regenerate assets, marketing registration email.',
        rescued: true,
        rescueReason: consumerAppGrowth.rescueReason,
      };
    }

    const rescued = rescueMarketingGrowthIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    let params: Record<string, unknown> = {};
    if (rescued.action === 'create_promo_code') {
      params = parseCreatePromoCodeFromPrompt(prompt) ?? {};
    } else if (rescued.action === 'configure_loyalty_settings') {
      params = parseConfigureLoyaltySettingsFromPrompt(prompt) ?? {};
    } else if (rescued.action === 'configure_stripe_connect') {
      params = enrichConfigureStripeConnectParamsFromPrompt({}, prompt);
    } else if ((rescued.action as string) === 'apply_loyalty_at_checkout') {
      params = enrichApplyLoyaltyAtCheckoutParamsFromPrompt({}, prompt);
    }
    return {
      action: rescued.action,
      params,
      reasoning: `Marketing/growth rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueConsumerCheckoutTax(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainConsumerCheckoutTaxIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainConsumerCheckoutTaxFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.aspect) params.aspect = parsed.aspect;

    return {
      action: rescued.action,
      params,
      reasoning: `Consumer checkout tax explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueCheckoutTax(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueCheckoutTaxIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainCheckoutTaxFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.aspect) params.aspect = parsed.aspect;

    return {
      action: rescued.action,
      params,
      reasoning: `Checkout tax explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueConsumerCheckoutSuccess(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainConsumerCheckoutSuccessIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainConsumerCheckoutSuccessFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.bookingId) params.bookingId = parsed.bookingId;
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.aspect) params.aspect = parsed.aspect;

    return {
      action: rescued.action,
      params,
      reasoning: `Consumer checkout success explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueDismissRecommendations(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueDismissRecommendationsIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseDismissRecommendationsFromPrompt(prompt);
    if (!parsed) return null;

    return {
      action: rescued.action,
      params: enrichDismissRecommendationsParamsFromPrompt({}, prompt),
      reasoning:
        'Dismiss checkout recommendations — hide You might also like for this visit.',
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueCheckoutRecommendations(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainCheckoutRecommendationsIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainCheckoutRecommendationsFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.bookingId) params.bookingId = parsed.bookingId;
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.productName) params.productName = parsed.productName;
    if (parsed.aspect) params.aspect = parsed.aspect;

    return {
      action: rescued.action,
      params,
      reasoning: `Checkout recommendations explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProductGuideMisroute(
    prompt: string,
    action: string,
    surface?: IntentRescueInput['surface'],
    assistantMode?: AssistantMode,
  ): IntentRescueResult | null {
    const rescued = rescueProductGuideMisroute(prompt, action, {
      surface,
      assistantMode,
    });
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Product guide misroute guard → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueCreateServicePrepayment(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueCreateServicePrepaymentIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params:
        rescued.action === 'create_services'
          ? enrichCreateServicesPrepaymentParamsFromPrompt({}, prompt)
          : enrichCreateServicePrepaymentParamsFromPrompt({}, prompt),
      reasoning: `Create service prepayment rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  // e2e-bug.148 (write-side follow-up) — "Add a retail product ... priced at
  // N dollars" was being stolen by the budget-discovery rescue's price-mention
  // detection (→ list_services / budget_list_services) before
  // rescueRetailFinanceIntent ever got a chance to run, since budget-discovery
  // runs earlier in this pipeline. Mirrors the e2e-bug.146/137
  // rescue-before-steal pattern.
  private tryRescueCreateProductEarly(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    if (action === 'create_product') return null;
    if (!isCreateProductPrompt(prompt)) return null;
    return {
      action: 'create_product',
      params: enrichCreateProductParamsFromPrompt({}, prompt),
      reasoning: 'Create product rescue before budget-discovery price steal.',
      rescued: true,
      rescueReason: 'create_product',
    };
  }

  private tryRescueListServicesPaymentFilter(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueListServicesPaymentFilterIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: enrichListServicesPaymentFilterParamsFromPrompt({}, prompt),
      reasoning: `Service catalog payment filter rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueRescheduleThenCreateBookingCompound(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const compound = rescueRescheduleThenCreateBookingCompoundIntent(
      prompt,
      action,
    );
    if (!compound) return null;
    return {
      action: compound.action,
      params: {},
      reasoning:
        'Reschedule then create booking compound — move existing visit, then book another.',
      rescued: true,
      rescueReason: compound.rescueReason,
    };
  }

  private tryRescueBudgetServiceDiscovery(
    prompt: string,
    action: string,
    surface?: 'dashboard' | 'customer' | 'public',
  ): IntentRescueResult | null {
    if (surface === 'dashboard') {
      const compound = rescueBudgetDiscoverAndBookCompoundIntent(
        prompt,
        action,
      );
      if (compound) {
        return {
          action: compound.action,
          params: enrichBudgetFromPrompt({}, prompt),
          reasoning:
            'Budget discover and book compound — filter catalog, check providers, create booking.',
          rescued: true,
          rescueReason: compound.rescueReason,
        };
      }
    }
    if (surface === 'customer' || surface === 'public') {
      const discoverPay = rescueDiscoverBookAndPayCompoundIntent(
        prompt,
        action,
      );
      if (discoverPay) {
        return {
          action: discoverPay.action,
          params: enrichBudgetFromPrompt({}, prompt),
          reasoning:
            'Discover book and pay compound — filter catalog, check availability, book, pay online.',
          rescued: true,
          rescueReason: discoverPay.rescueReason,
        };
      }
    }
    const eveningWeekendChipRescue = rescueFindEveningWeekendSlotsIntent(
      prompt,
      action,
    );
    if (eveningWeekendChipRescue) {
      return {
        action: eveningWeekendChipRescue.action,
        params: parseFindEveningWeekendSlotsFromPrompt(prompt) ?? {},
        reasoning: 'Evening/weekend discover chip → find_evening_weekend_slots',
        rescued: true,
        rescueReason: eveningWeekendChipRescue.rescueReason,
      };
    }
    const budgetChipRescue = rescueFindServicesUnderBudgetIntent(
      prompt,
      action,
    );
    if (budgetChipRescue) {
      return {
        action: budgetChipRescue.action,
        params: parseFindServicesUnderBudgetFromPrompt(prompt) ?? {},
        reasoning: 'Budget discover chip → find_services_under_budget',
        rescued: true,
        rescueReason: budgetChipRescue.rescueReason,
      };
    }
    const rescued = rescueBudgetServiceDiscoveryIntent(prompt, action, surface);
    if (!rescued || rescued.action === action) return null;
    const rescueReason =
      rescued.rescueReason === 'apply_gift_card_code'
        ? 'apply_gift_card_checkout'
        : rescued.rescueReason;
    // e2e-bug.130 / e2e-bug.80 — purchase/quote misroutes need gift-card amount
    // hints, not budget maxPrice.
    if (
      rescued.action === 'buy_gift_card' ||
      rescued.action === 'buy_gift_card_physical' ||
      rescued.action === 'buy_gift_card_for_someone' ||
      rescued.action === 'get_gift_card_quote'
    ) {
      const buyParams: Record<string, any> = {};
      applyGiftCardPaymentsPromptHints(rescued.action, buyParams, prompt);
      return {
        action: rescued.action,
        params: buyParams,
        reasoning: `Budget service discovery rescue → ${rescued.action}`,
        rescued: true,
        rescueReason,
      };
    }
    return {
      action: rescued.action,
      params: enrichBudgetFromPrompt({}, prompt),
      reasoning: `Budget service discovery rescue → ${rescued.action}`,
      rescued: true,
      rescueReason,
    };
  }

  private tryRescueRankServiceDiscovery(
    prompt: string,
    action: string,
    surface: 'dashboard' | 'customer' | 'public' = 'dashboard',
  ): IntentRescueResult | null {
    // e2e-bug.92 — public/customer rank discovery must escape check_providers_for_service.
    if (surface === 'customer' || surface === 'public') {
      const rescued = rescueServiceRankDiscoveryIntent(prompt, action, surface);
      if (!rescued || rescued.action === action) return null;
      return {
        action: rescued.action,
        params: rescued.params,
        reasoning: `Rank service discovery rescue → ${rescued.action}`,
        rescued: true,
        rescueReason: rescued.rescueReason,
      };
    }
    if (surface !== 'dashboard') return null;
    const compound = rescueRankDiscoverAndBookCompoundIntent(prompt, action);
    if (!compound) return null;
    return {
      action: compound.action,
      params: enrichServiceRankFromPrompt(
        enrichBudgetFromPrompt({}, prompt),
        prompt,
      ),
      reasoning:
        'Rank discover and book compound — filter catalog, check providers, create booking.',
      rescued: true,
      rescueReason: compound.rescueReason,
    };
  }

  private tryRescueSetupSalonCheckoutCompound(
    prompt: string,
    action: string,
    surface?: 'dashboard' | 'customer' | 'public',
  ): IntentRescueResult | null {
    if (surface !== 'dashboard') return null;
    const compound = rescueSetupSalonCheckoutCompoundIntent(prompt, action);
    if (!compound) return null;
    return {
      action: compound.action,
      params: {},
      reasoning:
        'Salon checkout setup compound — Stripe guide, cash, online prepayment, booking page.',
      rescued: true,
      rescueReason: compound.rescueReason,
    };
  }

  private tryRescueConfigureServicesPaymentMatrixCompound(
    prompt: string,
    action: string,
    surface?: 'dashboard' | 'customer' | 'public',
  ): IntentRescueResult | null {
    if (surface !== 'dashboard') return null;
    const compound = rescueConfigureServicesPaymentMatrixCompoundIntent(
      prompt,
      action,
    );
    if (!compound) return null;
    return {
      action: compound.action,
      params: {},
      reasoning:
        'Services payment matrix compound — optional price update, per-category online payment, cash.',
      rescued: true,
      rescueReason: compound.rescueReason,
    };
  }

  private tryRescueCashAndOnlinePaymentCompound(
    prompt: string,
    action: string,
    surface?: 'dashboard' | 'customer' | 'public',
  ): IntentRescueResult | null {
    if (surface !== 'dashboard') return null;
    const compound = rescueCashAndOnlinePaymentCompoundIntent(prompt, action);
    if (!compound) return null;
    return {
      action: compound.action,
      params: {},
      reasoning:
        'Cash + online payment compound — configure cash then per-service online payment.',
      rescued: true,
      rescueReason: compound.rescueReason,
    };
  }

  private tryRescueDeclineOnlinePaymentCategoryCompound(
    prompt: string,
    action: string,
    surface?: 'dashboard' | 'customer' | 'public',
  ): IntentRescueResult | null {
    if (surface !== 'dashboard') return null;
    const compound = rescueDeclineOnlinePaymentCategoryCompoundIntent(
      prompt,
      action,
    );
    if (!compound) return null;
    return {
      action: compound.action,
      params: {},
      reasoning:
        'Decline/accept category payment compound — per-category online payment split.',
      rescued: true,
      rescueReason: compound.rescueReason,
    };
  }

  private tryRescueOnboardSalonNotificationsCompound(
    prompt: string,
    action: string,
    surface?: 'dashboard' | 'customer' | 'public',
  ): IntentRescueResult | null {
    if (surface !== 'dashboard') return null;
    const compound = rescueOnboardSalonNotificationsCompoundIntent(
      prompt,
      action,
    );
    if (!compound) return null;
    return {
      action: compound.action,
      params: {},
      reasoning:
        'Salon notification onboarding compound — notification settings, WhatsApp integration, test push.',
      rescued: true,
      rescueReason: compound.rescueReason,
    };
  }

  private tryRescueLaunchConsumerAppGrowthCompound(
    prompt: string,
    action: string,
    surface?: 'dashboard' | 'customer' | 'public',
  ): IntentRescueResult | null {
    if (surface !== 'dashboard') return null;
    const compound = rescueLaunchConsumerAppGrowthCompoundIntent(
      prompt,
      action,
    );
    if (!compound) return null;
    return {
      action: compound.action,
      params: {},
      reasoning:
        'Consumer app growth launch compound — explain install QR, regenerate assets, marketing registration email.',
      rescued: true,
      rescueReason: compound.rescueReason,
    };
  }

  private tryRescueRecommendationProduct(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const performanceRescued = rescueSummarizeRecommendationPerformanceIntent(
      prompt,
      action,
    );
    if (performanceRescued) {
      const parsed = parseSummarizeRecommendationPerformanceFromPrompt(prompt);
      const params: Record<string, unknown> = {};
      if (parsed?.aspect) params.aspect = parsed.aspect;
      if (parsed?.surface) params.surface = parsed.surface;
      if (parsed?.serviceName) params.serviceName = parsed.serviceName;
      if (parsed?.productName) params.productName = parsed.productName;
      if (parsed?.daysAhead) params.daysAhead = parsed.daysAhead;
      return {
        action: performanceRescued.action,
        params,
        reasoning: `Recommendation performance summary rescue → ${performanceRescued.action}`,
        rescued: true,
        rescueReason: performanceRescued.rescueReason,
      };
    }

    const explainRescued = rescueExplainRecommendationSetupIntent(
      prompt,
      action,
    );
    if (explainRescued) {
      const parsed = parseExplainRecommendationSetupFromPrompt(prompt);
      const params: Record<string, unknown> = {};
      if (parsed?.serviceId) params.serviceId = parsed.serviceId;
      if (parsed?.serviceName) params.serviceName = parsed.serviceName;
      if (parsed?.categoryId) params.categoryId = parsed.categoryId;
      if (parsed?.categoryName) params.categoryName = parsed.categoryName;
      return {
        action: explainRescued.action,
        params,
        reasoning: `Recommendation product rescue → ${explainRescued.action}`,
        rescued: true,
        rescueReason: explainRescued.rescueReason,
      };
    }

    const analyticsRescued = rescueExplainRecommendationAnalyticsIntent(
      prompt,
      action,
    );
    if (analyticsRescued) {
      const parsed = parseExplainRecommendationAnalyticsFromPrompt(prompt);
      const params: Record<string, unknown> = {};
      if (parsed?.aspect) params.aspect = parsed.aspect;
      if (parsed?.surface) params.surface = parsed.surface;
      if (parsed?.productName) params.productName = parsed.productName;
      if (parsed?.daysAhead) params.daysAhead = parsed.daysAhead;
      return {
        action: analyticsRescued.action,
        params,
        reasoning: `Recommendation analytics explain rescue → ${analyticsRescued.action}`,
        rescued: true,
        rescueReason: analyticsRescued.rescueReason,
      };
    }

    const linkRescued = rescueLinkRecommendedProductsIntent(prompt, action);
    if (linkRescued) {
      const parsed = parseLinkRecommendedProductsFromPrompt(prompt);
      if (!parsed) return null;
      const params: Record<string, unknown> = {};
      if (parsed.productNames.length > 0) {
        params.productNames = parsed.productNames;
      }
      if (parsed.productIds?.length) params.productIds = parsed.productIds;
      if (parsed.serviceId) params.serviceId = parsed.serviceId;
      if (parsed.serviceName) params.serviceName = parsed.serviceName;
      if (parsed.categoryId) params.categoryId = parsed.categoryId;
      if (parsed.categoryName) params.categoryName = parsed.categoryName;
      return {
        action: linkRescued.action,
        params,
        reasoning: `Recommendation product rescue → ${linkRescued.action}`,
        rescued: true,
        rescueReason: linkRescued.rescueReason,
      };
    }

    const rescued = rescueConfigureRecommendationProductIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseConfigureRecommendationProductFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.productId) params.productId = parsed.productId;
    if (parsed.productName) params.productName = parsed.productName;
    if (parsed.description) params.description = parsed.description;
    if (parsed.imageUrl) params.imageUrl = parsed.imageUrl;
    if (parsed.externalLink) params.externalLink = parsed.externalLink;
    if (parsed.retailPrice !== undefined)
      params.retailPrice = parsed.retailPrice;
    if (parsed.wantsImage) params.wantsImage = true;
    if (parsed.wantsLink) params.wantsLink = true;
    if (parsed.isUpdate) params.isUpdate = true;

    return {
      action: rescued.action,
      params,
      reasoning: `Recommendation product rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueRetailFinance(
    prompt: string,
    action: string,
    params: Record<string, unknown> = {},
  ): IntentRescueResult | null {
    // e2e-bug.148 — enrich create_product price/name even when already classified.
    if (action === 'create_product') {
      const enriched = enrichCreateProductParamsFromPrompt(
        { ...params },
        prompt,
      );
      if (enriched.price != null || enriched.productName) {
        return {
          action: 'create_product',
          params: enriched,
          reasoning:
            'Enrich create_product name/price from natural retail phrasing.',
          rescued: true,
          rescueReason: 'create_product_params',
        };
      }
    }

    // e2e-bug.141 — enrich delete_expense description/id even when already classified.
    if (action === 'delete_expense') {
      const enriched = enrichDeleteExpenseParamsFromPrompt(
        { ...params },
        prompt,
      );
      if (enriched.description || enriched.expenseId || enriched.category) {
        return {
          action: 'delete_expense',
          params: enriched,
          reasoning:
            'Enrich delete_expense match fields from natural expense phrasing.',
          rescued: true,
          rescueReason: 'delete_expense_params',
        };
      }
    }

    // e2e-bug.140 — sanitize garbage category (e.g. "today") on record_expense.
    if (action === 'record_expense') {
      const enriched = enrichRecordExpenseParamsFromPrompt(
        { ...params },
        prompt,
      );
      if (
        enriched.category ||
        enriched.amount != null ||
        enriched.description
      ) {
        return {
          action: 'record_expense',
          params: enriched,
          reasoning:
            'Enrich/sanitize record_expense category, amount, description.',
          rescued: true,
          rescueReason: 'record_expense_params',
        };
      }
    }

    const rescued = rescueRetailFinanceIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    let nextParams: Record<string, unknown> = { ...params };
    if (rescued.action === 'create_commission_rule') {
      nextParams = {
        ...nextParams,
        ...(parseCreateCommissionRuleFromPrompt(prompt) ?? {}),
      };
    } else if (rescued.action === 'export_analytics_report') {
      nextParams = {
        ...nextParams,
        ...(parseExportAnalyticsReportFromPrompt(prompt) ?? {}),
      };
    } else if (rescued.action === 'create_product') {
      nextParams = enrichCreateProductParamsFromPrompt(nextParams, prompt);
    } else if (rescued.action === 'delete_expense') {
      nextParams = enrichDeleteExpenseParamsFromPrompt(nextParams, prompt);
    } else if (rescued.action === 'record_expense') {
      nextParams = enrichRecordExpenseParamsFromPrompt(nextParams, prompt);
    }
    return {
      action: rescued.action,
      params: nextParams,
      reasoning: `Retail/finance rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  /**
   * `lookup_customer` carrying the booking the prompt names — e2e-bug.358.
   *
   * "Summarize customer Maria Lopez who has a booking with Gevorg today at
   * 10:00" names a customer *and* which booking is meant. Both facts are
   * needed: `ai-booking-core.service.ts` only narrows to that appointment when
   * `params.bookingContext === true` and a provider, time or date came with it.
   *
   * This existed, below, as a standalone branch — but `tryRescueDashboardCustomerRead`
   * runs first and its `isLookupCustomerPrompt` arm returns `lookup_customer`
   * with nothing but `customerName`, so the richer branch was unreachable for
   * exactly the prompts it was written for. All six `lookup_customer` eval cases
   * failed on the missing params; four of them matched the action perfectly.
   *
   * Shared rather than duplicated into the earlier arm: two copies of "what does
   * this prompt say about the booking" is how they drift.
   */
  private lookupCustomerWithBookingContext(
    prompt: string,
    params: Record<string, unknown>,
    fallbackCustomerName?: string,
  ): IntentRescueResult | null {
    if (!isCustomerBookingContextPrompt(prompt)) return null;
    const ctx = extractCustomerBookingContextFromPrompt(prompt);
    return {
      action: 'lookup_customer',
      params: {
        ...params,
        customerName:
          ctx.customerName ?? fallbackCustomerName ?? params.customerName,
        employeeName: ctx.employeeName ?? params.employeeName,
        timeSlot: ctx.timeSlot ?? params.timeSlot,
        date: ctx.dateHint ?? params.date ?? 'today',
        bookingContext: true,
      },
      reasoning: 'Customer profile with booking context (provider/time).',
      rescued: true,
      rescueReason: 'customer_booking_context',
    };
  }

  private tryRescueDashboardCustomerRead(
    prompt: string,
    action: string,
    params: Record<string, unknown>,
  ): IntentRescueResult | null {
    if (
      action === 'list_customers' ||
      action === 'lookup_customer' ||
      action === 'summarize_customers'
    ) {
      return null;
    }
    if (isCustomerRetentionPrompt(prompt)) {
      return {
        action: 'summarize_customers',
        params: { ...params, customerMetric: 'at_risk' },
        reasoning:
          'Customer retention / at-risk segment → summarize_customers.',
        rescued: true,
        rescueReason: 'customer_retention',
      };
    }
    if (isListCustomersPrompt(prompt)) {
      return {
        action: 'list_customers',
        params: { ...params },
        reasoning: 'Customer list/browse → list_customers.',
        rescued: true,
        rescueReason: 'list_customers',
      };
    }
    if (isLookupCustomerPrompt(prompt)) {
      const customerName = extractLookupCustomerNameFromPrompt(prompt);
      // e2e-bug.358 — when the prompt also names the booking, say so.
      const withBooking = this.lookupCustomerWithBookingContext(
        prompt,
        params,
        customerName,
      );
      if (withBooking) return withBooking;
      return {
        action: 'lookup_customer',
        params: {
          ...params,
          ...(customerName ? { customerName } : {}),
        },
        reasoning: 'Customer profile lookup → lookup_customer.',
        rescued: true,
        rescueReason: 'lookup_customer',
      };
    }
    return null;
  }

  /** e2e-bug.139 — override list_agent_tasks for support tickets / unread messages. */
  private tryRescueExplainSupportInbox(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainSupportInboxIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Support inbox boundary → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueAgentOps(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueAgentOpsIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    const params: Record<string, unknown> = {};
    if (rescued.action === 'list_agent_tasks' && /\bpending\b/i.test(prompt)) {
      params.scope = 'pending';
    }
    return {
      action: rescued.action,
      params,
      reasoning: `Agent ops rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueMetaOps(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueMetaOpsIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Meta ops rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueLocations(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueLocationsIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    let params: Record<string, unknown> = {};
    if (rescued.action === 'create_location') {
      params = { ...(parseCreateLocationFromPrompt(prompt) ?? {}) };
    } else if (rescued.action === 'update_location') {
      params = { ...(parseUpdateLocationFromPrompt(prompt) ?? {}) };
    }
    return {
      action: rescued.action,
      params,
      reasoning: `Locations rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  /** e2e-bug.146 — shared business-tax rescue (configure / set_service / explain). */
  private tryRescueBusinessTaxEarly(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const businessTax = rescueBusinessTaxIntent(prompt, action);
    if (!businessTax || businessTax.action === action) return null;
    const params: Record<string, unknown> = {};
    if (businessTax.action === 'configure_business_tax') {
      const parsed = parseBusinessTaxFromPrompt(prompt);
      if (!parsed) return null;
      Object.assign(params, parsed);
    } else if (businessTax.action === 'set_service_tax_rate') {
      const parsed = parseSetServiceTaxRateFromPrompt(prompt);
      if (!parsed) return null;
      Object.assign(params, parsed);
    }
    return {
      action: businessTax.action,
      params,
      reasoning: `Business tax rescue → ${businessTax.action}`,
      rescued: true,
      rescueReason: businessTax.rescueReason,
    };
  }

  private tryRescueIntegrations(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueIntegrationsIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    let params: Record<string, unknown> = {};
    if ((rescued.action as string) === 'explain_integration_health') {
      params = { ...(parseExplainIntegrationHealthFromPrompt(prompt) ?? {}) };
    } else if ((rescued.action as string) === 'configure_openai_integration') {
      params = enrichOpenaiIntegrationParamsFromPrompt({}, prompt);
    }
    return {
      action: rescued.action,
      params,
      reasoning: `Integrations rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueGiftFulfillment(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueGiftFulfillmentIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Gift fulfillment rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueReportsCurrency(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueReportsCurrencyIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Reports currency rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueSummarizeBookings(
    prompt: string,
    action: string,
    params: Record<string, unknown>,
  ): IntentRescueResult | null {
    const rescued = rescueSummarizeBookingsIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: {
        ...params,
        bookingMetric: rescued.bookingMetric,
        ...(rescued.allTime ? { allTime: true } : {}),
      },
      reasoning:
        rescued.bookingMetric === 'revenue'
          ? 'Calculate total earnings/revenue for the requested period.'
          : rescued.allTime
            ? 'Count all bookings (unscoped total) — not a single empty day.'
            : 'Summarize booking metrics for the requested period.',
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  /** e2e-bug.153 — plain "how many customers" → overview, not ranked no-shows. */
  private tryRescueUnscopedCustomerCount(
    prompt: string,
    action: string,
    params: Record<string, unknown>,
  ): IntentRescueResult | null {
    const rescued = rescueUnscopedCustomerCountIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: {
        ...params,
        customerMetric: rescued.customerMetric,
      },
      reasoning:
        'Count active customers (roster total) — not a ranked no-show/segment list.',
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  /** e2e-bug.137 — "customer retention rate" has no react_agent tool at all. */
  private tryRescueCustomerRetentionRate(
    prompt: string,
    action: string,
    params: Record<string, unknown>,
  ): IntentRescueResult | null {
    const rescued = rescueCustomerRetentionRateIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: {
        ...params,
        customerMetric: rescued.customerMetric,
      },
      reasoning:
        'Calculate customer retention rate from real repeat-visit data.',
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueRevenueKpis(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueRevenueKpisIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Revenue KPI summary rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescuePackageDisplayName(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescuePackageDisplayNameIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parsePackageDisplayNameExplainFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.packageId) params.packageId = parsed.packageId;
    if (parsed.packageName) params.packageName = parsed.packageName;
    if (parsed.queryLocale) params.locale = parsed.queryLocale;

    return {
      action: rescued.action,
      params,
      reasoning: `Package display name rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueBusinessLanguages(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const packageDisplayName = this.tryRescuePackageDisplayName(prompt, action);
    if (packageDisplayName) return packageDisplayName;

    const packageLocalized = this.tryRescuePackageLocalizedNames(
      prompt,
      action,
    );
    if (packageLocalized) return packageLocalized;

    const bookingLanguages = rescueBookingLanguagesIntent(prompt, action);
    if (bookingLanguages) {
      return {
        action: bookingLanguages.action,
        params: {},
        reasoning: `Booking languages rescue → ${bookingLanguages.action}`,
        rescued: true,
        rescueReason: bookingLanguages.rescueReason,
      };
    }

    const getDirectionsToSalon = rescueGetDirectionsToSalonIntent(
      prompt,
      action,
    );
    if (getDirectionsToSalon) {
      const parsed = parseGetDirectionsToSalonFromPrompt(prompt);
      return {
        action: getDirectionsToSalon.action,
        params: parsed ? { aspect: parsed.aspect } : {},
        reasoning: `Salon directions rescue → ${getDirectionsToSalon.action}`,
        rescued: true,
        rescueReason: getDirectionsToSalon.rescueReason,
      };
    }

    const professionalProfileEarly = rescueExplainProfessionalProfileIntent(
      prompt,
      action,
    );
    if (professionalProfileEarly) {
      return {
        action: professionalProfileEarly.action,
        params: enrichExplainProfessionalProfileParamsFromPrompt({}, prompt),
        reasoning: `Professional profile rescue → ${professionalProfileEarly.action}`,
        rescued: true,
        rescueReason: professionalProfileEarly.rescueReason,
      };
    }

    const salonProfileEarly = rescueExplainSalonProfileIntent(prompt, action);
    if (salonProfileEarly) {
      return {
        action: salonProfileEarly.action,
        params: enrichExplainSalonProfileParamsFromPrompt({}, prompt),
        reasoning: 'Salon profile rescue → explain_salon_profile',
        rescued: true,
        rescueReason: salonProfileEarly.rescueReason,
      };
    }

    const businessHoursLocation = rescueExplainBusinessHoursAndLocationIntent(
      prompt,
      action,
    );
    if (businessHoursLocation) {
      return {
        action: businessHoursLocation.action,
        params: enrichExplainBusinessHoursLocationParamsFromPrompt({}, prompt),
        reasoning: `Business hours/location rescue → ${businessHoursLocation.action}`,
        rescued: true,
        rescueReason: businessHoursLocation.rescueReason,
      };
    }

    const explainProviderAvailability = rescueExplainProviderAvailabilityIntent(
      prompt,
      action,
    );
    if (explainProviderAvailability) {
      return {
        action: explainProviderAvailability.action,
        params: enrichExplainProviderAvailabilityParamsFromPrompt({}, prompt),
        reasoning: `Explain provider availability rescue → ${explainProviderAvailability.action}`,
        rescued: true,
        rescueReason: explainProviderAvailability.rescueReason,
      };
    }

    const switchProviderSameTime = rescueSwitchProviderSameTimeIntent(
      prompt,
      action,
    );
    if (switchProviderSameTime) {
      return {
        action: switchProviderSameTime.action,
        params: enrichSwitchProviderSameTimeParamsFromPrompt({}, prompt),
        reasoning: `Switch provider same time rescue → ${switchProviderSameTime.action}`,
        rescued: true,
        rescueReason: switchProviderSameTime.rescueReason,
      };
    }

    const pickProvider = rescuePickProviderForServiceIntent(prompt, action);
    if (pickProvider) {
      return {
        action: pickProvider.action,
        params: enrichPickProviderForServiceParamsFromPrompt({}, prompt),
        reasoning: `Pick provider for service rescue → ${pickProvider.action}`,
        rescued: true,
        rescueReason: pickProvider.rescueReason,
      };
    }

    const anyProviderOption = rescueExplainAnyProviderOptionIntent(
      prompt,
      action,
    );
    if (anyProviderOption) {
      return {
        action: anyProviderOption.action,
        params: parseExplainAnyProviderOptionFromPrompt(prompt) ?? {},
        reasoning: `Any provider option explain rescue → ${anyProviderOption.action}`,
        rescued: true,
        rescueReason: anyProviderOption.rescueReason,
      };
    }

    const professionalProfile = rescueExplainProfessionalProfileIntent(
      prompt,
      action,
    );
    if (professionalProfile) {
      return {
        action: professionalProfile.action,
        params: enrichExplainProfessionalProfileParamsFromPrompt({}, prompt),
        reasoning: `Professional profile rescue → ${professionalProfile.action}`,
        rescued: true,
        rescueReason: professionalProfile.rescueReason,
      };
    }

    const providerSpecialty = rescueExplainProviderSpecialtyIntent(
      prompt,
      action,
    );
    if (providerSpecialty) {
      return {
        action: providerSpecialty.action,
        params: enrichExplainProviderSpecialtyParamsFromPrompt({}, prompt),
        reasoning: `Provider specialty rescue → ${providerSpecialty.action}`,
        rescued: true,
        rescueReason: providerSpecialty.rescueReason,
      };
    }

    const bookingDateFormat = rescueBookingDateFormatIntent(prompt, action);
    if (bookingDateFormat) {
      return {
        action: bookingDateFormat.action,
        params: {},
        reasoning: `Booking date format rescue → ${bookingDateFormat.action}`,
        rescued: true,
        rescueReason: bookingDateFormat.rescueReason,
      };
    }

    const bulkStrip = rescueBulkStripDisabledLocaleTranslationsIntent(
      prompt,
      action,
    );
    if (bulkStrip) {
      return {
        action: bulkStrip.action,
        params: {},
        reasoning: `Business languages rescue → ${bulkStrip.action}`,
        rescued: true,
        rescueReason: bulkStrip.rescueReason,
      };
    }

    const explain = rescueExplainBusinessLanguagesIntent(prompt, action);
    if (explain) {
      return {
        action: explain.action,
        params: {},
        reasoning: `Business languages rescue → ${explain.action}`,
        rescued: true,
        rescueReason: explain.rescueReason,
      };
    }

    const rescued = rescueBusinessLanguagesIntent(prompt, action);
    if (!rescued) return null;

    const parsed = parseBusinessLanguagesFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {
      operation: parsed.operation,
      locales: parsed.locales,
    };
    if (parsed.operation === 'set_default') {
      params.defaultLocale = parsed.locales[0];
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Business languages rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueConfigureProviderPushDateFormat(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    if (!isConfigureProviderPushDateFormatPrompt(prompt)) {
      return null;
    }
    const rescued = rescueProviderDateFormatIntent(prompt, action);
    if (!rescued) {
      return null;
    }
    const params: Record<string, unknown> = {};
    if (rescued.action === 'configure_provider_push_date_format') {
      const parsedTimeFormat = parseProviderPushTimeFormatFromPrompt(
        prompt,
        params,
      );
      if (parsedTimeFormat?.timeFormat) {
        params.timeFormat = parsedTimeFormat.timeFormat;
      }
    }
    return {
      action: rescued.action,
      params,
      reasoning: `Provider push date format rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueNotificationCurrency(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueNotificationCurrencyIntent(prompt, action);
    if (!rescued) {
      return null;
    }
    return {
      action: rescued.action,
      params: {},
      reasoning: `Notification currency rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueBusinessDateFormat(
    prompt: string,
    action: string,
    surface?: IntentRescueInput['surface'],
  ): IntentRescueResult | null {
    // e2e-bug.77 — provider-only nests must not steal customer/public prompts
    // (list_upcoming_bookings, show_provider_profile, open_booking_detail, …).
    const blockProviderNests = surface === 'customer' || surface === 'public';

    if (
      !blockProviderNests &&
      isConfigureProviderPushDateFormatPrompt(prompt)
    ) {
      const providerDateFormatEarly = rescueProviderDateFormatIntent(
        prompt,
        action,
      );
      if (!providerDateFormatEarly) {
        return null;
      }
      const params: Record<string, unknown> = {};
      if (
        providerDateFormatEarly.action === 'configure_provider_push_date_format'
      ) {
        const parsedTimeFormat = parseProviderPushTimeFormatFromPrompt(
          prompt,
          params,
        );
        if (parsedTimeFormat?.timeFormat) {
          params.timeFormat = parsedTimeFormat.timeFormat;
        }
      }
      return {
        action: providerDateFormatEarly.action,
        params,
        reasoning: `Provider date format rescue → ${providerDateFormatEarly.action}`,
        rescued: true,
        rescueReason: providerDateFormatEarly.rescueReason,
      };
    }

    const notificationDate = this.tryRescueNotificationDateFormat(
      prompt,
      action,
    );
    if (notificationDate) return notificationDate;

    const dateInput = rescueDateInputFormatIntent(prompt, action);
    if (dateInput) {
      const params: Record<string, unknown> = {};
      if (dateInput.action === 'preview_date_input_parse') {
        params.dateStrings = parseDateStringsFromPrompt(prompt, params);
      }
      return {
        action: dateInput.action,
        params,
        reasoning: `Date input format rescue → ${dateInput.action}`,
        rescued: true,
        rescueReason: dateInput.rescueReason,
      };
    }

    if (!blockProviderNests) {
      const providerPushSetup = this.tryRescueProviderPushSetup(prompt, action);
      if (providerPushSetup) return providerPushSetup;

      const providerSessionTimeout = rescueProviderSessionTimeoutIntent(
        prompt,
        action,
      );
      if (providerSessionTimeout) {
        return {
          action: providerSessionTimeout.action,
          params: {},
          reasoning: `Provider session timeout rescue → ${providerSessionTimeout.action}`,
          rescued: true,
          rescueReason: providerSessionTimeout.rescueReason,
        };
      }

      const providerContext = rescueExplainProviderContextIntent(
        prompt,
        action,
      );
      if (providerContext) {
        return {
          action: providerContext.action,
          params: {},
          reasoning: `Provider context rescue → ${providerContext.action}`,
          rescued: true,
          rescueReason: providerContext.rescueReason,
        };
      }

      const providerScheduleReads = rescueProviderScheduleReadsIntent(
        prompt,
        action,
      );
      if (providerScheduleReads) {
        return {
          action: providerScheduleReads.action,
          params: {},
          reasoning: `Provider schedule reads rescue → ${providerScheduleReads.action}`,
          rescued: true,
          rescueReason: providerScheduleReads.rescueReason,
        };
      }

      const openBookingDetail = rescueOpenBookingDetailIntent(prompt, action);
      if (openBookingDetail) {
        return {
          action: openBookingDetail.action,
          params: {},
          reasoning: `Open booking detail rescue → ${openBookingDetail.action}`,
          rescued: true,
          rescueReason: openBookingDetail.rescueReason,
        };
      }

      const showProviderProfile = rescueShowProviderProfileIntent(
        prompt,
        action,
      );
      if (showProviderProfile) {
        return {
          action: showProviderProfile.action,
          params: {},
          reasoning: `Show provider profile rescue → ${showProviderProfile.action}`,
          rescued: true,
          rescueReason: showProviderProfile.rescueReason,
        };
      }
    }

    const rescued = rescueBusinessDateFormatIntent(prompt, action);
    if (rescued) {
      const params: Record<string, unknown> = {};
      if (rescued.action === 'migrate_dashboard_date_display') {
        const surfaceId = extractMigrationSurfaceId(prompt);
        if (surfaceId) params.surfaceId = surfaceId;
      }

      if (
        rescued.action === 'configure_business_date_format' ||
        rescued.action === 'preview_business_date_format'
      ) {
        const parsed = parseBusinessDateFormatFromPrompt(prompt);
        if (rescued.action === 'configure_business_date_format' && !parsed) {
          return null;
        }
        if (parsed?.dateFormat) params.dateFormat = parsed.dateFormat;
        if (parsed?.timeFormat) params.timeFormat = parsed.timeFormat;
      }

      return {
        action: rescued.action,
        params,
        reasoning: `Business date format rescue → ${rescued.action}`,
        rescued: true,
        rescueReason: rescued.rescueReason,
      };
    }

    if (blockProviderNests) return null;

    const providerDateFormat = rescueProviderDateFormatIntent(prompt, action);
    if (!providerDateFormat) return null;

    const params: Record<string, unknown> = {};
    if (providerDateFormat.action === 'configure_provider_push_date_format') {
      const parsedTimeFormat = parseProviderPushTimeFormatFromPrompt(
        prompt,
        params,
      );
      if (parsedTimeFormat?.timeFormat) {
        params.timeFormat = parsedTimeFormat.timeFormat;
      }
    }
    return {
      action: providerDateFormat.action,
      params,
      reasoning: `Provider date format rescue → ${providerDateFormat.action}`,
      rescued: true,
      rescueReason: providerDateFormat.rescueReason,
    };
  }

  private tryRescueBusinessCurrency(
    prompt: string,
    action: string,
    surface?: IntentRescueInput['surface'],
  ): IntentRescueResult | null {
    const businessCompliance = rescueBusinessComplianceIntent(prompt, action);
    if (businessCompliance) {
      const params: Record<string, unknown> = {};
      if (businessCompliance.action === 'configure_privacy_retention') {
        const parsed = parseConfigurePrivacyRetentionFromPrompt(prompt);
        if (parsed?.retention) Object.assign(params, parsed.retention);
        if (parsed?.cookieBanner?.enabled !== undefined) {
          params.cookieBannerEnabled = parsed.cookieBanner.enabled;
        }
        if (parsed?.cookieBanner?.message) {
          params.cookieBannerMessage = parsed.cookieBanner.message;
        }
      } else if (businessCompliance.action === 'configure_granular_consent') {
        const parsed = parseConfigureGranularConsentFromPrompt(prompt);
        if (parsed?.requireAiProcessing !== undefined) {
          params.requireAiProcessing = parsed.requireAiProcessing;
        }
        if (parsed?.requireThirdPartyIntegrations !== undefined) {
          params.requireThirdPartyIntegrations =
            parsed.requireThirdPartyIntegrations;
        }
      } else if (
        businessCompliance.action === 'configure_hipaa_session_timeout'
      ) {
        const parsed = parseConfigureHipaaSessionTimeoutFromPrompt(prompt);
        if (parsed?.sessionTimeoutMinutes != null) {
          params.sessionTimeoutMinutes = parsed.sessionTimeoutMinutes;
        }
      } else if (businessCompliance.action === 'accept_hipaa_baa') {
        const parsed = parseAcceptHipaaBaaFromPrompt(prompt);
        if (parsed?.enableHipaa != null) {
          params.enableHipaa = parsed.enableHipaa;
        }
      } else if (businessCompliance.action === 'enable_hipaa_mode') {
        const parsed = parseEnableHipaaModeFromPrompt(prompt);
        if (parsed?.enabled !== undefined) {
          params.enabled = parsed.enabled;
        }
        if (parsed?.sessionTimeoutMinutes !== undefined) {
          params.sessionTimeoutMinutes = parsed.sessionTimeoutMinutes;
        }
      } else if (businessCompliance.action === 'list_sub_processors') {
        const parsed = parseListSubProcessorsFromPrompt(prompt);
        if (parsed?.article28 != null) {
          params.article28 = parsed.article28;
        }
      } else if (businessCompliance.action === 'explain_gdpr_checklist') {
        const parsed = parseExplainGdprChecklistFromPrompt(prompt);
        if (parsed?.aspect) {
          params.aspect = parsed.aspect;
        }
      } else if (businessCompliance.action === 'explain_compliance_status') {
        const parsed = parseExplainComplianceStatusFromPrompt(prompt);
        if (parsed?.aspect) {
          params.aspect = parsed.aspect;
        }
      } else if (businessCompliance.action === 'admin_delete_customer_data') {
        const parsed = parseAdminDeleteCustomerDataFromPrompt(prompt);
        if (parsed?.customerName) {
          params.customerName = parsed.customerName;
        }
      } else if (businessCompliance.action === 'send_breach_notification') {
        const parsed = parseSendBreachNotificationFromPrompt(prompt);
        if (parsed?.incidentRef) {
          params.incidentRef = parsed.incidentRef;
        }
      } else if (businessCompliance.action === 'open_compliance_dashboard') {
        const parsed = parseOpenComplianceDashboardFromPrompt(prompt);
        if (parsed?.panel) {
          params.panel = parsed.panel;
        }
      } else if (businessCompliance.action === 'report_data_breach') {
        const parsed = parseReportDataBreachFromPrompt(prompt);
        if (parsed?.description) {
          params.description = parsed.description;
        }
        if (parsed?.affectedCustomerCount != null) {
          params.affectedCustomerCount = parsed.affectedCustomerCount;
        }
      } else if (businessCompliance.action === 'list_breach_incidents') {
        const parsed = parseListBreachIncidentsFromPrompt(prompt);
        if (parsed?.aspect) {
          params.aspect = parsed.aspect;
        }
      } else if (businessCompliance.action === 'view_phi_access_audit') {
        const parsed = parseViewPhiAccessAuditFromPrompt(prompt);
        if (parsed?.daysBack != null) {
          params.daysBack = parsed.daysBack;
        }
        if (parsed?.fieldName) {
          params.fieldName = parsed.fieldName;
        }
        if (parsed?.limit != null) {
          params.limit = parsed.limit;
        }
      } else if (
        businessCompliance.action === 'explain_phi_encryption_status'
      ) {
        const parsed = parseExplainPhiEncryptionStatusFromPrompt(prompt);
        if (parsed?.fieldName) {
          params.fieldName = parsed.fieldName;
        }
      } else if (
        businessCompliance.action === 'explain_minimum_necessary_phi_access'
      ) {
        const parsed = parseExplainMinimumNecessaryPhiAccessFromPrompt(prompt);
        if (parsed?.aspect) {
          params.aspect = parsed.aspect;
        }
      } else if (
        businessCompliance.action === 'explain_hipaa_session_timeout'
      ) {
        const parsed = parseExplainHipaaSessionTimeoutFromPrompt(prompt);
        if (parsed?.personalLogout != null) {
          params.personalLogout = parsed.personalLogout;
        }
      }
      return {
        action: businessCompliance.action,
        params,
        reasoning: `Business compliance rescue → ${businessCompliance.action}`,
        rescued: true,
        rescueReason: businessCompliance.rescueReason,
      };
    }

    const quoteStaffBookingTax = rescueQuoteStaffBookingTaxIntent(
      prompt,
      action,
    );
    if (quoteStaffBookingTax) {
      return {
        action: quoteStaffBookingTax.action,
        params: {},
        reasoning: `Staff booking tax quote rescue → ${quoteStaffBookingTax.action}`,
        rescued: true,
        rescueReason: quoteStaffBookingTax.rescueReason,
      };
    }

    const stackedTax = rescueStackedTaxIntent(prompt, action);
    if (stackedTax) {
      const params: Record<string, unknown> = {};
      if (stackedTax.action === 'configure_stacked_tax_rules') {
        const parsed = parseConfigureStackedTaxRulesFromPrompt(prompt);
        if (!parsed) return null;
        Object.assign(params, parsed);
      }
      return {
        action: stackedTax.action,
        params,
        reasoning: `Stacked tax rescue → ${stackedTax.action}`,
        rescued: true,
        rescueReason: stackedTax.rescueReason,
      };
    }

    const stripeCheckoutEarly = rescueStripeCheckoutCurrencyIntent(
      prompt,
      action,
    );
    if (stripeCheckoutEarly) {
      return {
        action: stripeCheckoutEarly.action,
        params: {},
        reasoning: `Stripe checkout currency rescue → ${stripeCheckoutEarly.action}`,
        rescued: true,
        rescueReason: stripeCheckoutEarly.rescueReason,
      };
    }

    const stripeTaxCharge = rescueStripeTaxChargeIntent(prompt, action);
    if (stripeTaxCharge) {
      return {
        action: stripeTaxCharge.action,
        params: {},
        reasoning: `Stripe tax charge rescue → ${stripeTaxCharge.action}`,
        rescued: true,
        rescueReason: stripeTaxCharge.rescueReason,
      };
    }

    const lookupBookingTax = rescueLookupBookingTaxMetadataIntent(
      prompt,
      action,
    );
    if (lookupBookingTax) {
      return {
        action: lookupBookingTax.action,
        params: {},
        reasoning: `Booking tax metadata lookup rescue → ${lookupBookingTax.action}`,
        rescued: true,
        rescueReason: lookupBookingTax.rescueReason,
      };
    }

    const appointmentTaxEarly = rescueAppointmentTaxIntent(prompt, action);
    if (appointmentTaxEarly) {
      return {
        action: appointmentTaxEarly.action,
        params: {},
        reasoning: `Appointment tax rescue → ${appointmentTaxEarly.action}`,
        rescued: true,
        rescueReason: appointmentTaxEarly.rescueReason,
      };
    }

    const summarizeCustomerTaxPaid = rescueSummarizeCustomerTaxPaidIntent(
      prompt,
      action,
    );
    if (summarizeCustomerTaxPaid) {
      return {
        action: summarizeCustomerTaxPaid.action,
        params: {},
        reasoning: `Customer tax paid summary rescue → ${summarizeCustomerTaxPaid.action}`,
        rescued: true,
        rescueReason: summarizeCustomerTaxPaid.rescueReason,
      };
    }

    const businessTax = this.tryRescueBusinessTaxEarly(prompt, action);
    if (businessTax) return businessTax;

    const businessDateFormat = this.tryRescueBusinessDateFormat(
      prompt,
      action,
      surface,
    );
    if (businessDateFormat) return businessDateFormat;

    const businessLanguages = this.tryRescueBusinessLanguages(prompt, action);
    if (businessLanguages) return businessLanguages;

    const reportsCurrency = this.tryRescueReportsCurrency(prompt, action);
    if (reportsCurrency) return reportsCurrency;

    const revenueKpis = this.tryRescueRevenueKpis(prompt, action);
    if (revenueKpis) return revenueKpis;

    const tenant = rescueTenantCurrencyIntent(prompt, action);
    if (tenant) {
      return {
        action: tenant.action,
        params: {},
        reasoning: `Tenant currency rescue → ${tenant.action}`,
        rescued: true,
        rescueReason: tenant.rescueReason,
      };
    }

    const notificationCurrency = rescueNotificationCurrencyIntent(
      prompt,
      action,
    );
    if (notificationCurrency) {
      return {
        action: notificationCurrency.action,
        params: {},
        reasoning: `Notification currency rescue → ${notificationCurrency.action}`,
        rescued: true,
        rescueReason: notificationCurrency.rescueReason,
      };
    }

    const dataRightsEarly = rescueExplainDataRightsIntent(prompt, action);
    if (dataRightsEarly) {
      const params: Record<string, unknown> = {};
      const parsed = parseExplainDataRightsFromPrompt(prompt);
      if (parsed?.aspect) {
        params.aspect = parsed.aspect;
      }
      return {
        action: dataRightsEarly.action,
        params,
        reasoning: `Data rights rescue → ${dataRightsEarly.action}`,
        rescued: true,
        rescueReason: dataRightsEarly.rescueReason,
      };
    }

    const checkoutTaxEarly = this.tryRescueCheckoutTax(prompt, action);
    if (checkoutTaxEarly) {
      return checkoutTaxEarly;
    }

    const packageCurrency = rescuePackageCurrencyIntent(prompt, action);
    if (packageCurrency) {
      return {
        action: packageCurrency.action,
        params: {},
        reasoning: `Package currency rescue → ${packageCurrency.action}`,
        rescued: true,
        rescueReason: packageCurrency.rescueReason,
      };
    }

    const stripeCheckoutFailure = rescueStripeCheckoutFailureIntent(
      prompt,
      action,
    );
    if (stripeCheckoutFailure) {
      return {
        action: stripeCheckoutFailure.action,
        params: {},
        reasoning: `Stripe checkout failure rescue → ${stripeCheckoutFailure.action}`,
        rescued: true,
        rescueReason: stripeCheckoutFailure.rescueReason,
      };
    }

    const stripeWarning = rescueStripeCurrencyWarningIntent(prompt, action);
    if (stripeWarning) {
      return {
        action: stripeWarning.action,
        params: {},
        reasoning: `Stripe currency warning rescue → ${stripeWarning.action}`,
        rescued: true,
        rescueReason: stripeWarning.rescueReason,
      };
    }

    const providerPaymentCurrency = rescueProviderPaymentCurrencyIntent(
      prompt,
      action,
    );
    if (providerPaymentCurrency) {
      return {
        action: providerPaymentCurrency.action,
        params: {},
        reasoning: `Provider payment currency rescue → ${providerPaymentCurrency.action}`,
        rescued: true,
        rescueReason: providerPaymentCurrency.rescueReason,
      };
    }

    const stripeCheckout = rescueStripeCheckoutCurrencyIntent(prompt, action);
    if (stripeCheckout) {
      return {
        action: stripeCheckout.action,
        params: {},
        reasoning: `Stripe checkout currency rescue → ${stripeCheckout.action}`,
        rescued: true,
        rescueReason: stripeCheckout.rescueReason,
      };
    }

    const checkoutTax = this.tryRescueCheckoutTax(prompt, action);
    if (checkoutTax) {
      return checkoutTax;
    }

    const checkout = rescueCheckoutCurrencyIntent(prompt, action);
    if (checkout) {
      return {
        action: checkout.action,
        params: {},
        reasoning: `Checkout currency rescue → ${checkout.action}`,
        rescued: true,
        rescueReason: checkout.rescueReason,
      };
    }

    const rescued = rescueBusinessCurrencyIntent(prompt, action);
    if (!rescued) return null;

    const params: Record<string, unknown> = {};
    if (rescued.action === 'configure_business_currency') {
      const currencyCode = parseCurrencyFromPrompt(prompt);
      if (!currencyCode) return null;
      params.currencyCode = currencyCode;
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Business currency rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  /** e2e-bug.94 — customer/public soonest availability before clinic/marketing. */
  private tryRescueFindSoonestAppointment(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    if (action === 'find_soonest_appointment') return null;
    if (!isFindSoonestAppointmentPrompt(prompt)) return null;
    return {
      action: 'find_soonest_appointment',
      params: enrichFindSoonestParamsFromPrompt({}, prompt),
      reasoning: 'Find soonest appointment rescue → find_soonest_appointment',
      rescued: true,
      rescueReason: 'soonest_appointment',
    };
  }

  private tryRescuePayments(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const salonCheckout = rescueSetupSalonCheckoutCompoundIntent(
      prompt,
      action,
    );
    if (salonCheckout) {
      return {
        action: salonCheckout.action,
        params: {},
        reasoning:
          'Salon checkout setup compound — Stripe guide, cash, online prepayment, booking page.',
        rescued: true,
        rescueReason: salonCheckout.rescueReason,
      };
    }

    const paymentMatrix = rescueConfigureServicesPaymentMatrixCompoundIntent(
      prompt,
      action,
    );
    if (paymentMatrix) {
      return {
        action: paymentMatrix.action,
        params: {},
        reasoning:
          'Services payment matrix compound — optional price update, per-category online payment, cash.',
        rescued: true,
        rescueReason: paymentMatrix.rescueReason,
      };
    }

    const cashOnline = rescueCashAndOnlinePaymentCompoundIntent(prompt, action);
    if (cashOnline) {
      return {
        action: cashOnline.action,
        params: {},
        reasoning:
          'Cash + online payment compound — configure cash then per-service online payment.',
        rescued: true,
        rescueReason: cashOnline.rescueReason,
      };
    }

    const declineCategory = rescueDeclineOnlinePaymentCategoryCompoundIntent(
      prompt,
      action,
    );
    if (declineCategory) {
      return {
        action: declineCategory.action,
        params: {},
        reasoning:
          'Decline/accept category payment compound — per-category online payment split.',
        rescued: true,
        rescueReason: declineCategory.rescueReason,
      };
    }

    const giftCardCheckout = rescueGiftCardCheckoutCompoundIntent(
      prompt,
      action,
    );
    if (giftCardCheckout) {
      return {
        action: giftCardCheckout.action,
        params: {},
        reasoning:
          'Gift card checkout compound — check balance, apply code, book nearest slot.',
        rescued: true,
        rescueReason: giftCardCheckout.rescueReason,
      };
    }

    const disambiguated = disambiguateGiftCardPaymentsAction(prompt, action);
    if (disambiguated && disambiguated.action !== action) {
      const rescuedParams: Record<string, any> = {};
      applyGiftCardPaymentsPromptHints(
        disambiguated.action,
        rescuedParams,
        prompt,
      );
      return {
        action: disambiguated.action,
        params: rescuedParams,
        reasoning: `Payments/checkout rescue → ${disambiguated.action}`,
        rescued: true,
        rescueReason: disambiguated.rescueReason,
      };
    }

    const rescued = rescuePaymentsIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    const rescuedParams: Record<string, any> = {};
    applyGiftCardPaymentsPromptHints(rescued.action, rescuedParams, prompt);
    if (rescued.action === 'configure_service_online_payment') {
      Object.assign(
        rescuedParams,
        enrichServiceOnlinePaymentParamsFromPrompt(rescuedParams, prompt),
      );
    }
    if (rescued.action === 'configure_service_deposit_policy') {
      Object.assign(
        rescuedParams,
        enrichServiceDepositPolicyParamsFromPrompt(rescuedParams, prompt),
      );
    }
    if ((rescued.action as string) === 'configure_checkout_defaults') {
      Object.assign(
        rescuedParams,
        parseConfigureCheckoutDefaultsFromPrompt(prompt, rescuedParams) ?? {},
      );
    }
    if (rescued.action === 'explain_service_price') {
      Object.assign(
        rescuedParams,
        enrichExplainServicePriceParamsFromPrompt(rescuedParams, prompt),
      );
    }
    if (rescued.action === 'explain_payment_options_for_service') {
      Object.assign(
        rescuedParams,
        enrichExplainPaymentOptionsParamsFromPrompt(rescuedParams, prompt),
      );
    }
    if (rescued.action === 'find_soonest_appointment') {
      Object.assign(
        rescuedParams,
        enrichFindSoonestParamsFromPrompt(rescuedParams, prompt),
      );
    }
    if (rescued.action === 'compare_services') {
      Object.assign(
        rescuedParams,
        enrichCompareServicesParamsFromPrompt(rescuedParams, prompt),
      );
    }
    if (rescued.action === 'filter_services_no_prepayment') {
      Object.assign(
        rescuedParams,
        enrichFilterServicesNoPrepaymentParamsFromPrompt(rescuedParams, prompt),
      );
    }
    if ((rescued.action as string) === 'explain_service_online_payment_setup') {
      Object.assign(
        rescuedParams,
        parseExplainServiceOnlinePaymentSetupFromPrompt(
          prompt,
          rescuedParams,
        ) ?? {},
      );
    }
    if (
      (rescued.action as string) === 'audit_services_missing_online_payment'
    ) {
      Object.assign(
        rescuedParams,
        parseAuditServicesMissingOnlinePaymentFromPrompt(
          prompt,
          rescuedParams,
        ) ?? {},
      );
    }
    if ((rescued.action as string) === 'get_directions_to_salon') {
      Object.assign(
        rescuedParams,
        enrichGetDirectionsToSalonParamsFromPrompt(rescuedParams, prompt),
      );
    }
    if ((rescued.action as string) === 'explain_business_hours_and_location') {
      Object.assign(
        rescuedParams,
        enrichExplainBusinessHoursLocationParamsFromPrompt(
          rescuedParams,
          prompt,
        ),
      );
    }
    if ((rescued.action as string) === 'explain_salon_profile') {
      Object.assign(
        rescuedParams,
        enrichExplainSalonProfileParamsFromPrompt(rescuedParams, prompt),
      );
    }
    if (rescued.action === 'list_services') {
      Object.assign(
        rescuedParams,
        enrichListServicesPaymentFilterParamsFromPrompt(rescuedParams, prompt),
      );
    }
    if (rescued.action === 'collect_cash_confirm') {
      const amount = extractAmountFromPrompt(prompt);
      if (amount != null) rescuedParams.amount = amount;
    }
    if (rescued.action === 'create_service') {
      Object.assign(
        rescuedParams,
        enrichCreateServicePrepaymentParamsFromPrompt(rescuedParams, prompt),
      );
    }
    if (rescued.action === 'create_services') {
      Object.assign(
        rescuedParams,
        enrichCreateServicesPrepaymentParamsFromPrompt(rescuedParams, prompt),
      );
    }
    return {
      action: rescued.action,
      params: rescuedParams,
      reasoning: `Payments/checkout rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueScheduleResources(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueScheduleResourceIntent(prompt, action);
    if (!rescued) return null;
    const params = rescued.params ?? {};
    // e2e-bug.147 — allow param enrichment when action already matches.
    if (rescued.action === action) {
      if (!Object.keys(params).length) return null;
      return {
        action: rescued.action,
        params,
        reasoning: `Schedule/resource param enrich → ${rescued.action}`,
        rescued: true,
        rescueReason: rescued.rescueReason,
      };
    }
    return {
      action: rescued.action,
      params,
      reasoning: `Schedule/resource rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  /** e2e-bug.129 — membership visits/expiry explain before billing/meta steals. */
  private tryRescueExplainMySubscription(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainMySubscriptionIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Explain my subscription rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueCustomerCrm(
    prompt: string,
    action: string,
    params: Record<string, unknown> = {},
  ): IntentRescueResult | null {
    const privacyDeleteConfirm = rescuePrivacyDeleteConfirmIntent(
      prompt,
      action,
      params,
    );
    if (privacyDeleteConfirm) {
      if (privacyDeleteConfirm.action === action && params.confirm === true) {
        return null;
      }
      return {
        action: privacyDeleteConfirm.action,
        params: privacyDeleteConfirm.params,
        reasoning: `Privacy delete confirm rescue → ${privacyDeleteConfirm.action}`,
        rescued: true,
        rescueReason: privacyDeleteConfirm.rescueReason,
      };
    }

    const rescued = rescueCustomerCrmIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Customer CRM rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescuePackageLocalizedNames(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescuePackageLocalizedNamesIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parsePackageLocalizedNamesFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {
      operation: parsed.operation,
    };
    if (parsed.packageId) params.packageId = parsed.packageId;
    if (parsed.packageName) params.packageName = parsed.packageName;
    if (parsed.locale) params.locale = parsed.locale;
    if (parsed.displayName) params.displayName = parsed.displayName;

    return {
      action: rescued.action,
      params,
      reasoning: `Package localized names rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueApplyClinicPlaybook(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueApplyClinicPlaybookIntent(prompt, action);
    if (!rescued) return null;

    return {
      action: rescued.action,
      params: {},
      reasoning: `Clinic playbook rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueApplyTourPlaybook(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueApplyTourPlaybookIntent(prompt, action);
    if (!rescued) return null;

    return {
      action: rescued.action,
      params: {},
      reasoning: `Tour playbook rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainTourCalendarSpan(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainTourCalendarSpanIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainTourCalendarSpanFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = { aspect: parsed.aspect };
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.weekStartDate) params.weekStartDate = parsed.weekStartDate;

    return {
      action: rescued.action,
      params,
      reasoning: `Tour calendar span explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueListTourCalendarWeek(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueListTourCalendarWeekIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseListTourCalendarWeekFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.employeeId) params.employeeId = parsed.employeeId;
    if (parsed.employeeName) params.employeeName = parsed.employeeName;
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.weekStartDate) params.weekStartDate = parsed.weekStartDate;

    return {
      action: rescued.action,
      params,
      reasoning: `Tour calendar week list rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueListUpcomingTourDepartures(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueListUpcomingTourDeparturesIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseListUpcomingTourDeparturesFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.daysAhead !== undefined) params.daysAhead = parsed.daysAhead;

    return {
      action: rescued.action,
      params,
      reasoning: `Upcoming tour departures list rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueBookTourNearestDepartureCompound(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const groupCheckout = rescueTourGroupCheckoutCompoundIntent(prompt, action);
    if (groupCheckout) {
      return {
        action: groupCheckout.action,
        params: {},
        reasoning:
          'Tour group checkout compound — validate group pax, check remaining seats, then book.',
        rescued: true,
        rescueReason: groupCheckout.rescueReason,
      };
    }

    const compound = rescueBookTourNearestDepartureCompoundIntent(
      prompt,
      action,
    );
    if (compound) {
      return {
        action: compound.action,
        params: {},
        reasoning:
          'Book tour nearest departure compound — catalog lookup, pax validation, nearest slot booking.',
        rescued: true,
        rescueReason: compound.rescueReason,
      };
    }

    // e2e-bug.206 — the classifier can hallucinate one of these two
    // compound-only recipe IDs directly (they're described in its own
    // classifier rules text) for a tour prompt that doesn't actually satisfy
    // either compound's trigger (no capacity gate, no earliest/nearest/
    // soonest cue, and sometimes no explicit booking verb at all) — e.g.
    // "Wine tour for 6 next Saturday" alone. Previously this fell straight
    // through to `security_blocked` with no clarifying message. The
    // classifier already having picked one of these two tour-only action IDs
    // is itself strong enough signal that this is a tour prompt — reroute to
    // the safe, read-only explain instead of blocking, reusing the same
    // `fromCompound` structured-params escape hatch the compounds' own step 1
    // already relies on (parseExplainTourBookingFromPrompt).
    if (
      (action === 'book_tour_nearest_departure' ||
        action === 'tour_group_checkout') &&
      !isBookTourNearestDepartureCompoundPrompt(prompt) &&
      !isTourGroupCheckoutCompoundPrompt(prompt)
    ) {
      const serviceName =
        extractTourServiceNameFromBookingPrompt(prompt) ??
        extractLeadingTourNamePrompt(prompt);
      if (serviceName) {
        return {
          action: 'explain_tour_booking',
          params: { serviceName, aspect: 'all' },
          reasoning:
            'Incomplete tour booking request (no capacity gate or earliest-date cue) — explaining the tour instead of blocking.',
          rescued: true,
          rescueReason: 'incomplete_tour_booking_mutate_clarify',
        };
      }
    }

    return null;
  }

  private tryRescueTourConsumer(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    if (isDiagnoseStripeCheckoutFailurePrompt(prompt)) return null;
    if (parseConfigureTourServiceFromPrompt(prompt)) return null;
    if (isExplainTourBookingRecordPrompt(prompt)) return null;
    if (isExplainTourCalendarSpanPrompt(prompt)) return null;
    if (isListTourCalendarWeekPrompt(prompt)) return null;
    if (isListUpcomingTourDeparturesPrompt(prompt)) return null;

    const tourGroupCheckout = rescueTourGroupCheckoutCompoundIntent(
      prompt,
      action,
    );
    if (tourGroupCheckout) {
      return {
        action: tourGroupCheckout.action,
        params: {},
        reasoning:
          'Tour group checkout compound — validate group pax, check remaining seats, then book.',
        rescued: true,
        rescueReason: tourGroupCheckout.rescueReason,
      };
    }

    const tourCompound = rescueBookTourNearestDepartureCompoundIntent(
      prompt,
      action,
    );
    if (tourCompound) {
      return {
        action: tourCompound.action,
        params: {},
        reasoning:
          'Book tour nearest departure compound — catalog lookup, pax validation, nearest slot booking.',
        rescued: true,
        rescueReason: tourCompound.rescueReason,
      };
    }

    const diagnose = rescueDiagnoseTourCapacityIntent(prompt, action);
    if (diagnose) {
      const parsed = parseDiagnoseTourCapacityFromPrompt(prompt);
      if (!parsed) return null;
      const params: Record<string, unknown> = {};
      if (parsed.serviceId) params.serviceId = parsed.serviceId;
      if (parsed.serviceName) params.serviceName = parsed.serviceName;
      if (parsed.dateKey) params.date = parsed.dateKey;
      if (parsed.requestedPax !== undefined) {
        params.requestedPax = parsed.requestedPax;
      }
      if (parsed.aspect) params.aspect = parsed.aspect;
      return {
        action: diagnose.action,
        params,
        reasoning: `Tour capacity diagnosis rescue → ${diagnose.action}`,
        rescued: true,
        rescueReason: diagnose.rescueReason,
      };
    }

    if (
      isExplainTourServicesPrompt(prompt) &&
      !isExplainTourBookingPrompt(prompt) &&
      !isExplainTourDaySlotsPrompt(prompt)
    ) {
      return null;
    }

    const daySlots = rescueTourDaySlotsIntent(prompt, action);
    if (daySlots) {
      const parsed = parseExplainTourDaySlotsFromPrompt(prompt);
      if (!parsed) return null;
      const params: Record<string, unknown> = {};
      if (parsed.serviceId) params.serviceId = parsed.serviceId;
      if (parsed.serviceName) params.serviceName = parsed.serviceName;
      if (parsed.dateKey) params.date = parsed.dateKey;
      if (parsed.aspect) params.aspect = parsed.aspect;
      return {
        action: daySlots.action,
        params,
        reasoning: `Tour day slots explain rescue → ${daySlots.action}`,
        rescued: true,
        rescueReason: daySlots.rescueReason,
      };
    }

    const meetingPoint = rescueExplainTourMeetingPointIntent(prompt, action);
    if (meetingPoint) {
      const parsed = parseExplainTourMeetingPointFromPrompt(prompt);
      if (!parsed) return null;
      const params: Record<string, unknown> = {};
      if (parsed.serviceName) params.serviceName = parsed.serviceName;
      if (parsed.bookingId) params.bookingId = parsed.bookingId;
      if (parsed.aspect) params.aspect = parsed.aspect;
      return {
        action: meetingPoint.action,
        params,
        reasoning: `Tour meeting point explain rescue → ${meetingPoint.action}`,
        rescued: true,
        rescueReason: meetingPoint.rescueReason,
      };
    }

    const tourBooking = rescueTourBookingIntent(prompt, action);
    if (tourBooking) {
      const parsed = parseExplainTourBookingFromPrompt(prompt);
      if (!parsed) return null;
      const params: Record<string, unknown> = {};
      if (parsed.serviceId) params.serviceId = parsed.serviceId;
      if (parsed.serviceName) params.serviceName = parsed.serviceName;
      if (parsed.aspect) params.aspect = parsed.aspect;
      return {
        action: tourBooking.action,
        params,
        reasoning: `Tour booking explain rescue → ${tourBooking.action}`,
        rescued: true,
        rescueReason: tourBooking.rescueReason,
      };
    }

    return null;
  }

  private tryRescueExplainTourMeetingPoint(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainTourMeetingPointIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainTourMeetingPointFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.bookingId) params.bookingId = parsed.bookingId;
    if (parsed.aspect) params.aspect = parsed.aspect;

    return {
      action: rescued.action,
      params,
      reasoning: `Tour meeting point explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainTourBookingRecord(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainTourBookingRecordIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainTourBookingRecordFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.bookingId) params.bookingId = parsed.bookingId;
    if (parsed.customerName) params.customerName = parsed.customerName;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.aspect) params.aspect = parsed.aspect;

    return {
      action: rescued.action,
      params,
      reasoning: `Tour booking record explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueFixCheckoutValidationError(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueFixCheckoutValidationErrorIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseFixCheckoutValidationErrorFromPrompt(prompt);
    if (!parsed) return null;

    return {
      action: rescued.action,
      params: { aspect: parsed.aspect },
      reasoning: `Checkout validation error rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueConfirmMyBookingDetails(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueConfirmMyBookingDetailsIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseConfirmMyBookingDetailsFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = { aspect: parsed.aspect };
    if (parsed.bookingId) params.bookingId = parsed.bookingId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;

    return {
      action: rescued.action,
      params,
      reasoning: `Confirm booking details rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueRecoverLostManageLink(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueRecoverLostManageLinkIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseRecoverLostManageLinkFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = { guestLookup: true };
    if (parsed.email) params.email = parsed.email;
    if (parsed.phone) params.phone = parsed.phone;
    if (parsed.delivery) params.delivery = parsed.delivery;

    return {
      action: rescued.action,
      params,
      reasoning: `Recover lost manage link rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueSignInToManageBooking(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueSignInToManageBookingIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseSignInToManageBookingFromPrompt(prompt);
    if (!parsed) return null;

    return {
      action: rescued.action,
      params: { aspect: parsed.aspect },
      reasoning: `Sign in to manage booking rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueGetManageLink(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueGetManageLinkIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseGetManageLinkFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.bookingId) params.bookingId = parsed.bookingId;
    if (parsed.email) params.email = parsed.email;
    if (parsed.phone) params.phone = parsed.phone;
    if (parsed.delivery) params.delivery = parsed.delivery;

    return {
      action: rescued.action,
      params,
      reasoning: `Get manage link rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueReportBookingProblem(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueReportBookingProblemIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseReportBookingProblemFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = { aspect: parsed.aspect };
    if (parsed.message) params.message = parsed.message;
    if (parsed.bookingId) params.bookingId = parsed.bookingId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.date) params.date = parsed.date;

    return {
      action: rescued.action,
      params,
      reasoning: `Report booking problem rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueSignInAfterBooking(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueSignInAfterBookingIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseSignInAfterBookingFromPrompt(prompt);
    if (!parsed) return null;

    return {
      action: rescued.action,
      params: { aspect: parsed.aspect },
      reasoning: `Sign in after booking rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainShareReward(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainShareRewardIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainShareRewardFromPrompt(prompt);
    if (!parsed) return null;

    return {
      action: rescued.action,
      params: { aspect: parsed.aspect },
      reasoning: `Explain share reward rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainPostVisitReviewPrompt(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainPostVisitReviewPromptIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainPostVisitReviewPromptFromPrompt(prompt);
    if (!parsed) return null;

    return {
      action: rescued.action,
      params: { aspect: parsed.aspect },
      reasoning: `Explain post-visit review prompt rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueLeaveVisitReview(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueLeaveVisitReviewIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseLeaveVisitReviewFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.rating) params.rating = parsed.rating;
    if (parsed.comment) params.comment = parsed.comment;
    if (parsed.bookingId) params.bookingId = parsed.bookingId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.date) params.date = parsed.date;

    return {
      action: rescued.action,
      params,
      reasoning: `Leave visit review rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueNotifyRunningLate(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueNotifyRunningLateIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseNotifyRunningLateFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {
      minutesLate: parsed.minutesLate,
    };
    if (parsed.bookingId) params.bookingId = parsed.bookingId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.date) params.date = parsed.date;
    if (parsed.timeSlot) params.timeSlot = parsed.timeSlot;

    return {
      action: rescued.action,
      params,
      reasoning: `Notify running late rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainPackageVisitRules(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainPackageVisitRulesIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainPackageVisitRulesFromPrompt(prompt);
    if (!parsed) return null;
    return {
      action: rescued.action,
      params: enrichExplainPackageVisitRulesParamsFromPrompt({}, prompt),
      reasoning: `Explain package visit rules rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainDepositForfeiture(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainDepositForfeitureIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainDepositForfeitureFromPrompt(prompt);
    if (!parsed) return null;

    return {
      action: rescued.action,
      params: parsed.bookingId ? { bookingId: parsed.bookingId } : {},
      reasoning: `Explain deposit forfeiture rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainCancelPolicy(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainCancelPolicyIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainCancelPolicyFromPrompt(prompt);
    if (!parsed) return null;

    return {
      action: rescued.action,
      params: parsed.bookingId ? { bookingId: parsed.bookingId } : {},
      reasoning: `Explain cancel policy rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescuePayOnline(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescuePayOnlineCheckoutIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: enrichPayOnlineParamsFromPrompt(
        {},
        prompt,
        extractServiceNameFromPrompt,
      ),
      reasoning: `Pay online rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueListMyUpcomingAppointments(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueListMyUpcomingAppointmentsIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseListMyUpcomingAppointmentsFromPrompt(prompt);
    if (!parsed) return null;

    return {
      action: rescued.action,
      params: { scope: parsed.scope },
      reasoning: `List upcoming appointments rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueShareMyBooking(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueShareMyBookingIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseShareMyBookingFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.bookingId) params.bookingId = parsed.bookingId;

    return {
      action: rescued.action,
      params,
      reasoning: `Share my booking rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueBookAnotherService(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueBookAnotherServiceIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseBookAnotherServiceFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = { sameDay: parsed.sameDay };
    if (parsed.bookingId) params.bookingId = parsed.bookingId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;

    return {
      action: rescued.action,
      params,
      reasoning: `Book another service rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueCancelAllUpcomingConfirm(
    prompt: string,
    action: string,
    params: Record<string, unknown> = {},
  ): IntentRescueResult | null {
    const history = Array.isArray(params.conversationHistory)
      ? (params.conversationHistory as Array<{
          role: string;
          content: string;
        }>)
      : undefined;
    const rescued = rescueCancelAllUpcomingConfirmIntent(
      prompt,
      action,
      params,
      history,
    );
    if (!rescued) return null;
    if (rescued.action === action && params.confirm === true) return null;
    return {
      action: rescued.action,
      params: rescued.params,
      reasoning: `Cancel all upcoming confirm rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainSubscriptionVsOneTime(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainSubscriptionVsOneTimeIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: enrichExplainSubscriptionVsOneTimeParamsFromPrompt({}, prompt),
      reasoning: `Explain subscription vs one-time rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueAddBookingToCalendar(
    prompt: string,
    action: string,
    surface?: string,
  ): IntentRescueResult | null {
    // e2e-bug.307 — classifier may still label anybody-open as calendar; remap.
    if (
      action === 'add_booking_to_calendar' &&
      isProviderAvailabilityOpenCheckPrompt(prompt)
    ) {
      const availabilitySurface =
        surface === 'dashboard' ||
        surface === 'customer' ||
        surface === 'public'
          ? surface
          : 'public';
      const resolved = resolveAvailabilityIntentFromPrompt(
        availabilitySurface,
        prompt,
      );
      if (resolved) {
        return {
          action: resolved.action,
          params: { ...(resolved.params ?? {}) },
          reasoning:
            'Provider availability open-check — not add_booking_to_calendar (e2e-bug.307).',
          rescued: true,
          rescueReason: 'availability_not_calendar',
        };
      }
      return {
        action: 'check_availability',
        params: {},
        reasoning:
          'Provider availability open-check — not add_booking_to_calendar (e2e-bug.307).',
        rescued: true,
        rescueReason: 'availability_not_calendar',
      };
    }

    const rescued = rescueAddBookingToCalendarIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseAddBookingToCalendarFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = { format: parsed.format };
    if (parsed.bookingId) params.bookingId = parsed.bookingId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;

    return {
      action: rescued.action,
      params,
      reasoning: `Add booking to calendar rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueGetDirectionsToSalon(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueGetDirectionsToSalonIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseGetDirectionsToSalonFromPrompt(prompt);
    if (!parsed) return null;

    return {
      action: rescued.action,
      params: { aspect: parsed.aspect },
      reasoning: `Salon directions rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainPreparationNotes(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainPreparationNotesIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainPreparationNotesFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = { aspect: parsed.aspect };
    if (parsed.bookingId) params.bookingId = parsed.bookingId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;

    return {
      action: rescued.action,
      params,
      reasoning: `Preparation notes rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainWhySignIn(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainWhySignInIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainWhySignInFromPrompt(prompt);
    if (!parsed) return null;

    return {
      action: rescued.action,
      params: { aspect: parsed.aspect },
      reasoning: `Why sign in explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  /** e2e-bug.76 — account language setting before explain_why_sign_in / my_profile. */
  private tryRescueMyLocale(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueMyLocaleIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `My locale rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  /** e2e-bug.93 — named provider availability / profile / specialty before guest checkout. */
  private tryRescueNamedProviderReadIntents(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const availability = rescueExplainProviderAvailabilityIntent(
      prompt,
      action,
    );
    if (availability) {
      return {
        action: availability.action,
        params: enrichExplainProviderAvailabilityParamsFromPrompt({}, prompt),
        reasoning: `Explain provider availability rescue → ${availability.action}`,
        rescued: true,
        rescueReason: availability.rescueReason,
      };
    }

    const professionalProfile = rescueExplainProfessionalProfileIntent(
      prompt,
      action,
    );
    if (professionalProfile) {
      return {
        action: professionalProfile.action,
        params: enrichExplainProfessionalProfileParamsFromPrompt({}, prompt),
        reasoning: `Professional profile rescue → ${professionalProfile.action}`,
        rescued: true,
        rescueReason: professionalProfile.rescueReason,
      };
    }

    // e2e-bug.191 — salon/business overview before named-provider specialty steal.
    const salonProfile = rescueExplainSalonProfileIntent(prompt, action);
    if (salonProfile) {
      return {
        action: salonProfile.action,
        params: enrichExplainSalonProfileParamsFromPrompt({}, prompt),
        reasoning: `Salon profile rescue → ${salonProfile.action}`,
        rescued: true,
        rescueReason: salonProfile.rescueReason,
      };
    }

    const providerSpecialty = rescueExplainProviderSpecialtyIntent(
      prompt,
      action,
    );
    if (providerSpecialty) {
      return {
        action: providerSpecialty.action,
        params: enrichExplainProviderSpecialtyParamsFromPrompt({}, prompt),
        reasoning: `Provider specialty rescue → ${providerSpecialty.action}`,
        rescued: true,
        rescueReason: providerSpecialty.rescueReason,
      };
    }

    return null;
  }

  /** e2e-bug.92 / e2e-bug.189 — escape check_providers_for_service into roster / reviews / any-provider / timed book. */
  private tryRescueCheckProvidersCollapseIntents(
    prompt: string,
    action: string,
    surface: 'customer' | 'public',
  ): IntentRescueResult | null {
    // e2e-bug.189 — roster-only prompts before other escapes.
    const roster = rescueListProvidersIntent(prompt, action);
    if (roster) {
      return {
        action: roster.action,
        params: {},
        reasoning: `List providers roster rescue (${surface}) → ${roster.action}`,
        rescued: true,
        rescueReason: roster.rescueReason,
      };
    }

    const reviews = rescueListProviderReviewsIntent(prompt, action);
    if (reviews) {
      return {
        action: reviews.action,
        params: enrichListProviderReviewsParamsFromPrompt({}, prompt),
        reasoning: `Provider reviews rescue → ${reviews.action}`,
        rescued: true,
        rescueReason: reviews.rescueReason,
      };
    }

    const anyProvider = rescueExplainAnyProviderOptionIntent(prompt, action);
    if (anyProvider) {
      return {
        action: anyProvider.action,
        params: parseExplainAnyProviderOptionFromPrompt(prompt) ?? {},
        reasoning: `Any provider option explain rescue → ${anyProvider.action}`,
        rescued: true,
        rescueReason: anyProvider.rescueReason,
      };
    }

    // e2e-bug.134 — a pasted manage link combined with a concrete date/time
    // ("Reschedule my booking to Friday 2pm https://.../manage?bookingId=book-9&...")
    // must still reach tryRescueManageBookingWithToken later in the chain, not
    // get stolen here into book_appointment (its bare `\bbook\b` regex, inside
    // isConcreteTimedBookAppointmentPrompt, matches the literal "book-9" bookingId
    // value embedded in the URL).
    const manageLinkCredsForCollapseRescue =
      extractManageLinkCredentialsFromPrompt(prompt);
    const hasManageLinkCredsForCollapseRescue = Boolean(
      manageLinkCredsForCollapseRescue.bookingId &&
      manageLinkCredsForCollapseRescue.manageToken,
    );

    if (
      !hasManageLinkCredsForCollapseRescue &&
      isConcreteTimedBookAppointmentPrompt(prompt) &&
      action !== 'book_appointment' &&
      action !== 'book_nearest_slot'
    ) {
      return {
        action: 'book_appointment',
        params: enrichBookAppointmentParamsFromPrompt(prompt),
        reasoning: `Timed book rescue (${surface}) → book_appointment`,
        rescued: true,
        rescueReason: 'public_timed_book',
      };
    }

    return null;
  }

  private tryRescueExplainGuestCheckoutFields(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainGuestCheckoutFieldsIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainGuestCheckoutFieldsFromPrompt(prompt);
    if (!parsed) return null;

    return {
      action: rescued.action,
      params: { aspect: parsed.aspect },
      reasoning: `Guest checkout fields explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueResumePendingPayment(
    prompt: string,
    action: string,
    surface?: 'dashboard' | 'customer' | 'public' | 'provider',
  ): IntentRescueResult | null {
    if (surface !== 'customer') return null;
    const rescued = rescueResumePendingPaymentIntent(prompt, action);
    if (!rescued) return null;

    return {
      action: rescued.action,
      params: {},
      reasoning: `Resume pending payment rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainLabPrep(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainLabPrepIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainLabPrepFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;

    return {
      action: rescued.action,
      params,
      reasoning: `Lab prep explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainClinicBookingFields(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainClinicBookingFieldsIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainClinicBookingFieldsFromPrompt(prompt);
    if (!parsed) return null;

    return {
      action: rescued.action,
      params: { aspect: parsed.aspect },
      reasoning: `Clinic booking fields explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainPublicIntakeForm(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainPublicIntakeFormIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainPublicIntakeFormFromPrompt(prompt);
    if (!parsed) return null;

    return {
      action: rescued.action,
      params: enrichExplainPublicIntakeFormParamsFromPrompt(
        { aspect: parsed.aspect },
        prompt,
      ),
      reasoning: `Public intake form explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainClinicBooking(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainClinicBookingIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainClinicBookingFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = { aspect: parsed.aspect };
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;

    return {
      action: rescued.action,
      params,
      reasoning: `Clinic booking explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainClinicServices(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainClinicServicesIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainClinicServicesFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;

    return {
      action: rescued.action,
      params,
      reasoning: `Clinic services explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueClinicService(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueConfigureClinicServiceIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseConfigureClinicServiceFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.serviceType) params.serviceType = parsed.serviceType;
    if (parsed.requiresFasting !== undefined) {
      params.requiresFasting = parsed.requiresFasting;
    }
    if (parsed.preparationNotes) {
      params.preparationNotes = parsed.preparationNotes;
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Clinic service rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainTourServices(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainTourServicesIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainTourServicesFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.daysAhead !== undefined) params.daysAhead = parsed.daysAhead;

    return {
      action: rescued.action,
      params,
      reasoning: `Tour services explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueTourService(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueConfigureTourServiceIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseConfigureTourServiceFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.enableTour) {
      params.enableTour = true;
      params.serviceType = 'tour';
    }
    if (parsed.maxGroupSize !== undefined) {
      params.maxGroupSize = parsed.maxGroupSize;
    }
    if (parsed.difficulty) params.difficulty = parsed.difficulty;
    if (parsed.coverImage) params.coverImage = parsed.coverImage;
    if (parsed.meetingPoint) params.meetingPoint = parsed.meetingPoint;
    if (parsed.includedItems) params.includedItems = parsed.includedItems;
    if (parsed.durationDays !== undefined) {
      params.durationDays = parsed.durationDays;
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Tour service rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  /** e2e-bug.144 — soft-delete catalog service before staff/ops misroutes. */
  private tryRescueCatalogDeactivateService(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    if (action === 'deactivate_service') return null;
    if (!isDeactivateServicePrompt(prompt)) return null;
    const params = enrichDeactivateServiceCategoryScopeParamsFromPrompt(
      {},
      prompt,
    );
    const calledName = extractDeactivateServiceNameFromPrompt(prompt);
    if (calledName && !params.serviceName) {
      params.serviceName = calledName;
    }
    return {
      action: 'deactivate_service',
      params,
      reasoning: 'Catalog soft-delete rescue → deactivate_service',
      rescued: true,
      // e2e-bug.430 — name the shape of the request, not just the action.
      //
      // "Hide all hair services from public catalog" is a category-wide
      // deactivation; "Disable Deluxe Facial" is one service. Both land here and
      // both were labelled `deactivate_service`, so the seven scoped cases in
      // the corpus asserted a reason nothing produced. The params already
      // distinguish them — this branch builds them with
      // `enrichDeactivateServiceCategoryScopeParamsFromPrompt` — only the label
      // did not.
      //
      // The same correction is in `ai-catalog.util.ts`'s equivalent branch;
      // they are separate rescue chains and each must label its own result.
      rescueReason: isDeactivateServiceCategoryScopePrompt(prompt)
        ? 'deactivate_service_category_scope'
        : 'deactivate_service',
    };
  }

  private tryRescueCatalog(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const applyClinicPlaybook = this.tryRescueApplyClinicPlaybook(
      prompt,
      action,
    );
    if (applyClinicPlaybook) return applyClinicPlaybook;

    const applyTourPlaybook = this.tryRescueApplyTourPlaybook(prompt, action);
    if (applyTourPlaybook) return applyTourPlaybook;

    const explainTourRecord = this.tryRescueExplainTourBookingRecord(
      prompt,
      action,
    );
    if (explainTourRecord) return explainTourRecord;

    const listDepartures = this.tryRescueListUpcomingTourDepartures(
      prompt,
      action,
    );
    if (listDepartures) return listDepartures;

    const explainCalendarSpan = this.tryRescueExplainTourCalendarSpan(
      prompt,
      action,
    );
    if (explainCalendarSpan) return explainCalendarSpan;

    const listCalendarWeek = this.tryRescueListTourCalendarWeek(prompt, action);
    if (listCalendarWeek) return listCalendarWeek;

    const explainTours = this.tryRescueExplainTourServices(prompt, action);
    if (explainTours) return explainTours;

    const explainClinic = this.tryRescueExplainClinicServices(prompt, action);
    if (explainClinic) return explainClinic;

    const tourService = this.tryRescueTourService(prompt, action);
    if (tourService) return tourService;

    const clinicService = this.tryRescueClinicService(prompt, action);
    if (clinicService) return clinicService;

    const packageLocalized = this.tryRescuePackageLocalizedNames(
      prompt,
      action,
    );
    if (packageLocalized) return packageLocalized;

    const rescued = rescueCatalogIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    const params: Record<string, unknown> = {
      ...('params' in rescued && rescued.params ? rescued.params : {}),
    };
    enrichServiceCategoryRescueParams(rescued.action, params, prompt);
    enrichCatalogNotifyRescueParams(rescued.action, params, prompt);
    if (rescued.action === 'configure_service_featured') {
      Object.assign(
        params,
        enrichConfigureServiceFeaturedParamsFromPrompt(params, prompt),
      );
    }
    if (rescued.action === 'bulk_assign_services_category') {
      Object.assign(
        params,
        enrichBulkAssignServicesCategoryParamsFromPrompt(params, prompt),
      );
    }
    if (rescued.action === 'configure_package_online_payment') {
      Object.assign(
        params,
        enrichConfigurePackageOnlinePaymentParamsFromPrompt(params, prompt),
      );
    }
    if (rescued.action === 'deactivate_service') {
      Object.assign(
        params,
        enrichDeactivateServiceCategoryScopeParamsFromPrompt(params, prompt),
      );
    }
    if (rescued.action === 'update_service_duration_buffer') {
      Object.assign(
        params,
        enrichServiceDurationBufferParamsFromPrompt(params, prompt),
      );
    }
    return {
      action: rescued.action,
      params,
      reasoning: `Catalog command rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private disambiguateMisclassified(
    prompt: string,
    action: string,
    params: Record<string, any>,
    employees: Array<{ id: string; name: string }>,
    customers: Array<{ id: string; name: string }> = [],
    timeZone = 'UTC',
    surface?: IntentRescueInput['surface'],
  ): IntentRescueResult | null {
    // e2e-bug.134 — a pasted manage link combined with a concrete date/time
    // ("Reschedule my booking to Friday 2pm https://.../manage?bookingId=...")
    // must still reach tryRescueManageBookingWithToken later in the chain, not
    // get stolen into book_appointment by the timed-book disambiguation below.
    const manageLinkCredsForDisambiguation =
      extractManageLinkCredentialsFromPrompt(prompt);
    if (
      manageLinkCredsForDisambiguation.bookingId &&
      manageLinkCredsForDisambiguation.manageToken
    ) {
      return null;
    }
    const scheduling = this.tryRescueScheduling(prompt, action, params);
    if (scheduling) return scheduling;
    const createBookingNotEmployee = this.tryRescueCreateBookingNotEmployee(
      prompt,
      action,
      params,
    );
    if (createBookingNotEmployee) return createBookingNotEmployee;
    const staffOperations = this.tryRescueStaffOperations(prompt, action);
    if (staffOperations) return staffOperations;
    const waitlistDashboard = this.tryRescueWaitlistDashboard(prompt, action);
    if (waitlistDashboard) return waitlistDashboard;
    const operations = this.tryRescueOperations(prompt, action, params);
    if (operations) return operations;

    const lower = prompt.toLowerCase();

    // e2e-bug.284 — move+then-book-another must stay compound, not collapse
    // to a lone reschedule_booking via misclass_to_reschedule.
    const rescheduleThenCreate =
      this.tryRescueRescheduleThenCreateBookingCompound(prompt, action);
    if (rescheduleThenCreate) return rescheduleThenCreate;

    // e2e-bug.248 — remap move/reschedule+nearest steals (soonest, optimize, book, …).
    // e2e-bug.252 — never steal owner cancel/reschedule *alert prefs* into
    // reschedule_booking (classifier often already has the toggle correct).
    if (
      action !== 'reschedule_booking' &&
      action !== 'reschedule_my_booking' &&
      action !== 'toggle_business_email_on_customer_change' &&
      !isToggleBusinessEmailOnCustomerChangePrompt(prompt) &&
      isRescheduleExistingAppointmentPrompt(prompt) &&
      // Customer/public self-serve "my appointment" stays on reschedule_my_booking.
      !(
        (surface === 'customer' || surface === 'public') &&
        /\b(my|mine)\b/i.test(prompt)
      )
    ) {
      const rescuedParams = { ...params };
      applyBookingRescheduleActionHints(
        'reschedule_booking',
        rescuedParams,
        prompt,
        { employees, customers, timeZone },
      );
      return {
        action: 'reschedule_booking',
        params: rescuedParams,
        reasoning: 'Move/reschedule existing appointment — not a new booking.',
        rescued: true,
        rescueReason:
          action === 'find_soonest_appointment'
            ? 'soonest_to_reschedule'
            : action === 'optimize_schedule'
              ? 'optimize_to_reschedule'
              : action === 'create_booking'
                ? 'create_booking_to_reschedule'
                : 'misclass_to_reschedule',
      };
    }

    // e2e-bug.77 — staff package/multi booking is dashboard-only; never steal
    // customer/public "package visit rules" into create_package_booking.
    const packageMultiFix =
      surface === 'customer' || surface === 'public'
        ? null
        : disambiguateStaffPackageMultiBooking(prompt, action);
    if (packageMultiFix) {
      const rescuedParams = { ...params };
      applyPackageMultiServicePromptHints(
        packageMultiFix.action,
        rescuedParams,
        prompt,
        { employees, customers, timeZone },
      );
      return {
        action: packageMultiFix.action,
        params: rescuedParams,
        reasoning:
          packageMultiFix.action === 'create_package_booking'
            ? 'Staff-assisted package booking — not a single-service create_booking.'
            : 'Staff-assisted multi-service booking — not a single-service create_booking.',
        rescued: true,
        rescueReason: packageMultiFix.rescueReason,
      };
    }

    const giftCardPaymentsFix = disambiguateGiftCardPaymentsAction(
      prompt,
      action,
    );
    if (giftCardPaymentsFix) {
      const rescuedParams = { ...params };
      applyGiftCardPaymentsPromptHints(
        giftCardPaymentsFix.action,
        rescuedParams,
        prompt,
      );
      return {
        action: giftCardPaymentsFix.action,
        params: rescuedParams,
        reasoning: `Gift card / checkout rescue → ${giftCardPaymentsFix.action}`,
        rescued: true,
        rescueReason: giftCardPaymentsFix.rescueReason,
      };
    }

    // e2e-bug.249 — dashboard check-then-book / first-available before the
    // multi-surface availability loop (public book_appointment must not steal).
    // e2e-bug.286 — also remap create_employee steal of "create a booking…".
    if (
      action === 'create_booking' &&
      isCheckProvidersForServicePrompt(prompt) &&
      isBookNearestSlotPrompt(prompt)
    ) {
      const rescuedParams = { ...params };
      enrichBookingTimeHintsFromPrompt('create_booking', rescuedParams, prompt);
      return {
        action: 'create_booking',
        params: rescuedParams,
        reasoning:
          'Check-then-book compound — flexible earliest slot, no fixed start time.',
        rescued: true,
        rescueReason: 'check_and_book_compound',
      };
    }

    if (
      (action === 'create_booking' ||
        action === 'reschedule_booking' ||
        action === 'create_employee') &&
      (isFirstAvailableBookingPrompt(prompt) ||
        (action === 'create_employee' &&
          isCreateBookingNotEmployeePrompt(prompt)))
    ) {
      const rescuedParams = { ...params };
      enrichBookingTimeHintsFromPrompt('create_booking', rescuedParams, prompt);
      if (
        /\bfirst\s+available\b/i.test(prompt) ||
        /\b(?:nearest|soonest|next\s+available)\b/i.test(prompt) ||
        isFirstAvailableBookingPrompt(prompt)
      ) {
        rescuedParams.bookingFirstAvailable = true;
        delete rescuedParams.timeSlot;
      }
      if (isAnyProviderBookingPrompt(prompt)) {
        rescuedParams.allProviders = true;
      }
      return {
        action:
          action === 'reschedule_booking'
            ? 'reschedule_booking'
            : 'create_booking',
        params: rescuedParams,
        reasoning:
          action === 'create_employee'
            ? 'Create booking (not hire staff) — first available slot.'
            : 'Nearest/first available slot — no fixed start time required.',
        rescued: true,
        rescueReason:
          action === 'create_employee'
            ? 'create_booking_not_employee'
            : 'booking_first_available',
      };
    }

    // e2e-bug.92 — include public so timed book / availability can escape check_providers.
    // Prefer the caller's surface first so dashboard create_booking is not rewritten
    // by a later public book_appointment candidate (e2e-bug.249).
    // e2e-bug.287 — stop after the caller surface when it already agrees with the
    // current action (dashboard check_providers must not be aliased to public
    // check_availability), and never let a secondary surface remap after the
    // caller surface already produced a fix-or-confirm decision.
    const primaryAvailabilitySurface: AvailabilityDisambiguationSurface =
      surface === 'dashboard' || surface === 'customer' || surface === 'public'
        ? surface
        : 'dashboard';
    const secondaryAvailabilitySurfaces = (
      ['dashboard', 'customer', 'public'] as const
    ).filter((s) => s !== primaryAvailabilitySurface);
    const primaryAvailabilityFix = disambiguateMisclassifiedAvailabilityIntent(
      primaryAvailabilitySurface,
      prompt,
      action,
      params,
    );
    if (primaryAvailabilityFix) {
      return {
        action: primaryAvailabilityFix.action,
        params: primaryAvailabilityFix.params ?? params,
        reasoning: `Availability disambiguation (${primaryAvailabilitySurface}) → ${primaryAvailabilityFix.action}`,
        rescued: true,
        rescueReason: primaryAvailabilityFix.rescueReason,
      };
    }
    const primaryAvailabilityResolved = resolveAvailabilityIntentFromPrompt(
      primaryAvailabilitySurface,
      prompt,
    );
    if (primaryAvailabilityResolved?.action !== action) {
      for (const availabilitySurface of secondaryAvailabilitySurfaces) {
        const availabilityFix = disambiguateMisclassifiedAvailabilityIntent(
          availabilitySurface,
          prompt,
          action,
          params,
        );
        if (availabilityFix) {
          return {
            action: availabilityFix.action,
            params: availabilityFix.params ?? params,
            reasoning: `Availability disambiguation (${availabilitySurface}) → ${availabilityFix.action}`,
            rescued: true,
            rescueReason: availabilityFix.rescueReason,
          };
        }
      }
    }

    if (
      action === 'show_appointments' &&
      /\b(book|schedule|reserve)\b/i.test(lower) &&
      !/\b(show|list|display|who)\b/i.test(lower)
    ) {
      return {
        action: 'create_booking',
        params,
        reasoning: 'Booking intent detected from prompt.',
        rescued: true,
        rescueReason: 'show_to_create_booking',
      };
    }

    if (
      action === 'list_bookings' &&
      /\b(most expensive|longest|shortest|earliest|latest)\b/i.test(lower)
    ) {
      return {
        action: 'analyze_appointments',
        params,
        reasoning: 'Analytics query — analyze appointments.',
        rescued: true,
        rescueReason: 'list_to_analyze_appointments',
      };
    }

    if (
      (action === 'list_bookings' ||
        action === 'show_appointments' ||
        action === 'summarize_day') &&
      isTotalEarningsPrompt(prompt)
    ) {
      return {
        action: 'summarize_bookings',
        params: { ...params, bookingMetric: 'revenue' },
        reasoning: 'Total earnings/revenue query — booking analytics.',
        rescued: true,
        rescueReason: 'list_to_total_earnings',
      };
    }

    if (
      (action === 'list_employees' ||
        action === 'list_bookings' ||
        action === 'show_appointments') &&
      isTopStaffRevenuePrompt(prompt)
    ) {
      return {
        action: 'summarize_staff',
        params: {
          ...params,
          staffMetric: 'most_revenue',
          limit: extractLimitFromPrompt(prompt),
        },
        reasoning: 'Specialist/provider revenue ranking query.',
        rescued: true,
        rescueReason: 'list_to_top_staff_revenue',
      };
    }

    const scheduleDisambiguation = disambiguateClearScheduleVsHideCalendar(
      prompt,
      action,
    );
    if (
      scheduleDisambiguation &&
      (scheduleDisambiguation.rescueReason !== 'read_to_clear_schedule' ||
        READ_ONLY_ACTIONS.has(action))
    ) {
      const rescuedParams = { ...params };
      applyScheduleOpsPromptHints(
        scheduleDisambiguation.action,
        rescuedParams,
        prompt,
        { employees, timeZone },
      );
      return {
        action: scheduleDisambiguation.action,
        params: rescuedParams,
        reasoning:
          scheduleDisambiguation.action === 'hide_appointments_from_calendar'
            ? 'Hiding appointments from calendar — not clearing applied schedule.'
            : 'Clear applied schedule operation detected.',
        rescued: true,
        rescueReason: scheduleDisambiguation.rescueReason,
      };
    }

    if (action === 'unknown') {
      return this.rescue({ prompt, action, params, employees });
    }

    return null;
  }

  private tryRescueNotificationDateFormat(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const notificationDate = rescueNotificationDateFormatIntent(prompt, action);
    if (!notificationDate) return null;

    const params: Record<string, unknown> = {};
    if (notificationDate.action === 'preview_notification_datetime') {
      params.messageKind = parseNotificationMessageKind(prompt);
    }
    if (notificationDate.action === 'notify_patient_result_ready') {
      Object.assign(params, parsePatientResultReadyParams(prompt, params));
    }
    return {
      action: notificationDate.action,
      params,
      reasoning: `Notification date format rescue → ${notificationDate.action}`,
      rescued: true,
      rescueReason: notificationDate.rescueReason,
    };
  }

  private tryRescueClinicTestResult(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueClinicTestResultIntent(prompt, action);
    if (!rescued) return null;

    const params: Record<string, unknown> = {};
    if (rescued.action === 'enter_test_result') {
      const parsed = parseEnterTestResultFromPrompt(prompt);
      if (parsed?.measurementCode)
        params.measurementCode = parsed.measurementCode;
      if (parsed?.value) params.value = parsed.value;
      if (parsed?.orderId) params.orderId = parsed.orderId;
      if (parsed?.resultId) params.resultId = parsed.resultId;
      if (parsed?.customerName) params.customerName = parsed.customerName;
    } else if (rescued.action === 'release_test_result') {
      const parsed = parseReleaseTestResultFromPrompt(prompt);
      if (parsed?.customerName) params.customerName = parsed.customerName;
      if (parsed?.orderId) params.orderId = parsed.orderId;
      if (parsed?.resultId) params.resultId = parsed.resultId;
    } else if (rescued.action === 'upload_patient_result') {
      const parsed = parseUploadPatientResultFromPrompt(prompt);
      if (parsed?.orderId) params.orderId = parsed.orderId;
      if (parsed?.customerName) params.customerName = parsed.customerName;
    } else if (rescued.action === 'explain_patient_results') {
      const parsed = parseExplainPatientResultsFromPrompt(prompt);
      if (parsed?.customerName) params.customerName = parsed.customerName;
      if (parsed?.orderId) params.orderId = parsed.orderId;
    } else if (rescued.action === 'configure_test_reference_range') {
      const parsed = parseConfigureTestReferenceRangeFromPrompt(prompt);
      if (parsed?.measurementCode)
        params.measurementCode = parsed.measurementCode;
      if (parsed?.normalLow) params.normalLow = parsed.normalLow;
      if (parsed?.normalHigh) params.normalHigh = parsed.normalHigh;
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Clinic test result rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueClinicPatientChart(
    prompt: string,
    action: string,
    surface?: string,
  ): IntentRescueResult | null {
    const rescued = rescueClinicPatientChartIntent(prompt, action);
    if (!rescued) return null;

    const params: Record<string, unknown> = {};
    const parsed = parseExplainPatientChartFromPrompt(prompt);
    if (parsed?.customerName) params.customerName = parsed.customerName;
    if (parsed?.customerId) params.customerId = parsed.customerId;

    /** ai-cmd-provider-5.11.4 — provider surface calls this "open_patient_chart", dashboard calls it "explain_patient_chart". */
    const resolvedAction =
      surface === 'provider' && rescued.action === 'explain_patient_chart'
        ? 'open_patient_chart'
        : rescued.action;
    const resolvedReason =
      surface === 'provider' && rescued.action === 'explain_patient_chart'
        ? 'open_patient_chart'
        : rescued.rescueReason;

    return {
      action: resolvedAction,
      params,
      reasoning: `Clinic patient chart rescue → ${resolvedAction}`,
      rescued: true,
      rescueReason: resolvedReason,
    };
  }

  private tryRescueConsumerClinicTestResults(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueConsumerClinicTestResultsIntent(prompt, action);
    if (!rescued) return null;

    const params: Record<string, unknown> = {};
    if (rescued.action === 'explain_result_status') {
      const parsed = parseExplainResultStatusFromPrompt(prompt);
      if (parsed?.status) params.status = parsed.status;
      if (parsed?.testName) params.testName = parsed.testName;
      if (parsed?.resultId) params.resultId = parsed.resultId;
    } else {
      const parsed = parseListMyTestResultsFromPrompt(prompt);
      if (parsed?.testName) params.testName = parsed.testName;
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Consumer clinic test results rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueTrackLabOrderStatus(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueTrackLabOrderStatusIntent(prompt, action);
    if (!rescued) return null;

    const parsed = parseTrackLabOrderStatusFromPrompt(prompt);
    const params: Record<string, unknown> = {};
    if (parsed?.testName) params.testName = parsed.testName;

    return {
      action: rescued.action,
      params,
      reasoning: `Track lab order status rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueListMyDocuments(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueListMyDocumentsIntent(prompt, action);
    if (!rescued) return null;

    const params = enrichListMyDocumentsParamsFromPrompt({}, prompt);

    return {
      action: rescued.action,
      params,
      reasoning: `List my documents rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainAbnormalResultFlag(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainAbnormalResultFlagIntent(prompt, action);
    if (!rescued) return null;

    const params = enrichExplainAbnormalResultFlagParamsFromPrompt({}, prompt);

    return {
      action: rescued.action,
      params,
      reasoning: `Explain abnormal result flag rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueNotifyWhenResultsReady(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueNotifyWhenResultsReadyIntent(prompt, action);
    if (!rescued) return null;

    const params = enrichNotifyWhenResultsReadyParamsFromPrompt({}, prompt);

    return {
      action: rescued.action,
      params,
      reasoning: `Notify when results ready rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderClinicCollection(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueProviderClinicCollectionIntent(prompt, action);
    if (!rescued) return null;

    const params: Record<string, unknown> = {};
    if (rescued.action === 'mark_specimen_collected') {
      const parsed = parseMarkSpecimenCollectedFromPrompt(prompt);
      if (parsed?.specimenId) params.specimenId = parsed.specimenId;
      if (parsed?.orderId) params.orderId = parsed.orderId;
      if (parsed?.customerName) params.customerName = parsed.customerName;
    } else {
      const parsed = parseListMyCollectionQueueFromPrompt(prompt);
      if (parsed?.date) params.date = parsed.date;
      if (parsed?.dateFrom) params.dateFrom = parsed.dateFrom;
      if (parsed?.dateTo) params.dateTo = parsed.dateTo;
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Provider clinic collection rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderClinicTasksAndResults(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueProviderClinicTasksAndResultsIntent(prompt, action);
    if (!rescued) return null;

    const params: Record<string, unknown> = {};
    if (
      rescued.action === 'claim_clinic_task' ||
      rescued.action === 'complete_clinic_task'
    ) {
      const taskId = extractClinicTaskIdFromPrompt(prompt);
      if (taskId) params.taskId = taskId;
    }
    if (rescued.action === 'list_booking_lab_summaries') {
      const bookingId = extractBookingIdForLabSummariesFromPrompt(prompt);
      if (bookingId) params.bookingId = bookingId;
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Provider clinic tasks/results rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueClinicCompound(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const labDayClose = rescueClinicLabDayCloseCompoundIntent(prompt, action);
    if (labDayClose) {
      return {
        action: labDayClose.action,
        params: {},
        reasoning:
          'Clinic lab day close compound — list orders, enter results, release, notify.',
        rescued: true,
        rescueReason: labDayClose.rescueReason,
      };
    }
    const labReview = rescueClinicLabReviewCompoundIntent(prompt, action);
    if (labReview) {
      return {
        action: labReview.action,
        params: {},
        reasoning:
          'Clinic lab review compound — list abnormal flags, then explain results.',
        rescued: true,
        rescueReason: labReview.rescueReason,
      };
    }
    const rescued = rescueClinicCompoundIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning:
        'Clinic lab order + result notification compound — split into book/order then notify/explain.',
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueDashboardClinicLabBooking(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueDashboardClinicLabBookingIntent(prompt, action);
    if (!rescued) return null;

    const params: Record<string, unknown> = {};
    if (rescued.action === 'push_lab_booking_to_patient') {
      const parsed = parsePushLabBookingFromPrompt(prompt);
      if (parsed?.customerName) params.customerName = parsed.customerName;
      if (parsed?.orderId) params.orderId = parsed.orderId;
      if (parsed?.collectionServiceName) {
        params.collectionServiceName = parsed.collectionServiceName;
      }
    } else {
      const parsed = parseStaffBookLabCollectionFromPrompt(prompt);
      if (parsed?.customerName) params.customerName = parsed.customerName;
      if (parsed?.orderId) params.orderId = parsed.orderId;
      if (parsed?.startTime) params.startTime = parsed.startTime;
      if (parsed?.employeeId) params.employeeId = parsed.employeeId;
      if (parsed?.employeeName) params.employeeName = parsed.employeeName;
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Dashboard clinic lab booking rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueConsumerClinicLabBooking(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const intakeLabBookPayCompound = rescueIntakeLabBookPayCompoundIntent(
      prompt,
      action,
    );
    if (intakeLabBookPayCompound) {
      return {
        action: intakeLabBookPayCompound.action,
        params: {},
        reasoning:
          'Intake lab book pay compound — pre-visit questionnaire, lab slot booking, then checkout payment.',
        rescued: true,
        rescueReason: intakeLabBookPayCompound.rescueReason,
      };
    }

    const intakeBookCompound = rescueCompleteIntakeAndBookCompoundIntent(
      prompt,
      action,
    );
    if (intakeBookCompound) {
      return {
        action: intakeBookCompound.action,
        params: {},
        reasoning:
          'Complete intake and book compound — pre-visit questionnaire then lab slot booking.',
        rescued: true,
        rescueReason: intakeBookCompound.rescueReason,
      };
    }

    const nearestCompound = rescueBookLabCollectionNearestCompoundIntent(
      prompt,
      action,
    );
    if (nearestCompound) {
      return {
        action: nearestCompound.action,
        params: {},
        reasoning:
          'Book lab collection nearest compound — list pending requests, book with earliest slot.',
        rescued: true,
        rescueReason: nearestCompound.rescueReason,
      };
    }

    const rescued = rescueConsumerClinicLabBookingIntent(prompt, action);
    if (!rescued) return null;

    const params: Record<string, unknown> = {};
    if (rescued.action === 'book_lab_collection') {
      const parsed = parseBookLabCollectionFromPrompt(prompt);
      if (parsed?.orderId) params.orderId = parsed.orderId;
      if (parsed?.testName) params.testName = parsed.testName;
    } else if (rescued.action === 'book_lab_from_order') {
      const parsed = parseBookLabFromOrderFromPrompt(prompt);
      if (parsed?.orderId) params.orderId = parsed.orderId;
      if (parsed?.testName) params.testName = parsed.testName;
    } else {
      const parsed = parseListMyLabBookingRequestsFromPrompt(prompt);
      if (parsed?.orderId) params.orderId = parsed.orderId;
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Consumer clinic lab booking rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderClinicLabBooking(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueProviderClinicLabBookingIntent(prompt, action);
    if (!rescued) return null;

    return {
      action: rescued.action,
      params: {},
      reasoning: `Provider clinic lab booking rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueClinicTestOrder(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueClinicTestOrderIntent(prompt, action);
    if (!rescued) return null;

    const params: Record<string, unknown> = {};
    if (rescued.action === 'create_test_order') {
      const parsed = parseCreateTestOrderFromPrompt(prompt);
      if (parsed?.customerName) params.customerName = parsed.customerName;
      if (parsed?.bookingId) params.bookingId = parsed.bookingId;
      if (parsed?.testNames) params.testNames = parsed.testNames;
      if (parsed?.date) params.date = parsed.date;
    } else {
      const parsed = parseListTestOrdersFromPrompt(prompt);
      if (parsed?.customerName) params.customerName = parsed.customerName;
      if (parsed?.bookingId) params.bookingId = parsed.bookingId;
      if (parsed?.status) params.status = parsed.status;
      if (parsed?.date) params.date = parsed.date;
      if (parsed?.awaitingPatientBooking) {
        params.awaitingPatientBooking = true;
      }
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Clinic test order rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }
}
