import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { Employee } from '../employee/entities/employee.entity.js';
import { BusinessMember } from '../business/entities/business-member.entity.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { resolveBookingPaymentSummary } from '../booking/booking-payment-summary.util.js';
import { BusinessService } from '../business/business.service.js';
import { BookingService } from '../booking/booking.service.js';
import { RetailPosService } from '../retail-pos/retail-pos.service.js';
import { SchedulingSlot } from '../schedule/entities/scheduling-slot.entity.js';
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
    private businessService: BusinessService,
    private bookingService: BookingService,
    private retailPosService: RetailPosService,
    private llm: LlmService,
    private clinicTestOrderService: ClinicTestOrderService,
    private clinicTestResultService: ClinicTestResultService,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    private patientClinicalProfilesService: PatientClinicalProfilesService,
    private patientClinicalProfileAccessService: PatientClinicalProfileAccessService,
    private clinicTasksService: ClinicTasksService,
  ) {}

  async getContext(businessId: string, userId: string) {
    const access = await this.resolveMobileAccess(businessId, userId);
    const business = await this.businessService.findOne(businessId);
    const settings = business?.settings as Record<string, unknown> | undefined;

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
    };
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

    return {
      viewMode: access.viewMode,
      employee: access.employee
        ? { id: access.employee.id, name: access.employee.name }
        : null,
      days: [...byDay.entries()].map(([date, counts]) => ({ date, ...counts })),
    };
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
    const booking = await this.getAccessibleBooking(
      businessId,
      userId,
      bookingId,
    );
    return this.toBookingDetail(booking, businessId);
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
    const cancelled = await this.bookingService.cancel(
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
  ): Promise<Booking> {
    const access = await this.resolveMobileAccess(businessId, userId);
    const where: Record<string, unknown> = { id: bookingId, businessId };
    if (access.viewMode === 'provider') {
      where.employeeId = access.employee!.id;
    }

    const booking = await this.bookingRepo.findOne({
      where: where,
      relations: { service: true, customer: true, employee: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  private async toBookingDetail(booking: Booking, businessId: string) {
    const business = await this.businessService.findOne(businessId);
    const settings = business?.settings as Record<string, unknown> | undefined;
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
      paymentSummary: resolveBookingPaymentSummary(
        booking,
        retailLines,
        settings,
      ),
    };
  }

  private toBookingSummary(booking: Booking) {
    return {
      id: booking.id,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status,
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
}
