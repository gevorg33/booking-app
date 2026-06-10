import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { PublicBookingService } from './public-booking.service.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { BusinessService } from '../business/business.service.js';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import {
  formatDateDisplay,
  formatTimeDisplay,
  formatTimeRangeDisplay,
  toIsoDay,
} from '../../common/utils/date-format.util.js';
import {
  getDateKeyInTimezone,
  resolveTimezone,
} from '../../common/utils/timezone.util.js';
import { CreatePublicBookingDto } from './dto/public-booking.dto.js';
import {
  resolveLocale,
  t,
  localeLanguageInstruction,
  type AppLocale,
} from '../../common/i18n/messages.js';
import { formatWeekdayShortByDayIndex } from '../../common/i18n/locale-date.util.js';
import { BookingSlotResolverService } from '../booking/booking-slot-resolver.service.js';
import { AiPlatformService } from '../ai/ai-platform.service.js';
import { AiSettingsService } from '../ai/ai-settings.service.js';
import {
  fuzzyMatchServiceByName,
  inferServiceGroupLabel,
  matchServicesByQuery,
  PUBLIC_AVAILABILITY_SCAN_DAYS,
  resolveEmployees,
  resolvePublicAvailabilityWindows,
  resolveServicesFromCatalogParams,
  enrichListServicesParamsFromPrompt,
  stripServiceRoleNoise,
  resolvePublicAssistantSessionServiceFields,
} from '../ai/ai-orchestration.helpers.js';
import { addDaysToDateKey } from '../../common/utils/timezone.util.js';
import { PUBLIC_CHECK_AND_BOOK_CLASSIFIER_RULES } from '../ai/ai-check-and-book.fixtures.js';
import { buildNoNearestSlotMessage } from '../ai/ai-booking-slot-messages.util.js';
import {
  attachCheckProvidersHandoff,
  buildCheckProvidersHandoffFromResult,
  pickCheckProvidersHandoff,
  type CheckProvidersHandoff,
} from '../ai/ai-check-book-handoff.util.js';
import {
  applyChosenAvailabilityWindowToParams,
  buildNearestAvailabilityWindowQueries,
  buildNearestBookableSlotQuery,
} from '../ai/ai-nearest-slot-resolver.util.js';
import { CLASSIFIER_MULTILINGUAL_RULES } from '../ai/ai-prompt-i18n.js';
import { CHECKOUT_CURRENCY_CLASSIFIER_RULES } from '../ai/ai-checkout-currency.fixtures.js';
import { BOOKING_LANGUAGES_CLASSIFIER_RULES } from '../ai/ai-booking-languages.fixtures.js';
import { BOOKING_DATE_FORMAT_CLASSIFIER_RULES } from '../ai/ai-booking-date-format.fixtures.js';
import { PUBLIC_PACKAGE_DISPLAY_NAME_CLASSIFIER_RULES } from '../ai/ai-package-display-name.fixtures.js';
import { TOUR_BOOKING_CLASSIFIER_RULES } from '../ai/ai-tour-booking.fixtures.js';
import { TOUR_DAY_SLOTS_CLASSIFIER_RULES } from '../ai/ai-tour-day-slots.fixtures.js';
import { PACKAGE_CURRENCY_CLASSIFIER_RULES } from '../ai/ai-package-currency.fixtures.js';
import { rescueBookingLanguagesIntent } from '../ai/ai-booking-languages.util.js';
import { rescueBookingDateFormatIntent } from '../ai/ai-booking-date-format.util.js';
import { AiBusinessDateFormatService } from '../ai/ai-business-date-format.service.js';
import { rescueCheckoutCurrencyIntent } from '../ai/ai-checkout-currency.util.js';
import { rescueStripeCheckoutCurrencyIntent } from '../ai/ai-stripe-checkout-currency.util.js';
import { STRIPE_CHECKOUT_CURRENCY_CLASSIFIER_RULES } from '../ai/ai-stripe-checkout-currency.fixtures.js';
import { rescuePackageCurrencyIntent } from '../ai/ai-package-currency.util.js';
import { rescuePackageDisplayNameIntent } from '../ai/ai-package-display-name.util.js';
import { rescueDiagnoseTourCapacityIntent } from '../ai/ai-tour-capacity.util.js';
import { TOUR_CAPACITY_CLASSIFIER_RULES } from '../ai/ai-tour-capacity.fixtures.js';
import { CHECKOUT_RECOMMENDATIONS_CLASSIFIER_RULES } from '../ai/ai-checkout-recommendations.fixtures.js';
import { rescueTourBookingIntent } from '../ai/ai-tour-booking.util.js';
import { rescueTourDaySlotsIntent } from '../ai/ai-tour-day-slots.util.js';
import { rescueExplainCheckoutRecommendationsIntent } from '../ai/ai-checkout-recommendations.util.js';
import { rescueExplainDataRightsIntent } from '../ai/ai-data-rights.util.js';
import { rescueConsumerClinicTestResultsIntent } from '../ai/ai-consumer-clinic-test-results.util.js';
import { DATA_RIGHTS_CLASSIFIER_RULES } from '../ai/ai-data-rights.fixtures.js';
import { PUBLIC_CLINIC_TEST_RESULTS_CLASSIFIER_APPENDIX } from '../ai/ai-clinic-v2-6.fixtures.js';
import { CONSUMER_CLINIC_TEST_RESULTS_CLASSIFIER_RULES } from '../ai/ai-consumer-clinic-test-results.fixtures.js';
import { AiBusinessComplianceService } from '../ai/ai-business-compliance.service.js';
import { AiConsumerClinicTestResultsService } from '../ai/ai-consumer-clinic-test-results.service.js';
import { AiClinicLabBookingService } from '../ai/ai-clinic-lab-booking.service.js';
import { PUBLIC_CLINIC_LAB_BOOKING_CLASSIFIER_APPENDIX } from '../ai/ai-clinic-lab-booking.fixtures.js';
import { CONSUMER_CLINIC_LAB_BOOKING_CLASSIFIER_RULES } from '../ai/ai-clinic-lab-booking.fixtures.js';
import { rescueConsumerClinicLabBookingIntent } from '../ai/ai-clinic-lab-booking.util.js';
import { rescueExplainClinicBookingIntent } from '../ai/ai-clinic-booking.util.js';
import { CLINIC_BOOKING_CLASSIFIER_RULES } from '../ai/ai-clinic-booking.fixtures.js';
import { BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES } from '../ai/ai-budget-service-discovery.fixtures.js';
import { FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES } from '../ai/ai-flexible-availability.fixtures.js';
import { SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES } from '../ai/ai-service-rank-discovery.fixtures.js';
import { AiClinicBookingService } from '../ai/ai-clinic-booking.service.js';
import { AiBusinessCurrencyService } from '../ai/ai-business-currency.service.js';
import { AiTourServiceService } from '../ai/ai-tour-service.service.js';
import { AiRecommendationProductService } from '../ai/ai-recommendation-product.service.js';
import { AiBusinessLanguagesService } from '../ai/ai-business-languages.service.js';
import { AiPackageLocalizedNamesService } from '../ai/ai-package-localized-names.service.js';
import { PUBLIC_AVAILABILITY_DISAMBIGUATION_RULES } from '../ai/ai-intent-disambiguation.fixtures.js';
import { disambiguateMisclassifiedAvailabilityIntent } from '../ai/ai-intent-disambiguation.util.js';
import { enrichPublicAssistantParamsFromPrompt } from '../ai/ai-intent-heuristics.js';
import { rescueBudgetServiceDiscoveryIntent } from '../ai/ai-budget-service-discovery.util.js';
import { rescueServiceRankFromRecommendSpecialistsIntent } from '../ai/ai-service-rank-discovery.util.js';
import {
  applyBudgetFilterForRecommendSpecialists,
  composePublicListServicesBudgetResponse,
  resolveBudgetConstrainedService,
} from '../ai/ai-budget-list-services.logic.js';
import {
  composePublicListServicesRankResponse,
  resolveListServicesRankLimitFromPrompt,
} from '../ai/ai-rank-list-services.logic.js';
import { resolveServiceRankParam } from '../ai/ai-service-rank-discovery.util.js';
import { isBudgetServiceDiscoveryCompoundPrompt } from '../ai/ai-budget-service-discovery-compound.util.js';
import { isFlexibleAvailabilityBudgetBookCompoundPrompt } from '../ai/ai-flexible-availability-compound.util.js';
import {
  composeAvailabilityNoSlotsSummary,
  composePublicAvailabilityCheckSummary,
  filterPublicProviderSlotsByTimeOfDay,
  mergePublicProviderSlotTimes,
  shouldGroupPublicAvailabilityByWindow,
  applyBudgetFilterForAvailabilityCheck,
  type PublicAvailabilityDayReport,
  type PublicAvailabilityWindowReport,
} from '../ai/ai-flexible-availability-check.logic.js';
import {
  buildAvailabilityBudgetClarifyDetails,
  buildPublicAvailabilityWindowLabelForCheck,
  prepareAvailabilityWindowsForCheck,
  resolveAvailabilityBudgetClarifyMaxPrice,
} from '../ai/ai-flexible-availability-clarify.logic.js';
import { executePublicAssistantCompoundFromSteps } from './public-booking-assistant-compound.logic.js';
import {
  mergePublicAssistantSessionParams,
  serializePublicAssistantDiscoverySessionFields,
} from './public-booking-assistant-session.util.js';
import { AiEventsService } from '../ai/ai-events.service.js';
import { recordMisrouteTelemetry } from '../ai/ai-misroute-telemetry.util.js';
import {
  decomposeDeterministicForSurface,
  isCompoundPrompt,
} from '../ai/intent-decomposition.util.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface PublicAssistantNavigate {
  path:
    | 'professionals'
    | 'services'
    | 'checkout'
    | 'account'
    | 'home'
    | 'profile'
    | 'packages'
    | 'multi/checkout';
  query: Record<string, string>;
}

export interface PublicAssistantResult {
  success: boolean;
  action: string;
  summary: string;
  sessionContext?: Record<string, string | null>;
  navigate?: PublicAssistantNavigate;
  bookingId?: string;
  details?: Record<string, unknown>;
}

export function buildPublicClassifierSchema(): string {
  return `You are a friendly booking assistant for a customer-facing online appointment page.
Classify the user's message and extract ALL parameters needed to execute the request. Return JSON:

{
  "action": "list_providers" | "list_services" | "check_availability" | "recommend_specialists" | "business_info" | "book_appointment" | "booking_help" | "explain_checkout_currency" | "explain_stripe_checkout_currency" | "explain_package_currency" | "explain_booking_languages" | "explain_booking_date_format" | "explain_package_display_name" | "explain_tour_booking" | "explain_tour_day_slots" | "diagnose_tour_capacity" | "explain_checkout_recommendations" | "explain_data_rights" | "explain_clinic_booking" | "list_my_test_results" | "explain_result_status" | "list_my_lab_booking_requests" | "book_lab_collection" | "unknown",
  "params": {
    "employeeName": "string or null — one specialist from the Providers list",
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
    "availabilityWindows": [{"date": "DD/MM/YYYY or null", "weekdays": ["monday", "friday", etc.] or null, "timeOfDay": "morning | afternoon | evening | null", "timeFrom": "HH:MM or null", "timeSlot": "HH:MM or null"}] or null — OR alternatives when user says tomorrow evening OR Friday afternoon; each window scanned independently",
    "bookingFirstAvailable": boolean or null,
    "allProviders": boolean or null — true when any specialist is acceptable",
    "providerFallbackNames": ["string"] or null,
    "fallbackAnyProvider": boolean or null,
    "maxPrice": number or null — inclusive catalog display-price ceiling when the user states a budget (under $X, I have $X, etc.),
    "serviceRank": "highest_price" | "lowest_price" | "most_popular" | null — rank catalog services for list_services (premium/cheapest/popular service, not specialist ratings),
    "customerName": "string or null",
    "customerEmail": "string or null",
    "customerPhone": "string or null"
  },
  "reasoning": "one short sentence"
}

You MUST resolve relative dates yourself using Today's date from context (tomorrow, this week, Monday, next Friday → concrete DD/MM/YYYY or dateFrom/dateTo/weekdays). When the user mentions dates or weekdays in THIS message, set fresh date fields — ignore stale session dates for availability/recommend queries.

Action rules:
- recommend_specialists: best/top/highest-rated/suggested specialists. Set serviceCategory for broad requests ('massage', 'hair') OR serviceName for one service OR serviceNames for an explicit set from the catalog. Set date/dateFrom/dateTo/weekdays for the period. allProviders=true.
- check_availability: open times / who is free. serviceName or serviceCategory as above. allProviders=true unless one specialist is named. Set availabilityWindows when the user lists OR alternatives (tomorrow evening or Friday afternoon). Set weekdays for "Monday and Friday" with the SAME timeOfDay (AND — not OR). Set timeOfDay for morning/afternoon/evening/tonight on single-window prompts.
- list_providers: who works here (not ratings/availability).
- list_services: prices, durations, catalog. Set serviceCategory for type questions ("what massages do you have" → serviceCategory: "massage") to filter service TYPE NAMES containing that keyword; only list matches — no catalog category named massage is required. Set maxPrice when the user states a spending limit. Set serviceRank when they ask for premium/luxury/cheapest/most popular service (catalog rank — not specialist ratings).
- book_appointment: reserve/schedule. bookingFirstAvailable=true for nearest/soonest/next/earliest/ASAP/any specialist — leave timeSlot null. providerFallbackNames + fallbackAnyProvider for "Gevorg at 9, else Mary, else anyone". When the user picks a slot from a prior recommendation (e.g. "book facemassage on Karo at 9:30"), set employeeName, serviceName, timeSlot, and date from that context (including assistant messages in history).
- Check-then-book compound prompts (who is free + book nearest/soonest/ASAP) are executed as multi-step flows automatically — never return book_appointment without timeSlot unless bookingFirstAvailable=true.
- business_info / booking_help: as named.
- explain_checkout_currency: why prices show € / ֏ / ₽ / $ on this booking page; READ only.
- explain_stripe_checkout_currency: why online Stripe checkout charges in € / ֏ / ₽ / $; when stripeCurrencySupported is false use cash/pay-at-venue; READ only.
- explain_package_currency: why package or gift-card totals use business default vs legacy bundled service currency; READ only.
- explain_booking_languages: why the language menu only shows certain locales on this booking page; READ only.
- explain_booking_date_format: why dates show DD/MM vs MM/DD (or ISO) on this booking page; READ only.
${PUBLIC_PACKAGE_DISPLAY_NAME_CLASSIFIER_RULES}

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
${FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES}
${SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES}
${CHECKOUT_CURRENCY_CLASSIFIER_RULES}
${STRIPE_CHECKOUT_CURRENCY_CLASSIFIER_RULES}
${PACKAGE_CURRENCY_CLASSIFIER_RULES}
${BOOKING_LANGUAGES_CLASSIFIER_RULES}
${BOOKING_DATE_FORMAT_CLASSIFIER_RULES}
${TOUR_BOOKING_CLASSIFIER_RULES}
${TOUR_DAY_SLOTS_CLASSIFIER_RULES}
${TOUR_CAPACITY_CLASSIFIER_RULES}
${CHECKOUT_RECOMMENDATIONS_CLASSIFIER_RULES}
${DATA_RIGHTS_CLASSIFIER_RULES}
${CONSUMER_CLINIC_TEST_RESULTS_CLASSIFIER_RULES}
${CONSUMER_CLINIC_LAB_BOOKING_CLASSIFIER_RULES}
${CLINIC_BOOKING_CLASSIFIER_RULES}
${PUBLIC_CLINIC_TEST_RESULTS_CLASSIFIER_APPENDIX}
${PUBLIC_CLINIC_LAB_BOOKING_CLASSIFIER_APPENDIX}

${CLASSIFIER_MULTILINGUAL_RULES}`;
}

@Injectable()
export class PublicBookingAssistantService {
  private readonly logger = new Logger(PublicBookingAssistantService.name);

  constructor(
    private publicBookingService: PublicBookingService,
    private businessService: BusinessService,
    private openAi: OpenAiGatewayService,
    private slotResolver: BookingSlotResolverService,
    private platform: AiPlatformService,
    private aiSettings: AiSettingsService,
    private aiEvents: AiEventsService,
    private businessCurrency: AiBusinessCurrencyService,
    private businessLanguages: AiBusinessLanguagesService,
    private businessDateFormat: AiBusinessDateFormatService,
    private packageLocalizedNames: AiPackageLocalizedNamesService,
    private tourService: AiTourServiceService,
    private recommendationProduct: AiRecommendationProductService,
    private businessCompliance: AiBusinessComplianceService,
    private consumerClinicTestResults: AiConsumerClinicTestResultsService,
    private clinicLabBooking: AiClinicLabBookingService,
    private clinicBooking: AiClinicBookingService,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
  ) {}

  async chat(
    slug: string,
    prompt: string,
    session?: {
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      context?: Record<string, any>;
      locale?: string;
    },
    options?: { recordMetrics?: boolean },
  ): Promise<PublicAssistantResult> {
    const business = await this.businessService.findBySlug(slug);
    const locale = resolveLocale(
      session?.locale,
      resolveLocale(business.settings?.locale, 'en'),
    );
    const aiConfig = await this.aiSettings.getSettings(business.id);
    const businessType = business.settings?.businessType as string | undefined;
    const orchestratedSession = this.platform.enrichPublicSession(
      session?.context,
      businessType,
      aiConfig,
    );

    if (!(await this.openAi.isAvailableForBusiness(business.id))) {
      return {
        success: false,
        action: 'error',
        summary: t(locale, 'assistant.unavailable'),
      };
    }
    const tz = resolveTimezone(business.timezone);
    const todayKey = getDateKeyInTimezone(new Date(), tz);
    const todayDisplay = formatDateDisplay(todayKey, locale);

    const [employees, services] = await Promise.all([
      this.employeeRepo.find({
        where: { businessId: business.id, isActive: true },
        order: { name: 'ASC' },
      }),
      this.serviceRepo.find({
        where: { businessId: business.id, isActive: true },
        order: { name: 'ASC' },
      }),
    ]);

    const contextBlock = `Business: ${business.name}
Today's date: ${todayDisplay} (DD/MM/YYYY; schedule times are shown in 24h HH:mm)
Providers: ${
      employees
        .map((e) => {
          const title = e.metadata?.title || e.metadata?.role;
          return title ? `${e.name} (${title})` : e.name;
        })
        .join(', ') || 'none'
    }
Services: ${services.map((s) => `${s.name} — ${s.durationMinutes} min, ${s.price} ${s.currency}`).join(', ') || 'none'}`;

    const compoundResult = await this.tryExecutePublicCompound(
      slug,
      prompt,
      orchestratedSession,
      employees,
      services,
      locale,
      tz,
      todayKey,
      options,
    );
    if (compoundResult) return compoundResult;

    const parsed = await this.classifyIntent(
      business.id,
      prompt,
      contextBlock,
      session?.history,
      orchestratedSession,
      locale,
    );
    if (!parsed) {
      return {
        success: false,
        action: 'unknown',
        summary: t(locale, 'assistant.unknown'),
      };
    }

    const gateDenied = this.platform.gatePublicAction(parsed.action);
    if (gateDenied) {
      return {
        success: false,
        action: gateDenied.action,
        summary: gateDenied.summary,
      };
    }

    const classifierAction = parsed.action;
    const classifierConfidence =
      typeof parsed.confidence === 'number' ? parsed.confidence : undefined;
    const availabilityFix = disambiguateMisclassifiedAvailabilityIntent(
      'public',
      prompt,
      parsed.action,
      parsed.params ?? {},
    );
    if (availabilityFix) {
      parsed.action = availabilityFix.action;
      parsed.params = {
        ...parsed.params,
        ...availabilityFix.params,
      };
    }

    const packageCurrencyRescue = rescuePackageCurrencyIntent(
      prompt,
      parsed.action,
    );
    if (packageCurrencyRescue) {
      parsed.action = packageCurrencyRescue.action;
    }

    const stripeCheckoutCurrencyRescue = rescueStripeCheckoutCurrencyIntent(
      prompt,
      parsed.action,
    );
    if (stripeCheckoutCurrencyRescue) {
      parsed.action = stripeCheckoutCurrencyRescue.action;
    }

    const tourCapacityRescue = rescueDiagnoseTourCapacityIntent(
      prompt,
      parsed.action,
    );
    if (tourCapacityRescue) {
      parsed.action = tourCapacityRescue.action;
    }

    const checkoutRecommendationsRescue =
      rescueExplainCheckoutRecommendationsIntent(prompt, parsed.action);
    if (checkoutRecommendationsRescue) {
      parsed.action = checkoutRecommendationsRescue.action;
    }

    const tourDaySlotsRescue = rescueTourDaySlotsIntent(prompt, parsed.action);
    if (tourDaySlotsRescue) {
      parsed.action = tourDaySlotsRescue.action;
    }

    const tourBookingRescue = rescueTourBookingIntent(prompt, parsed.action);
    if (tourBookingRescue) {
      parsed.action = tourBookingRescue.action;
    }

    const checkoutCurrencyRescue = rescueCheckoutCurrencyIntent(
      prompt,
      parsed.action,
    );
    if (checkoutCurrencyRescue) {
      parsed.action = checkoutCurrencyRescue.action;
    }

    const packageDisplayNameRescue = rescuePackageDisplayNameIntent(
      prompt,
      parsed.action,
    );
    if (packageDisplayNameRescue) {
      parsed.action = packageDisplayNameRescue.action;
    }

    const bookingLanguagesRescue = rescueBookingLanguagesIntent(
      prompt,
      parsed.action,
    );
    if (bookingLanguagesRescue) {
      parsed.action = bookingLanguagesRescue.action;
    }

    const bookingDateFormatRescue = rescueBookingDateFormatIntent(
      prompt,
      parsed.action,
    );
    if (bookingDateFormatRescue) {
      parsed.action = bookingDateFormatRescue.action;
    }

    const dataRightsRescue = rescueExplainDataRightsIntent(
      prompt,
      parsed.action,
    );
    if (dataRightsRescue) {
      parsed.action = dataRightsRescue.action;
    }

    const consumerClinicResultsRescue = rescueConsumerClinicTestResultsIntent(
      prompt,
      parsed.action,
    );
    if (consumerClinicResultsRescue) {
      parsed.action = consumerClinicResultsRescue.action;
    }

    const consumerClinicLabBookingRescue = rescueConsumerClinicLabBookingIntent(
      prompt,
      parsed.action,
    );
    if (consumerClinicLabBookingRescue) {
      parsed.action = consumerClinicLabBookingRescue.action;
    }

    const clinicBookingRescue = rescueExplainClinicBookingIntent(
      prompt,
      parsed.action,
    );
    if (clinicBookingRescue) {
      parsed.action = clinicBookingRescue.action;
    }

    const budgetDiscoveryRescue = rescueBudgetServiceDiscoveryIntent(
      prompt,
      parsed.action,
      'public',
    );
    if (budgetDiscoveryRescue) {
      parsed.action = budgetDiscoveryRescue.action;
    }

    const rankRecommendRescue = rescueServiceRankFromRecommendSpecialistsIntent(
      prompt,
      parsed.action,
    );
    if (rankRecommendRescue) {
      parsed.action = rankRecommendRescue.action;
    }

    const compoundDecomposition = isCompoundPrompt(prompt)
      ? decomposeDeterministicForSurface('public', prompt)
      : null;
    recordMisrouteTelemetry(this.aiEvents, business.id, {
      surface: 'public',
      prompt,
      classifierAction,
      rescuedAction: parsed.action,
      rescueReason:
        rankRecommendRescue?.rescueReason ??
        budgetDiscoveryRescue?.rescueReason ??
        checkoutCurrencyRescue?.rescueReason ??
        availabilityFix?.rescueReason,
      classifierConfidence,
      compoundStepCount: compoundDecomposition?.steps.length ?? 1,
    });

    parsed.params = this.mergeSessionContext(
      parsed.params,
      orchestratedSession,
      parsed.action,
    );
    parsed.params = enrichPublicAssistantParamsFromPrompt(
      prompt,
      parsed.params ?? {},
      services.map((s) => ({ id: s.id, name: s.name })),
      parsed.action,
    );
    this.normalizeDateParams(parsed.params, todayKey);

    this.logger.log(
      `Public assistant action="${parsed.action}" — ${parsed.reasoning}`,
    );

    let result: PublicAssistantResult;

    switch (parsed.action) {
      case 'list_providers':
        result = await this.handleListProviders(slug, parsed.params, locale);
        break;
      case 'list_services':
        result = await this.handleListServices(
          slug,
          enrichListServicesParamsFromPrompt(prompt, parsed.params ?? {}),
          employees,
          locale,
          prompt,
        );
        break;
      case 'check_availability':
        result = await this.handleCheckAvailability(
          slug,
          parsed.params,
          employees,
          services,
          locale,
          tz,
        );
        break;
      case 'recommend_specialists':
        result = await this.handleRecommendSpecialists(
          slug,
          parsed.params,
          employees,
          services,
          locale,
          tz,
        );
        break;
      case 'business_info':
        result = this.handleBusinessInfo(business);
        break;
      case 'book_appointment':
        result = await this.handleBookAppointment(
          slug,
          parsed.params,
          employees,
          services,
          locale,
          prompt,
        );
        break;
      case 'booking_help':
        result = this.handleBookingHelp(locale);
        break;
      case 'explain_checkout_currency':
        result = await this.handleExplainCheckoutCurrency(business.id);
        break;
      case 'explain_stripe_checkout_currency':
        result = await this.handleExplainStripeCheckoutCurrency(business.id);
        break;
      case 'explain_package_currency':
        result = await this.handleExplainPackageCurrency(business.id);
        break;
      case 'explain_booking_languages':
        result = await this.handleExplainBookingLanguages(business.id, locale);
        break;
      case 'explain_booking_date_format':
        result = await this.handleExplainBookingDateFormat(business.id);
        break;
      case 'explain_package_display_name':
        result = await this.handleExplainPackageDisplayName(
          business.id,
          parsed.params ?? {},
          prompt,
          locale,
        );
        break;
      case 'explain_tour_booking':
        result = await this.handleExplainTourBooking(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_tour_day_slots':
        result = await this.handleExplainTourDaySlots(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'diagnose_tour_capacity':
        result = await this.handleDiagnoseTourCapacity(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_checkout_recommendations':
        result = await this.handleExplainCheckoutRecommendations(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_data_rights':
        result = await this.handleExplainDataRights(business.id, prompt);
        break;
      case 'explain_clinic_booking':
        result = await this.handleExplainClinicBooking(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'list_my_test_results':
        result = await this.handleListMyTestResults(
          business.id,
          {
            ...parsed.params,
            sessionCustomerId:
              orchestratedSession.customerId ??
              parsed.params?.sessionCustomerId,
          },
          prompt,
        );
        break;
      case 'explain_result_status':
        result = await this.handleExplainResultStatus(
          business.id,
          {
            ...parsed.params,
            sessionCustomerId:
              orchestratedSession.customerId ??
              parsed.params?.sessionCustomerId,
            locale,
          },
          prompt,
        );
        break;
      case 'list_my_lab_booking_requests':
        result = await this.handleListMyLabBookingRequests(
          business.id,
          {
            ...parsed.params,
            sessionCustomerId:
              orchestratedSession.customerId ??
              parsed.params?.sessionCustomerId,
          },
          prompt,
        );
        break;
      case 'book_lab_collection':
        result = await this.handleBookLabCollection(
          business.id,
          {
            ...parsed.params,
            sessionCustomerId:
              orchestratedSession.customerId ??
              parsed.params?.sessionCustomerId,
          },
          prompt,
        );
        break;
      default:
        result = {
          success: false,
          action: 'unknown',
          summary: t(locale, 'assistant.helpPrompt'),
        };
    }

    const final = this.attachSession(result, parsed.params, employees, services, locale);
    if (options?.recordMetrics !== false) {
      void this.platform.recordCommandOutcome({
        businessId: business.id,
        result: final as unknown as Record<string, unknown>,
        surface: 'public',
        locationId:
          typeof orchestratedSession.locationId === 'string'
            ? orchestratedSession.locationId
            : undefined,
      });
    }
    return final;
  }

  private async handleListProviders(
    slug: string,
    params: any,
    locale: AppLocale,
  ): Promise<PublicAssistantResult> {
    const { providers } = await this.publicBookingService.getProviders(
      slug,
      params.date,
      locale,
    );
    if (providers.length === 0) {
      return {
        success: true,
        action: 'list_providers',
        summary: t(locale, 'assistant.noSpecialists'),
      };
    }

    const lines = providers.map((p) => {
      const title = p.role ? ` — ${p.role}` : '';
      const slots = p.slots
        .slice(0, 4)
        .map((s) => formatTimeDisplay(s.startTime))
        .join(', ');
      const slotText = slots
        ? p.nearestDateLabel
          ? `${t(locale, 'assistant.nextOn')} ${p.nearestDateLabel}: ${slots}${p.slots.length > 4 ? '…' : ''}`
          : `${t(locale, 'assistant.open')}: ${slots}`
        : t(locale, 'assistant.noUpcomingSlots');
      return `• ${p.name}${title} — ${slotText}`;
    });

    return {
      success: true,
      action: 'list_providers',
      summary: [t(locale, 'assistant.specialistsHeader'), '', ...lines].join(
        '\n',
      ),
      navigate: { path: 'professionals', query: {} },
    };
  }

  private async handleListServices(
    slug: string,
    params: any,
    employees: Employee[],
    locale: AppLocale,
    prompt = '',
  ): Promise<PublicAssistantResult> {
    const employee = params.employeeName
      ? this.fuzzyMatchByName(employees, params.employeeName)
      : undefined;

    const { services: catalog } = await this.publicBookingService.getServices(
      slug,
      employee?.id,
    );
    if (catalog.length === 0) {
      return {
        success: true,
        action: 'list_services',
        summary: employee
          ? `No services listed for ${employee.name} right now.`
          : 'No services are available for online booking at the moment.',
      };
    }

    const hasServiceFilter = !!(
      params.serviceCategory ||
      params.serviceName ||
      (Array.isArray(params.serviceNames) && params.serviceNames.length)
    );
    const matched = hasServiceFilter
      ? resolveServicesFromCatalogParams(catalog, params)
      : catalog;

    if (hasServiceFilter && matched.length === 0) {
      return {
        success: false,
        action: 'list_services',
        summary: t(locale, 'assistant.availabilityServiceNotFound', {
          service: params.serviceCategory ?? params.serviceName,
          available: catalog.map((s) => s.name).join(', '),
        }),
      };
    }

    const catalogRows = matched.map((service) => ({
      id: service.id,
      name: service.name,
      price: service.price,
      currency: service.currency,
      durationMinutes: service.durationMinutes,
      bookingCount: service.bookingCount90d ?? 0,
      ...(service.category?.name ? { serviceCategory: service.category.name } : {}),
      ...(service.isFeatured ? { isFeatured: true } : {}),
      ...(service.serviceTier ? { serviceTier: service.serviceTier } : {}),
    }));

    const serviceRank = resolveServiceRankParam(params.serviceRank);
    const serviceQuery = params.serviceCategory ?? params.serviceName;

    if (serviceRank) {
      const rankLimit = resolveListServicesRankLimitFromPrompt(prompt, params);
      const composed = composePublicListServicesRankResponse({
        matchedServices: catalogRows,
        serviceRank,
        limit: rankLimit,
        maxPrice: params.maxPrice,
        serviceCategory: params.serviceCategory ?? params.serviceName ?? null,
        header: employee ? `Services with ${employee.name}:` : undefined,
      });

      return {
        success: composed.success,
        action: 'list_services',
        summary: composed.summary,
        navigate: composed.navigate,
        sessionContext: {
          serviceId:
            composed.services.length === 1 ? composed.services[0]!.id : null,
          serviceName:
            composed.services.length === 1 ? composed.services[0]!.name : null,
          maxPrice:
            params.maxPrice != null ? String(params.maxPrice) : null,
        },
        details:
          composed.services.length === 1
            ? { serviceId: composed.services[0]!.id }
            : undefined,
      };
    }

    const header = employee
      ? `Services with ${employee.name}:`
      : serviceQuery
        ? `Our ${stripServiceRoleNoise(String(serviceQuery))} service types:`
        : params.maxPrice != null
          ? `Services within your budget:`
          : 'Our service types:';

    const composed = composePublicListServicesBudgetResponse({
      matchedServices: catalogRows,
      maxPrice: params.maxPrice,
      header,
    });

    return {
      success: composed.success,
      action: 'list_services',
      summary: composed.summary,
      navigate: composed.navigate,
      sessionContext: {
        serviceId:
          composed.services.length === 1 ? composed.services[0]!.id : null,
        serviceName:
          composed.services.length === 1 ? composed.services[0]!.name : null,
        maxPrice:
          params.maxPrice != null ? String(params.maxPrice) : null,
      },
      details:
        composed.services.length === 1
          ? { serviceId: composed.services[0]!.id }
          : undefined,
    };
  }

  async executeDeterministicIntent(
    slug: string,
    input: {
      action: string;
      params: Record<string, any>;
      prompt: string;
      session?: Record<string, any>;
      locale?: string;
    },
  ): Promise<PublicAssistantResult> {
    const business = await this.businessService.findBySlug(slug);
    const locale = resolveLocale(
      input.locale,
      resolveLocale(business.settings?.locale, 'en'),
    );
    const tz = resolveTimezone(business.timezone);
    const todayKey = getDateKeyInTimezone(new Date(), tz);
    const orchestratedSession = this.platform.enrichPublicSession(
      input.session,
      business.settings?.businessType as string | undefined,
      await this.aiSettings.getSettings(business.id),
    );
    const [employees, services] = await Promise.all([
      this.employeeRepo.find({
        where: { businessId: business.id, isActive: true },
        order: { name: 'ASC' },
      }),
      this.serviceRepo.find({
        where: { businessId: business.id, isActive: true },
        order: { name: 'ASC' },
      }),
    ]);

    const mergedParams = this.mergeSessionContext(
      enrichPublicAssistantParamsFromPrompt(
        input.prompt,
        input.params ?? {},
        services.map((service) => ({ id: service.id, name: service.name })),
        input.action,
      ),
      orchestratedSession,
      input.action,
    );
    this.normalizeDateParams(mergedParams, todayKey);

    const raw = await this.dispatchCompoundStepAction(
      input.action,
      mergedParams,
      input.prompt,
      slug,
      employees,
      services,
      locale,
      tz,
    );
    return this.attachSession(raw, mergedParams, employees, services, locale);
  }

  private async tryExecutePublicCompound(
    slug: string,
    prompt: string,
    orchestratedSession: Record<string, any>,
    employees: Employee[],
    services: Service[],
    locale: AppLocale,
    tz: string,
    todayKey: string,
    options?: { recordMetrics?: boolean },
  ): Promise<PublicAssistantResult | null> {
    if (
      !isCompoundPrompt(prompt) &&
      !isBudgetServiceDiscoveryCompoundPrompt(prompt) &&
      !isFlexibleAvailabilityBudgetBookCompoundPrompt(prompt)
    ) {
      return null;
    }

    const decomposition = decomposeDeterministicForSurface('public', prompt);
    if (!decomposition || decomposition.steps.length < 2) return null;

    const business = await this.businessService.findBySlug(slug);

    const result = await executePublicAssistantCompoundFromSteps(
      prompt,
      decomposition.steps,
      { ...orchestratedSession },
      {
        runStep: async (action, params, segment) => {
          const enriched = enrichPublicAssistantParamsFromPrompt(
            segment,
            params,
            services.map((service) => ({
              id: service.id,
              name: service.name,
            })),
            action,
          );
          this.normalizeDateParams(enriched, todayKey);
          const raw = await this.dispatchCompoundStepAction(
            action,
            enriched,
            segment,
            slug,
            employees,
            services,
            locale,
            tz,
          );
          return this.attachSession(raw, enriched, employees, services, locale);
        },
      },
    );

    if (options?.recordMetrics !== false) {
      void this.platform.recordCommandOutcome({
        businessId: business.id,
        result: result as unknown as Record<string, unknown>,
        surface: 'public',
        locationId:
          typeof orchestratedSession.locationId === 'string'
            ? orchestratedSession.locationId
            : undefined,
      });
    }

    return result;
  }

  private async dispatchCompoundStepAction(
    action: string,
    params: Record<string, any>,
    prompt: string,
    slug: string,
    employees: Employee[],
    services: Service[],
    locale: AppLocale,
    tz: string,
  ): Promise<PublicAssistantResult> {
    switch (action) {
      case 'list_services':
        return this.handleListServices(
          slug,
          enrichListServicesParamsFromPrompt(prompt, params),
          employees,
          locale,
          prompt,
        );
      case 'check_availability':
        return this.handleCheckAvailability(
          slug,
          params,
          employees,
          services,
          locale,
          tz,
        );
      case 'book_appointment':
        return this.handleBookAppointment(
          slug,
          params,
          employees,
          services,
          locale,
          prompt,
        );
      default:
        return {
          success: false,
          action,
          summary: `Public compound step "${action}" is not supported yet.`,
        };
    }
  }

  private async handleCheckAvailability(
    slug: string,
    params: any,
    employees: Employee[],
    services: Service[],
    locale: AppLocale,
    tz: string,
  ): Promise<PublicAssistantResult> {
    let matchedServices = this.resolveServicesFromParams(params, services);
    const budgetFiltered = applyBudgetFilterForAvailabilityCheck(
      matchedServices.map((service) => ({
        id: service.id,
        name: service.name,
        price: Number(service.price),
        durationMinutes: service.durationMinutes,
      })),
      params.maxPrice,
    );
    if (budgetFiltered.noMatchSummary) {
      const clarifyMaxPrice = resolveAvailabilityBudgetClarifyMaxPrice(
        params.maxPrice,
        budgetFiltered.budgetMax,
      );
      return {
        success: true,
        action: 'check_availability',
        summary: budgetFiltered.noMatchSummary,
        details: clarifyMaxPrice
          ? buildAvailabilityBudgetClarifyDetails(clarifyMaxPrice)
          : { clarify: true, reason: 'budget_no_match' },
      };
    }
    if (budgetFiltered.services.length > 0) {
      matchedServices = budgetFiltered.services.map(
        (entry) => services.find((service) => service.id === entry.id)!,
      );
      if (matchedServices.length === 1) {
        params = {
          ...params,
          serviceId: matchedServices[0]!.id,
          serviceName: matchedServices[0]!.name,
        };
      }
    }

    if (
      (params.serviceName || params.serviceCategory) &&
      matchedServices.length === 0
    ) {
      return {
        success: false,
        action: 'check_availability',
        summary: t(locale, 'assistant.availabilityServiceNotFound', {
          service: params.serviceCategory ?? params.serviceName,
          available: services.map((s) => s.name).join(', '),
        }),
      };
    }

    const targets =
      params.allProviders ||
      (!params.employeeName && !params.employeeNames?.length)
        ? employees
        : resolveEmployees(employees, params);
    if (targets.length === 0) {
      return {
        success: false,
        action: 'check_availability',
        summary: t(locale, 'assistant.availabilityProviderNotFound', {
          name: params.employeeName,
          available: employees.map((e) => e.name).join(', '),
        }),
      };
    }

    let availabilityWindows = resolvePublicAvailabilityWindows(
      params,
      undefined,
      tz,
    );
    const todayKey = getDateKeyInTimezone(new Date(), tz);
    const preparedWindows = prepareAvailabilityWindowsForCheck({
      windows: availabilityWindows,
      locale,
      timeZone: tz,
      todayDateKey: todayKey,
    });
    availabilityWindows = preparedWindows.windows;
    const overlapClarifyNote = preparedWindows.overlapClarifyNote;
    const windowOverlap = preparedWindows.overlap;
    if (availabilityWindows.length === 0 && matchedServices.length > 0) {
      const defaultDateKeys = Array.from(
        { length: PUBLIC_AVAILABILITY_SCAN_DAYS },
        (_, offset) => addDaysToDateKey(todayKey, offset, tz),
      );
      availabilityWindows = [
        {
          dateKeys: defaultDateKeys,
          timeOfDay: params.timeOfDay ?? null,
          timeFrom: params.timeFrom ?? null,
          timeTo: params.timeTo ?? null,
          timeSlot: params.timeSlot ?? null,
        },
      ];
    }

    const allDateKeys = [
      ...new Set(availabilityWindows.flatMap((window) => window.dateKeys)),
    ];
    if (allDateKeys.length === 0) {
      return {
        success: true,
        action: 'check_availability',
        summary: matchedServices.length
          ? t(locale, 'assistant.availabilityNeedsDay', {
              service: inferServiceGroupLabel(
                matchedServices,
                params.serviceCategory ?? params.serviceName,
              ),
            })
          : t(locale, 'assistant.availabilityNeedsDayOrService'),
      };
    }

    const groupByWindow = shouldGroupPublicAvailabilityByWindow(
      availabilityWindows,
      params,
    );
    const windowReports: PublicAvailabilityWindowReport[] = [];
    const flatDayReports: PublicAvailabilityDayReport[] = [];
    let bestNavigate: { employeeId: string; startTime: string } | undefined;

    for (const window of availabilityWindows) {
      const dayReports: PublicAvailabilityDayReport[] = [];
      const notBeforeTime = window.timeFrom ?? params.timeFrom ?? null;

      for (const dateKey of window.dateKeys) {
        const providersForDay: PublicAvailabilityDayReport['providers'] = [];

        for (const employee of targets) {
          const serviceIds =
            matchedServices.length > 0
              ? matchedServices
                  .filter(
                    (s) =>
                      !employee.serviceIds?.length ||
                      employee.serviceIds.includes(s.id),
                  )
                  .map((s) => s.id)
              : [undefined];

          for (const serviceId of serviceIds) {
            if (
              serviceId &&
              employee.serviceIds?.length &&
              !employee.serviceIds.includes(serviceId)
            ) {
              continue;
            }

            const { slots: rawSlots } =
              await this.publicBookingService.getProviderSlots(
                slug,
                employee.id,
                dateKey,
                {
                  serviceId,
                  notBeforeTime,
                },
              );
            const slots = filterPublicProviderSlotsByTimeOfDay(
              rawSlots,
              window.timeOfDay,
            );
            if (slots.length === 0) continue;

            mergePublicProviderSlotTimes({
              providers: providersForDay,
              employeeId: employee.id,
              employeeName: employee.name,
              slots,
            });

            if (!bestNavigate || slots[0]!.startTime < bestNavigate.startTime) {
              bestNavigate = {
                employeeId: employee.id,
                startTime: slots[0]!.startTime,
              };
            }
          }
        }

        if (providersForDay.length > 0) {
          const dayReport = { dateKey, providers: providersForDay };
          dayReports.push(dayReport);
          flatDayReports.push(dayReport);
        }
      }

      if (groupByWindow) {
        windowReports.push({
          label: buildPublicAvailabilityWindowLabelForCheck({
            window,
            overlap: windowOverlap,
            locale,
            timeZone: tz,
            todayDateKey: todayKey,
          }),
          dayReports,
        });
      }
    }

    const serviceLabel =
      matchedServices.length > 0
        ? inferServiceGroupLabel(
            matchedServices,
            params.serviceCategory ?? params.serviceName,
          )
        : t(locale, 'assistant.anyService');
    const dayCount = allDateKeys.length;

    if (flatDayReports.length === 0) {
      const providerLabel =
        targets.length === 1
          ? targets[0].name
          : t(locale, 'assistant.anySpecialist');
      const summary = composeAvailabilityNoSlotsSummary({
        locale,
        serviceLabel,
        providerLabel,
        daysLabel:
          dayCount === 1
            ? formatDateDisplay(allDateKeys[0], locale)
            : String(dayCount),
        maxPrice: params.maxPrice,
      });
      return this.withCheckProvidersHandoff(
        {
          success: true,
          action: 'check_availability',
          summary,
          navigate:
            targets.length === 1
              ? { path: 'professionals', query: { employeeId: targets[0].id } }
              : { path: 'professionals', query: {} },
        },
        this.buildPublicAvailabilityHandoff(
          summary,
          params,
          [],
          true,
          allDateKeys[0],
        ),
      );
    }

    const navigateQuery: Record<string, string> = {};
    if (bestNavigate) {
      navigateQuery.employeeId = bestNavigate.employeeId;
      navigateQuery.startTime = bestNavigate.startTime;
    } else if (targets.length === 1) {
      navigateQuery.employeeId = targets[0].id;
    }
    if (matchedServices.length === 1)
      navigateQuery.serviceId = matchedServices[0].id;

    const summary = composePublicAvailabilityCheckSummary({
      serviceLabel,
      locale,
      timeZone: tz,
      singleProvider: targets.length === 1,
      groupByWindow,
      windowReports,
      flatDayReports,
      totalDayCount: dayCount,
      maxPrice: params.maxPrice,
      overlapClarifyNote,
    });
    const availableProviders = [
      ...new Set(
        flatDayReports.flatMap((day) =>
          day.providers.map((provider) => provider.employeeName),
        ),
      ),
    ];

    return this.withCheckProvidersHandoff(
      {
        success: true,
        action: 'check_availability',
        summary,
        navigate: {
          path: bestNavigate ? 'services' : 'professionals',
          query: navigateQuery,
        },
      },
      this.buildPublicAvailabilityHandoff(
        summary,
        params,
        availableProviders,
        false,
        flatDayReports[0]?.dateKey,
      ),
    );
  }

  private async handleRecommendSpecialists(
    slug: string,
    params: any,
    employees: Employee[],
    services: Service[],
    locale: AppLocale,
    tz: string,
  ): Promise<PublicAssistantResult> {
    const matchedServices = this.resolveServicesFromParams(params, services);

    if (
      (params.serviceName || params.serviceCategory) &&
      matchedServices.length === 0
    ) {
      return {
        success: false,
        action: 'recommend_specialists',
        summary: t(locale, 'assistant.availabilityServiceNotFound', {
          service: params.serviceCategory ?? params.serviceName,
          available: services.map((s) => s.name).join(', '),
        }),
      };
    }

    if (matchedServices.length === 0) {
      return {
        success: true,
        action: 'recommend_specialists',
        summary: t(locale, 'assistant.recommendNeedsService', {
          services: services.map((s) => s.name).join(', '),
        }),
      };
    }

    const budgetRecommend = applyBudgetFilterForRecommendSpecialists(
      matchedServices.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        durationMinutes: service.durationMinutes,
      })),
      params.maxPrice,
    );
    if (budgetRecommend.noMatchSummary) {
      return {
        success: true,
        action: 'recommend_specialists',
        summary: budgetRecommend.noMatchSummary,
      };
    }

    const filteredServiceIds = new Set(
      budgetRecommend.services.map((service) => service.id),
    );
    const filteredServices = matchedServices.filter((service) =>
      filteredServiceIds.has(service.id),
    );

    const serviceLabel = inferServiceGroupLabel(
      filteredServices,
      params.serviceCategory ?? params.serviceName,
    );
    const multiService = filteredServices.length > 1;

    let dateKeys = resolvePublicAvailabilityDateKeys(params, undefined, tz);
    if (dateKeys.length === 0) {
      const todayKey = getDateKeyInTimezone(new Date(), tz);
      dateKeys = Array.from(
        { length: PUBLIC_AVAILABILITY_SCAN_DAYS },
        (_, offset) => addDaysToDateKey(todayKey, offset, tz),
      );
    }

    const { providers } = await this.publicBookingService.recommendProviders(
      slug,
      {
        serviceIds: filteredServices.map((s) => s.id),
        dateKeys,
        notBeforeTime: params.timeFrom ?? null,
        limit: 5,
      },
    );

    const periodLabel =
      dateKeys.length === 1
        ? formatDateDisplay(dateKeys[0], locale)
        : t(locale, 'assistant.recommendPeriodDays', {
            count: dateKeys.length,
          });

    if (providers.length === 0) {
      return {
        success: true,
        action: 'recommend_specialists',
        summary: t(locale, 'assistant.recommendNoMatches', {
          service: serviceLabel,
          period: periodLabel,
        }),
        navigate: { path: 'professionals', query: {} },
      };
    }

    const lines: string[] = [
      t(locale, 'assistant.recommendHeader', {
        service: serviceLabel,
        period: periodLabel,
      }),
      '',
    ];

    providers.forEach((provider, index) => {
      const ratingLabel = this.formatProviderRating(
        provider.averageRating,
        provider.reviewCount,
        locale,
      );
      const role = provider.role ? ` (${provider.role})` : '';
      const dayLabel = formatDateDisplay(provider.earliestDateKey, locale);
      const times = provider.previewTimes.join(', ');
      const serviceNote =
        multiService && provider.matchedServiceName
          ? t(locale, 'assistant.recommendServiceNote', {
              service: provider.matchedServiceName,
            })
          : '';
      lines.push(
        t(locale, 'assistant.recommendLine', {
          rank: index + 1,
          name: provider.name,
          role,
          rating: ratingLabel,
          service: serviceNote,
          date: dayLabel,
          times,
        }),
      );
    });

    const top = providers[0];
    const navigateQuery: Record<string, string> = {
      employeeId: top.id,
      startTime: top.earliestStartTime,
      serviceId: top.matchedServiceId,
    };

    return {
      success: true,
      action: 'recommend_specialists',
      summary: lines.join('\n'),
      navigate: { path: 'services', query: navigateQuery },
    };
  }

  private async resolveBookableStartTime(
    slug: string,
    employee: Employee,
    service: Service,
    params: { date?: string; timeSlot?: string; startTime?: string },
    tz: string,
  ): Promise<{ dateKey: string; startTime: string; timeSlot: string } | null> {
    if (params.startTime?.includes('T')) {
      const dateKey = params.startTime.split('T')[0];
      return {
        dateKey,
        startTime: params.startTime,
        timeSlot: formatTimeDisplay(params.startTime),
      };
    }

    if (params.date && params.timeSlot) {
      const dateKey = toIsoDay(params.date, tz);
      const timeSlot = this.snapTo10min(params.timeSlot);
      return {
        dateKey,
        startTime: `${dateKey}T${timeSlot}:00.000Z`,
        timeSlot,
      };
    }

    if (!params.timeSlot) return null;

    const timeSlot = this.snapTo10min(params.timeSlot);
    const scanFrom = params.date
      ? toIsoDay(params.date, tz)
      : getDateKeyInTimezone(new Date(), tz);

    for (let offset = 0; offset < PUBLIC_AVAILABILITY_SCAN_DAYS; offset++) {
      const dateKey = addDaysToDateKey(scanFrom, offset, tz);
      const { slots } = await this.publicBookingService.getProviderSlots(
        slug,
        employee.id,
        dateKey,
        {
          serviceId: service.id,
        },
      );
      const hit = slots.find(
        (s) => formatTimeDisplay(s.startTime) === timeSlot,
      );
      if (hit) {
        return { dateKey, startTime: hit.startTime, timeSlot };
      }
    }

    return null;
  }

  private resolveServicesFromParams(
    params: Record<string, any>,
    catalog: Service[],
  ): Service[] {
    return resolveServicesFromCatalogParams(catalog, params);
  }

  private formatProviderRating(
    averageRating: number | null,
    reviewCount: number,
    locale: AppLocale,
  ): string {
    if (averageRating == null || reviewCount === 0) {
      return t(locale, 'assistant.recommendNoReviews');
    }
    return t(locale, 'assistant.recommendRating', {
      rating: averageRating.toFixed(1),
      count: reviewCount,
    });
  }

  private async handleExplainBookingLanguages(
    businessId: string,
    visitorLocale: AppLocale,
  ): Promise<PublicAssistantResult> {
    const result = await this.businessLanguages.handleExplainBookingLanguages(
      businessId,
      visitorLocale,
    );
    return {
      success: result.success,
      action: result.action ?? 'explain_booking_languages',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainBookingDateFormat(
    businessId: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.businessDateFormat.handleExplainBookingDateFormat(businessId);
    return {
      success: result.success,
      action: result.action ?? 'explain_booking_date_format',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainCheckoutCurrency(
    businessId: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.businessCurrency.handleExplainCheckoutCurrency(businessId);
    return {
      success: result.success,
      action: result.action ?? 'explain_checkout_currency',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainDataRights(
    businessId: string,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.businessCompliance.handleExplainDataRights(
      businessId,
      { _prompt: prompt },
      prompt,
    );
    const aspect = result.details?.aspect;
    const navigate =
      aspect === 'export' || aspect === 'delete'
        ? { path: 'account' as const, query: { section: 'privacy' } }
        : undefined;

    return {
      success: result.success,
      action: result.action ?? 'explain_data_rights',
      summary: result.summary,
      details: result.details,
      navigate,
    };
  }

  private async handleListMyTestResults(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.consumerClinicTestResults.handleListMyTestResults(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'list_my_test_results',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainResultStatus(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.consumerClinicTestResults.handleExplainResultStatus(
        businessId,
        params,
        prompt,
      );
    return {
      success: result.success,
      action: result.action ?? 'explain_result_status',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleListMyLabBookingRequests(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.clinicLabBooking.handleListMyLabBookingRequests(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'list_my_lab_booking_requests',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleBookLabCollection(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.clinicLabBooking.handleBookLabCollection(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'book_lab_collection',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainStripeCheckoutCurrency(
    businessId: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.businessCurrency.handleExplainStripeCheckoutCurrency(
        businessId,
      );
    return {
      success: result.success,
      action: result.action ?? 'explain_stripe_checkout_currency',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainPackageCurrency(
    businessId: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.businessCurrency.handleExplainPackageCurrency(businessId);
    return {
      success: result.success,
      action: result.action ?? 'explain_package_currency',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainPackageDisplayName(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
    visitorLocale: AppLocale,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.packageLocalizedNames.handleExplainPackageDisplayName(
        businessId,
        params,
        prompt,
        visitorLocale,
      );
    return {
      success: result.success,
      action: result.action ?? 'explain_package_display_name',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainTourBooking(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.tourService.handleExplainTourBooking(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'explain_tour_booking',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainClinicBooking(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.clinicBooking.handleExplainClinicBooking(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'explain_clinic_booking',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainTourDaySlots(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.tourService.handleExplainTourDaySlots(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'explain_tour_day_slots',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleDiagnoseTourCapacity(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.tourService.handleDiagnoseTourCapacity(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'diagnose_tour_capacity',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainCheckoutRecommendations(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.recommendationProduct.handleExplainCheckoutRecommendations(
        businessId,
        params,
        prompt,
      );
    return {
      success: result.success,
      action: result.action ?? 'explain_checkout_recommendations',
      summary: result.summary,
      details: result.details,
    };
  }

  private handleBusinessInfo(business: {
    name: string;
    description?: string;
    phone?: string;
    email?: string;
    address?: string;
  }): PublicAssistantResult {
    const parts = [`${business.name}`];
    if (business.description) parts.push(business.description);
    if (business.address) parts.push(`Address: ${business.address}`);
    if (business.phone) parts.push(`Phone: ${business.phone}`);
    if (business.email) parts.push(`Email: ${business.email}`);

    return {
      success: true,
      action: 'business_info',
      summary: parts.join('\n'),
      navigate: { path: 'profile', query: {} },
    };
  }

  private handleBookingHelp(locale: AppLocale): PublicAssistantResult {
    const steps =
      locale === 'hy'
        ? [
            'Առցանց ամրագրումը հեշտ է՝',
            '1. Ընտրեք մասնագետ և ժամ',
            '2. Ընտրեք ծառայություն',
            '3. Մուտքագրեք անուն և կոնտակտ',
            '',
            'Կամ ասեք, թե ինչ է պետք — օրինակ «Ամրագրիր facemassage Gevorg-ի հետ վաղը 10:00» — և ես կօգնեմ։',
          ]
        : locale === 'ru'
          ? [
              'Онлайн-запись проста:',
              '1. Выберите специалиста и время',
              '2. Выберите услугу',
              '3. Укажите имя и контакт',
              '',
              'Или скажите, что нужно — например «Запиши facemassage с Gevorg на завтра в 10:00» — и я помогу.',
            ]
          : [
              'Booking online is easy:',
              '1. Choose a specialist and time',
              '2. Pick a service',
              '3. Enter your name and contact details',
              '',
              'Or tell me what you need — e.g. "Book facemassage with Gevorg tomorrow at 10:00", "Best rated specialists for massage this week", or "Free slots on Monday and Friday for haircut" — and I\'ll guide you.',
            ];

    return {
      success: true,
      action: 'booking_help',
      summary: steps.join('\n'),
      navigate: { path: 'professionals', query: {} },
    };
  }

  private async handleBookAppointment(
    slug: string,
    params: any,
    employees: Employee[],
    services: Service[],
    locale: AppLocale,
    prompt = '',
  ): Promise<PublicAssistantResult> {
    const business = await this.publicBookingService.resolveBusiness(slug);
    const tz = resolveTimezone(business.timezone);

    const employee = params.employeeName
      ? this.fuzzyMatchByName(employees, params.employeeName)
      : params.employeeId
        ? employees.find((e) => e.id === params.employeeId)
        : undefined;

    const matchedServices = this.resolveServicesFromParams(params, services);
    const catalogPool =
      matchedServices.length > 0
        ? matchedServices.map((entry) => ({
            id: entry.id,
            name: entry.name,
            price: Number(entry.price),
            durationMinutes: entry.durationMinutes,
          }))
        : services.map((entry) => ({
            id: entry.id,
            name: entry.name,
            price: Number(entry.price),
            durationMinutes: entry.durationMinutes,
          }));
    const budgetResolved = resolveBudgetConstrainedService(catalogPool, {
      serviceId: params.serviceId,
      serviceName: params.serviceName,
      serviceCategory: params.serviceCategory,
      maxPrice: params.maxPrice,
    });
    if (budgetResolved.noMatchSummary) {
      return {
        success: false,
        action: 'book_appointment',
        summary: budgetResolved.noMatchSummary,
      };
    }
    const service = budgetResolved.service
      ? services.find((entry) => entry.id === budgetResolved.service!.id)
      : undefined;

    if (params.employeeName && !employee) {
      return {
        success: false,
        action: 'book_appointment',
        summary: `Specialist "${params.employeeName}" not found. Available: ${employees.map((e) => e.name).join(', ')}`,
      };
    }

    if ((params.serviceName || params.serviceCategory) && !service) {
      return {
        success: false,
        action: 'book_appointment',
        summary: `Service "${params.serviceCategory ?? params.serviceName}" not found. Available: ${services.map((s) => s.name).join(', ')}`,
      };
    }

    if (params.bookingFirstAvailable) {
      if (!service) {
        return {
          success: false,
          action: 'book_appointment',
          summary: t(locale, 'assistant.nearestNeedsService'),
        };
      }

      const slotQuery = buildNearestBookableSlotQuery(
        params,
        prompt,
        employee?.id ?? null,
      );
      const windowQueries = buildNearestAvailabilityWindowQueries(
        params,
        prompt,
        tz,
      );

      const nearestResult =
        await this.publicBookingService.findNearestBookableSlotAcrossWindows(
          slug,
          {
            serviceId: service.id,
            employeeId: slotQuery.employeeId,
            windows: windowQueries,
          },
        );

      if (!nearestResult) {
        const summary =
          locale === 'en'
            ? buildNoNearestSlotMessage({
                serviceName: service.name,
                dateKey: slotQuery.startDateKey,
                timeOfDay: slotQuery.timeOfDay,
                notBeforeTime: slotQuery.notBeforeTime,
              })
            : t(locale, 'assistant.noNearestSlot', {
                service: service.name,
                after: slotQuery.notBeforeTime
                  ? ` after ${slotQuery.notBeforeTime}`
                  : '',
              });
        return this.withBookAppointmentHandoff(
          {
            success: false,
            action: 'book_appointment',
            summary,
          },
          params,
        );
      }

      Object.assign(
        params,
        applyChosenAvailabilityWindowToParams(params, nearestResult),
      );
    }

    const wantsProviderFallback =
      !params.bookingFirstAvailable &&
      !!params.date &&
      !!params.timeSlot &&
      (params.fallbackAnyProvider === true ||
        (Array.isArray(params.providerFallbackNames) &&
          params.providerFallbackNames.length > 0));

    if (wantsProviderFallback && service) {
      const isoDay = toIsoDay(params.date, tz);
      const priorityNames: string[] = Array.isArray(
        params.providerFallbackNames,
      )
        ? params.providerFallbackNames
        : employee
          ? [employee.name]
          : [];

      const providerPriority = priorityNames
        .map((name) => this.fuzzyMatchByName(employees, name))
        .filter((e): e is Employee => !!e)
        .map((e) => ({ id: e.id, name: e.name }));

      const pick = await this.slotResolver.resolveWithFallback({
        businessId: business.id,
        serviceId: service.id,
        isoDay,
        timeSlot: params.timeSlot,
        timeZone: tz,
        providerPriority,
        fallbackAnyProvider: params.fallbackAnyProvider === true,
        allActiveProviders: employees.map((e) => ({ id: e.id, name: e.name })),
      });

      if (!pick) {
        const tried =
          providerPriority.map((p) => p.name).join(', ') ||
          'requested specialists';
        return {
          success: false,
          action: 'book_appointment',
          summary: `Sorry — no one is available for ${service.name} at ${this.snapTo10min(params.timeSlot)} on ${formatDateDisplay(isoDay, locale)}. We tried: ${tried}${
            params.fallbackAnyProvider ? ' and other specialists' : ''
          }.`,
        };
      }

      params.employeeId = pick.employeeId;
      params.employeeName = pick.employeeName;
      params.timeSlot = pick.timeSlot;
      params.date = pick.isoDay;
      params.startTime = pick.startTime;
    }

    const resolvedEmployee =
      employee ??
      (params.employeeId
        ? employees.find((e) => e.id === params.employeeId)
        : params.employeeName
          ? this.fuzzyMatchByName(employees, params.employeeName)
          : undefined);
    const resolvedService = service;

    if (
      !params.bookingFirstAvailable &&
      resolvedEmployee &&
      resolvedService &&
      params.timeSlot &&
      !params.date &&
      !params.startTime
    ) {
      const resolved = await this.resolveBookableStartTime(
        slug,
        resolvedEmployee,
        resolvedService,
        params,
        tz,
      );
      if (resolved) {
        params.date = resolved.dateKey;
        params.timeSlot = resolved.timeSlot;
        params.startTime = resolved.startTime;
      }
    }

    const missing: string[] = [];
    if (!resolvedEmployee) missing.push('specialist');
    if (!resolvedService) missing.push('service');
    if (!params.bookingFirstAvailable && !params.date) missing.push('date');
    if (!params.bookingFirstAvailable && !params.timeSlot) missing.push('time');

    if (
      missing.length > 0 ||
      !resolvedEmployee ||
      !resolvedService ||
      (!params.bookingFirstAvailable && (!params.date || !params.timeSlot))
    ) {
      const navigateQuery: Record<string, string> = {};
      if (resolvedEmployee) navigateQuery.employeeId = resolvedEmployee.id;
      if (resolvedService) navigateQuery.serviceId = resolvedService.id;
      if (params.date && params.timeSlot) {
        navigateQuery.startTime = `${params.date}T${this.snapTo10min(params.timeSlot)}:00.000Z`;
      } else if (resolvedEmployee && params.date) {
        const { slots } = await this.publicBookingService.getProviderSlots(
          slug,
          resolvedEmployee.id,
          params.date,
          resolvedService ? { serviceId: resolvedService.id } : undefined,
        );
        if (slots[0]) navigateQuery.startTime = slots[0].startTime;
      }

      const canCheckout =
        !!navigateQuery.employeeId &&
        !!navigateQuery.startTime &&
        !!navigateQuery.serviceId;

      return {
        success: false,
        action: 'book_appointment',
        summary: `To finish booking I still need: ${missing.join(', ') || 'a valid time slot'}. You can also continue in the booking flow — I've pre-filled what I could.`,
        navigate: {
          path: canCheckout
            ? 'checkout'
            : navigateQuery.startTime
              ? 'services'
              : 'professionals',
          query: navigateQuery,
        },
      };
    }

    const snappedTime = this.snapTo10min(params.timeSlot);
    const startTime =
      params.startTime ?? `${params.date}T${snappedTime}:00.000Z`;

    const { services: slotServices } =
      await this.publicBookingService.getServicesForSlot(
        slug,
        resolvedEmployee.id,
        startTime,
      );
    const fits = slotServices.some((s) => s.id === resolvedService.id);
    if (!fits) {
      const fit = await this.publicBookingService.explainServiceSlotFit(
        slug,
        resolvedEmployee.id,
        startTime,
        resolvedService.id,
      );
      const summary = this.buildServiceUnfitSummary(
        resolvedService,
        resolvedEmployee,
        params.date,
        snappedTime,
        slotServices,
        fit,
        locale,
      );
      return {
        success: false,
        action: 'book_appointment',
        summary,
        navigate: {
          path: 'services',
          query: { employeeId: resolvedEmployee.id, startTime },
        },
      };
    }

    const hasContact = params.customerEmail || params.customerPhone;
    if (!params.customerName || !hasContact) {
      return this.withBookAppointmentHandoff(
        {
          success: true,
          action: 'book_appointment',
          summary: `Great — ${resolvedService.name} with ${resolvedEmployee.name} on ${formatDateDisplay(params.date, locale)} at ${snappedTime}. Please add your name and email or phone on the checkout screen to confirm.`,
          navigate: {
            path: 'checkout',
            query: {
              employeeId: resolvedEmployee.id,
              startTime,
              serviceId: resolvedService.id,
            },
          },
        },
        params,
      );
    }

    const dto: CreatePublicBookingDto = {
      employeeId: resolvedEmployee.id,
      serviceId: resolvedService.id,
      startTime,
      customer: {
        name: params.customerName,
        email: params.customerEmail || undefined,
        phone: params.customerPhone || undefined,
      },
      notes: params.notes || undefined,
    };

    try {
      const { booking } = await this.publicBookingService.createBooking(
        slug,
        dto,
      );
      const bookingId = (booking as any)?.id;
      const range = formatTimeRangeDisplay(
        startTime,
        new Date(
          new Date(startTime).getTime() +
            (resolvedService.durationMinutes + resolvedService.bufferMinutes) *
              60000,
        ),
      );

      return this.withBookAppointmentHandoff(
        {
          success: true,
          action: 'book_appointment',
          summary: `You're booked! ${resolvedService.name} with ${resolvedEmployee.name} on ${formatDateDisplay(params.date, locale)} (${range}).`,
          bookingId,
        },
        params,
      );
    } catch (err: any) {
      return this.withBookAppointmentHandoff(
        {
          success: false,
          action: 'book_appointment',
          summary:
            err?.message ||
            'That slot is no longer available. Please pick another time.',
          navigate: {
            path: 'professionals',
            query: { employeeId: resolvedEmployee.id, startTime },
          },
        },
        params,
      );
    }
  }

  private async classifyIntent(
    businessId: string,
    prompt: string,
    context: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    sessionContext?: Record<string, any>,
    locale: AppLocale = 'en',
  ) {
    const sessionBlock =
      sessionContext &&
      Object.values(sessionContext).some((v) => v != null && v !== '')
        ? `\nActive session:\n${JSON.stringify(sessionContext, null, 2)}`
        : '';

    const historyMessages = (history ?? []).slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `${buildPublicClassifierSchema()}\n\n${localeLanguageInstruction(locale)}\n\n${context}${sessionBlock}`,
      },
      ...historyMessages,
      { role: 'user', content: prompt },
    ];

    const response = await this.openAi.chatCompletion(
      {
        businessId,
        surface: 'public_booking',
        operation: 'classify_intent',
        actorType: 'customer',
      },
      {
        messages,
        responseFormat: 'json_object',
        temperature: 0.2,
        maxTokens: 650,
      },
    );

    const raw = response?.choices[0]?.message?.content;
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (err: any) {
      this.logger.error(
        `Public assistant classification parse failed: ${err.message}`,
      );
      return null;
    }
  }

  private buildPublicAvailabilityHandoff(
    summary: string,
    params: Record<string, any>,
    availableProviders: string[],
    noProviders: boolean,
    dateKey?: string,
  ): CheckProvidersHandoff {
    return {
      summary,
      serviceName: params.serviceName ?? params.serviceCategory ?? undefined,
      date: dateKey ?? params.date,
      timeOfDay: params.timeOfDay ?? null,
      notBeforeTime: params.timeFrom ?? null,
      availableProviders,
      noProviders,
    };
  }

  private withCheckProvidersHandoff(
    result: PublicAssistantResult,
    handoff: CheckProvidersHandoff,
  ): PublicAssistantResult {
    return {
      ...result,
      details: attachCheckProvidersHandoff(result.details ?? {}, handoff),
    };
  }

  private withBookAppointmentHandoff(
    result: PublicAssistantResult,
    params: Record<string, any>,
  ): PublicAssistantResult {
    const handoff = pickCheckProvidersHandoff(params);
    if (!handoff) return result;
    return {
      ...result,
      details: attachCheckProvidersHandoff(result.details ?? {}, handoff),
    };
  }

  private mergeSessionContext(
    params: Record<string, any>,
    session?: Record<string, any>,
    action?: string,
  ) {
    return mergePublicAssistantSessionParams(params, session, action) as Record<
      string,
      any
    >;
  }

  private buildServiceUnfitSummary(
    service: Service,
    employee: Employee,
    date: string,
    time: string,
    slotServices: Array<{
      name: string;
      durationMinutes: number;
      bufferMinutes: number;
    }>,
    fit: {
      requiredMinutes?: number;
      remainingMinutes?: number;
      availableUntil?: Date;
      failureReason?: string;
      message?: string;
    },
    locale: AppLocale,
  ): string {
    const dateStr = formatDateDisplay(date, locale);
    const lines: string[] = [
      `${service.name} isn't available at ${time} on ${dateStr}.`,
    ];

    const required =
      fit.requiredMinutes ?? service.durationMinutes + service.bufferMinutes;
    const remaining = fit.remainingMinutes;
    const until = fit.availableUntil
      ? formatTimeDisplay(fit.availableUntil)
      : null;

    if (
      (fit.failureReason === 'duration' ||
        fit.failureReason === 'service_period') &&
      until &&
      remaining !== undefined &&
      remaining < required
    ) {
      lines.push(
        `${employee.name} is only available until ${until} — that leaves ${remaining} minutes from ${time}, but ${service.name} needs ${required} minutes.`,
      );
    } else if (fit.failureReason === 'service_restriction') {
      lines.push(
        `${employee.name} does not offer ${service.name} during the entire time window starting at ${time}.`,
      );
    } else if (fit.message) {
      lines.push(fit.message);
    }

    if (slotServices.length > 0) {
      const list = slotServices
        .map((s) => `${s.name} (${s.durationMinutes + s.bufferMinutes} min)`)
        .join(', ');
      lines.push(`Services you can book at that time: ${list}.`);
      if (remaining !== undefined && remaining < required) {
        lines.push(
          `Try an earlier start time so the full ${required}-minute appointment fits, or choose one of the shorter services above.`,
        );
      }
    } else {
      lines.push(
        'No services fit that time slot. Please choose a different time.',
      );
    }

    return lines.join('\n');
  }

  private normalizeDateParams(
    params: Record<string, any>,
    fallbackDateKey: string,
  ) {
    if (params.date) {
      params.date = toIsoDay(params.date) ?? fallbackDateKey;
    }
    if (params.dateFrom) {
      params.dateFrom = toIsoDay(params.dateFrom) ?? params.dateFrom;
    }
    if (params.dateTo) {
      params.dateTo = toIsoDay(params.dateTo) ?? params.dateTo;
    }
  }

  private attachSession(
    result: PublicAssistantResult,
    params: Record<string, any>,
    employees: Employee[],
    services: Service[],
    locale: AppLocale,
  ): PublicAssistantResult {
    const employee = params.employeeName
      ? this.fuzzyMatchByName(employees, params.employeeName)
      : undefined;

    const handoff = result.details?.checkProvidersHandoff as
      | CheckProvidersHandoff
      | undefined;

    const sessionService = resolvePublicAssistantSessionServiceFields(
      params,
      services,
    );

    return {
      ...result,
      sessionContext: {
        employeeName: employee?.name ?? params.employeeName ?? null,
        date: params.date ? formatDateDisplay(params.date, locale) : null,
        serviceName: sessionService.serviceName,
        serviceCategory: sessionService.serviceCategory,
        serviceId:
          (result.sessionContext?.serviceId as string | null | undefined) ??
          (typeof params.serviceId === 'string' ? params.serviceId : null),
        ...serializePublicAssistantDiscoverySessionFields({
          ...params,
          timeOfDay:
            (params.timeOfDay as string | undefined) ??
            handoff?.timeOfDay ??
            undefined,
        }),
        timeSlot: params.timeSlot ?? null,
        customerName: params.customerName ?? null,
        customerEmail: params.customerEmail ?? null,
        customerPhone: params.customerPhone ?? null,
        priorCheckSummary: handoff?.summary ?? null,
      },
    };
  }

  private fuzzyMatchByName<T extends { name: string }>(
    items: T[],
    name: string,
  ): T | undefined {
    const lower = name.toLowerCase().trim();
    return (
      items.find((item) => item.name.toLowerCase() === lower) ||
      items.find((item) => item.name.toLowerCase().includes(lower)) ||
      items.find((item) => lower.includes(item.name.toLowerCase()))
    );
  }

  private snapTo10min(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number);
    return `${String(h).padStart(2, '0')}:${String(Math.floor(m / 10) * 10).padStart(2, '0')}`;
  }
}
