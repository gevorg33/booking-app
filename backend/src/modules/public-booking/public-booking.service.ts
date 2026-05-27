import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { BusinessService } from '../business/business.service.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service, PrepaymentMode } from '../service/entities/service.entity.js';
import { PaymentStatus } from '../booking/entities/booking.entity.js';
import { BookingService } from '../booking/booking.service.js';
import { CustomerService } from '../customer/customer.service.js';
import { SchedulingSlot, SlotStatus } from '../schedule/entities/scheduling-slot.entity.js';
import { SchedulingEngineService } from '../../engine/scheduling/scheduling-engine.service.js';
import { CreatePublicBookingDto } from './dto/public-booking.dto.js';
import { Business } from '../business/entities/business.entity.js';
import {
  addDaysToDateKey,
  formatZonedDateLabel,
  getDateKeyInTimezone,
  getUtcBoundsForDateKey,
  resolveTimezone,
} from '../../common/utils/timezone.util.js';
import { getBusinessWhatsAppIntegration } from '../notifications/whatsapp-integration.types.js';

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
}

export interface ProviderSlotPreview {
  startTime: string;
  endTime: string;
}

export interface PublicProvider {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  nearestDate: string | null;
  nearestDateLabel: string | null;
  slots: ProviderSlotPreview[];
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
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(SchedulingSlot) private slotRepo: Repository<SchedulingSlot>,
  ) {}

  async resolveBusiness(slug: string): Promise<Business> {
    const business = await this.businessService.findBySlug(slug);
    if (!business.isActive) {
      throw new ForbiddenException('This business is not accepting bookings');
    }
    return business;
  }

  toPublicProfile(business: Business): PublicBusinessProfile {
    const settings = business.settings || {};
    const branding = settings.branding || {};
    const publicBooking = settings.publicBooking || {};
    const social = settings.social || {};
    const location = settings.location || {};

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
        logoUrl: branding.logoUrl,
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
      defaultPhoneCountryCode:
        getBusinessWhatsAppIntegration(settings).defaultCountryCode || '374',
    };
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

    const providers = await Promise.all(
      employees.map(async (employee) =>
        this.buildProviderPreview(business.id, employee, startDateKey, todayKey, tz),
      ),
    );

    return { providers };
  }

  async getProviderSlots(slug: string, employeeId: string, date: string) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);

    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, businessId: business.id, isActive: true },
    });
    if (!employee) throw new NotFoundException('Provider not found');

    const tz = resolveTimezone(business.timezone);
    const slots = await this.getEmployeeStartTimes(business.id, employee, date);
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

  async getServices(slug: string, employeeId?: string) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);

    let services = await this.serviceRepo.find({
      where: { businessId: business.id, isActive: true },
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

    return {
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        durationMinutes: s.durationMinutes,
        bufferMinutes: s.bufferMinutes,
        price: Number(s.price),
        currency: s.currency,
        prepaymentMode: s.prepaymentMode,
        depositAmount: s.depositAmount != null ? Number(s.depositAmount) : null,
      })),
    };
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

  async createBooking(slug: string, dto: CreatePublicBookingDto) {
    const business = await this.resolveBusiness(slug);
    this.assertPublicBookingEnabled(business);

    if (!dto.customer.email && !dto.customer.phone) {
      throw new BadRequestException('Email or phone number is required');
    }

    const service = await this.serviceRepo.findOne({
      where: { id: dto.serviceId, businessId: business.id, isActive: true },
    });
    if (!service) throw new NotFoundException('Service not found');

    if (!dto.markPaid && service.prepaymentMode !== PrepaymentMode.NONE) {
      throw new BadRequestException(
        'Prepayment is required for this service. Complete payment at checkout.',
      );
    }

    const { customer, created } = await this.customerService.findOrCreateByContact(business.id, {
      name: dto.customer.name,
      email: dto.customer.email,
      phone: dto.customer.phone,
      emailReminders: dto.customer.emailReminders,
      smsReminders: dto.customer.smsReminders,
      whatsappReminders: dto.customer.whatsappReminders,
    });

    const booking = await this.bookingService.create(
      business.id,
      {
        employeeId: dto.employeeId,
        serviceId: dto.serviceId,
        customerId: customer.id,
        startTime: dto.startTime,
        notes: dto.notes,
        metadata: { source: 'public_booking', ...(dto.metadata || {}) },
      },
      undefined,
      dto.markPaid ? { paymentStatus: PaymentStatus.PAID } : undefined,
    );

    return {
      booking,
      customer: { id: customer.id, name: customer.name, created },
    };
  }

  private assertPublicBookingEnabled(business: Business) {
    const enabled = business.settings?.publicBooking?.enabled;
    if (enabled === false) {
      throw new ForbiddenException('Public booking is disabled for this business');
    }
  }

  private async buildProviderPreview(
    businessId: string,
    employee: Employee,
    fromDateKey: string,
    todayDateKey: string,
    timeZone: string,
  ): Promise<PublicProvider> {
    const metadata = employee.metadata || {};
    let nearestDateKey: string | null = null;
    let slots: Date[] = [];
    const now = Date.now();

    for (let offset = 0; offset < SCAN_DAYS; offset++) {
      const dateKey = addDaysToDateKey(fromDateKey, offset, timeZone);
      const daySlots = await this.getEmployeeStartTimes(businessId, employee, dateKey);
      const upcoming = daySlots.filter((s) => s.getTime() > now);
      if (upcoming.length > 0) {
        nearestDateKey = dateKey;
        slots = upcoming;
        break;
      }
    }

    return {
      id: employee.id,
      name: employee.name,
      role: metadata.role || metadata.title,
      avatarUrl: metadata.avatarUrl,
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
