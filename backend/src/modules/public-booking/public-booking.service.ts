import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { BusinessService } from '../business/business.service.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service, PrepaymentMode } from '../service/entities/service.entity.js';
import { PaymentStatus } from '../booking/entities/booking.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { ensureBookingManageToken } from '../../common/utils/booking-manage-token.util.js';
import { resolveCheckoutPaymentStatus } from '../booking/booking-payment-status.util.js';
import { BookingService } from '../booking/booking.service.js';
import { CustomerService } from '../customer/customer.service.js';
import { SchedulingSlot, SlotStatus } from '../schedule/entities/scheduling-slot.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';
import { SchedulingEngineService } from '../../engine/scheduling/scheduling-engine.service.js';
import { CreatePublicBookingDto, PublicBookingQuoteDto, BookPublicPackageDto, PublicPackageQuoteDto, BookPublicMultiServiceDto, PublicMultiServiceQuoteDto } from './dto/public-booking.dto.js';
import { BookingPaymentService } from '../booking/booking-payment.service.js';
import { CheckoutPricingService } from '../promo-codes/checkout-pricing.service.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import { Business } from '../business/entities/business.entity.js';
import {
  resolveCustomerSelfServiceSettings,
  resolvePublicPaymentSettings,
} from '../../common/utils/customer-self-service.util.js';
import { readBusinessGiftCardSettings } from '../gift-cards/gift-card.types.js';
import {
  addDaysToDateKey,
  formatZonedDateLabel,
  getDateKeyInTimezone,
  getUtcBoundsForDateKey,
  isWallClockSlotBookable,
  resolveTimezone,
} from '../../common/utils/timezone.util.js';
import { formatTimeDisplay, toIsoDay } from '../../common/utils/date-format.util.js';
import { inferDefaultPhoneCountryCode } from '../../common/utils/phone-country.util.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import { ConfigService } from '@nestjs/config';
import { getBusinessZendeskIntegration } from '../integrations/zendesk/zendesk-integration.types.js';
import {
  buildMessagingLinksForBusiness,
  getDistributionIntegrations,
} from '../integrations/distribution/distribution-integration.types.js';
import { resolvePublicAssetUrl } from '../../common/utils/public-asset-url.util.js';
import { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import { ServicePackagesService } from '../service-packages/service-packages.service.js';
import { resolvePackageCheckoutGraceHours } from '../../common/utils/package-pricing.util.js';
import { validatePackageBookingLines, validatePackageSameDayBlock } from '../../common/utils/package-booking.util.js';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import {
  buildSequentialAppointments,
  employeeQualifiesForServices,
  normalizeMultiServiceIds,
  validatePerServiceLines,
} from '../../common/utils/multi-service-booking.util.js';
import type { MultiServiceSettings } from '../../common/utils/multi-service-settings.util.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import {
  assertValidCustomerReminderHours,
  buildBookingReminderMetadata,
  buildPublicAppointmentReminderSettings,
  mergeCustomerReminderChoiceSettings,
} from '../notifications/appointment-reminder-settings.util.js';

export interface PublicBranding {
  logoUrl?: string;
  primaryColor?: string;
  tagline?: string;
}

export interface PublicSocialLinks {
  website?: string;
  instagram?: string;
  facebook?: string;
  x?: string;
  tiktok?: string;
  linkedin?: string;
  youtube?: string;
}

export interface PublicLocation {
  mapEmbedHtml?: string;
}

export interface PublicSupportWidgets {
  zendeskWidgetKey?: string;
}

export interface PublicMetaBooking {
  bookingUrl: string;
  buttonLabel: string;
  facebookPageUrl?: string;
  instagramUsername?: string;
}

export interface PublicMessagingLinks {
  publicBookingUrl: string;
  telegramUrl?: string | null;
  whatsappUrl?: string | null;
  facebookBookingUrl?: string | null;
  instagramBookingUrl?: string | null;
}

export interface PublicBusinessProfile {
  id: string;
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  timezone: string;
  locale: string;
  branding: PublicBranding;
  social?: PublicSocialLinks;
  location?: PublicLocation;
  publicBookingEnabled: boolean;
  defaultPhoneCountryCode: string;
  onlinePaymentsEnabled: boolean;
  acceptCashPayments: boolean;
  customerSelfService: {
    allowCancel: boolean;
    allowReschedule: boolean;
    minimumNoticeHours: number;
    maxReschedulesPerBooking: number;
    allowProviderChangeOnReschedule: boolean;
  };
  giftCardsPurchaseEnabled: boolean;
  support?: PublicSupportWidgets;
  metaBooking?: PublicMetaBooking;
  messaging?: PublicMessagingLinks;
  multiService?: {
    enabled: boolean;
    maxServiceCount: number;
    maxDurationMinutes: number;
    turnoverBufferMinutes: number;
    schedulingMode: 'same_visit' | 'per_service';
    incompatiblePairMode: 'service' | 'category';
    incompatiblePairs: Array<[string, string]>;
    incompatibleCategoryPairs: Array<[string, string]>;
  };
  appointmentReminders?: {
    enabled: boolean;
    optionsHours: number[];
    defaultHours: number | null;
  };
}

export interface ProviderSlotPreview {
  startTime: string;
  endTime: string;
}

export interface PublicProviderReview {
  id: string;
  rating: number;
  comment: string | null;
  customerName: string | null;
  createdAt: string;
}

export interface PublicProvider {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  nearestDate: string | null;
  nearestDateLabel: string | null;
  slots: ProviderSlotPreview[];
  averageRating: number | null;
  reviewCount: number;
  recentReviews: PublicProviderReview[];
}

export interface NearestBookableSlot {
  employeeId: string;
  employeeName: string;
  dateKey: string;
  startTime: string;
}

export interface RecommendedProvider {
  id: string;
  name: string;
  role?: string;
  averageRating: number | null;
  reviewCount: number;
  earliestDateKey: string;
  earliestStartTime: string;
  previewTimes: string[];
  matchedServiceId: string;
  matchedServiceName: string;
}

export interface PublicServiceDaySlot {
  startTime: string;
  endTime: string;
  employeeId: string;
  employeeName: string;
}

export interface PublicServiceSlotProvider {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  averageRating: number | null;
  reviewCount: number;
}

const SCAN_DAYS = 14;
const SLOT_STEP_MINUTES = 30;

@Injectable()
export class PublicBookingService {
  constructor(
    private businessService: BusinessService,
    private bookingService: BookingService,
    private customerService: CustomerService,
    private schedulingEngine: SchedulingEngineService,
    private stripeIntegrationService: StripeIntegrationService,
    private reviewsService: ReviewsService,
    @Inject(forwardRef(() => BookingPaymentService))
    private bookingPaymentService: BookingPaymentService,
    private checkoutPricingService: CheckoutPricingService,
    private loyaltyService: LoyaltyService,
    private subscriptionsService: ServiceSubscriptionsService,
    private packagesService: ServicePackagesService,
    private multiServiceBookingsService: MultiServiceBookingsService,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(SchedulingSlot) private slotRepo: Repository<SchedulingSlot>,
    @InjectRepository(SchedulingPeriod) private schedulingPeriodRepo: Repository<SchedulingPeriod>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
  ) {}

  async resolveBusiness(slug: string): Promise<Business> {
    const business = await this.businessService.findBySlug(slug);
    if (!business.isActive) {
      throw new ForbiddenException('This business is not accepting bookings');
    }
    return business;
  }

  private publicApiBaseUrl(): string {
    return this.configService.get<string>('PUBLIC_API_URL') || 'http://localhost:3001';
  }

  private resolvePublicMediaUrl(url: string | undefined | null): string | undefined {
    return resolvePublicAssetUrl(url, this.publicApiBaseUrl());
  }

  toPublicProfile(business: Business): PublicBusinessProfile {
    const settings = business.settings || {};
    const branding = settings.branding || {};
    const publicBooking = settings.publicBooking || {};
    const social = settings.social || {};
    const location = settings.location || {};
    const zendesk = getBusinessZendeskIntegration(settings);
    const dist = getDistributionIntegrations(settings);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const bookingUrl = `${frontendUrl.replace(/\/$/, '')}/book/${business.slug}`;

    const zendeskWidgetKey =
      zendesk.enabled && zendesk.widgetEnabledOnPublicBooking && zendesk.widgetKey?.trim()
        ? zendesk.widgetKey.trim()
        : undefined;

    const messagingLinks = buildMessagingLinksForBusiness(business, frontendUrl);
    const hasMessaging =
      messagingLinks.telegramUrl ||
      messagingLinks.whatsappUrl ||
      messagingLinks.facebookBookingUrl ||
      messagingLinks.instagramBookingUrl;

    return {
      id: business.id,
      name: business.name,
      slug: business.slug,
      description: business.description ?? undefined,
      phone: business.phone ?? undefined,
      email: business.email ?? undefined,
      address: business.address ?? undefined,
      timezone: business.timezone,
      locale: settings.locale || 'en',
      branding: {
        logoUrl: this.resolvePublicMediaUrl(branding.logoUrl),
        primaryColor: branding.primaryColor || '#7c3aed',
        tagline: branding.tagline,
      },
      social: {
        website: social.website,
        instagram: social.instagram,
        facebook: social.facebook,
        x: social.x || social.twitter,
        tiktok: social.tiktok,
        linkedin: social.linkedin,
        youtube: social.youtube,
      },
      location: {
        mapEmbedHtml: location.mapEmbedHtml,
      },
      publicBookingEnabled: publicBooking.enabled !== false,
      defaultPhoneCountryCode: inferDefaultPhoneCountryCode(settings, business.timezone),
      onlinePaymentsEnabled: this.stripeIntegrationService.isConnectReady(settings),
      acceptCashPayments: resolvePublicPaymentSettings(settings).acceptCashPayments,
      customerSelfService: resolveCustomerSelfServiceSettings(settings),
      giftCardsPurchaseEnabled: readBusinessGiftCardSettings(settings).purchaseEnabled,
      ...(zendeskWidgetKey ? { support: { zendeskWidgetKey } } : {}),
      ...(dist.metaBooking?.enabled
        ? {
            metaBooking: {
              bookingUrl,
              buttonLabel: dist.metaBooking.bookingButtonLabel || 'Book online',
              facebookPageUrl: dist.metaBooking.facebookPageUrl,
              instagramUsername: dist.metaBooking.instagramUsername,
            },
          }
        : {}),
      ...(hasMessaging ? { messaging: messagingLinks } : {}),
      ...this.mapPublicMultiServiceSettings(business),
      ...(buildPublicAppointmentReminderSettings(settings)
        ? { appointmentReminders: buildPublicAppointmentReminderSettings(settings)! }
        : {}),
    };
  }

  private resolvePublicBookingReminderMetadata(
    business: Business,
    contact: CreatePublicBookingDto['customer'],
  ): Record<string, number | null> {
    const reminderSettings = mergeCustomerReminderChoiceSettings(business.settings?.notifications);
    assertValidCustomerReminderHours(contact.reminderHoursBefore, reminderSettings);
    return buildBookingReminderMetadata(contact.reminderHoursBefore, reminderSettings);
  }

  private mapPublicMultiServiceSettings(business: Business) {
    const ms = this.multiServiceBookingsService.resolveSettingsFromBusiness(business);
    if (!ms.enabled) return {};
    return {
      multiService: {
        enabled: true,
        maxServiceCount: ms.maxServiceCount,
        maxDurationMinutes: ms.maxDurationMinutes,
        turnoverBufferMinutes: ms.turnoverBufferMinutes,
        schedulingMode: ms.schedulingMode,
        incompatiblePairMode: ms.incompatiblePairMode,
        incompatiblePairs: ms.incompatiblePairs,
        incompatibleCategoryPairs: ms.incompatibleCategoryPairs,
      },
    };
  }

  private mapPublicService(
    service: Service,
    onlinePaymentsEnabled: boolean,
    hasSubscriptionPlans = false,
  ) {
    const wantsOnline = service.prepaymentMode !== PrepaymentMode.NONE;
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      bufferMinutes: service.bufferMinutes,
      price: Number(service.price),
      currency: service.currency,
      prepaymentMode: service.prepaymentMode,
      onlinePaymentEnabled: onlinePaymentsEnabled && wantsOnline,
      depositAmount: service.depositAmount != null ? Number(service.depositAmount) : null,
      hasSubscriptionPlans,
      category: service.category
        ? {
            id: service.category.id,
            name: service.category.name,
            sortOrder: service.category.sortOrder,
          }
        : null,
    };
  }

  private sortPublicServices<T extends { category?: { sortOrder: number; name: string } | null; name: string }>(
    services: T[],
  ): T[] {
    return [...services].sort((a, b) => {
      const aOrder = a.category?.sortOrder ?? 9999;
      const bOrder = b.category?.sortOrder ?? 9999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      const aCat = a.category?.name ?? '';
      const bCat = b.category?.name ?? '';
      if (aCat !== bCat) return aCat.localeCompare(bCat);
      return a.name.localeCompare(b.name);
    });
  }

  async getProfile(slug: string): Promise<PublicBusinessProfile> {
    const business = await this.resolveBusiness(slug);
    return this.toPublicProfile(business);
  }

  async getProviders(slug: string, date?: string): Promise<{ providers: PublicProvider[] }> {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);

    const employees = await this.employeeRepo.find({
      where: { businessId: business.id, isActive: true },
      order: { name: 'ASC' },
    });

    const tz = resolveTimezone(business.timezone);
    const todayKey = getDateKeyInTimezone(new Date(), tz);
    // Scan from business-local today, but date keys align with UTC schedule days
    const startDateKey = date?.match(/^\d{4}-\d{2}-\d{2}$/) ? date : todayKey;

    const reviewSummaries = await this.reviewsService.getPublicReviewsByEmployees(
      business.id,
      employees.map((e) => e.id),
    );

    const providers = await Promise.all(
      employees.map(async (employee) => {
        const preview = await this.buildProviderPreview(
          business.id,
          employee,
          startDateKey,
          todayKey,
          tz,
        );
        const reviews = reviewSummaries.get(employee.id);
        return {
          ...preview,
          averageRating: reviews?.averageRating ?? null,
          reviewCount: reviews?.reviewCount ?? 0,
          recentReviews: reviews?.recentReviews ?? [],
        };
      }),
    );

    return { providers };
  }

  async recommendProviders(
    slug: string,
    options: {
      serviceId?: string;
      serviceIds?: string[];
      dateKeys: string[];
      notBeforeTime?: string | null;
      limit?: number;
    },
  ): Promise<{ providers: RecommendedProvider[] }> {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);
    const tz = resolveTimezone(business.timezone);

    const requestedIds = [
      ...(options.serviceIds ?? []),
      ...(options.serviceId ? [options.serviceId] : []),
    ];
    const uniqueIds = [...new Set(requestedIds)];

    let employees = await this.employeeRepo.find({
      where: { businessId: business.id, isActive: true },
    });

    let matchedServices: Service[] = [];
    if (uniqueIds.length > 0) {
      matchedServices = await this.serviceRepo.find({
        where: { id: In(uniqueIds), businessId: business.id, isActive: true },
      });
      if (!matchedServices.length) return { providers: [] };

      employees = employees.filter((employee) =>
        matchedServices.some(
          (service) => !employee.serviceIds?.length || employee.serviceIds.includes(service.id),
        ),
      );
    }

    if (!employees.length) return { providers: [] };

    const reviewSummaries = await this.reviewsService.getPublicReviewsByEmployees(
      business.id,
      employees.map((e) => e.id),
    );

    const sortedDateKeys = [...options.dateKeys].sort();
    const candidates: RecommendedProvider[] = [];

    for (const employee of employees) {
      let earliestDateKey: string | null = null;
      let earliestStartTime: string | null = null;
      let previewTimes: string[] = [];
      let matchedService: Service | null = null;

      for (const dateKey of sortedDateKeys) {
        for (const service of matchedServices.length ? matchedServices : []) {
          if (employee.serviceIds?.length && !employee.serviceIds.includes(service.id)) {
            continue;
          }

          const rawSlots = await this.getEmployeeStartTimes(business.id, employee, dateKey);
          const upcoming = rawSlots.filter((startTime) =>
            isWallClockSlotBookable(
              dateKey,
              formatTimeDisplay(startTime),
              tz,
              options.notBeforeTime ?? null,
            ),
          );

          const bookable = await this.filterStartTimesWithService(
            business.id,
            employee,
            upcoming,
            service,
          );
          if (bookable.length === 0) continue;

          if (
            !earliestDateKey ||
            dateKey < earliestDateKey ||
            (dateKey === earliestDateKey &&
              earliestStartTime &&
              bookable[0].toISOString() < earliestStartTime)
          ) {
            earliestDateKey = dateKey;
            earliestStartTime = bookable[0].toISOString();
            previewTimes = bookable.slice(0, 4).map((s) => formatTimeDisplay(s));
            matchedService = service;
          }
        }

        if (matchedServices.length === 0) {
          const rawSlots = await this.getEmployeeStartTimes(business.id, employee, dateKey);
          const upcoming = rawSlots.filter((startTime) =>
            isWallClockSlotBookable(
              dateKey,
              formatTimeDisplay(startTime),
              tz,
              options.notBeforeTime ?? null,
            ),
          );
          const bookable = await this.filterStartTimesWithAnyBookableService(
            business.id,
            employee,
            upcoming,
          );
          if (bookable.length === 0) continue;

          if (
            !earliestDateKey ||
            dateKey < earliestDateKey ||
            (dateKey === earliestDateKey &&
              earliestStartTime &&
              bookable[0].toISOString() < earliestStartTime)
          ) {
            earliestDateKey = dateKey;
            earliestStartTime = bookable[0].toISOString();
            previewTimes = bookable.slice(0, 4).map((s) => formatTimeDisplay(s));
          }
        }
      }

      if (!earliestDateKey || !earliestStartTime) continue;

      const reviews = reviewSummaries.get(employee.id);
      const metadata = employee.metadata || {};
      candidates.push({
        id: employee.id,
        name: employee.name,
        role: metadata.role || metadata.title,
        averageRating: reviews?.averageRating ?? null,
        reviewCount: reviews?.reviewCount ?? 0,
        earliestDateKey,
        earliestStartTime,
        previewTimes,
        matchedServiceId: matchedService?.id ?? matchedServices[0]?.id ?? '',
        matchedServiceName: matchedService?.name ?? matchedServices[0]?.name ?? '',
      });
    }

    candidates.sort((a, b) => {
      const aRating = a.averageRating ?? -1;
      const bRating = b.averageRating ?? -1;
      if (bRating !== aRating) return bRating - aRating;
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
      return a.name.localeCompare(b.name);
    });

    const limit = options.limit ?? 5;
    return { providers: candidates.slice(0, limit) };
  }

  async getProviderSlots(
    slug: string,
    employeeId: string,
    date: string,
    options?: { serviceId?: string; notBeforeTime?: string | null },
  ) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);

    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, businessId: business.id, isActive: true },
    });
    if (!employee) throw new NotFoundException('Provider not found');

    const tz = resolveTimezone(business.timezone);
    const rawSlots = await this.getEmployeeStartTimes(business.id, employee, date);
    const upcoming = rawSlots.filter((startTime) =>
      isWallClockSlotBookable(date, formatTimeDisplay(startTime), tz, options?.notBeforeTime ?? null),
    );

    let slots: Date[];
    if (options?.serviceId) {
      const service = await this.serviceRepo.findOne({
        where: { id: options.serviceId, businessId: business.id, isActive: true },
      });
      if (!service) throw new NotFoundException('Service not found');
      slots = await this.filterStartTimesWithService(business.id, employee, upcoming, service);
    } else {
      slots = await this.filterStartTimesWithAnyBookableService(business.id, employee, upcoming);
    }

    return {
      date,
      employeeId,
      employeeName: employee.name,
      slots: slots.map((startTime) => ({
        startTime: startTime.toISOString(),
        endTime: new Date(startTime.getTime() + SLOT_STEP_MINUTES * 60000).toISOString(),
      })),
    };
  }

  async getServiceDaySlots(
    slug: string,
    serviceId: string,
    date: string,
    options?: { notBeforeTime?: string | null },
  ): Promise<{
    date: string;
    serviceId: string;
    serviceName: string;
    slots: PublicServiceDaySlot[];
  }> {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);

    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, businessId: business.id, isActive: true },
    });
    if (!service) throw new NotFoundException('Service not found');

    const tz = resolveTimezone(business.timezone);
    let employees = await this.employeeRepo.find({
      where: { businessId: business.id, isActive: true },
      order: { name: 'ASC' },
    });

    employees = employees.filter((employee) => {
      if (!employee.serviceIds?.length) return true;
      return employee.serviceIds.includes(service.id);
    });

    const slotMap = new Map<string, PublicServiceDaySlot>();

    for (const employee of employees) {
      const rawSlots = await this.getEmployeeStartTimes(business.id, employee, date);
      const upcoming = rawSlots.filter((startTime) =>
        isWallClockSlotBookable(date, formatTimeDisplay(startTime), tz, options?.notBeforeTime ?? null),
      );
      const bookable = await this.filterStartTimesWithService(business.id, employee, upcoming, service);

      for (const startTime of bookable) {
        const key = startTime.toISOString();
        if (slotMap.has(key)) continue;
        const endTime = new Date(
          startTime.getTime() + (service.durationMinutes + service.bufferMinutes) * 60000,
        );
        slotMap.set(key, {
          startTime: key,
          endTime: endTime.toISOString(),
          employeeId: employee.id,
          employeeName: employee.name,
        });
      }
    }

    const slots = [...slotMap.values()].sort((a, b) => a.startTime.localeCompare(b.startTime));

    return {
      date,
      serviceId: service.id,
      serviceName: service.name,
      slots,
    };
  }

  async resolveEmployeeForServiceSlot(
    slug: string,
    serviceId: string,
    startTime: string,
  ): Promise<{ employeeId: string; employeeName: string } | null> {
    const { providers } = await this.getProvidersForServiceSlot(slug, serviceId, startTime);
    if (!providers.length) return null;
    return { employeeId: providers[0].id, employeeName: providers[0].name };
  }

  async getProvidersForServiceSlot(
    slug: string,
    serviceId: string,
    startTime: string,
  ): Promise<{ providers: PublicServiceSlotProvider[] }> {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);

    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, businessId: business.id, isActive: true },
    });
    if (!service) throw new NotFoundException('Service not found');

    const start = new Date(startTime);
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException('Invalid start time');
    }

    let employees = await this.employeeRepo.find({
      where: { businessId: business.id, isActive: true },
      order: { name: 'ASC' },
    });

    employees = employees.filter((employee) => {
      if (!employee.serviceIds?.length) return true;
      return employee.serviceIds.includes(service.id);
    });

    const reviewSummaries = await this.reviewsService.getPublicReviewsByEmployees(
      business.id,
      employees.map((e) => e.id),
    );

    const providers: PublicServiceSlotProvider[] = [];

    for (const employee of employees) {
      if (!(await this.canBookServiceAt(business.id, employee.id, start, service))) {
        continue;
      }

      const metadata = employee.metadata || {};
      const reviews = reviewSummaries.get(employee.id);
      providers.push({
        id: employee.id,
        name: employee.name,
        role: metadata.role || metadata.title,
        avatarUrl: this.resolvePublicMediaUrl(metadata.avatarUrl),
        averageRating: reviews?.averageRating ?? null,
        reviewCount: reviews?.reviewCount ?? 0,
      });
    }

    return { providers };
  }

  async getServices(slug: string, employeeId?: string) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);

    let services = await this.serviceRepo.find({
      where: { businessId: business.id, isActive: true },
      relations: { category: true },
      order: { name: 'ASC' },
    });

    if (employeeId) {
      const employee = await this.employeeRepo.findOne({
        where: { id: employeeId, businessId: business.id, isActive: true },
      });
      if (!employee) throw new NotFoundException('Provider not found');
      if (employee.serviceIds?.length) {
        services = services.filter((s) => employee.serviceIds.includes(s.id));
      }
    }

    const planServiceIds = await this.subscriptionsService.serviceIdsWithActivePlans(business.id);
    const planSet = new Set(planServiceIds);
    const paymentsReady = this.stripeIntegrationService.isConnectReady(business.settings);

    return {
      services: this.sortPublicServices(
        services.map((s) =>
          this.mapPublicService(s, paymentsReady, planSet.has(s.id)),
        ),
      ),
    };
  }

  async getServiceSubscriptionPlans(slug: string, serviceId: string) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);
    const plans = await this.subscriptionsService.listPlans(business.id, serviceId);
    return plans.map((plan) => ({
      ...plan,
      preview: this.subscriptionsService.previewFromPlan(plan, Number(plan.service.price)),
    }));
  }

  async getCustomerSubscriptions(slug: string, customerId: string) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);
    return this.subscriptionsService.listCustomerSubscriptions(business.id, customerId);
  }

  async getActiveCustomerSubscriptionForService(
    slug: string,
    customerId: string,
    serviceId: string,
  ) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);
    const sub = await this.subscriptionsService.getActiveForCustomerService(
      business.id,
      customerId,
      serviceId,
    );
    return { subscription: sub };
  }

  async getServicesForSlot(slug: string, employeeId: string, startTime: string) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);

    let { services } = await this.getServices(slug, employeeId);
    const start = new Date(startTime);

    const allowedIds = await this.bookingService.getAllowedServiceIdsAtInstant(
      business.id,
      employeeId,
      start,
    );
    if (allowedIds !== null) {
      if (allowedIds.length === 0) {
        return { services: [] };
      }
      services = services.filter((s) => allowedIds.includes(s.id));
    }

    const eligible: Array<{
      id: string;
      name: string;
      description: string | null;
      durationMinutes: number;
      bufferMinutes: number;
      price: number;
      currency: string;
    }> = [];
    for (const service of services) {
      const totalDuration = service.durationMinutes + service.bufferMinutes;
      const end = new Date(start.getTime() + totalDuration * 60000);
      try {
        await this.bookingService.validateServiceFitsWindow(
          business.id,
          employeeId,
          start,
          end,
          service.id,
        );
        eligible.push(service);
      } catch {
        /* service duration does not fit this start time */
      }
    }

    return { services: eligible };
  }

  async explainServiceSlotFit(
    slug: string,
    employeeId: string,
    startTime: string,
    serviceId: string,
  ) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);
    return this.bookingService.explainServiceSlotFit(
      business.id,
      employeeId,
      new Date(startTime),
      serviceId,
    );
  }

  async findNearestBookableSlot(
    slug: string,
    options: {
      serviceId: string;
      employeeId?: string | null;
      notBeforeTime?: string | null;
      startDateKey?: string | null;
    },
  ): Promise<NearestBookableSlot | null> {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);

    const service = await this.serviceRepo.findOne({
      where: { id: options.serviceId, businessId: business.id, isActive: true },
    });
    if (!service) return null;

    const tz = resolveTimezone(business.timezone);
    const todayKey = getDateKeyInTimezone(new Date(), tz);
    const startKey = options.startDateKey
      ? toIsoDay(options.startDateKey, tz)
      : todayKey;

    let employees: Employee[];
    if (options.employeeId) {
      const employee = await this.employeeRepo.findOne({
        where: { id: options.employeeId, businessId: business.id, isActive: true },
      });
      if (!employee) return null;
      employees = [employee];
    } else {
      employees = await this.employeeRepo.find({
        where: { businessId: business.id, isActive: true },
        order: { name: 'ASC' },
      });
    }

    employees = employees.filter((employee) => {
      if (!employee.serviceIds?.length) return true;
      return employee.serviceIds.includes(service.id);
    });
    if (!employees.length) return null;

    let best: { employee: Employee; dateKey: string; startTime: Date } | null = null;

    for (let offset = 0; offset < SCAN_DAYS; offset++) {
      const dateKey = addDaysToDateKey(startKey, offset, tz);

      for (const employee of employees) {
        const daySlots = await this.getEmployeeStartTimes(business.id, employee, dateKey);

        for (const startTime of daySlots) {
          const timeSlot = formatTimeDisplay(startTime);
          if (!isWallClockSlotBookable(dateKey, timeSlot, tz, options.notBeforeTime ?? null)) {
            continue;
          }

          const endTime = new Date(
            startTime.getTime() + (service.durationMinutes + service.bufferMinutes) * 60000,
          );
          try {
            await this.bookingService.validateServiceFitsWindow(
              business.id,
              employee.id,
              startTime,
              endTime,
              service.id,
            );
          } catch {
            continue;
          }

          if (!best || startTime.getTime() < best.startTime.getTime()) {
            best = { employee, dateKey, startTime };
          }
        }
      }
    }

    if (!best) return null;

    return {
      employeeId: best.employee.id,
      employeeName: best.employee.name,
      dateKey: best.dateKey,
      startTime: best.startTime.toISOString(),
    };
  }

  async resolvePublicBookingCustomer(
    businessId: string,
    contact: CreatePublicBookingDto['customer'],
    authenticatedCustomerId?: string,
  ) {
    if (!authenticatedCustomerId) {
      return this.customerService.findOrCreateByContact(businessId, {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        emailReminders: contact.emailReminders,
        smsReminders: contact.smsReminders,
        whatsappReminders: contact.whatsappReminders,
        privacyConsentAccepted: contact.privacyConsentAccepted,
        marketingOptIn: contact.marketingOptIn,
      });
    }

    const customer = await this.customerService.findOne(authenticatedCustomerId);
    if (customer.businessId !== businessId || !customer.isActive) {
      throw new UnauthorizedException('Customer session expired');
    }

    const saved = await this.customerService.findOrCreateByContact(businessId, {
      name: contact.name?.trim() || customer.name,
      email: customer.email ?? contact.email,
      phone: contact.phone?.trim() || customer.phone,
      emailReminders: contact.emailReminders,
      smsReminders: contact.smsReminders,
      whatsappReminders: contact.whatsappReminders,
    });

    if (saved.customer.id !== customer.id) {
      throw new BadRequestException('Contact details do not match your signed-in account');
    }

    return { customer: saved.customer, created: false };
  }

  async quoteCheckout(
    slug: string,
    dto: PublicBookingQuoteDto,
    authenticatedCustomerId?: string,
  ) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);

    const service = await this.serviceRepo.findOne({
      where: { id: dto.serviceId, businessId: business.id, isActive: true },
    });
    if (!service) throw new NotFoundException('Service not found');

    return this.bookingPaymentService.resolveCheckoutPricing(
      business.id,
      service,
      {
        serviceId: dto.serviceId,
        startTime: new Date().toISOString(),
        customer: { name: 'Quote' },
        promoCode: dto.promoCode,
        loyaltyPointsToRedeem: dto.loyaltyPointsToRedeem,
        purchasePlanId: dto.purchasePlanId,
      },
      authenticatedCustomerId,
    );
  }

  async getCustomerLoyalty(slug: string, customerId: string) {
    const business = await this.resolveBusiness(slug);
    const account = await this.loyaltyService.getOrCreate(business.id, customerId);
    return this.loyaltyService.getPublicSummary(account, business.settings);
  }

  async getCustomerSubscriptionUsage(slug: string, customerId: string, subscriptionId: string) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);
    return this.subscriptionsService.getCustomerSubscriptionUsage(
      business.id,
      customerId,
      subscriptionId,
    );
  }

  async getPublicPackages(slug: string) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);
    const graceHours = resolvePackageCheckoutGraceHours(business.settings);
    const packages = await this.packagesService.listPublicPackages(business.id, graceHours);
    return { packages };
  }

  async getPublicPackage(slug: string, packageId: string) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);
    const graceHours = resolvePackageCheckoutGraceHours(business.settings);
    const pkg = await this.packagesService.getPublicPackage(business.id, packageId, graceHours);
    return { package: pkg };
  }

  async suggestPackageLineSlots(slug: string, packageId: string) {
    const ctx = await this.resolvePackageBlockContext(slug, packageId);
    let block: Awaited<ReturnType<PublicBookingService['suggestPackageBlock']>>;
    try {
      block = await this.suggestPackageBlock(slug, packageId);
    } catch {
      throw new BadRequestException('No available same-day block found for this package');
    }

    const sequential = buildSequentialAppointments(
      ctx.services,
      new Date(block.startTime),
      ctx.settings.turnoverBufferMinutes,
    );
    const nameByServiceId = new Map(ctx.services.map((svc) => [svc.serviceId, svc.name ?? '']));

    return {
      dateKey: block.dateKey,
      blockStartTime: block.startTime,
      lines: sequential.map((appt) => ({
        serviceId: appt.serviceId,
        serviceName: nameByServiceId.get(appt.serviceId) ?? '',
        startTime: appt.startTime.toISOString(),
        employeeId: block.employeeId,
        employeeName: block.employeeName,
      })),
    };
  }

  async suggestPackageBlock(slug: string, packageId: string) {
    const { serviceIds } = await this.resolvePackageBlockContext(slug, packageId);
    return this.suggestMultiServiceBlock(slug, serviceIds);
  }

  async getPackageBlockDaySlots(slug: string, packageId: string, date: string) {
    const { serviceIds } = await this.resolvePackageBlockContext(slug, packageId);
    return this.getMultiServiceBlockDaySlots(slug, serviceIds, date);
  }

  async getPackageBlockProviders(
    slug: string,
    packageId: string,
    startTime: string,
    includeLaterDays = false,
  ) {
    const { serviceIds } = await this.resolvePackageBlockContext(slug, packageId);
    return this.getMultiServiceBlockProviders(slug, serviceIds, startTime, includeLaterDays);
  }

  async quotePackageCheckout(
    slug: string,
    dto: PublicPackageQuoteDto,
    authenticatedCustomerId?: string,
  ) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);
    return this.bookingPaymentService.resolvePackageCheckoutPricing(
      business.id,
      dto.packageId,
      {
        promoCode: dto.promoCode,
        loyaltyPointsToRedeem: dto.loyaltyPointsToRedeem,
      },
      authenticatedCustomerId,
    );
  }

  async bookPackage(
    slug: string,
    dto: BookPublicPackageDto,
    authenticatedCustomerId?: string,
  ) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);

    if (!dto.customer.email && !dto.customer.phone) {
      throw new BadRequestException('Email or phone number is required');
    }

    const graceHours = resolvePackageCheckoutGraceHours(business.settings);
    const pkg = await this.packagesService.assertPackageBookable(
      business.id,
      dto.packageId,
      graceHours,
    );

    try {
      validatePackageBookingLines(this.packagesService.expectedLineServiceIds(pkg), dto.lines);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }

    const serviceIds = this.packagesService.expectedLineServiceIds(pkg);
    const services = await this.loadOrderedMultiServiceLines(business.id, serviceIds);
    const settings = this.multiServiceBookingsService.resolveSettingsFromBusiness(business);

    try {
      validatePackageSameDayBlock(services, dto.lines, settings.turnoverBufferMinutes);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }

    for (const line of dto.lines) {
      if (!line.employeeId) {
        const resolved = await this.resolveEmployeeForServiceSlot(
          slug,
          line.serviceId,
          line.startTime,
        );
        if (!resolved) {
          throw new BadRequestException('One or more selected time slots are no longer available');
        }
        line.employeeId = resolved.employeeId;
      }
    }

    const primaryEmployeeId = dto.lines[0].employeeId!;
    for (const line of dto.lines) {
      line.employeeId = primaryEmployeeId;
    }

    const blockStart = new Date(dto.lines[0].startTime);
    const fits = await this.validateMultiServiceBlockAt(
      business.id,
      primaryEmployeeId,
      blockStart,
      services,
      settings.turnoverBufferMinutes,
    );
    if (!fits) {
      throw new BadRequestException('That time block is no longer available');
    }

    const pricing = await this.bookingPaymentService.resolvePackageCheckoutPricing(
      business.id,
      dto.packageId,
      dto,
      authenticatedCustomerId,
    );

    const paymentsReady = this.stripeIntegrationService.isConnectReady(business.settings);
    if (paymentsReady && pricing.amountDue > 0 && !dto.markPaid) {
      throw new BadRequestException(
        'Online payment is required for this package. Complete payment at checkout.',
      );
    }

    const { customer, created } = await this.resolvePublicBookingCustomer(
      business.id,
      dto.customer,
      authenticatedCustomerId,
    );

    const preview = this.packagesService.previewFromPackage(pkg);
    const purchase = await this.packagesService.createPackagePurchase(
      business.id,
      pkg.id,
      customer.id,
      pricing.amountDue,
      preview.currency,
    );

    const paymentStatus = dto.markPaid ? PaymentStatus.PAID : PaymentStatus.NOT_APPLICABLE;
    const bookings: Awaited<ReturnType<BookingService['create']>>[] = [];
    const sameVisitMultiService = dto.lines.length > 1;
    for (const line of dto.lines) {
      const booking = await this.bookingService.create(
        business.id,
        {
          employeeId: line.employeeId!,
          serviceId: line.serviceId,
          customerId: customer.id,
          startTime: line.startTime,
          notes: dto.notes,
          packagePurchaseId: purchase.id,
          metadata: {
            source: 'public_package_booking',
            packageId: pkg.id,
            packageName: pkg.name,
            packagePurchaseId: purchase.id,
            ...this.resolvePublicBookingReminderMetadata(business, dto.customer),
          },
        },
        undefined,
        { paymentStatus, sameVisitMultiService },
      );
      bookings.push(booking);
    }

    await this.checkoutPricingService.applyRedemptions(
      business.id,
      customer.id,
      pricing,
      bookings[0]?.id,
    );

    await this.notificationsService.sendMultiAppointmentConfirmation(
      bookings.map((b) => b.id),
    );

    return {
      packagePurchase: purchase,
      bookings,
      customer: { id: customer.id, name: customer.name, created },
      pricing,
    };
  }

  async getMultiServiceSettings(slug: string) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);
    return this.multiServiceBookingsService.resolveSettingsFromBusiness(business);
  }

  async previewMultiServiceSelection(slug: string, serviceIds: string[]) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);
    return this.multiServiceBookingsService.previewTotals(business.id, serviceIds);
  }

  async getMultiServiceBlockDaySlots(slug: string, serviceIds: string[], date: string) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);
    const normalizedIds = normalizeMultiServiceIds(serviceIds);
    const settings = this.multiServiceBookingsService.resolveSettingsFromBusiness(business);
    const preview = await this.multiServiceBookingsService.previewTotals(business.id, normalizedIds);
    const services = await this.loadOrderedMultiServiceLines(business.id, normalizedIds);
    const employees = await this.findQualifiedMultiServiceEmployees(business.id, normalizedIds);
    if (!employees.length) {
      throw new BadRequestException('No provider can perform all selected services');
    }

    const tz = resolveTimezone(business.timezone);
    const slotMap = new Map<string, PublicServiceDaySlot>();

    for (const employee of employees) {
      const rawSlots = await this.getMultiServiceBlockStartCandidates(
        business.id,
        employee,
        date,
        normalizedIds,
        preview.totals!.blockDurationMinutes,
      );
      const upcoming = rawSlots.filter((startTime) =>
        isWallClockSlotBookable(date, formatTimeDisplay(startTime), tz, null),
      );

      for (const startTime of upcoming) {
        const fits = await this.validateMultiServiceBlockAt(
          business.id,
          employee.id,
          startTime,
          services,
          settings.turnoverBufferMinutes,
        );
        if (!fits) continue;
        const key = startTime.toISOString();
        if (slotMap.has(key)) continue;
        const endTime = new Date(
          startTime.getTime() + preview.totals!.blockDurationMinutes * 60_000,
        );
        slotMap.set(key, {
          startTime: key,
          endTime: endTime.toISOString(),
          employeeId: employee.id,
          employeeName: employee.name,
        });
      }
    }

    return {
      date,
      serviceIds: normalizedIds,
      totalDurationMinutes: preview.totals!.blockDurationMinutes,
      slots: [...slotMap.values()].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    };
  }

  async suggestMultiServiceBlock(slug: string, serviceIds: string[]) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);
    const normalizedIds = normalizeMultiServiceIds(serviceIds);
    const settings = this.multiServiceBookingsService.resolveSettingsFromBusiness(business);
    const preview = await this.multiServiceBookingsService.previewTotals(business.id, normalizedIds);
    const services = await this.loadOrderedMultiServiceLines(business.id, normalizedIds);
    const employees = await this.findQualifiedMultiServiceEmployees(business.id, normalizedIds);
    if (!employees.length) {
      throw new BadRequestException('No provider can perform all selected services');
    }
    const tz = resolveTimezone(business.timezone);
    const todayKey = getDateKeyInTimezone(new Date(), tz);
    const blockDurationMinutes = preview.totals!.blockDurationMinutes;

    type BlockSuggestion = { employee: Employee; dateKey: string; startTime: Date };
    let blockSuggestion: BlockSuggestion | undefined;

    outer: for (let offset = 0; offset < SCAN_DAYS; offset++) {
      const dateKey = addDaysToDateKey(todayKey, offset, tz);
      for (const employee of employees) {
        const daySlots = await this.getMultiServiceBlockStartCandidates(
          business.id,
          employee,
          dateKey,
          normalizedIds,
          blockDurationMinutes,
        );
        for (const startTime of daySlots) {
          if (!isWallClockSlotBookable(dateKey, formatTimeDisplay(startTime), tz, null)) continue;
          const fits = await this.validateMultiServiceBlockAt(
            business.id,
            employee.id,
            startTime,
            services,
            settings.turnoverBufferMinutes,
          );
          if (!fits) continue;
          if (!blockSuggestion || startTime.getTime() < blockSuggestion.startTime.getTime()) {
            blockSuggestion = { employee, dateKey, startTime };
          }
        }
      }
      if (blockSuggestion) break outer;
    }

    if (!blockSuggestion) {
      throw new BadRequestException('No available block found for the selected services');
    }

    return {
      employeeId: blockSuggestion.employee.id,
      employeeName: blockSuggestion.employee.name,
      dateKey: blockSuggestion.dateKey,
      startTime: blockSuggestion.startTime.toISOString(),
    };
  }

  async getMultiServiceBlockProviders(
    slug: string,
    serviceIds: string[],
    startTime: string,
    includeLaterDays = false,
  ) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);
    const normalizedIds = normalizeMultiServiceIds(serviceIds);
    const settings = this.multiServiceBookingsService.resolveSettingsFromBusiness(business);
    const services = await this.loadOrderedMultiServiceLines(business.id, normalizedIds);
    const employees = await this.findQualifiedMultiServiceEmployees(business.id, normalizedIds);
    const start = new Date(startTime);
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException('Invalid start time');
    }

    const reviewSummaries = await this.reviewsService.getPublicReviewsByEmployees(
      business.id,
      employees.map((e) => e.id),
    );

    const providers: Array<PublicServiceSlotProvider & { earliestStartTime?: string }> = [];

    for (const employee of employees) {
      if (includeLaterDays) {
        const earliest = await this.suggestMultiServiceBlockForEmployee(
          business,
          employee,
          normalizedIds,
          services,
          settings,
        );
        if (!earliest) continue;
        providers.push(
          this.mapMultiServiceProvider(employee, reviewSummaries, earliest.startTime),
        );
        continue;
      }

      const fits = await this.validateMultiServiceBlockAt(
        business.id,
        employee.id,
        start,
        services,
        settings.turnoverBufferMinutes,
      );
      if (!fits) continue;
      providers.push(this.mapMultiServiceProvider(employee, reviewSummaries));
    }

    return { providers };
  }

  async suggestMultiServicePerServiceLines(slug: string, serviceIds: string[]) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);
    await this.multiServiceBookingsService.previewTotals(business.id, serviceIds);

    const suggestions: Array<{
      serviceId: string;
      serviceName: string;
      startTime: string;
      employeeId: string;
      employeeName: string;
    }> = [];

    let notBefore: string | null = null;
    for (const serviceId of serviceIds) {
      const service = await this.serviceRepo.findOne({
        where: { id: serviceId, businessId: business.id, isActive: true },
      });
      const nearest = await this.findNearestBookableSlot(slug, {
        serviceId,
        notBeforeTime: notBefore,
      });
      if (!nearest) {
        throw new BadRequestException(
          `No available slot found for ${service?.name ?? 'a selected service'}`,
        );
      }
      suggestions.push({
        serviceId,
        serviceName: service?.name ?? '',
        startTime: nearest.startTime,
        employeeId: nearest.employeeId,
        employeeName: nearest.employeeName,
      });
      notBefore = nearest.startTime;
    }

    return { lines: suggestions };
  }

  async quoteMultiServiceCheckout(
    slug: string,
    dto: PublicMultiServiceQuoteDto,
    authenticatedCustomerId?: string,
  ) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);
    return this.bookingPaymentService.resolveMultiServiceCheckoutPricing(
      business.id,
      dto.serviceIds,
      dto,
      authenticatedCustomerId,
    );
  }

  async bookMultiService(
    slug: string,
    dto: BookPublicMultiServiceDto,
    authenticatedCustomerId?: string,
  ) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);

    if (!dto.customer.email && !dto.customer.phone) {
      throw new BadRequestException('Email or phone number is required');
    }

    const settings = this.multiServiceBookingsService.resolveSettingsFromBusiness(business);
    const preview = await this.multiServiceBookingsService.previewTotals(
      business.id,
      dto.serviceIds,
    );
    const services = await this.loadOrderedMultiServiceLines(business.id, dto.serviceIds);
    const serviceNames = await this.loadMultiServiceNames(business.id, dto.serviceIds);

    const pricing = await this.bookingPaymentService.resolveMultiServiceCheckoutPricing(
      business.id,
      dto.serviceIds,
      dto,
      authenticatedCustomerId,
    );

    const paymentsReady = this.stripeIntegrationService.isConnectReady(business.settings);
    if (paymentsReady && pricing.amountDue > 0 && !dto.markPaid) {
      throw new BadRequestException(
        'Online payment is required for this booking. Complete payment at checkout.',
      );
    }

    const { customer, created } = await this.resolvePublicBookingCustomer(
      business.id,
      dto.customer,
      authenticatedCustomerId,
    );

    let appointments: Array<{ serviceId: string; employeeId: string; startTime: string }> = [];
    let blockStartTime: Date | null = null;
    let primaryEmployeeId: string | null = null;

    if (settings.schedulingMode === 'per_service') {
      if (!dto.lines?.length) {
        throw new BadRequestException('Schedule each selected service before checkout');
      }
      try {
        validatePerServiceLines(dto.serviceIds, dto.lines);
      } catch (err) {
        throw new BadRequestException((err as Error).message);
      }
      for (const line of dto.lines) {
        if (!line.employeeId) {
          const resolved = await this.resolveEmployeeForServiceSlot(
            slug,
            line.serviceId,
            line.startTime,
          );
          if (!resolved) {
            throw new BadRequestException('One or more selected time slots are no longer available');
          }
          line.employeeId = resolved.employeeId;
        }
      }
      appointments = dto.lines.map((line) => ({
        serviceId: line.serviceId,
        employeeId: line.employeeId!,
        startTime: line.startTime,
      }));
    } else {
      if (!dto.blockStartTime) {
        throw new BadRequestException('Select a time block for your visit');
      }
      let employeeId = dto.employeeId;
      if (!employeeId) {
        const providers = await this.getMultiServiceBlockProviders(
          slug,
          dto.serviceIds,
          dto.blockStartTime,
          false,
        );
        if (!providers.providers.length) {
          throw new BadRequestException('That time block is no longer available');
        }
        employeeId = providers.providers[0].id;
      }

      const blockStart = new Date(dto.blockStartTime);
      const sequential = buildSequentialAppointments(
        services,
        blockStart,
        settings.turnoverBufferMinutes,
      );
      const fits = await this.validateMultiServiceBlockAt(
        business.id,
        employeeId,
        blockStart,
        services,
        settings.turnoverBufferMinutes,
      );
      if (!fits) {
        throw new BadRequestException('That time block is no longer available');
      }

      blockStartTime = blockStart;
      primaryEmployeeId = employeeId;
      appointments = sequential.map((line) => ({
        serviceId: line.serviceId,
        employeeId: employeeId!,
        startTime: line.startTime.toISOString(),
      }));
    }

    await this.assertMultiServiceAppointmentsAvailable(
      business.id,
      settings,
      services,
      appointments,
    );

    const group = await this.multiServiceBookingsService.createGroup({
      businessId: business.id,
      customerId: customer.id,
      schedulingMode: settings.schedulingMode,
      totals: preview.totals!,
      blockStartTime,
      primaryEmployeeId,
      metadata: {
        serviceIds: dto.serviceIds,
        serviceNames,
        schedulingMode: settings.schedulingMode,
      },
    });

    const paymentStatus = dto.markPaid ? PaymentStatus.PAID : PaymentStatus.NOT_APPLICABLE;
    const bookings: Awaited<ReturnType<BookingService['create']>>[] = [];
    const sameVisitMultiService =
      settings.schedulingMode === 'same_visit' && appointments.length > 1;

    for (const appt of appointments) {
      const booking = await this.bookingService.create(
        business.id,
        {
          employeeId: appt.employeeId,
          serviceId: appt.serviceId,
          customerId: customer.id,
          startTime: appt.startTime,
          notes: dto.notes,
          multiServiceGroupId: group.id,
          metadata: {
            source: 'public_multi_service_booking',
            multiServiceGroupId: group.id,
            groupLabel: serviceNames.join(' + '),
            schedulingMode: settings.schedulingMode,
            ...this.resolvePublicBookingReminderMetadata(business, dto.customer),
          },
        },
        undefined,
        { paymentStatus, sameVisitMultiService },
      );
      bookings.push(booking);
    }

    await this.checkoutPricingService.applyRedemptions(
      business.id,
      customer.id,
      pricing,
      bookings[0]?.id,
    );

    await this.notificationsService.sendMultiAppointmentConfirmation(
      bookings.map((b) => b.id),
    );

    return {
      multiServiceGroup: group,
      bookings,
      customer: { id: customer.id, name: customer.name, created },
      pricing,
    };
  }

  private async resolvePackageBlockContext(slug: string, packageId: string) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);
    const graceHours = resolvePackageCheckoutGraceHours(business.settings);
    const pkg = await this.packagesService.assertPackageBookable(
      business.id,
      packageId,
      graceHours,
    );
    const serviceIds = this.packagesService.expectedLineServiceIds(pkg);
    const settings = this.multiServiceBookingsService.resolveSettingsFromBusiness(business);
    const preview = await this.multiServiceBookingsService.previewTotals(business.id, serviceIds);
    const services = await this.loadOrderedMultiServiceLines(business.id, serviceIds);
    const employees = await this.findQualifiedMultiServiceEmployees(business.id, serviceIds);
    if (!employees.length) {
      throw new BadRequestException('No provider can perform all included package services');
    }
    return {
      business,
      pkg,
      serviceIds,
      settings,
      preview,
      services,
      employees,
    };
  }

  private async loadOrderedMultiServiceLines(businessId: string, serviceIds: string[]) {
    const loaded = await this.multiServiceBookingsService.loadServicesForSelection(
      businessId,
      serviceIds,
    );
    const byId = new Map(loaded.map((svc) => [svc.serviceId, svc]));
    return serviceIds.map((id) => {
      const svc = byId.get(id);
      if (!svc) throw new NotFoundException('Service not found');
      return svc;
    });
  }

  private async loadMultiServiceNames(businessId: string, serviceIds: string[]) {
    const lines = await this.loadOrderedMultiServiceLines(businessId, serviceIds);
    return lines.map((line) => line.name ?? line.serviceId);
  }

  private async findQualifiedMultiServiceEmployees(businessId: string, serviceIds: string[]) {
    const employees = await this.employeeRepo.find({
      where: { businessId, isActive: true },
      order: { name: 'ASC' },
    });
    return employees.filter((employee) =>
      employeeQualifiesForServices(employee.serviceIds, serviceIds),
    );
  }

  private async validateMultiServiceBlockAt(
    businessId: string,
    employeeId: string,
    blockStart: Date,
    services: Array<{ serviceId: string; durationMinutes: number; bufferMinutes: number }>,
    turnoverBufferMinutes: number,
  ): Promise<boolean> {
    const sequential = buildSequentialAppointments(services, blockStart, turnoverBufferMinutes);
    if (!sequential.length) return false;

    const blockEnd = sequential[sequential.length - 1].endTime;
    const serviceIds = services.map((svc) => svc.serviceId);

    try {
      await this.bookingService.validateMultiServiceBlockFits(
        businessId,
        employeeId,
        sequential[0].startTime,
        blockEnd,
        serviceIds,
      );
      return true;
    } catch {
      return false;
    }
  }

  private async assertMultiServiceAppointmentsAvailable(
    businessId: string,
    settings: MultiServiceSettings,
    services: Array<{ serviceId: string; durationMinutes: number; bufferMinutes: number }>,
    appointments: Array<{ serviceId: string; employeeId: string; startTime: string }>,
  ): Promise<void> {
    if (settings.schedulingMode === 'same_visit' && appointments.length > 1) {
      const blockStart = new Date(appointments[0].startTime);
      const employeeId = appointments[0].employeeId;
      const fits = await this.validateMultiServiceBlockAt(
        businessId,
        employeeId,
        blockStart,
        services,
        settings.turnoverBufferMinutes,
      );
      if (!fits) {
        throw new BadRequestException('That time block is no longer available');
      }
      return;
    }

    for (const appt of appointments) {
      const svc = services.find((entry) => entry.serviceId === appt.serviceId);
      if (!svc) throw new BadRequestException('One or more selected services are unavailable');

      const start = new Date(appt.startTime);
      const end = new Date(start.getTime() + (svc.durationMinutes + svc.bufferMinutes) * 60_000);
      try {
        await this.bookingService.validateServiceFitsWindow(
          businessId,
          appt.employeeId,
          start,
          end,
          appt.serviceId,
        );
      } catch {
        throw new BadRequestException('One or more selected time slots are no longer available');
      }
    }
  }

  private mapMultiServiceProvider(
    employee: Employee,
    reviewSummaries: Map<string, { averageRating: number | null; reviewCount: number }>,
    earliestStartTime?: string,
  ): PublicServiceSlotProvider & { earliestStartTime?: string } {
    const summary = reviewSummaries.get(employee.id);
    const metadata = employee.metadata || {};
    return {
      id: employee.id,
      name: employee.name,
      role: metadata.role || metadata.title,
      avatarUrl: this.resolvePublicMediaUrl(metadata.avatarUrl),
      averageRating: summary?.averageRating ?? null,
      reviewCount: summary?.reviewCount ?? 0,
      ...(earliestStartTime ? { earliestStartTime } : {}),
    };
  }

  private async suggestMultiServiceBlockForEmployee(
    business: Business,
    employee: Employee,
    serviceIds: string[],
    services: Array<{ serviceId: string; durationMinutes: number; bufferMinutes: number }>,
    settings: MultiServiceSettings,
  ): Promise<{ startTime: string } | null> {
    const tz = resolveTimezone(business.timezone);
    const todayKey = getDateKeyInTimezone(new Date(), tz);

    const blockDurationMinutes =
      services.reduce((sum, svc) => sum + svc.durationMinutes + svc.bufferMinutes, 0) +
      Math.max(0, services.length - 1) * Math.max(0, settings.turnoverBufferMinutes);

    for (let offset = 0; offset < SCAN_DAYS; offset++) {
      const dateKey = addDaysToDateKey(todayKey, offset, tz);
      const daySlots = await this.getMultiServiceBlockStartCandidates(
        business.id,
        employee,
        dateKey,
        serviceIds,
        blockDurationMinutes,
      );
      for (const startTime of daySlots) {
        if (!isWallClockSlotBookable(dateKey, formatTimeDisplay(startTime), tz, null)) continue;
        const fits = await this.validateMultiServiceBlockAt(
          business.id,
          employee.id,
          startTime,
          services,
          settings.turnoverBufferMinutes,
        );
        if (fits) return { startTime: startTime.toISOString() };
      }
    }
    return null;
  }

  async createBooking(slug: string, dto: CreatePublicBookingDto, authenticatedCustomerId?: string) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);

    if (!dto.customer.email && !dto.customer.phone) {
      throw new BadRequestException('Email or phone number is required');
    }

    const service = await this.serviceRepo.findOne({
      where: { id: dto.serviceId, businessId: business.id, isActive: true },
    });
    if (!service) throw new NotFoundException('Service not found');

    const paymentsReady = this.stripeIntegrationService.isConnectReady(business.settings);
    const prepaymentRequired = paymentsReady && service.prepaymentMode !== PrepaymentMode.NONE;

    let useSubscriptionId = dto.useSubscriptionId;

    const pricing = await this.bookingPaymentService.resolveCheckoutPricing(
      business.id,
      service,
      dto,
      authenticatedCustomerId,
    );

    const subscriptionCoversVisit = Boolean(useSubscriptionId);
    if (subscriptionCoversVisit && prepaymentRequired && pricing.amountDue > 0 && !dto.markPaid) {
      // Subscription credit — no service fee due
    } else if (
      prepaymentRequired &&
      pricing.amountDue > 0 &&
      !dto.markPaid &&
      !dto.purchasePlanId &&
      dto.paymentMethod !== 'cash'
    ) {
      throw new BadRequestException(
        'Online payment is required for this service. Complete payment at checkout.',
      );
    }

    let employeeId = dto.employeeId;
    if (!employeeId) {
      const resolved = await this.resolveEmployeeForServiceSlot(slug, dto.serviceId, dto.startTime);
      if (!resolved) {
        throw new BadRequestException('That time slot is no longer available');
      }
      employeeId = resolved.employeeId;
    }

    const { customer, created } = await this.resolvePublicBookingCustomer(
      business.id,
      dto.customer,
      authenticatedCustomerId,
    );

    if (dto.purchasePlanId) {
      const purchased = await this.subscriptionsService.assignSubscription(
        business.id,
        customer.id,
        dto.purchasePlanId,
        {
          pricePaid:
            dto.metadata?.subscriptionPricePaid != null
              ? Number(dto.metadata.subscriptionPricePaid)
              : undefined,
        },
      );
      if (dto.useSubscriptionCreditOnPurchase !== false) {
        useSubscriptionId = purchased.id;
      }
    }

    if (useSubscriptionId) {
      await this.subscriptionsService.assertCanConsume(
        business.id,
        useSubscriptionId,
        customer.id,
        dto.serviceId,
      );
    }

    const cashPaymentsAllowed = resolvePublicPaymentSettings(business.settings).acceptCashPayments;
    const wantsCash = dto.paymentMethod === 'cash';
    if (wantsCash) {
      if (!cashPaymentsAllowed) {
        throw new BadRequestException('Cash payments are not accepted for online booking');
      }
      if (dto.purchasePlanId) {
        throw new BadRequestException('Subscription purchases require online payment');
      }
      if (prepaymentRequired && pricing.amountDue > 0 && !subscriptionCoversVisit) {
        throw new BadRequestException(
          'This service requires online prepayment; pay in cash is not available',
        );
      }
    }

    const paymentStatus = useSubscriptionId
      ? PaymentStatus.NOT_APPLICABLE
      : dto.markPaid
        ? PaymentStatus.PAID
        : wantsCash && pricing.amountDue > 0
          ? PaymentStatus.PENDING
          : resolveCheckoutPaymentStatus(pricing);

    const booking = await this.bookingService.create(
      business.id,
      {
        employeeId,
        serviceId: dto.serviceId,
        customerId: customer.id,
        startTime: dto.startTime,
        notes: dto.notes,
        useSubscriptionId,
        metadata: {
          source: 'public_booking',
          ...this.bookingPaymentService.pricingMetadata(pricing),
          ...(dto.metadata || {}),
          ...(dto.purchasePlanId ? { purchasePlanId: dto.purchasePlanId } : {}),
          ...(wantsCash ? { paymentMethod: 'cash', payAtVenue: true } : {}),
          ...this.resolvePublicBookingReminderMetadata(business, dto.customer),
        },
      },
      undefined,
      { paymentStatus },
    );

    await this.checkoutPricingService.applyRedemptions(
      business.id,
      customer.id,
      pricing,
      booking.id,
    );

    const manageToken = await ensureBookingManageToken(this.bookingRepo, booking.id);

    return {
      booking,
      customer: { id: customer.id, name: customer.name, created },
      manageToken,
      paymentMethod: wantsCash ? 'cash' : 'online',
      amountDue: pricing.amountDue,
    };
  }

  private assertPublicBookingEnabled(business: Business) {
    const enabled = business.settings?.publicBooking?.enabled;
    if (enabled === false) {
      throw new ForbiddenException('Public booking is disabled for this business');
    }
  }

  private async filterStartTimesWithAnyBookableService(
    businessId: string,
    employee: Employee,
    startTimes: Date[],
  ): Promise<Date[]> {
    const services = await this.getEmployeeServices(businessId, employee);
    if (services.length === 0) return [];

    const bookable: Date[] = [];
    for (const startTime of startTimes) {
      if (await this.canBookAnyServiceAt(businessId, employee.id, startTime, services)) {
        bookable.push(startTime);
      }
    }
    return bookable;
  }

  private async filterStartTimesWithService(
    businessId: string,
    employee: Employee,
    startTimes: Date[],
    service: Service,
  ): Promise<Date[]> {
    if (employee.serviceIds?.length && !employee.serviceIds.includes(service.id)) {
      return [];
    }

    const bookable: Date[] = [];
    for (const startTime of startTimes) {
      if (await this.canBookServiceAt(businessId, employee.id, startTime, service)) {
        bookable.push(startTime);
      }
    }
    return bookable;
  }

  private async canBookServiceAt(
    businessId: string,
    employeeId: string,
    startTime: Date,
    service: Service,
  ): Promise<boolean> {
    const allowedIds = await this.bookingService.getAllowedServiceIdsAtInstant(
      businessId,
      employeeId,
      startTime,
    );
    if (allowedIds !== null && !allowedIds.includes(service.id)) {
      return false;
    }

    const end = new Date(
      startTime.getTime() + (service.durationMinutes + service.bufferMinutes) * 60000,
    );
    try {
      await this.bookingService.validateServiceFitsWindow(
        businessId,
        employeeId,
        startTime,
        end,
        service.id,
      );
      return true;
    } catch {
      return false;
    }
  }

  private async canBookAnyServiceAt(
    businessId: string,
    employeeId: string,
    startTime: Date,
    services: Service[],
  ): Promise<boolean> {
    const allowedIds = await this.bookingService.getAllowedServiceIdsAtInstant(
      businessId,
      employeeId,
      startTime,
    );
    if (allowedIds !== null && allowedIds.length === 0) {
      return false;
    }
    const candidates =
      allowedIds === null ? services : services.filter((s) => allowedIds.includes(s.id));

    for (const service of candidates) {
      const end = new Date(
        startTime.getTime() + (service.durationMinutes + service.bufferMinutes) * 60000,
      );
      try {
        await this.bookingService.validateServiceFitsWindow(
          businessId,
          employeeId,
          startTime,
          end,
          service.id,
        );
        return true;
      } catch {
        /* try next service */
      }
    }
    return false;
  }

  private async buildProviderPreview(
    businessId: string,
    employee: Employee,
    fromDateKey: string,
    todayDateKey: string,
    timeZone: string,
  ): Promise<Omit<PublicProvider, 'averageRating' | 'reviewCount' | 'recentReviews'>> {
    const metadata = employee.metadata || {};
    let nearestDateKey: string | null = null;
    let slots: Date[] = [];

    for (let offset = 0; offset < SCAN_DAYS; offset++) {
      const dateKey = addDaysToDateKey(fromDateKey, offset, timeZone);
      const daySlots = await this.getEmployeeStartTimes(businessId, employee, dateKey);
      const upcoming = daySlots.filter((startTime) =>
        isWallClockSlotBookable(dateKey, formatTimeDisplay(startTime), timeZone, null),
      );
      const bookable = await this.filterStartTimesWithAnyBookableService(
        businessId,
        employee,
        upcoming,
      );
      if (bookable.length > 0) {
        nearestDateKey = dateKey;
        slots = bookable;
        break;
      }
    }

    return {
      id: employee.id,
      name: employee.name,
      role: metadata.role || metadata.title,
      avatarUrl: this.resolvePublicMediaUrl(metadata.avatarUrl),
      nearestDate: nearestDateKey,
      nearestDateLabel: nearestDateKey
        ? this.formatNearestDateLabel(nearestDateKey, todayDateKey, timeZone)
        : null,
      slots: slots.map((startTime) => ({
        startTime: startTime.toISOString(),
        endTime: new Date(startTime.getTime() + SLOT_STEP_MINUTES * 60000).toISOString(),
      })),
    };
  }

  private formatNearestDateLabel(dateKey: string, todayDateKey: string, timeZone: string): string {
    const formatted = formatZonedDateLabel(dateKey, timeZone);
    if (dateKey === todayDateKey) return `today, ${formatted}`;
    return formatted;
  }

  private async getMultiServiceBlockStartCandidates(
    businessId: string,
    employee: Employee,
    dateKey: string,
    serviceIds: string[],
    blockDurationMinutes: number,
  ): Promise<Date[]> {
    const seen = new Set<string>();
    const candidates: Date[] = [];
    const addTimes = (times: Date[]) => {
      for (const time of times) {
        const key = time.toISOString();
        if (seen.has(key)) continue;
        seen.add(key);
        candidates.push(time);
      }
    };

    addTimes(await this.getEmployeeStartTimes(businessId, employee, dateKey));

    const { start: dayStart, end: dayEnd } = getUtcBoundsForDateKey(dateKey, 'UTC');
    for (const serviceId of serviceIds) {
      if (employee.serviceIds?.length && !employee.serviceIds.includes(serviceId)) continue;
      try {
        const engineSlots = await this.schedulingEngine.getAvailableSlots({
          businessId,
          serviceId,
          date: dayStart,
          employeeId: employee.id,
        });
        addTimes(this.snapToGrid(engineSlots.map((slot) => slot.startTime)));
      } catch {
        // ignore per-service engine failures
      }
    }

    const dayPeriods = await this.schedulingPeriodRepo.find({
      where: {
        businessId,
        employeeId: employee.id,
        startTime: Between(dayStart, dayEnd),
      },
      order: { startTime: 'ASC' },
    });

    const blockMs = blockDurationMinutes * 60_000;
    const stepMs = SLOT_STEP_MINUTES * 60_000;

    for (const period of dayPeriods) {
      if (period.type !== TemplatePeriodType.SERVICE_BLOCK) continue;
      const allowedIds = period.serviceIds;
      if (allowedIds?.length && !serviceIds.every((id) => allowedIds.includes(id))) continue;

      let cursor = period.startTime.getTime();
      const periodEnd = period.endTime.getTime();
      while (cursor + blockMs <= periodEnd) {
        const start = new Date(cursor);
        const end = new Date(cursor + blockMs);
        const blocked = dayPeriods.some(
          (p) =>
            (p.type === TemplatePeriodType.UNAVAILABLE_BLOCK ||
              p.type === TemplatePeriodType.BLOCKED_TIME) &&
            p.startTime < end &&
            p.endTime > start,
        );
        if (!blocked) {
          addTimes(this.snapToGrid([start]));
        }
        cursor += stepMs;
      }
    }

    return candidates.sort((a, b) => a.getTime() - b.getTime());
  }

  private async getEmployeeStartTimes(
    businessId: string,
    employee: Employee,
    dateKey: string,
  ): Promise<Date[]> {
    // Schedule micro-slots are stored on UTC calendar days (wall-clock HH:mm as UTC)
    const { start: dayStart, end: dayEnd } = getUtcBoundsForDateKey(dateKey, 'UTC');

    const microSlots = await this.slotRepo.find({
      where: {
        businessId,
        employeeId: employee.id,
        startTime: Between(dayStart, dayEnd),
        status: SlotStatus.AVAILABLE,
      },
      order: { startTime: 'ASC' },
    });

    const availableMicro = microSlots.filter(
      (s) => s.appointmentCount < s.maxAppointmentCount,
    );

    if (availableMicro.length > 0) {
      return this.snapToGrid(availableMicro.map((s) => s.startTime));
    }

    const services = await this.getEmployeeServices(businessId, employee);
    if (services.length === 0) return [];

    const shortest = services.reduce((a, b) =>
      a.durationMinutes + a.bufferMinutes <= b.durationMinutes + b.bufferMinutes ? a : b,
    );

    const engineSlots = await this.schedulingEngine.getAvailableSlots({
      businessId,
      serviceId: shortest.id,
      date: dayStart,
      employeeId: employee.id,
    });

    return this.snapToGrid(engineSlots.map((s) => s.startTime));
  }

  private async getEmployeeServices(businessId: string, employee: Employee): Promise<Service[]> {
    const services = await this.serviceRepo.find({
      where: { businessId, isActive: true },
    });
    if (!employee.serviceIds?.length) return services;
    return services.filter((s) => employee.serviceIds.includes(s.id));
  }

  private snapToGrid(times: Date[]): Date[] {
    const seen = new Set<string>();
    const result: Date[] = [];

    for (const time of times.sort((a, b) => a.getTime() - b.getTime())) {
      // UTC wall-clock matches dashboard schedule times (10:00 stored as 10:00 UTC)
      const minutes = time.getUTCHours() * 60 + time.getUTCMinutes();
      const snappedMin = Math.floor(minutes / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES;
      const snapped = new Date(time);
      snapped.setUTCHours(Math.floor(snappedMin / 60), snappedMin % 60, 0, 0);
      const key = snapped.toISOString();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(snapped);
      }
    }

    return result;
  }
}
