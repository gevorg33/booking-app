import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { Employee } from '../employee/entities/employee.entity.js';
import { BusinessMember } from '../business/entities/business-member.entity.js';
import {
  Booking,
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { resolveBookingPaymentSummary } from '../booking/booking-payment-summary.util.js';
import { BusinessService } from '../business/business.service.js';
import { BookingService } from '../booking/booking.service.js';
import { BookingSlotResolverService } from '../booking/booking-slot-resolver.service.js';
import { RetailPosService } from '../retail-pos/retail-pos.service.js';
import { BlockScheduleService } from '../schedule/services/block-schedule.service.js';
import { SchedulingSlot } from '../schedule/entities/scheduling-slot.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { LlmService } from '../../engine/agent/llm.service.js';
import {
  isMobileManagerRole,
  MOBILE_MANAGER_ROLES,
  type MobileAccess,
  type MobileViewMode,
} from './provider-mobile-access.js';
import {
  UpdateProviderBookingDto,
  CancelProviderBookingDto,
  SuggestCancelNoteDto,
  UpdateProviderProfileDto,
  ReassignProviderBookingDto,
} from './dto/provider-mobile.dto.js';
import {
  buildClinicProviderResultsQueueWindow,
  CLINIC_PROVIDER_COLLECTION_QUEUE_STATUSES,
  CLINIC_PROVIDER_RESULTS_LOOKBACK_DAYS,
  CLINIC_PROVIDER_RESULTS_QUEUE_STATUSES,
  isClinicLabFeaturesEnabled,
} from '../../common/utils/clinic-lab-state.util.js';
import { readBusinessTypeFromSettings } from '../clinic-test-results/shared/clinic-test-results-gate.util.js';
import { ClinicTestOrderService } from '../clinic-test-results/order/clinic-test-order.service.js';
import { ClinicTestResultService } from '../clinic-test-results/test-result/clinic-test-result.service.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { PatientClinicalProfilesService } from '../patient-clinical-profiles/patient-clinical-profiles.service.js';
import { PatientClinicalProfileAccessService } from '../patient-clinical-profiles/shared/patient-clinical-profile-access.service.js';
import {
  buildProviderPatientChartTodayWindow,
  customerIdsAssignedToProvider,
  mapProviderPatientChartOrder,
  mapProviderPatientChartResult,
  PROVIDER_PATIENT_SEARCH_LIMIT,
  PROVIDER_PATIENT_SEARCH_MIN_LENGTH,
} from './provider-mobile-patient-chart.util.js';
import { ClinicTasksService } from '../clinic-tasks/clinic-tasks.service.js';
import {
  buildProviderClinicTaskNameLookups,
  CLINIC_PROVIDER_TASK_INBOX_PAGE_SIZE,
  CLINIC_PROVIDER_TASK_INBOX_STATUSES,
  mapProviderClinicTaskInboxItems,
  mergeClinicTaskInboxItems,
  type ProviderClinicTaskInbox,
} from './provider-mobile-clinic-tasks.util.js';
import type { CompleteClinicTaskDto } from '../clinic-tasks/dto/clinic-task.dto.js';
import { Review } from '../reviews/entities/review.entity.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import { readReferredByCustomerId } from '../../common/utils/referral-program.util.js';
import { buildProviderBookingCustomerContextView } from './provider-booking-customer-context.util.js';
import {
  buildProviderRecentCompletedVisits,
  PROVIDER_RECENT_VISIT_LIMIT,
} from './provider-booking-visit-history.util.js';
import {
  canWriteProviderBookingCustomerStaffNotes,
  PROVIDER_CUSTOMER_STAFF_NOTE_MAX_LENGTH,
  PROVIDER_CUSTOMER_STAFF_NOTES_LIST_LIMIT,
  type ProviderBookingCustomerStaffNotesListView,
} from './provider-booking-customer-staff-notes.util.js';
import { PatientStaffNotesService } from '../patient-clinical-profiles/patient-staff-notes.service.js';
import { PatientStaffNoteAccessService } from '../patient-clinical-profiles/shared/patient-staff-note-access.service.js';
import type { PatientStaffNoteAccessContext } from '../patient-clinical-profiles/shared/patient-staff-note-access.service.js';
import type {
  CreateProviderCustomerStaffNoteDto,
  CreateProviderSelfBlockDto,
} from './dto/provider-mobile.dto.js';
import {
  buildProviderBookingCheckoutContextView,
  buildProviderMultiServiceBadge,
  buildProviderPackageBadge,
  buildProviderSubscriptionBadge,
  readSubscriptionIdFromBookingMetadata,
} from './provider-booking-checkout-context.util.js';
import { MultiServiceBookingGroup } from '../multi-service-bookings/entities/multi-service-booking-group.entity.js';
import { CustomerSubscription } from '../service-subscriptions/entities/subscription.entity.js';
import { ClinicPreVisitIntake } from '../clinic-pre-visit-intakes/entities/clinic-pre-visit-intake.entity.js';
import { ClinicPreVisitIntakeService } from '../clinic-pre-visit-intakes/clinic-pre-visit-intake.service.js';
import { ClinicQuestionnairesService } from '../clinic-questionnaires/clinic-questionnaires.service.js';
import { ClinicQuestionnaireEngineService } from '../clinic-questionnaires/clinic-questionnaire-engine.service.js';
import {
  buildProviderPreVisitIntakeAnswerRows,
  buildProviderPreVisitIntakeSummaryView,
  serviceOffersProviderPreVisitIntake,
  shouldShowProviderPreVisitIntakeSection,
  type ProviderPreVisitIntakeSummaryView,
} from './provider-booking-pre-visit-intake.util.js';
import { getBusinessDefaultCurrency } from '../../common/utils/business-currency.util.js';
import { businessPaymentTipsEnabled } from '../../common/utils/business-payment.util.js';
import { SetBookingRetailSalesDto } from '../retail-pos/dto/set-booking-retail-sales.dto.js';
import {
  buildProviderRetailCartBlockedReason,
  isProviderRetailPosEnabled,
} from './provider-retail-pos.util.js';
import { isoDateRangeToUtcBounds } from '../ai/ai-provider-earnings.util.js';
import {
  buildProviderMyStatsView,
  canRequestProviderTeamStatsRollup,
  normalizeProviderMyStatsPeriod,
  normalizeProviderMyStatsScope,
  resolveProviderMyStatsPeriodRange,
} from './provider-my-stats.util.js';
import {
  buildProviderCalendarMonthView,
  normalizeCalendarMonthKey,
  resolveCalendarMonthBounds,
} from './provider-calendar-month.util.js';
import { mergeMarketingAutomationSettings } from '../marketing-automation/marketing-automation.types.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import {
  buildProviderReviewRequestEligibility,
  buildProviderReviewsInboxView,
  normalizeProviderReviewsInboxFilters,
  PROVIDER_REVIEWS_INBOX_FETCH_LIMIT,
} from './provider-reviews-inbox.util.js';
import {
  buildProviderCheckInEligibility,
  buildProviderCheckInPushMessage,
  claimProviderBookingCheckIn,
  providerMobileNotifyCustomerOnVisitStatus,
  providerMobileNotifyReceptionOnCheckIn,
  resolveProviderBookingFloorStatus,
} from './provider-booking-check-in.util.js';
import {
  applyProviderVisitStatusToMetadata,
  buildProviderVisitStatusEligibility,
  buildProviderVisitStatusSnapshot,
  readProviderVisitStatus,
  type ProviderVisitStatusKind,
} from './provider-booking-visit-status.util.js';
import {
  formatDateDisplay,
  formatTimeDisplay,
  getTodayDateKey,
} from '../../common/utils/date-format.util.js';
import {
  formatZonedTime,
  getDateKeyInTimezone,
  getUtcBoundsForDateKey,
  pickTimezone,
  resolveBusinessWallClockTimezone,
} from '../../common/utils/timezone.util.js';
import { getBusinessDefaultLocale } from '../../common/utils/business-locale.util.js';
import {
  resolveCustomerSelfServiceSettings,
  resolvePublicPaymentSettings,
  evaluateCustomerBookingPolicy,
} from '../../common/utils/customer-self-service.util.js';
import {
  buildCancelPolicyDepositContext,
  buildCancelPolicySettingsLines,
  buildDepositForfeitureLines,
  buildGeneralDepositForfeitureLine,
} from '../ai/ai-explain-cancel-policy.util.js';
import {
  buildProviderReassignEligibility,
  filterReassignTargetEmployees,
} from './provider-booking-reassign.util.js';
import {
  buildProviderTodayTimelineView,
  providerMobileShowTodayTimeline,
} from './provider-booking-today-timeline.util.js';
import {
  buildTeamFloorColumns,
  filterTeamFloorBookingsByEmployee,
  isValidTeamFloorEmployeeFilter,
  listTeamFloorProviders,
  normalizeTeamFloorEmployeeFilter,
  resolveTeamFloorChipStatus,
  type TeamFloorTodayView,
} from './provider-team-floor.util.js';
import {
  buildTeamWhosNextView,
  type TeamWhosNextView,
} from './provider-team-whos-next.util.js';
import { mergeBusinessNotificationSettings } from '../notifications/merge-business-notification-settings.js';
import {
  buildProviderCustomerContactView,
  type ProviderCustomerContactView,
} from './provider-customer-contact.util.js';
import {
  isStaffMessageTemplatesFeatureEnabled,
  readStaffMessageTemplatesSettings,
  resolveStaffMessageTemplatesForBooking,
  type ResolvedStaffMessageTemplate,
} from './provider-staff-message-templates.util.js';
import {
  buildCreateBlockScheduleDto,
  isProviderSelfBlockEnabled,
  readProviderSelfBlockSettings,
  validateProviderSelfBlockWindow,
  buildProviderSelfBlockIso,
} from './provider-self-block.util.js';
import {
  isProviderTimeOffEnabled,
  readProviderTimeOffSettings,
} from './provider-time-off.util.js';
import { ProviderTimeOffService } from './provider-time-off.service.js';
import { PushService } from './push.service.js';
import {
  findOpenShiftsInWindow,
  isProviderOpenShiftsEnabled,
  normalizeScheduleDateKey,
  readProviderOpenShiftsSettings,
} from './provider-open-shifts.util.js';
import { resolveAvailabilityDayBounds } from './provider-ai-sprint19.util.js';
import type { CreateProviderTimeOffRequestDto } from './dto/provider-mobile.dto.js';

const TERMINAL_BOOKING_STATUSES = [
  BookingStatus.COMPLETED,
  BookingStatus.NO_SHOW,
  BookingStatus.CANCELLED,
];

const ACTIVE_STATUSES = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
];

@Injectable()
export class ProviderMobileService {
  constructor(
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(BusinessMember)
    private memberRepo: Repository<BusinessMember>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(SchedulingSlot)
    private slotRepo: Repository<SchedulingSlot>,
    @InjectRepository(SchedulingPeriod)
    private schedulingPeriodRepo: Repository<SchedulingPeriod>,
    private businessService: BusinessService,
    private bookingService: BookingService,
    private bookingSlotResolver: BookingSlotResolverService,
    private retailPosService: RetailPosService,
    private blockScheduleService: BlockScheduleService,
    private providerTimeOffService: ProviderTimeOffService,
    private llm: LlmService,
    private clinicTestOrderService: ClinicTestOrderService,
    private clinicTestResultService: ClinicTestResultService,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
    private patientClinicalProfilesService: PatientClinicalProfilesService,
    private patientClinicalProfileAccessService: PatientClinicalProfileAccessService,
    private clinicTasksService: ClinicTasksService,
    private loyaltyService: LoyaltyService,
    private staffNotesService: PatientStaffNotesService,
    private staffNoteAccessService: PatientStaffNoteAccessService,
    @InjectRepository(MultiServiceBookingGroup)
    private multiServiceGroupRepo: Repository<MultiServiceBookingGroup>,
    @InjectRepository(CustomerSubscription)
    private customerSubscriptionRepo: Repository<CustomerSubscription>,
    @InjectRepository(ClinicPreVisitIntake)
    private intakeRepo: Repository<ClinicPreVisitIntake>,
    private clinicPreVisitIntakeService: ClinicPreVisitIntakeService,
    private questionnairesService: ClinicQuestionnairesService,
    private questionnaireEngineService: ClinicQuestionnaireEngineService,
    private notificationsService: NotificationsService,
    private reviewsService: ReviewsService,
    private pushService: PushService,
  ) {}

  async getContext(businessId: string, userId: string) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const business = await this.businessService.findOne(businessId);
    const settings = business?.settings as Record<string, unknown> | undefined;
    const notificationSettings = mergeBusinessNotificationSettings(
      settings?.notifications as Record<string, unknown> | undefined,
    );
    const providerStatus =
      this.notificationsService.getProviderStatus(settings);

    return {
      membershipRole: access.membershipRole,
      viewMode: access.viewMode,
      employee: access.employee
        ? {
            id: access.employee.id,
            name: access.employee.name,
            email: access.employee.email,
            phone: access.employee.phone,
          }
        : null,
      canUseProviderApp: true,
      labFeaturesEnabled: isClinicLabFeaturesEnabled(
        readBusinessTypeFromSettings(settings),
      ),
      retailPosEnabled: isProviderRetailPosEnabled(
        await this.retailPosService.hasConfiguredRetailProducts(businessId),
      ),
      whatsappContactEnabled:
        notificationSettings.whatsappEnabled &&
        providerStatus.whatsappConfigured,
      staffMessageTemplatesEnabled: isStaffMessageTemplatesFeatureEnabled(
        readStaffMessageTemplatesSettings(settings),
      ),
      selfBlockEnabled: isProviderSelfBlockEnabled(
        readProviderSelfBlockSettings(settings),
      ),
      timeOffEnabled: isProviderTimeOffEnabled(
        readProviderTimeOffSettings(settings),
      ),
      openShiftsEnabled: isProviderOpenShiftsEnabled(
        readProviderOpenShiftsSettings(settings),
      ),
    };
  }

  private resolveStaffMessageTemplatesForBookingDetail(
    settings: Record<string, unknown> | undefined,
    booking: Booking,
    businessName: string,
  ): ResolvedStaffMessageTemplate[] | null {
    const templateSettings = readStaffMessageTemplatesSettings(settings);
    if (!isStaffMessageTemplatesFeatureEnabled(templateSettings)) {
      return null;
    }
    const timeZone = pickTimezone(
      typeof settings?.timezone === 'string' ? settings.timezone : undefined,
    );
    const appointmentTime = `${formatDateDisplay(booking.startTime, undefined, { timeZone })} ${formatTimeDisplay(booking.startTime, { timeZone })}`;
    return resolveStaffMessageTemplatesForBooking(templateSettings, {
      customerName: booking.customer?.name,
      businessName,
      appointmentTime,
    });
  }

  private resolveProviderCustomerContact(
    settings: Record<string, unknown> | undefined,
    customerPhone?: string | null,
  ): ProviderCustomerContactView | null {
    const notificationSettings = mergeBusinessNotificationSettings(
      settings?.notifications as Record<string, unknown> | undefined,
    );
    const providerStatus =
      this.notificationsService.getProviderStatus(settings);
    return buildProviderCustomerContactView({
      customerPhone,
      whatsappEnabledSetting: notificationSettings.whatsappEnabled,
      whatsappConfigured: providerStatus.whatsappConfigured,
    });
  }

  async listProviderRetailProducts(businessId: string, userId: string) {
    await this.resolveMobileAccess(businessId, userId);
    const enabled =
      await this.retailPosService.hasConfiguredRetailProducts(businessId);
    if (!enabled) {
      throw new ForbiddenException(
        'Retail POS is not enabled. Add products with a retail price in Operations → Inventory.',
      );
    }
    return {
      products: await this.retailPosService.listSellableProducts(businessId),
    };
  }

  async getProviderBookingRetailSales(
    businessId: string,
    userId: string,
    bookingId: string,
  ) {
    await this.getAccessibleBooking(businessId, userId, bookingId, 'read');
    const enabled =
      await this.retailPosService.hasConfiguredRetailProducts(businessId);
    if (!enabled) {
      throw new ForbiddenException(
        'Retail POS is not enabled for this business',
      );
    }
    return this.retailPosService.getBookingRetailSales(businessId, bookingId);
  }

  async setProviderBookingRetailSales(
    businessId: string,
    userId: string,
    bookingId: string,
    dto: SetBookingRetailSalesDto,
  ) {
    const booking = await this.getAccessibleBooking(
      businessId,
      userId,
      bookingId,
    );
    const enabled =
      await this.retailPosService.hasConfiguredRetailProducts(businessId);
    if (!enabled) {
      throw new ForbiddenException(
        'Retail POS is not enabled for this business',
      );
    }
    const blockedReason = buildProviderRetailCartBlockedReason(booking.status);
    if (blockedReason) {
      throw new BadRequestException(blockedReason);
    }
    return this.retailPosService.setBookingRetailSales(
      businessId,
      bookingId,
      userId,
      dto,
    );
  }

  async getTodayLabCollectionQueue(businessId: string, userId: string) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const business = await this.businessService.findOne(businessId);
    const settings = business?.settings as Record<string, unknown> | undefined;
    const labFeaturesEnabled = isClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(settings),
    );

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(today);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const orders = labFeaturesEnabled
      ? await this.clinicTestOrderService.listLabQueue(businessId, {
          from: today.toISOString(),
          to: dayEnd.toISOString(),
          statuses: [...CLINIC_PROVIDER_COLLECTION_QUEUE_STATUSES],
          employeeId:
            access.viewMode === 'provider' ? access.employee!.id : undefined,
          sort: 'bookingTimeAsc',
        })
      : [];

    return {
      date: today.toISOString().slice(0, 10),
      viewMode: access.viewMode,
      labFeaturesEnabled,
      employee: access.employee
        ? { id: access.employee.id, name: access.employee.name }
        : null,
      orders,
    };
  }

  async getProviderLabResultsQueue(businessId: string, userId: string) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const business = await this.businessService.findOne(businessId);
    const settings = business?.settings as Record<string, unknown> | undefined;
    const labFeaturesEnabled = isClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(settings),
    );
    const { from, to } = buildClinicProviderResultsQueueWindow();

    const results = labFeaturesEnabled
      ? await this.clinicTestResultService.listResultQueue(businessId, {
          from,
          to,
          statuses: [...CLINIC_PROVIDER_RESULTS_QUEUE_STATUSES],
          employeeId:
            access.viewMode === 'provider' ? access.employee!.id : undefined,
        })
      : [];

    return {
      lookbackDays: CLINIC_PROVIDER_RESULTS_LOOKBACK_DAYS,
      viewMode: access.viewMode,
      labFeaturesEnabled,
      employee: access.employee
        ? { id: access.employee.id, name: access.employee.name }
        : null,
      results,
    };
  }

  async getProviderClinicTaskInbox(
    businessId: string,
    userId: string,
  ): Promise<ProviderClinicTaskInbox> {
    const access = await this.resolveMobileAccess(businessId, userId);
    const business = await this.businessService.findOne(businessId);
    const settings = business?.settings as Record<string, unknown> | undefined;
    const labFeaturesEnabled = isClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(settings),
    );

    if (!labFeaturesEnabled) {
      return {
        viewMode: access.viewMode,
        labFeaturesEnabled: false,
        employee: access.employee
          ? { id: access.employee.id, name: access.employee.name }
          : null,
        tasks: [],
      };
    }

    const inboxLists = await Promise.all(
      CLINIC_PROVIDER_TASK_INBOX_STATUSES.map((status) =>
        this.clinicTasksService.listClinicTasks(businessId, userId, {
          status,
          pageSize: CLINIC_PROVIDER_TASK_INBOX_PAGE_SIZE,
        }),
      ),
    );
    const mergedTasks = mergeClinicTaskInboxItems(
      ...inboxLists.map((list) => list.items),
    );

    const customerIds = [
      ...new Set(
        mergedTasks
          .map((task) => task.customerId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const assigneeIds = [
      ...new Set(
        mergedTasks
          .map((task) => task.assigneeEmployeeId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const [customers, employees] = await Promise.all([
      customerIds.length
        ? this.customerRepo.find({
            where: { businessId, id: In(customerIds) },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      assigneeIds.length
        ? this.employeeRepo.find({
            where: { businessId, id: In(assigneeIds) },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    ]);

    const membership = await this.businessService.ensureMember(
      businessId,
      userId,
    );
    const staffCtx = {
      userId,
      membershipRole: membership.role,
      employeeId: access.employee?.id ?? null,
    };
    const lookups = buildProviderClinicTaskNameLookups(customers, employees);

    return {
      viewMode: access.viewMode,
      labFeaturesEnabled: true,
      employee: access.employee
        ? { id: access.employee.id, name: access.employee.name }
        : null,
      tasks: mapProviderClinicTaskInboxItems(mergedTasks, staffCtx, lookups),
    };
  }

  async claimProviderClinicTask(
    businessId: string,
    userId: string,
    taskId: string,
  ) {
    await this.resolveMobileAccess(businessId, userId);
    return this.clinicTasksService.claimClinicTask(businessId, userId, taskId);
  }

  async completeProviderClinicTask(
    businessId: string,
    userId: string,
    taskId: string,
    dto: CompleteClinicTaskDto = {},
  ) {
    await this.resolveMobileAccess(businessId, userId);
    return this.clinicTasksService.completeClinicTask(
      businessId,
      userId,
      taskId,
      dto,
    );
  }

  async searchProviderPatients(
    businessId: string,
    userId: string,
    query: string,
  ) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const business = await this.businessService.findOne(businessId);
    const settings = business?.settings as Record<string, unknown> | undefined;
    const labFeaturesEnabled = isClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(settings),
    );
    const trimmed = query?.trim() ?? '';

    if (!labFeaturesEnabled) {
      return {
        labFeaturesEnabled: false,
        viewMode: access.viewMode,
        query: trimmed,
        patients: [],
      };
    }

    if (trimmed.length < PROVIDER_PATIENT_SEARCH_MIN_LENGTH) {
      return {
        labFeaturesEnabled: true,
        viewMode: access.viewMode,
        query: trimmed,
        patients: [],
      };
    }

    let scopedCustomerIds: string[] | null = null;
    if (access.viewMode === 'provider' && access.employee) {
      const bookings = await this.bookingRepo.find({
        where: { businessId },
        select: { customerId: true, employeeId: true, linkedEmployeeIds: true },
      });
      scopedCustomerIds = customerIdsAssignedToProvider(
        bookings,
        access.employee.id,
      );
      if (scopedCustomerIds.length === 0) {
        return {
          labFeaturesEnabled: true,
          viewMode: access.viewMode,
          query: trimmed,
          patients: [],
        };
      }
    }

    const qb = this.customerRepo
      .createQueryBuilder('customer')
      .where('customer.businessId = :businessId', { businessId })
      .andWhere('customer.isActive = :isActive', { isActive: true })
      .andWhere(
        '(LOWER(customer.name) LIKE LOWER(:term) OR LOWER(customer.email) LIKE LOWER(:term) OR customer.phone LIKE :term)',
        { term: `%${trimmed}%` },
      )
      .orderBy('LOWER(customer.name)', 'ASC')
      .take(PROVIDER_PATIENT_SEARCH_LIMIT);

    if (scopedCustomerIds) {
      qb.andWhere('customer.id IN (:...scopedCustomerIds)', {
        scopedCustomerIds,
      });
    }

    const customers = await qb.getMany();

    return {
      labFeaturesEnabled: true,
      viewMode: access.viewMode,
      query: trimmed,
      patients: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email ?? null,
        phone: customer.phone ?? null,
      })),
    };
  }

  async getProviderPatientChartSummary(
    businessId: string,
    userId: string,
    customerId: string,
  ) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const business = await this.businessService.findOne(businessId);
    const settings = business?.settings as Record<string, unknown> | undefined;
    const labFeaturesEnabled = isClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(settings),
    );
    const { date, from, to } = buildProviderPatientChartTodayWindow();

    if (!labFeaturesEnabled) {
      return {
        labFeaturesEnabled: false,
        viewMode: access.viewMode,
        date,
        canAccessChart: false,
        customer: null,
        clinicalProfile: null,
        todaysOrders: [],
        todaysResults: [],
      };
    }

    const accessContext =
      await this.patientClinicalProfileAccessService.assertCustomerClinicalProfileAccess(
        businessId,
        userId,
        customerId,
      );

    const customer = await this.customerRepo.findOne({
      where: { id: customerId, businessId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const [clinicalProfile, orders, results] = await Promise.all([
      this.patientClinicalProfilesService.getProfileForCustomer(
        businessId,
        customerId,
        accessContext,
      ),
      this.clinicTestOrderService.listLabQueue(businessId, {
        from,
        to,
        customerId,
        sort: 'bookingTimeAsc',
      }),
      this.clinicTestResultService.listResultQueue(businessId, {
        from,
        to,
        customerId,
      }),
    ]);

    return {
      labFeaturesEnabled: true,
      viewMode: access.viewMode,
      date,
      canAccessChart: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email ?? null,
        phone: customer.phone ?? null,
      },
      clinicalProfile,
      todaysOrders: orders.map(mapProviderPatientChartOrder),
      todaysResults: results.map(mapProviderPatientChartResult),
    };
  }

  async resolveMobileAccess(
    businessId: string,
    userId: string,
  ): Promise<MobileAccess> {
    const membership = await this.businessService.ensureMember(
      businessId,
      userId,
    );
    const employee = await this.employeeRepo.findOne({
      where: { businessId, userId, isActive: true },
    });

    if (isMobileManagerRole(membership.role)) {
      return {
        viewMode: 'team',
        membershipRole: membership.role,
        employee,
      };
    }

    if (employee) {
      return {
        viewMode: 'provider',
        membershipRole: membership.role,
        employee,
      };
    }

    throw new ForbiddenException(
      'No provider profile or admin access for this business',
    );
  }

  async getTodayBookings(businessId: string, userId: string) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(today);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const where: Record<string, unknown> = {
      businessId,
      startTime: Between(today, dayEnd),
      status: Not(In([BookingStatus.CANCELLED])),
    };
    if (access.viewMode === 'provider') {
      where.employeeId = access.employee!.id;
    }

    const bookings = await this.bookingRepo.find({
      where: where,
      relations: { service: true, customer: true, employee: true },
      order: { startTime: 'ASC' },
    });

    return {
      date: today.toISOString().slice(0, 10),
      viewMode: access.viewMode,
      employee: access.employee
        ? { id: access.employee.id, name: access.employee.name }
        : null,
      bookings: bookings.map((b) => this.toBookingSummary(b)),
    };
  }

  async getTeamFloorToday(
    businessId: string,
    userId: string,
    employeeId?: string | null,
  ): Promise<TeamFloorTodayView> {
    const access = await this.resolveMobileAccess(businessId, userId);
    if (access.viewMode !== 'team') {
      throw new ForbiddenException(
        'Team floor view is only available to managers',
      );
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(today);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const bookings = await this.bookingRepo.find({
      where: {
        businessId,
        startTime: Between(today, dayEnd),
        status: Not(In([BookingStatus.CANCELLED])),
      },
      relations: { service: true, customer: true, employee: true },
      order: { startTime: 'ASC' },
    });

    const providers = listTeamFloorProviders(
      bookings.map((booking) => ({
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        employee: booking.employee
          ? { id: booking.employee.id, name: booking.employee.name }
          : null,
      })),
    );

    const filterEmployeeId = normalizeTeamFloorEmployeeFilter(employeeId);
    if (!isValidTeamFloorEmployeeFilter(providers, filterEmployeeId)) {
      throw new BadRequestException('Unknown provider filter');
    }

    const filtered = filterTeamFloorBookingsByEmployee(
      bookings,
      filterEmployeeId,
    );

    const columns = buildTeamFloorColumns(filtered, (booking) => ({
      ...this.toBookingSummary(booking),
      teamFloorStatus: resolveTeamFloorChipStatus(booking),
    }));

    return {
      date: today.toISOString().slice(0, 10),
      viewMode: 'team',
      filterEmployeeId,
      providers,
      columns,
      totalBookings: filtered.length,
    };
  }

  /** ai-cmd-provider-5.8.5 — manager-only preview of today's unpaid bookings across the team. */
  async getTeamUnpaidToday(businessId: string, userId: string) {
    const access = await this.resolveMobileAccess(businessId, userId);
    if (access.viewMode !== 'team') {
      throw new ForbiddenException(
        'Team unpaid view is only available to managers',
      );
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(today);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const bookings = await this.bookingRepo.find({
      where: {
        businessId,
        startTime: Between(today, dayEnd),
        paymentStatus: PaymentStatus.PENDING,
        status: In([
          BookingStatus.CONFIRMED,
          BookingStatus.IN_PROGRESS,
          BookingStatus.COMPLETED,
        ]),
      },
      relations: { customer: true, employee: true, service: true },
      order: { startTime: 'ASC' },
    });

    return {
      date: today.toISOString().slice(0, 10),
      totalUnpaid: bookings.length,
      bookings: bookings.map((booking) => ({
        id: booking.id,
        customerName: booking.customer?.name ?? 'Walk-in',
        employeeName: booking.employee?.name ?? 'Unassigned',
        serviceName: booking.service?.name ?? 'Appointment',
        startTime: booking.startTime,
        servicePrice: booking.service?.price ?? null,
      })),
    };
  }

  async getTeamWhosNext(
    businessId: string,
    userId: string,
  ): Promise<TeamWhosNextView> {
    const access = await this.resolveMobileAccess(businessId, userId);
    if (access.viewMode !== 'team') {
      throw new ForbiddenException(
        'Team queue view is only available to managers',
      );
    }

    const now = new Date();
    const business = await this.businessService.findOne(businessId);
    const settings = (business?.settings ?? {}) as Record<string, unknown>;
    const wallClockTz = resolveBusinessWallClockTimezone(
      business?.timezone,
      getBusinessDefaultLocale(settings),
    );
    const todayKey = getDateKeyInTimezone(now, wallClockTz);
    const { start: todayStart, end: todayEnd } = getUtcBoundsForDateKey(
      todayKey,
      'UTC',
    );

    const bookings = await this.bookingRepo.find({
      where: {
        businessId,
        startTime: Between(todayStart, todayEnd),
        status: Not(In([BookingStatus.CANCELLED])),
      },
      relations: { service: true, customer: true, employee: true },
      order: { startTime: 'ASC' },
    });

    return buildTeamWhosNextView(
      bookings,
      (booking, meta) => ({
        ...this.toBookingSummary(booking),
        isNext: meta.isNext,
        queuePosition: meta.queuePosition,
        teamFloorStatus: resolveTeamFloorChipStatus(booking),
      }),
      wallClockTz,
      now,
    );
  }

  async getUpcomingBookings(businessId: string, userId: string, days = 7) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + days);
    end.setUTCHours(23, 59, 59, 999);

    const where: Record<string, unknown> = {
      businessId,
      startTime: Between(start, end),
      status: In(ACTIVE_STATUSES),
    };
    if (access.viewMode === 'provider') {
      where.employeeId = access.employee!.id;
    }

    const bookings = await this.bookingRepo.find({
      where: where,
      relations: { service: true, customer: true, employee: true },
      order: { startTime: 'ASC' },
    });

    return {
      viewMode: access.viewMode,
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
      bookings: bookings.map((b) => this.toBookingSummary(b)),
    };
  }

  async getCalendarMonthSummary(
    businessId: string,
    userId: string,
    month?: string,
  ) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const trimmedMonth = month?.trim() ?? '';
    const normalizedMonth = trimmedMonth
      ? normalizeCalendarMonthKey(trimmedMonth)
      : null;
    if (trimmedMonth && !normalizedMonth) {
      throw new BadRequestException('Invalid month. Use YYYY-MM.');
    }
    const monthKey = normalizedMonth ?? new Date().toISOString().slice(0, 7);
    const { from, to } = resolveCalendarMonthBounds(monthKey);
    const { start, end } = isoDateRangeToUtcBounds({ start: from, end: to });

    const employeeIds =
      access.viewMode === 'provider' && access.employee
        ? [access.employee.id]
        : (
            await this.employeeRepo.find({
              where: { businessId, isActive: true },
              select: { id: true },
            })
          ).map((row) => row.id);

    const bookings = employeeIds.length
      ? await this.bookingRepo.find({
          where: {
            businessId,
            employeeId: In(employeeIds),
            startTime: Between(start, end),
          },
        })
      : [];

    const periods = employeeIds.length
      ? await this.schedulingPeriodRepo.find({
          where: {
            businessId,
            employeeId: In(employeeIds),
            startTime: Between(start, end),
          },
        })
      : [];

    return buildProviderCalendarMonthView({
      monthKey,
      viewMode: access.viewMode,
      bookings,
      periods,
      employeeCount: employeeIds.length,
    });
  }

  async createProviderSelfBlock(
    businessId: string,
    userId: string,
    dto: CreateProviderSelfBlockDto,
  ) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const business = await this.businessService.findOne(businessId);
    const settings = business?.settings as Record<string, unknown> | undefined;

    if (!isProviderSelfBlockEnabled(readProviderSelfBlockSettings(settings))) {
      throw new ForbiddenException(
        'Self-service schedule blocks are not enabled. Ask your manager to turn this on in Settings.',
      );
    }

    if (access.viewMode !== 'provider' || !access.employee?.id) {
      throw new ForbiddenException(
        'Schedule blocks on mobile are only available for your own provider calendar.',
      );
    }

    const startTime = buildProviderSelfBlockIso(dto.date, dto.startTime);
    const endTime = buildProviderSelfBlockIso(dto.date, dto.endTime);
    if (!startTime || !endTime) {
      throw new BadRequestException('Invalid date or time');
    }

    const validationError = validateProviderSelfBlockWindow(startTime, endTime);
    if (validationError) {
      throw new BadRequestException(validationError);
    }

    const blockDto = buildCreateBlockScheduleDto(access.employee.id, {
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      placeholder: dto.placeholder,
    });
    if (!blockDto) {
      throw new BadRequestException('Could not build schedule block');
    }

    const created = await this.blockScheduleService.create(
      businessId,
      blockDto,
      userId,
    );

    return {
      id: created.id,
      placeholder: created.placeholderLabel,
      startTime: created.singleStartTime,
      endTime: created.singleEndTime,
      employeeId: access.employee.id,
    };
  }

  /** ai-cmd-provider-5.6.6 — extend/push the end time of the provider's own most-recent one-off block. */
  async extendProviderSelfBlock(
    businessId: string,
    userId: string,
    dto: { extendMinutes?: number; newEndTime?: string },
  ) {
    const access = await this.resolveMobileAccess(businessId, userId);
    if (access.viewMode !== 'provider' || !access.employee?.id) {
      throw new ForbiddenException(
        'Schedule blocks on mobile are only available for your own provider calendar.',
      );
    }

    const blocks = await this.blockScheduleService.list(
      businessId,
      access.employee.id,
    );
    const candidate = blocks.find(
      (b) => !b.isRepetitive && b.singleStartTime && b.singleEndTime,
    );
    if (!candidate) {
      throw new NotFoundException(
        'No block found to extend. Create one first with "block my lunch".',
      );
    }

    let newEndIso: string;
    if (dto.newEndTime) {
      const datePart = candidate.singleStartTime!.slice(0, 10);
      const iso = buildProviderSelfBlockIso(datePart, dto.newEndTime);
      if (!iso) throw new BadRequestException('Invalid end time');
      newEndIso = iso;
    } else {
      const minutes = dto.extendMinutes ?? 30;
      newEndIso = new Date(
        new Date(candidate.singleEndTime!).getTime() + minutes * 60_000,
      ).toISOString();
    }

    const updated = await this.blockScheduleService.update(
      businessId,
      candidate.id,
      {
        employeeId: access.employee.id,
        placeholder: candidate.placeholderLabel ?? 'Blocked',
        isRepetitive: false,
        singleBlock: {
          startTime: candidate.singleStartTime!,
          endTime: newEndIso,
        },
      },
      userId,
    );

    return {
      id: updated.id,
      placeholder: updated.placeholderLabel,
      startTime: updated.singleStartTime,
      endTime: updated.singleEndTime,
      employeeId: access.employee.id,
    };
  }

  /** ai-cmd-provider-5.7.6 — explain this booking's cancel/reschedule policy and deposit-forfeiture exposure to the provider. */
  async explainCancelPolicyForBooking(
    businessId: string,
    userId: string,
    bookingId: string,
  ) {
    const booking = await this.getAccessibleBooking(
      businessId,
      userId,
      bookingId,
      'read',
    );
    const business = await this.businessService.findOne(businessId);
    const rawSettings = (business?.settings ?? {}) as Record<string, unknown>;

    const settings = resolveCustomerSelfServiceSettings(rawSettings);
    const payment = resolvePublicPaymentSettings(rawSettings);
    const settingsLines = buildCancelPolicySettingsLines(settings);
    const depositContext = buildCancelPolicyDepositContext({
      businessSettings: rawSettings,
      booking,
    });
    const depositLines = buildDepositForfeitureLines(depositContext);
    const generalDepositLine =
      depositLines.length === 0
        ? buildGeneralDepositForfeitureLine(settings, payment)
        : null;
    const bookingPolicy = {
      cancel: evaluateCustomerBookingPolicy(booking, settings, 'cancel'),
      reschedule: evaluateCustomerBookingPolicy(
        booking,
        settings,
        'reschedule',
      ),
      deposit: {
        prepaymentMode: depositContext.prepaymentMode,
        prepaymentDueAmount: depositContext.prepaymentDueAmount,
        paymentStatus: depositContext.paymentStatus,
        cancelAllowedNow: depositContext.cancelAllowedNow,
      },
    };

    return {
      customerName: booking.customer?.name ?? 'Client',
      settingsLines,
      depositLines,
      generalDepositLine,
      depositContext,
      bookingPolicy,
    };
  }

  async createProviderTimeOffRequest(
    businessId: string,
    userId: string,
    dto: CreateProviderTimeOffRequestDto,
  ) {
    const access = await this.resolveMobileAccess(businessId, userId);
    if (access.viewMode !== 'provider' || !access.employee?.id) {
      throw new ForbiddenException(
        'Time-off requests on mobile are only available for your own provider calendar.',
      );
    }

    return this.providerTimeOffService.createRequest(
      businessId,
      userId,
      access.employee.id,
      {
        startDate: dto.startDate,
        endDate: dto.endDate,
        dailyStartTime: dto.dailyStartTime?.trim() || '00:00',
        dailyEndTime: dto.dailyEndTime?.trim() || '23:59',
        reason: dto.reason,
      },
    );
  }

  async listProviderTimeOffRequests(
    businessId: string,
    userId: string,
    limit = 20,
  ) {
    const access = await this.resolveMobileAccess(businessId, userId);
    if (access.viewMode !== 'provider' || !access.employee?.id) {
      throw new ForbiddenException(
        'Time-off requests on mobile are only available for your own provider calendar.',
      );
    }

    return this.providerTimeOffService.listForEmployee(
      businessId,
      access.employee.id,
      limit,
    );
  }

  async cancelProviderTimeOffRequest(
    businessId: string,
    userId: string,
    requestId: string,
  ) {
    const access = await this.resolveMobileAccess(businessId, userId);
    if (access.viewMode !== 'provider' || !access.employee?.id) {
      throw new ForbiddenException(
        'Time-off requests on mobile are only available for your own provider calendar.',
      );
    }

    return this.providerTimeOffService.cancelRequest(
      businessId,
      access.employee.id,
      requestId,
    );
  }

  async getScheduleSummary(businessId: string, userId: string, days = 14) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + days);

    const where: Record<string, unknown> = {
      businessId,
      startTime: Between(start, end),
    };
    if (access.viewMode === 'provider') {
      where.employeeId = access.employee!.id;
    }

    const slots = await this.slotRepo.find({
      where: where,
      order: { startTime: 'ASC' },
      take: 500,
    });

    const byDay = new Map<string, { available: number; booked: number }>();
    for (const slot of slots) {
      const day = slot.startTime.toISOString().slice(0, 10);
      const entry = byDay.get(day) ?? { available: 0, booked: 0 };
      if (slot.status === 'available') entry.available += 1;
      if (slot.status === 'booked') entry.booked += 1;
      byDay.set(day, entry);
    }

    const business = await this.businessService.findOne(businessId);
    const settings = (business?.settings ?? {}) as Record<string, unknown>;
    const wallClockTz = resolveBusinessWallClockTimezone(
      business?.timezone,
      getBusinessDefaultLocale(settings),
    );
    const todayKey = getDateKeyInTimezone(new Date(), wallClockTz);
    const { start: todayStart, end: todayEnd } = getUtcBoundsForDateKey(
      todayKey,
      'UTC',
    );

    const todayWhere: Record<string, unknown> = {
      businessId,
      startTime: Between(todayStart, todayEnd),
      status: Not(In([BookingStatus.CANCELLED])),
    };
    if (access.viewMode === 'provider') {
      todayWhere.employeeId = access.employee!.id;
    }

    const todayBookings = await this.bookingRepo.find({
      where: todayWhere,
      relations: { customer: true },
      order: { startTime: 'ASC' },
    });

    const todayTimeline = buildProviderTodayTimelineView({
      enabled: providerMobileShowTodayTimeline(settings),
      date: todayKey,
      bookings: todayBookings.map((booking) => ({
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        customer: booking.customer ? { name: booking.customer.name } : null,
      })),
      timeZone: wallClockTz,
    });

    const timeOffRequests =
      access.viewMode === 'provider' && access.employee?.id
        ? await this.providerTimeOffService.listForEmployee(
            businessId,
            access.employee.id,
            10,
          )
        : [];

    return {
      viewMode: access.viewMode,
      employee: access.employee
        ? { id: access.employee.id, name: access.employee.name }
        : null,
      days: [...byDay.entries()].map(([date, counts]) => ({ date, ...counts })),
      todayTimeline,
      timeOffRequests,
    };
  }

  async getBookingsByDate(businessId: string, userId: string, dateKey: string) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const { start, end } = this.parseDateKeyBounds(dateKey);

    const where: Record<string, unknown> = {
      businessId,
      startTime: Between(start, end),
      status: Not(In([BookingStatus.CANCELLED])),
    };
    if (access.viewMode === 'provider') {
      where.employeeId = access.employee!.id;
    }

    const bookings = await this.bookingRepo.find({
      where,
      relations: { service: true, customer: true, employee: true },
      order: { startTime: 'ASC' },
    });

    return {
      date: dateKey,
      viewMode: access.viewMode,
      employee: access.employee
        ? { id: access.employee.id, name: access.employee.name }
        : null,
      bookings: bookings.map((b) => this.toBookingSummary(b)),
    };
  }

  async listScheduleGaps(businessId: string, userId: string, dateKey: string) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const business = await this.businessService.findOne(businessId);
    const settings = business?.settings as Record<string, unknown> | undefined;

    if (
      !isProviderOpenShiftsEnabled(readProviderOpenShiftsSettings(settings))
    ) {
      throw new ForbiddenException(
        'Open shifts are not enabled. Ask your manager to turn this on in Settings.',
      );
    }

    if (access.viewMode !== 'provider' || !access.employee?.id) {
      throw new ForbiddenException(
        'Open shift gaps are available on your own provider calendar only.',
      );
    }

    const normalizedDate = normalizeScheduleDateKey(dateKey);
    if (!normalizedDate) {
      throw new BadRequestException('Invalid date');
    }

    const { day, dayEnd } = resolveAvailabilityDayBounds(normalizedDate);
    const periods = await this.schedulingPeriodRepo.find({
      where: {
        businessId,
        employeeId: access.employee.id,
        startTime: Between(day, dayEnd),
      },
      order: { startTime: 'ASC' },
    });

    const gaps = findOpenShiftsInWindow(day, periods);

    return {
      date: normalizedDate,
      viewMode: access.viewMode,
      minGapMinutes: 30,
      gaps,
    };
  }

  async getProviderProfile(businessId: string, userId: string) {
    const access = await this.resolveMobileAccess(businessId, userId);
    if (!access.employee) {
      throw new ForbiddenException('No linked provider profile');
    }

    const employee = await this.employeeRepo.findOne({
      where: { id: access.employee.id, businessId, isActive: true },
    });
    if (!employee) {
      throw new NotFoundException('Provider profile not found');
    }

    const metadata = (employee.metadata ?? {}) as Record<string, string>;
    return {
      id: employee.id,
      name: employee.name,
      email: employee.email ?? null,
      phone: employee.phone ?? null,
      title: metadata.title ?? metadata.role ?? null,
      avatarUrl: metadata.avatarUrl ?? null,
      viewMode: access.viewMode,
    };
  }

  async updateProviderProfile(
    businessId: string,
    userId: string,
    dto: UpdateProviderProfileDto,
  ) {
    const access = await this.resolveMobileAccess(businessId, userId);
    if (!access.employee) {
      throw new ForbiddenException('No linked provider profile');
    }
    if (access.employee.userId !== userId) {
      throw new ForbiddenException(
        'You can only edit your own provider profile',
      );
    }

    const employee = await this.employeeRepo.findOne({
      where: { id: access.employee.id, businessId, isActive: true },
    });
    if (!employee) {
      throw new NotFoundException('Provider profile not found');
    }

    const metadata = {
      ...((employee.metadata ?? {}) as Record<string, unknown>),
    };
    if (dto.title !== undefined) {
      const trimmed = dto.title.trim();
      if (trimmed) metadata.title = trimmed;
      else delete metadata.title;
    }
    if (dto.avatarUrl !== undefined) {
      const trimmed = dto.avatarUrl.trim();
      if (trimmed) metadata.avatarUrl = trimmed;
      else delete metadata.avatarUrl;
    }
    employee.metadata = metadata;
    await this.employeeRepo.save(employee);
    return this.getProviderProfile(businessId, userId);
  }

  async getProviderReviewsInbox(
    businessId: string,
    userId: string,
    query: { last30d?: string; lowRating?: string },
  ) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const filters = normalizeProviderReviewsInboxFilters(query);
    const business = await this.businessService.findOne(businessId);
    const settings = (business?.settings ?? {}) as Record<string, unknown>;
    const marketing = mergeMarketingAutomationSettings(
      settings.marketingAutomation as Record<string, unknown> | undefined,
    );

    if (!access.employee) {
      return buildProviderReviewsInboxView({
        employeeId: null,
        reviews: [],
        filters,
        postVisitReviewEnabled: marketing.postVisitReviewEnabled,
      });
    }

    const reviews = await this.reviewRepo.find({
      where: { businessId, employeeId: access.employee.id },
      order: { createdAt: 'DESC' },
      take: PROVIDER_REVIEWS_INBOX_FETCH_LIMIT,
    });

    return buildProviderReviewsInboxView({
      employeeId: access.employee.id,
      reviews,
      filters,
      postVisitReviewEnabled: marketing.postVisitReviewEnabled,
    });
  }

  async requestBookingReview(
    businessId: string,
    userId: string,
    bookingId: string,
  ) {
    const booking = await this.getAccessibleBooking(
      businessId,
      userId,
      bookingId,
      'read',
    );
    const business = await this.businessService.findOne(businessId);
    const settings = (business?.settings ?? {}) as Record<string, unknown>;
    const marketing = mergeMarketingAutomationSettings(
      settings.marketingAutomation as Record<string, unknown> | undefined,
    );
    const hasExistingReview = await this.reviewRepo.exists({
      where: { businessId, bookingId: booking.id },
    });
    const eligibility = buildProviderReviewRequestEligibility({
      postVisitReviewEnabled: marketing.postVisitReviewEnabled,
      bookingStatus: booking.status,
      reviewSubmittedAt: booking.metadata?.reviewSubmittedAt,
      hasExistingReview,
      customerEmail: booking.customer?.email,
      customerPhone: booking.customer?.phone,
    });

    if (!eligibility.allowed) {
      throw new BadRequestException(
        eligibility.reason ?? 'Review request is not allowed for this booking',
      );
    }

    await this.reviewsService.ensureReviewToken(booking.id);
    await this.notificationsService.sendReviewRequest(booking.id);

    return {
      sent: true,
      bookingId: booking.id,
    };
  }

  async checkInBooking(businessId: string, userId: string, bookingId: string) {
    // Access check first (provider scope); claim serializes the write.
    await this.getAccessibleBooking(businessId, userId, bookingId);

    const claimed = await claimProviderBookingCheckIn(this.bookingRepo, {
      bookingId,
      businessId,
    });
    if (!claimed.ok) {
      if (claimed.code === 'not_found') {
        throw new NotFoundException(claimed.reason);
      }
      throw new BadRequestException(claimed.reason);
    }

    const saved = claimed.booking;
    await this.maybeNotifyReceptionOnCheckIn(businessId, userId, saved);

    return {
      bookingId: saved.id,
      checkedInAt: saved.checkedInAt!.toISOString(),
      floorStatus: resolveProviderBookingFloorStatus(saved),
    };
  }

  private async maybeNotifyReceptionOnCheckIn(
    businessId: string,
    actorUserId: string,
    booking: Booking,
  ): Promise<void> {
    if (!this.pushService.isConfigured) return;

    const business = await this.businessService.findOne(businessId);
    const settings = (business?.settings ?? {}) as Record<string, unknown>;
    if (!providerMobileNotifyReceptionOnCheckIn(settings)) return;

    const whenLabel = `${formatDateDisplay(booking.startTime)} ${formatTimeDisplay(booking.startTime)}`;
    const { title, body } = buildProviderCheckInPushMessage({
      customerName: booking.customer?.name ?? 'A client',
      serviceName: booking.service?.name ?? 'Appointment',
      providerName: booking.employee?.name ?? 'Provider',
      whenLabel,
    });
    const url = `/provider/today?bookingId=${booking.id}`;

    const managerUserIds = await this.findMobileManagerUserIds(businessId);
    for (const managerUserId of managerUserIds) {
      if (managerUserId === actorUserId) continue;
      await this.pushService.sendToUser(managerUserId, businessId, {
        title,
        body,
        url,
        bookingId: booking.id,
      });
    }
  }

  async markBookingRunningLate(
    businessId: string,
    userId: string,
    bookingId: string,
    minutesLate?: number,
  ) {
    return this.applyProviderVisitStatus(
      businessId,
      userId,
      bookingId,
      'running_late',
      minutesLate,
    );
  }

  async markBookingReadyNow(
    businessId: string,
    userId: string,
    bookingId: string,
  ) {
    return this.applyProviderVisitStatus(
      businessId,
      userId,
      bookingId,
      'ready_now',
    );
  }

  private async applyProviderVisitStatus(
    businessId: string,
    userId: string,
    bookingId: string,
    kind: ProviderVisitStatusKind,
    minutesLate?: number,
  ) {
    const booking = await this.getAccessibleBooking(
      businessId,
      userId,
      bookingId,
    );
    const eligibility = buildProviderVisitStatusEligibility(booking);
    if (!eligibility.allowed) {
      throw new BadRequestException(
        eligibility.reason ?? 'Visit status cannot be updated for this booking',
      );
    }

    const snapshot = buildProviderVisitStatusSnapshot({
      kind,
      minutesLate,
      markedByUserId: userId,
    });
    booking.metadata = applyProviderVisitStatusToMetadata(
      booking.metadata,
      snapshot,
    );
    const saved = await this.bookingRepo.save(booking);

    const business = await this.businessService.findOne(businessId);
    const settings = (business?.settings ?? {}) as Record<string, unknown>;
    let notifications: { smsSent: boolean; pushSent: boolean } | null = null;
    if (providerMobileNotifyCustomerOnVisitStatus(settings)) {
      notifications =
        await this.notificationsService.sendProviderVisitStatusToCustomer(
          saved.id,
          {
            kind,
            minutesLate: snapshot.minutesLate,
            providerName: saved.employee?.name ?? 'Provider',
          },
        );
    }

    return {
      bookingId: saved.id,
      visitStatus: snapshot,
      floorStatus: resolveProviderBookingFloorStatus(saved),
      notifications,
    };
  }

  async getProviderReviews(businessId: string, userId: string) {
    const access = await this.resolveMobileAccess(businessId, userId);
    if (!access.employee) {
      return {
        employeeId: null,
        averageRating: null,
        reviewCount: 0,
        reviews: [],
      };
    }

    const reviews = await this.reviewRepo.find({
      where: { businessId, employeeId: access.employee.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
        : null;

    return {
      employeeId: access.employee.id,
      averageRating,
      reviewCount,
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        customerName: review.customerName,
        createdAt: review.createdAt.toISOString(),
      })),
    };
  }

  async getMyStats(
    businessId: string,
    userId: string,
    query: { period?: string; scope?: string },
  ) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const period = normalizeProviderMyStatsPeriod(query.period);
    const scope = normalizeProviderMyStatsScope(query.scope);
    const canTeamRollup = canRequestProviderTeamStatsRollup(
      access.membershipRole,
    );

    if (scope === 'team' && !canTeamRollup) {
      throw new ForbiddenException('Team stats require manager access');
    }

    const range = resolveProviderMyStatsPeriodRange(period, getTodayDateKey());
    const { start, end } = isoDateRangeToUtcBounds({
      start: range.from,
      end: range.to,
    });
    const business = await this.businessService.findOne(businessId);
    const settings = (business?.settings ?? {}) as Record<string, unknown>;
    const currency = getBusinessDefaultCurrency(settings);
    const tipsEnabled = businessPaymentTipsEnabled(settings);

    if (scope === 'mine' && !access.employee) {
      return buildProviderMyStatsView({
        period,
        scope,
        range,
        canTeamRollup,
        currency,
        employeeCount: 0,
        bookings: [],
        periods: [],
        reviews: [],
        tipsEnabled,
      });
    }

    const employeeIds =
      scope === 'team'
        ? (
            await this.employeeRepo.find({
              where: { businessId, isActive: true },
              select: { id: true },
            })
          ).map((row) => row.id)
        : [access.employee!.id];

    const bookings = employeeIds.length
      ? await this.bookingRepo.find({
          where: {
            businessId,
            employeeId: In(employeeIds),
            startTime: Between(start, end),
          },
          relations: { service: true },
        })
      : [];

    const periods = employeeIds.length
      ? await this.schedulingPeriodRepo.find({
          where: {
            businessId,
            employeeId: In(employeeIds),
            startTime: Between(start, end),
          },
        })
      : [];

    const reviews = employeeIds.length
      ? await this.reviewRepo.find({
          where: {
            businessId,
            employeeId: In(employeeIds),
            createdAt: Between(start, end),
          },
        })
      : [];

    return buildProviderMyStatsView({
      period,
      scope,
      range,
      canTeamRollup,
      currency,
      employeeCount: employeeIds.length,
      bookings,
      periods,
      reviews,
      tipsEnabled,
    });
  }

  async findEmployeeUserId(employeeId: string): Promise<string | null> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId },
    });
    return employee?.userId ?? null;
  }

  async findMobileManagerUserIds(businessId: string): Promise<string[]> {
    const members = await this.memberRepo.find({
      where: {
        businessId,
        role: In(MOBILE_MANAGER_ROLES),
      },
    });
    return members.map((m) => m.userId);
  }

  async getBookingDetail(
    businessId: string,
    userId: string,
    bookingId: string,
  ) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const booking = await this.getAccessibleBooking(
      businessId,
      userId,
      bookingId,
      'read',
    );
    const detail = await this.toBookingDetail(booking, businessId);
    return {
      ...detail,
      reassign: buildProviderReassignEligibility(
        {
          viewMode: access.viewMode,
          employeeId: access.employee?.id ?? null,
        },
        booking,
      ),
    };
  }

  async getBookingReassignOptions(
    businessId: string,
    userId: string,
    bookingId: string,
  ) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const booking = await this.getAccessibleBooking(
      businessId,
      userId,
      bookingId,
      'read',
    );
    const eligibility = buildProviderReassignEligibility(
      {
        viewMode: access.viewMode,
        employeeId: access.employee?.id ?? null,
      },
      booking,
    );
    if (!eligibility.allowed) {
      return {
        allowed: false,
        reason: eligibility.reason,
        options: [],
      };
    }

    const business = await this.businessService.findOne(businessId);
    const timeZone = pickTimezone(business?.timezone);
    const isoDay = getDateKeyInTimezone(booking.startTime, timeZone);
    const timeSlot = formatZonedTime(booking.startTime, timeZone);
    const serviceName = booking.service?.name ?? 'appointment';

    const employees = await this.employeeRepo.find({
      where: { businessId, isActive: true },
      order: { name: 'ASC' },
    });

    const options: Array<{ id: string; name: string }> = [];
    for (const employee of filterReassignTargetEmployees(
      employees,
      booking.employeeId,
    )) {
      const check = await this.bookingSlotResolver.checkSlotAvailability(
        businessId,
        employee.id,
        employee.name,
        booking.serviceId,
        isoDay,
        timeSlot,
        timeZone,
      );
      if (check.available) {
        options.push({ id: employee.id, name: employee.name });
      }
    }

    return {
      allowed: true,
      reason: null,
      date: isoDay,
      timeSlot,
      serviceName,
      currentEmployee: booking.employee
        ? { id: booking.employee.id, name: booking.employee.name }
        : null,
      options,
    };
  }

  async reassignBooking(
    businessId: string,
    userId: string,
    bookingId: string,
    dto: ReassignProviderBookingDto,
  ) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const booking = await this.getAccessibleBooking(
      businessId,
      userId,
      bookingId,
    );
    const eligibility = buildProviderReassignEligibility(
      {
        viewMode: access.viewMode,
        employeeId: access.employee?.id ?? null,
      },
      booking,
    );
    if (!eligibility.allowed) {
      throw new ForbiddenException(
        eligibility.reason ?? 'Reassign not allowed',
      );
    }

    if (dto.employeeId === booking.employeeId) {
      throw new BadRequestException(
        'This appointment is already assigned to that provider',
      );
    }

    const targetEmployee = await this.employeeRepo.findOne({
      where: { id: dto.employeeId, businessId, isActive: true },
    });
    if (!targetEmployee) {
      throw new NotFoundException('Provider not found');
    }

    const business = await this.businessService.findOne(businessId);
    const timeZone = pickTimezone(business?.timezone);
    const isoDay = getDateKeyInTimezone(booking.startTime, timeZone);
    const timeSlot = formatZonedTime(booking.startTime, timeZone);
    const serviceName = booking.service?.name ?? 'appointment';

    const check = await this.bookingSlotResolver.checkSlotAvailability(
      businessId,
      targetEmployee.id,
      targetEmployee.name,
      booking.serviceId,
      isoDay,
      timeSlot,
      timeZone,
    );
    if (!check.available) {
      throw new ConflictException(
        this.bookingSlotResolver.describeUnavailable(
          check,
          serviceName,
          timeSlot,
          isoDay,
        ),
      );
    }

    const updated = await this.bookingService.update(
      booking.id,
      {
        employeeId: dto.employeeId,
        expectedUpdatedAt: dto.expectedUpdatedAt,
      },
      userId,
    );

    const detail = await this.toBookingDetail(updated, businessId);
    return {
      ...detail,
      reassign: buildProviderReassignEligibility(
        {
          viewMode: access.viewMode,
          employeeId: access.employee?.id ?? null,
        },
        updated,
      ),
    };
  }

  async getBookingCustomerContext(
    businessId: string,
    userId: string,
    bookingId: string,
  ) {
    const booking = await this.getAccessibleBooking(
      businessId,
      userId,
      bookingId,
    );
    if (!booking.customerId || !booking.customer) {
      throw new NotFoundException('Customer not linked to this booking');
    }

    const business = await this.businessService.findOne(businessId);
    const customerId = booking.customerId;

    const loyaltyAccount = await this.loyaltyService.getOrCreate(
      businessId,
      customerId,
    );

    const [
      earnRedeem,
      completedVisitCount,
      noShowCount,
      lastCompleted,
      recentCompleted,
    ] = await Promise.all([
      this.loyaltyService.getLastEarnRedeemTransactions(loyaltyAccount.id),
      this.bookingRepo.count({
        where: {
          businessId,
          customerId,
          status: BookingStatus.COMPLETED,
        },
      }),
      this.bookingRepo.count({
        where: {
          businessId,
          customerId,
          status: BookingStatus.NO_SHOW,
        },
      }),
      this.bookingRepo.findOne({
        where: {
          businessId,
          customerId,
          status: BookingStatus.COMPLETED,
        },
        order: { endTime: 'DESC' },
        select: { endTime: true },
      }),
      this.bookingRepo.find({
        where: {
          businessId,
          customerId,
          status: BookingStatus.COMPLETED,
          id: Not(bookingId),
        },
        relations: { service: true, employee: true },
        order: { endTime: 'DESC' },
        take: PROVIDER_RECENT_VISIT_LIMIT,
      }),
    ]);

    const loyaltySummary = this.loyaltyService.getPublicSummary(
      loyaltyAccount,
      business?.settings as Record<string, unknown> | undefined,
    );

    const referrerId = readReferredByCustomerId(booking.customer.metadata);
    const referrer = referrerId
      ? await this.customerRepo.findOne({
          where: { id: referrerId, businessId },
          select: { id: true, name: true },
        })
      : null;

    return buildProviderBookingCustomerContextView({
      customer: booking.customer,
      loyalty: {
        pointsBalance: loyaltySummary.pointsBalance,
        pointsValue: loyaltySummary.pointsValue,
        lifetimeEarned: loyaltySummary.lifetimeEarned,
        lastEarn: earnRedeem.lastEarn,
        lastRedeem: earnRedeem.lastRedeem,
      },
      completedVisitCount,
      lastCompletedVisitAt: lastCompleted?.endTime ?? null,
      noShowCount,
      referrer,
      recentCompletedVisits:
        buildProviderRecentCompletedVisits(recentCompleted),
      inactiveDaysThreshold: mergeMarketingAutomationSettings(
        (business?.settings as Record<string, unknown> | undefined)
          ?.marketingAutomation as Record<string, unknown> | undefined,
      ).inactiveDaysThreshold,
    });
  }

  async getBookingPreVisitIntakeSummary(
    businessId: string,
    userId: string,
    bookingId: string,
  ): Promise<ProviderPreVisitIntakeSummaryView> {
    const booking = await this.getAccessibleBooking(
      businessId,
      userId,
      bookingId,
      'read',
    );
    const business = await this.businessService.findOne(businessId);
    const businessType = readBusinessTypeFromSettings(
      business?.settings as Record<string, unknown> | undefined,
    );
    const hasPublishedQuestionnaire =
      await this.clinicPreVisitIntakeService.hasPublishedIntakeQuestionnaire(
        businessId,
      );
    const serviceOffersIntake = serviceOffersProviderPreVisitIntake({
      businessType,
      serviceMetadata: booking.service?.metadata,
      hasPublishedQuestionnaire,
    });

    const intakes = await this.intakeRepo.find({
      where: { businessId, bookingId },
      order: { createdAt: 'DESC' },
      take: 1,
    });
    const intake = intakes[0] ?? null;

    if (
      !shouldShowProviderPreVisitIntakeSection({
        serviceOffersIntake,
        hasIntakeRecord: !!intake,
      })
    ) {
      return buildProviderPreVisitIntakeSummaryView({
        visible: false,
        bookingId,
        canOpenDashboard: false,
      });
    }

    const access = await this.resolveMobileAccess(businessId, userId);
    const canOpenDashboard = isMobileManagerRole(access.membershipRole);

    if (!intake) {
      return buildProviderPreVisitIntakeSummaryView({
        visible: true,
        status: 'none',
        bookingId,
        canOpenDashboard,
      });
    }

    const questionnaire =
      await this.questionnairesService.getPublishedQuestionnaireOrThrow(
        businessId,
        intake.questionnaireId,
      );

    if (!intake.responseId) {
      return buildProviderPreVisitIntakeSummaryView({
        visible: true,
        intakeId: intake.id,
        questionnaireTitle: questionnaire.title,
        status: intake.status,
        completedAt: intake.completedAt?.toISOString() ?? null,
        bookingId,
        canOpenDashboard,
      });
    }

    const [flow, ctx] = await Promise.all([
      this.questionnaireEngineService.getResponseFlow(
        businessId,
        userId,
        intake.responseId,
      ),
      this.questionnairesService.loadFlowContext(intake.questionnaireId),
    ]);
    const { rows, totalAnswerCount } = buildProviderPreVisitIntakeAnswerRows(
      ctx,
      flow.answers,
    );

    return buildProviderPreVisitIntakeSummaryView({
      visible: true,
      intakeId: intake.id,
      questionnaireTitle: questionnaire.title,
      status: intake.status,
      completedAt: intake.completedAt?.toISOString() ?? null,
      answers: rows,
      totalAnswerCount,
      bookingId,
      canOpenDashboard,
    });
  }

  async listBookingCustomerStaffNotes(
    businessId: string,
    userId: string,
    bookingId: string,
  ): Promise<ProviderBookingCustomerStaffNotesListView> {
    const booking = await this.getAccessibleBooking(
      businessId,
      userId,
      bookingId,
      'read',
    );
    if (!booking.customerId) {
      throw new NotFoundException('Customer not linked to this booking');
    }

    const access = await this.buildProviderStaffNoteAccess(businessId, userId);
    const list = await this.staffNotesService.listNotesForCustomer(
      businessId,
      booking.customerId,
      access,
      { take: PROVIDER_CUSTOMER_STAFF_NOTES_LIST_LIMIT },
    );

    return {
      notes: list.notes,
      canCreate: access.canWrite,
      maxLength: PROVIDER_CUSTOMER_STAFF_NOTE_MAX_LENGTH,
    };
  }

  async createBookingCustomerStaffNote(
    businessId: string,
    userId: string,
    bookingId: string,
    dto: CreateProviderCustomerStaffNoteDto,
  ) {
    const booking = await this.getAccessibleBooking(
      businessId,
      userId,
      bookingId,
    );
    if (!booking.customerId) {
      throw new NotFoundException('Customer not linked to this booking');
    }

    const access = await this.buildProviderStaffNoteAccess(businessId, userId);
    const created = await this.staffNotesService.createNoteForCustomer(
      businessId,
      booking.customerId,
      access,
      { body: dto.body.trim(), bookingId },
    );

    return {
      note: created,
      maxLength: PROVIDER_CUSTOMER_STAFF_NOTE_MAX_LENGTH,
    };
  }

  private async buildProviderStaffNoteAccess(
    businessId: string,
    userId: string,
  ): Promise<PatientStaffNoteAccessContext> {
    const mobileAccess = await this.resolveMobileAccess(businessId, userId);
    const ctx = await this.staffNoteAccessService.resolveStaffContext(
      businessId,
      userId,
    );
    return {
      ctx,
      phiAccess: { hasAssignedBooking: true },
      canWrite: canWriteProviderBookingCustomerStaffNotes(mobileAccess),
    };
  }

  async updateBooking(
    businessId: string,
    userId: string,
    bookingId: string,
    dto: UpdateProviderBookingDto,
  ) {
    const booking = await this.getAccessibleBooking(
      businessId,
      userId,
      bookingId,
    );

    if (dto.status === BookingStatus.CANCELLED) {
      throw new BadRequestException(
        'Use the cancel endpoint to cancel an appointment',
      );
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cancelled appointments cannot be updated');
    }

    if (dto.employeeId && dto.employeeId !== booking.employeeId) {
      throw new BadRequestException(
        'Use the reassign endpoint to move this appointment to another provider on the same day',
      );
    }

    const updated = await this.bookingService.update(
      booking.id,
      {
        status: dto.status,
        paymentStatus: dto.paymentStatus,
        notes: dto.notes,
        startTime: dto.startTime,
        employeeId: dto.employeeId,
        serviceId: dto.serviceId,
        expectedUpdatedAt: dto.expectedUpdatedAt,
      },
      userId,
    );

    return this.toBookingDetail(updated, businessId);
  }

  async cancelBooking(
    businessId: string,
    userId: string,
    bookingId: string,
    dto: CancelProviderBookingDto,
  ) {
    await this.getAccessibleBooking(businessId, userId, bookingId);
    const { booking: cancelled } = await this.bookingService.cancel(
      bookingId,
      dto.reason?.trim() || 'Cancelled by provider',
      userId,
      dto.expectedUpdatedAt,
    );
    return this.toBookingDetail(cancelled, businessId);
  }

  async suggestCancelNote(
    businessId: string,
    userId: string,
    bookingId: string,
    dto: SuggestCancelNoteDto,
  ) {
    const booking = await this.getAccessibleBooking(
      businessId,
      userId,
      bookingId,
    );
    const customerName = booking.customer?.name ?? 'the customer';
    const serviceName = booking.service?.name ?? 'appointment';
    const when = booking.startTime.toISOString().slice(0, 16).replace('T', ' ');

    const userInput =
      dto.prompt?.trim() ||
      dto.draft?.trim() ||
      'Need to cancel this appointment';
    const fallback = dto.draft?.trim()
      ? dto.draft.trim()
      : `${customerName} cancelled the ${serviceName} scheduled for ${when}.`;

    if (!(await this.llm.isAvailableForBusiness(businessId))) {
      return { suggestion: fallback, aiAvailable: false };
    }

    const result = await this.llm.completeJson<{ note: string }>(
      businessId,
      `You help service providers write short, professional appointment cancellation notes for their records.
Return JSON: { "note": "..." }
Rules: one or two sentences max, no greeting, no quotes, factual and polite.`,
      `Appointment: ${serviceName} with ${customerName} at ${when}.
Provider input: "${userInput}"
Write a cancellation note the provider can save.`,
      {
        surface: 'provider_mobile',
        operation: 'suggest_cancel_note',
        actorType: 'provider',
        userId,
      },
      0.3,
    );

    return {
      suggestion: result?.note?.trim() || fallback,
      aiAvailable: true,
    };
  }

  getViewMode(access: MobileAccess): MobileViewMode {
    return access.viewMode;
  }

  getScopedEmployeeId(access: MobileAccess): string | undefined {
    return access.viewMode === 'provider' ? access.employee!.id : undefined;
  }

  private async getAccessibleBooking(
    businessId: string,
    userId: string,
    bookingId: string,
    accessMode: 'read' | 'mutate' = 'mutate',
  ): Promise<Booking> {
    const access = await this.resolveMobileAccess(businessId, userId);
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, businessId },
      relations: { service: true, customer: true, employee: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (access.viewMode === 'provider') {
      const isOwnBooking = booking.employeeId === access.employee?.id;
      const canReadTerminal =
        accessMode === 'read' &&
        TERMINAL_BOOKING_STATUSES.includes(booking.status);
      if (!isOwnBooking && !canReadTerminal) {
        throw new NotFoundException('Booking not found');
      }
    }

    return booking;
  }

  private async toBookingDetail(booking: Booking, businessId: string) {
    const business = await this.businessService.findOne(businessId);
    const settings = business?.settings as Record<string, unknown> | undefined;
    const marketing = mergeMarketingAutomationSettings(
      settings?.marketingAutomation as Record<string, unknown> | undefined,
    );
    const hasExistingReview = await this.reviewRepo.exists({
      where: { businessId, bookingId: booking.id },
    });
    const reviewRequest = buildProviderReviewRequestEligibility({
      postVisitReviewEnabled: marketing.postVisitReviewEnabled,
      bookingStatus: booking.status,
      reviewSubmittedAt: booking.metadata?.reviewSubmittedAt,
      hasExistingReview,
      customerEmail: booking.customer?.email,
      customerPhone: booking.customer?.phone,
    });
    const checkIn = buildProviderCheckInEligibility(booking);
    const visitStatusActions = buildProviderVisitStatusEligibility(booking);
    const retailPosEnabled = isProviderRetailPosEnabled(
      await this.retailPosService.hasConfiguredRetailProducts(businessId),
    );
    const checkout = await this.retailPosService.getBookingRetailSales(
      businessId,
      booking.id,
    );
    const retailLines = checkout.lines.map((line) => ({
      productName: line.productName,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    }));

    return {
      ...this.toBookingSummary(booking),
      paymentStatus: booking.paymentStatus,
      description: booking.description,
      cancellationReason: booking.cancellationReason,
      labFeaturesEnabled: isClinicLabFeaturesEnabled(
        readBusinessTypeFromSettings(settings),
      ),
      retailPosEnabled,
      customerContact: this.resolveProviderCustomerContact(
        settings,
        booking.customer?.phone,
      ),
      staffMessageTemplates: this.resolveStaffMessageTemplatesForBookingDetail(
        settings,
        booking,
        business?.name ?? 'Salon',
      ),
      paymentSummary: resolveBookingPaymentSummary(
        booking,
        retailLines,
        settings,
      ),
      checkoutContext: await this.buildBookingCheckoutContext(booking),
      reviewRequest,
      checkIn,
      visitStatus: readProviderVisitStatus(booking.metadata),
      visitStatusActions,
    };
  }

  private async buildBookingCheckoutContext(booking: Booking) {
    const subscriptionId = readSubscriptionIdFromBookingMetadata(
      booking.metadata,
    );

    const [packageSiblings, subscription, multiGroup, multiSiblings] =
      await Promise.all([
        booking.packagePurchaseId
          ? this.bookingRepo.find({
              where: {
                businessId: booking.businessId,
                packagePurchaseId: booking.packagePurchaseId,
              },
              relations: { service: true, employee: true },
            })
          : Promise.resolve([]),
        subscriptionId
          ? this.customerSubscriptionRepo.findOne({
              where: { id: subscriptionId, businessId: booking.businessId },
              relations: { plan: true },
            })
          : Promise.resolve(null),
        booking.multiServiceGroupId
          ? this.multiServiceGroupRepo.findOne({
              where: {
                id: booking.multiServiceGroupId,
                businessId: booking.businessId,
              },
            })
          : Promise.resolve(null),
        booking.multiServiceGroupId
          ? this.bookingRepo.find({
              where: {
                businessId: booking.businessId,
                multiServiceGroupId: booking.multiServiceGroupId,
              },
              relations: { service: true, employee: true },
            })
          : Promise.resolve([]),
      ]);

    return buildProviderBookingCheckoutContextView({
      package: buildProviderPackageBadge(booking, packageSiblings),
      subscription: subscription
        ? buildProviderSubscriptionBadge(subscription)
        : null,
      multiService:
        multiGroup && multiSiblings.length
          ? buildProviderMultiServiceBadge(
              multiGroup,
              multiSiblings,
              booking.id,
            )
          : null,
    });
  }

  private toBookingSummary(booking: Booking) {
    return {
      id: booking.id,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status,
      checkedInAt: booking.checkedInAt?.toISOString() ?? null,
      floorStatus: resolveProviderBookingFloorStatus(booking),
      visitStatus: readProviderVisitStatus(booking.metadata),
      notes: booking.notes,
      updatedAt: booking.updatedAt.toISOString(),
      service: booking.service
        ? {
            id: booking.service.id,
            name: booking.service.name,
            price: Number(booking.service.price),
            currency: booking.service.currency,
          }
        : null,
      customer: booking.customer
        ? {
            id: booking.customer.id,
            name: booking.customer.name,
            phone: booking.customer.phone,
            email: booking.customer.email,
          }
        : null,
      employee: booking.employee
        ? { id: booking.employee.id, name: booking.employee.name }
        : null,
    };
  }

  private parseDateKeyBounds(dateKey: string): { start: Date; end: Date } {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
    if (!match) {
      throw new BadRequestException('Invalid date. Use YYYY-MM-DD.');
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    return { start, end };
  }
}
