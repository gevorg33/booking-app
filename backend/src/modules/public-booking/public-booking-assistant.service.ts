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
  resolvePublicAvailabilityDateKeys,
  resolvePublicAvailabilityWindows,
  resolveServicesFromCatalogParams,
  enrichListServicesParamsFromPrompt,
  stripServiceRoleNoise,
  resolvePublicAssistantSessionServiceFields,
} from '../ai/ai-orchestration.helpers.js';
import { addDaysToDateKey } from '../../common/utils/timezone.util.js';
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
import { AiBusinessDateFormatService } from '../ai/ai-business-date-format.service.js';
import { AiBusinessComplianceService } from '../ai/ai-business-compliance.service.js';
import { AiConsumerClinicTestResultsService } from '../ai/ai-consumer-clinic-test-results.service.js';
import { AiClinicLabBookingService } from '../ai/ai-clinic-lab-booking.service.js';
import { AiClinicBookingService } from '../ai/ai-clinic-booking.service.js';
import { AiProductGuideService } from '../ai/ai-product-guide.service.js';
import { AiProductGuideEmptyStateService } from '../ai/ai-product-guide-empty-state.service.js';
import {
  mapCommandResultGuideNavigate,
  runSurfaceProductGuideIntent,
} from '../ai/ai-product-guide-surface.logic.js';
import {
  mapPublicBookingGuideRoute,
  mergePublicBookingGuideContext,
  resolvePublicBookingGuideIntent,
  resolvePublicBookingGuideNavigate,
  rewriteBookingHelpGuideResult,
} from '../ai/ai-public-booking-guide.util.js';
import {
  enrichGuideTopicFromPrompt,
  rescueProductGuideIntent,
} from '../ai/ai-product-guide-rescue.util.js';
import { resolveProductGuideSessionContext } from '../ai/ai-product-guide-session.util.js';
import {
  isAppGuideIntent,
  resolveProductGuidePromptMatch,
  type AppGuideIntent,
} from '../ai/ai-product-guide.util.js';
import {
  isEmptyStateGuideIntent,
  type EmptyStateGuideIntent,
} from '../ai/ai-product-guide-empty-state.util.js';
import { AiBusinessCurrencyService } from '../ai/ai-business-currency.service.js';
import { AiTourServiceService } from '../ai/ai-tour-service.service.js';
import { AiRecommendationProductService } from '../ai/ai-recommendation-product.service.js';
import { AiBusinessLanguagesService } from '../ai/ai-business-languages.service.js';
import { AiPackageLocalizedNamesService } from '../ai/ai-package-localized-names.service.js';
import { AiPromptNormalizationService } from '../ai/ai-prompt-normalization.service.js';
import { PublicCommandUnderstandingAdapter } from '../ai/public-command-understanding.adapter.js';
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
import type { ClassifiedIntent } from '../ai/ai-command-routing.util.js';
import type { CommandResult } from '../ai/command-completion.types.js';
import type { PipelineUnderstandResult } from '../ai/command-understanding.types.js';
import { enrichPublicAssistantParamsFromPrompt } from '../ai/ai-intent-heuristics.js';
import { rescueBudgetServiceDiscoveryIntent } from '../ai/ai-budget-service-discovery.util.js';
import { rescueServiceRankFromRecommendSpecialistsIntent, rescueServiceRankDiscoveryIntent } from '../ai/ai-service-rank-discovery.util.js';
import { rescueServiceCatalogBrowseIntent } from '../ai/ai-service-catalog-browse.util.js';
import { commandResultToPublicAssistantResult } from '../ai/customer-ai-command.util.js';
import {
  appendPostFailureGuideFallback,
  buildPostFailureGuideFallbackInput,
} from '../ai/ai-product-guide-failure-fallback.util.js';
import {
  buildAiUnavailableErrorWithGuideLink,
  runAiUnavailableStaticGuideFallback,
} from '../ai/ai-product-guide-ai-unavailable.util.js';
export { buildPublicClassifierSchema } from './public-booking-classifier.schema.js';
import {
  applyBudgetFilterForRecommendSpecialists,
  composePublicListServicesBudgetResponse,
  resolveDiscoverConstrainedService,
} from '../ai/ai-budget-list-services.logic.js';
import {
  composePublicListServicesMidRangeResponse,
  composePublicListServicesRankResponse,
  resolveListServicesRankLimitFromPrompt,
} from '../ai/ai-rank-list-services.logic.js';
import { resolveServiceTierParam } from '../../common/utils/service-rank-metadata.util.js';
import {
  isMidRangeServiceListPrompt,
  isValueOrPremiumBudgetListPrompt,
  resolveServiceRankParam,
} from '../ai/ai-service-rank-discovery.util.js';
import { isBudgetServiceDiscoveryCompoundPrompt } from '../ai/ai-budget-service-discovery-compound.util.js';
import { isFlexibleAvailabilityBudgetBookCompoundPrompt } from '../ai/ai-flexible-availability-compound.util.js';
import {
  appendAvailabilityNearestAlternativeNote,
  composeAvailabilityNoSlotsSummary,
  composePublicAvailabilityCheckSummary,
  composePublicAvailabilityGroupedEmptyWindowsSummary,
  filterPublicProviderSlotsByTimeOfDay,
  formatAvailabilityNearestAlternativeNote,
  mergePublicProviderSlotTimes,
  shouldGroupPublicAvailabilityByWindow,
  shouldUseGroupedAvailabilityNoSlotsSummary,
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
  /** Product guide payload when assistant returns guide intents (ai-guide-1.0.3/1.0.4). */
  guide?: import('../ai/command-completion.types.js').GuideResponse;
  details?: Record<string, unknown>;
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
    private promptNormalization: AiPromptNormalizationService,
    private publicUnderstanding: PublicCommandUnderstandingAdapter,
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
    private productGuide: AiProductGuideService,
    private emptyStateGuide: AiProductGuideEmptyStateService,
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
      const fallback = await runAiUnavailableStaticGuideFallback({
        productGuide: this.productGuide,
        businessId: business.id,
        prompt,
        surface: 'public',
        reason: 'openai_not_configured',
        session: { context: orchestratedSession },
        locale,
      });
      if (fallback) {
        return commandResultToPublicAssistantResult(fallback);
      }
      return commandResultToPublicAssistantResult(
        buildAiUnavailableErrorWithGuideLink({
          surface: 'public',
          reason: 'openai_not_configured',
          route: mapPublicBookingGuideRoute(orchestratedSession),
          locale,
        }),
      );
    }

    const guideMatch = resolveProductGuidePromptMatch(prompt, {
      surface: 'public',
      assistantMode: orchestratedSession?.assistantMode as 'guide' | 'act' | undefined,
    });
    if (guideMatch.matched && guideMatch.intent) {
      return commandResultToPublicAssistantResult(
        await this.dispatchPublicAppGuideIntent(
          business.id,
          prompt,
          guideMatch.intent as AppGuideIntent,
          locale,
          orchestratedSession,
        ),
      );
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

    const promptNorm = await this.promptNormalization.normalizeForClassifier(
      business.id,
      undefined,
      prompt,
    );

    const understood = await this.publicUnderstanding.understand({
      businessId: business.id,
      effectivePrompt: prompt,
      confidence: aiConfig.confidence,
      sessionConfidenceHigh: orchestratedSession?._confidenceHigh as
        | number
        | undefined,
      lastAction: orchestratedSession?.lastAction as string | undefined,
      sessionContext: orchestratedSession,
      history: session?.history,
      locale,
      businessContextBlock: contextBlock,
      employees: employees.map((e) => ({ id: e.id, name: e.name })),
      promptNorm,
      classify: (normalizedPrompt, systemContext) =>
        this.classifyIntent(
          business.id,
          normalizedPrompt,
          systemContext,
          session?.history,
          orchestratedSession,
          locale,
        ),
    });

    if (understood.status === 'blocked') {
      return {
        success: false,
        action: 'unknown',
        summary: t(locale, 'assistant.unknown'),
      };
    }

    if (understood.status === 'clarify') {
      return this.applyPostFailureGuideFallback(
        this.pipelineClarifyToPublicResult(understood, locale),
        orchestratedSession,
        locale,
      );
    }

    let parsed = pipelineResultToClassifiedIntent(understood);
    const classifierCandidate = findClassifierCandidate(understood);
    const classifierAction = classifierCandidate?.action ?? parsed.action;
    const classifierConfidence = classifierCandidate?.confidence;
    let rescueReason: string | undefined = pipelineRescueReason(understood);

    const bookingHelpRescue = rescueProductGuideIntent(prompt, parsed.action, {
      surface: 'public',
      assistantMode: orchestratedSession?.assistantMode as 'guide' | 'act' | undefined,
      route: mapPublicBookingGuideRoute(
        mergePublicBookingGuideContext(orchestratedSession),
      ),
      context: orchestratedSession,
    });
    if (bookingHelpRescue.action !== parsed.action) {
      parsed.action = bookingHelpRescue.action;
      rescueReason = bookingHelpRescue.rescueReason ?? 'public_booking_help';
    }

    const discoveryRescue = this.applyBudgetAndRankServiceDiscoveryRescue(
      prompt,
      parsed.action,
    );
    if (discoveryRescue) {
      parsed.action = discoveryRescue.action;
      rescueReason = discoveryRescue.rescueReason;
      if (discoveryRescue.params) {
        parsed.params = { ...parsed.params, ...discoveryRescue.params };
      }
    }

    if (shouldBlockUnknownFromHandlerSwitch(parsed.action)) {
      return this.applyPostFailureGuideFallback(
        commandResultToPublicAssistantResult(
          buildUnknownIntentClarifyResult({
            surface: 'public',
            prompt,
            params: parsed.params,
            reasoning: parsed.reasoning,
            confidence:
              typeof parsed.confidence === 'number' ? parsed.confidence : 0,
            trace: understood.trace,
          }),
        ),
        orchestratedSession,
        locale,
      );
    }

    const gateDenied = this.platform.gatePublicAction(parsed.action);
    if (gateDenied) {
      return {
        success: false,
        action: gateDenied.action,
        summary: gateDenied.summary,
      };
    }

    const compoundDecomposition = isCompoundPrompt(prompt)
      ? decomposeDeterministicForSurface('public', prompt)
      : null;
    recordMisrouteTelemetry(this.aiEvents, business.id, {
      surface: 'public',
      prompt,
      classifierAction,
      rescuedAction: parsed.action,
      rescueReason,
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

    if (isAppGuideIntent(parsed.action)) {
      return commandResultToPublicAssistantResult(
        await this.dispatchPublicAppGuideIntent(
          business.id,
          prompt,
          parsed.action as AppGuideIntent,
          locale,
          orchestratedSession,
          parsed.params,
        ),
      );
    }

    if (isEmptyStateGuideIntent(parsed.action)) {
      return commandResultToPublicAssistantResult(
        await this.dispatchPublicEmptyStateGuideIntent(
          business.id,
          prompt,
          parsed.action,
          locale,
          orchestratedSession,
          parsed.params,
        ),
      );
    }

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
        result = await this.handleBookingHelp(
          business.id,
          prompt,
          locale,
          orchestratedSession,
        );
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
    return this.applyPostFailureGuideFallback(final, orchestratedSession, locale);
  }

  private applyPostFailureGuideFallback(
    result: PublicAssistantResult,
    session?: Record<string, unknown>,
    locale?: AppLocale,
  ): PublicAssistantResult {
    const asCommand: CommandResult = {
      success: result.success,
      action: result.action,
      summary: result.summary,
      details: {
        ...(result.details ?? {}),
        needsClarification: result.details?.needsClarification,
        sessionContext: result.sessionContext,
      },
      guide: result.guide,
    };
    const enriched = appendPostFailureGuideFallback(
      asCommand,
      buildPostFailureGuideFallbackInput(
        mergePublicBookingGuideContext({ ...session, locale }),
        'public',
        locale,
      ),
    );
    if (enriched === asCommand) return result;
    return {
      ...result,
      summary: enriched.summary,
      guide: enriched.guide ?? result.guide,
      details: {
        ...(result.details ?? {}),
        ...enriched.details,
      },
    };
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
    const serviceTier = resolveServiceTierParam(params.serviceTier);
    const serviceQuery = params.serviceCategory ?? params.serviceName;

    if (isMidRangeServiceListPrompt(prompt) && !serviceRank) {
      const midRangeLimit = resolveListServicesRankLimitFromPrompt(prompt, params);
      const composed = composePublicListServicesMidRangeResponse({
        matchedServices: catalogRows,
        serviceCategory: params.serviceCategory ?? params.serviceName ?? null,
        limit: midRangeLimit,
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
        },
        details:
          composed.services.length === 1
            ? { serviceId: composed.services[0]!.id }
            : undefined,
      };
    }

    if (serviceRank || serviceTier) {
      const rankLimit = resolveListServicesRankLimitFromPrompt(prompt, params);
      const composed = composePublicListServicesRankResponse({
        matchedServices: catalogRows,
        serviceRank: serviceRank ?? undefined,
        serviceTier,
        limit: rankLimit,
        maxPrice: params.maxPrice,
        serviceCategory: params.serviceCategory ?? params.serviceName ?? null,
        allCatalogServices: catalogRows,
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
          rankedServiceIds:
            composed.services.length > 1
              ? JSON.stringify(composed.services.map((service) => service.id))
              : null,
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
        : params.maxTotalPrice != null
          ? `Service combos within your budget:`
          : params.maxPrice != null
            ? `Services within your budget:`
            : 'Our service types:';

    const composed = composePublicListServicesBudgetResponse({
      matchedServices: catalogRows,
      maxPrice: params.maxPrice,
      minPrice: params.minPrice,
      preferShortDuration: params.preferShortDuration,
      minDurationMinutes: params.minDurationMinutes,
      maxTotalPrice: params.maxTotalPrice,
      serviceCount: params.serviceCount,
      header,
      valueOrPremiumBrowse: isValueOrPremiumBudgetListPrompt(prompt),
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
        maxTotalPrice:
          params.maxTotalPrice != null ? String(params.maxTotalPrice) : null,
        serviceCount:
          params.serviceCount != null ? String(params.serviceCount) : null,
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
    }

    const serviceRank = resolveServiceRankParam(params.serviceRank);
    if (serviceRank != null && matchedServices.length > 0) {
      const rankResolved = resolveDiscoverConstrainedService(
        matchedServices.map((service) => ({
          id: service.id,
          name: service.name,
          price: Number(service.price),
          durationMinutes: service.durationMinutes,
        })),
        params,
      );
      if (rankResolved.noMatchSummary) {
        return {
          success: true,
          action: 'check_availability',
          summary: rankResolved.noMatchSummary,
          details: { clarify: true, reason: 'rank_no_match' },
        };
      }
      if (rankResolved.service) {
        matchedServices = [
          services.find((service) => service.id === rankResolved.service!.id)!,
        ];
        params = {
          ...params,
          serviceId: rankResolved.service.id,
          serviceName: rankResolved.service.name,
        };
      }
    } else if (matchedServices.length === 1) {
      params = {
        ...params,
        serviceId: matchedServices[0]!.id,
        serviceName: matchedServices[0]!.name,
      };
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
      if (shouldUseGroupedAvailabilityNoSlotsSummary(groupByWindow, windowReports)) {
        let summary = composePublicAvailabilityGroupedEmptyWindowsSummary({
          serviceLabel,
          locale,
          timeZone: tz,
          singleProvider: targets.length === 1,
          windowReports,
          maxPrice: params.maxPrice,
          overlapClarifyNote,
        });

        if (matchedServices.length === 1) {
          const nearest = await this.publicBookingService.findNearestBookableSlot(
            slug,
            {
              serviceId: matchedServices[0].id,
              employeeId: targets.length === 1 ? targets[0].id : null,
              startDateKey: [...allDateKeys].sort()[0] ?? null,
            },
          );
          if (nearest) {
            summary = appendAvailabilityNearestAlternativeNote(
              summary,
              formatAvailabilityNearestAlternativeNote({
                locale,
                timeZone: tz,
                employeeName: nearest.employeeName,
                dateKey: nearest.dateKey,
                startTime: nearest.startTime,
              }),
            );
          }
        }

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
    const employeeRole =
      typeof params.employeeRole === 'string' ? params.employeeRole : undefined;
    let matchedServices = this.resolveServicesFromParams(params, services);

    if (
      employeeRole &&
      params.serviceCategory === employeeRole &&
      matchedServices.length === 0
    ) {
      matchedServices = [];
    }

    if (
      (params.serviceName || params.serviceCategory) &&
      matchedServices.length === 0 &&
      !employeeRole
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

    if (matchedServices.length === 0 && !employeeRole) {
      return {
        success: true,
        action: 'recommend_specialists',
        summary: t(locale, 'assistant.recommendNeedsService', {
          services: services.map((s) => s.name).join(', '),
        }),
      };
    }

    const servicesForRecommend =
      matchedServices.length > 0 ? matchedServices : services;

    const budgetRecommend = applyBudgetFilterForRecommendSpecialists(
      servicesForRecommend.map((service) => ({
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
    const filteredServices = servicesForRecommend.filter((service) =>
      filteredServiceIds.has(service.id),
    );

    const serviceLabel = employeeRole
      ? employeeRole.charAt(0).toUpperCase() + employeeRole.slice(1)
      : inferServiceGroupLabel(
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
        serviceIds:
          matchedServices.length > 0
            ? filteredServices.map((service) => service.id)
            : undefined,
        dateKeys,
        notBeforeTime: params.timeFrom ?? null,
        limit: 5,
        employeeRole: employeeRole ?? null,
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

  private async handleBookingHelp(
    businessId: string,
    prompt: string,
    locale: AppLocale,
    sessionContext?: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const guideResult = await this.dispatchPublicAppGuideIntent(
      businessId,
      prompt,
      resolvePublicBookingGuideIntent(
        prompt,
        mapPublicBookingGuideRoute(mergePublicBookingGuideContext(sessionContext)),
      ),
      locale,
      sessionContext,
      {},
      'booking_help',
    );

    if (guideResult.success && guideResult.guide) {
      return commandResultToPublicAssistantResult(guideResult);
    }

    return commandResultToPublicAssistantResult(
      rewriteBookingHelpGuideResult(
        {
          success: true,
          action: 'booking_help',
          summary:
            locale === 'hy'
              ? 'Ամրագրման քայլերը հասանելի չեն — փորձեք նորից կամ ընտրեք Professionals էջը։'
              : locale === 'ru'
                ? 'Шаги записи недоступны — попробуйте снова или откройте страницу специалистов.'
                : 'Booking guide steps are unavailable — try again or open the Professionals page.',
          details: {
            navigate: { path: 'professionals' },
            guideRoute: mapPublicBookingGuideRoute(
              mergePublicBookingGuideContext(sessionContext),
            ),
          },
        },
        mapPublicBookingGuideRoute(mergePublicBookingGuideContext(sessionContext)),
      ),
    );
  }

  /** ai-guide-1.5.3 — checkout-step context drives public guide playbook selection. */
  private async dispatchPublicAppGuideIntent(
    businessId: string,
    prompt: string,
    intent: AppGuideIntent,
    locale: AppLocale,
    sessionContext?: Record<string, unknown>,
    params: Record<string, unknown> = {},
    surrogateAction?: 'booking_help',
  ): Promise<CommandResult> {
    const mergedContext = mergePublicBookingGuideContext({
      ...sessionContext,
      locale,
    });
    const guideContext = resolveProductGuideSessionContext(
      { context: mergedContext },
      'public',
    );
    const route = guideContext.route ?? mapPublicBookingGuideRoute(mergedContext);
    const resolvedIntent = resolvePublicBookingGuideIntent(prompt, route, intent);
    const topicId = enrichGuideTopicFromPrompt(prompt, {
      surface: 'public',
      route,
      topicId: params.topicId,
    });
    const guideParams = topicId ? { ...params, topicId } : params;

    const guideResult = mapCommandResultGuideNavigate(
      await runSurfaceProductGuideIntent({
        productGuide: this.productGuide,
        businessId,
        prompt: prompt.trim() || 'How do I book online?',
        intent: resolvedIntent,
        surface: 'public',
        locale,
        params: guideParams,
        session: { context: mergedContext },
        sessionContext: guideContext,
      }),
    );

    const rewritten = surrogateAction
      ? rewriteBookingHelpGuideResult(guideResult, route)
      : {
          ...guideResult,
          details: {
            ...guideResult.details,
            guideRoute: route,
            guideIntent: resolvedIntent,
            bookingStep:
              typeof mergedContext.bookingStep === 'string'
                ? mergedContext.bookingStep
                : undefined,
          },
          guide: guideResult.guide
            ? {
                ...guideResult.guide,
                navigate:
                  guideResult.guide.navigate ??
                  resolvePublicBookingGuideNavigate(route),
              }
            : undefined,
        };

    return rewritten;
  }

  /** ai-guide-1.8.9 — public booking live catalog / Stripe empty-state guides. */
  private async dispatchPublicEmptyStateGuideIntent(
    businessId: string,
    prompt: string,
    intent: EmptyStateGuideIntent,
    locale: AppLocale,
    sessionContext?: Record<string, unknown>,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    if (!isEmptyStateGuideIntent(intent) || intent === 'explain_visibility_block') {
      return {
        success: false,
        action: intent,
        summary: 'Unsupported empty-state guide intent on public booking.',
        details: {},
      };
    }
    const mergedContext = mergePublicBookingGuideContext({
      ...sessionContext,
      locale,
    });
    const guideContext = resolveProductGuideSessionContext(
      { context: mergedContext },
      'public',
    );
    return mapCommandResultGuideNavigate(
      await this.emptyStateGuide.runIntent({
        businessId,
        intent,
        surface: 'public',
        prompt,
        params,
        session: { context: mergedContext },
        sessionContext: guideContext,
        locale,
      }),
    );
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
    const discoverResolved = resolveDiscoverConstrainedService(catalogPool, {
      serviceId: params.serviceId,
      serviceName: params.serviceName,
      serviceCategory: params.serviceCategory,
      maxPrice: params.maxPrice,
      serviceRank: params.serviceRank,
    });
    if (discoverResolved.noMatchSummary) {
      return {
        success: false,
        action: 'book_appointment',
        summary: discoverResolved.noMatchSummary,
      };
    }
    const service = discoverResolved.service
      ? services.find((entry) => entry.id === discoverResolved.service!.id)
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

  private applyPublicBookingHelpRescue(
    prompt: string,
    action: string,
  ): { action: string; rescueReason: string } | null {
    const rescued = rescueProductGuideIntent(prompt, action, { surface: 'public' });
    if (rescued.action === action) return null;
    return {
      action: rescued.action,
      rescueReason: rescued.rescueReason ?? 'public_booking_help',
    };
  }

  private applyBudgetAndRankServiceDiscoveryRescue(
    prompt: string,
    action: string,
  ): {
    action: string;
    rescueReason: string;
    params?: Record<string, unknown>;
  } | null {
    const rankDiscoveryRescue = rescueServiceRankDiscoveryIntent(
      prompt,
      action,
      'public',
    );
    if (rankDiscoveryRescue) return rankDiscoveryRescue;

    const catalogBrowseRescue = rescueServiceCatalogBrowseIntent(prompt, action);
    const resolvedBrowseAction = catalogBrowseRescue?.action ?? action;
    const budgetRescue = rescueBudgetServiceDiscoveryIntent(
      prompt,
      resolvedBrowseAction,
      'public',
    );
    const resolvedAction = budgetRescue?.action ?? resolvedBrowseAction;
    const rankRescue = rescueServiceRankFromRecommendSpecialistsIntent(
      prompt,
      resolvedAction,
    );
    return rankRescue ?? budgetRescue ?? catalogBrowseRescue ?? null;
  }

  private pipelineClarifyToPublicResult(
    understood: PipelineUnderstandResult,
    locale: AppLocale,
  ): PublicAssistantResult {
    const clarifyPayload = {
      summary:
        understood.clarifySummary ??
        t(locale, 'assistant.unknown'),
      clarifyFields: understood.clarifyFields ?? ['intentChoice'],
      suggestions: understood.clarifySuggestions ?? [],
      loweredConfidence: understood.confidence,
      ruleId:
        understood.blockReason?.replace('self_verify clarify: ', '') ??
        'unknown',
      reason: understood.blockReason ?? 'self_verify_clarify',
    };
    return commandResultToPublicAssistantResult(
      buildPipelineClarifyCommandResult(understood, clarifyPayload),
    );
  }

  private async classifyIntent(
    businessId: string,
    normalizedPrompt: string,
    systemContext: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    sessionContext?: Record<string, any>,
    locale: AppLocale = 'en',
  ): Promise<ClassifiedIntent | null> {
    const sessionBlock =
      sessionContext &&
      Object.values(sessionContext).some((v) => v != null && v !== '')
        ? `\n\nActive session:\n${JSON.stringify(sessionContext, null, 2)}`
        : '';

    const historyMessages = (history ?? []).slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `${systemContext}${sessionBlock}`,
      },
      ...historyMessages,
      { role: 'user', content: normalizedPrompt },
    ];

    try {
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

      const result = JSON.parse(raw) as {
        action?: string;
        params?: Record<string, unknown>;
        reasoning?: string;
        confidence?: number;
      };
      if (!result?.action) return null;

      return {
        action: result.action,
        params: result.params ?? {},
        reasoning: result.reasoning ?? '',
        confidence:
          typeof result.confidence === 'number' ? result.confidence : undefined,
      };
    } catch (err: any) {
      this.logger.error(
        `Public assistant classification failed: ${err.message}`,
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
