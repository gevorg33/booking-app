import { Injectable, Logger, OnModuleInit, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In, ILike } from 'typeorm';
import { WorkflowExecutorService, StepExecutor } from './workflow-executor.service.js';
import { BookingService } from '../../../modules/booking/booking.service.js';
import { BookingSlotResolverService } from '../../../modules/booking/booking-slot-resolver.service.js';
import { ServiceService } from '../../../modules/service/service.service.js';
import { ScheduleService } from '../../../modules/schedule/schedule.service.js';
import { TemplateApplyService } from '../../../modules/schedule/services/template-apply.service.js';
import { BlockScheduleService } from '../../../modules/schedule/services/block-schedule.service.js';
import { EmployeeService } from '../../../modules/employee/employee.service.js';
import { SchedulingEngineService } from '../../scheduling/scheduling-engine.service.js';
import { Booking, BookingStatus, PaymentStatus } from '../../../modules/booking/entities/booking.entity.js';
import { Employee } from '../../../modules/employee/entities/employee.entity.js';
import { Customer } from '../../../modules/customer/entities/customer.entity.js';
import { Business } from '../../../modules/business/entities/business.entity.js';
import { SchedulingPeriod } from '../../../modules/schedule/entities/scheduling-period.entity.js';
import { NotificationsService } from '../../../modules/notifications/notifications.service.js';
import { WorkflowStep } from '../interfaces/workflow.interfaces.js';
import { toBookingSnapshot, type BookingSnapshot } from '../../../modules/ai/ai-result-format.util.js';
import { formatTimeDisplay } from '../../../common/utils/date-format.util.js';
import { resolveDirectScheduleDateKeys, resolveDirectSchedulePeriodServiceIds, resolveScheduleDates } from '../../../modules/ai/ai-orchestration.helpers.js';

@Injectable()
export class WorkflowStepExecutorsService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowStepExecutorsService.name);

  constructor(
    private executor: WorkflowExecutorService,
    private bookingService: BookingService,
    private slotResolver: BookingSlotResolverService,
    private serviceService: ServiceService,
    private scheduleService: ScheduleService,
    private templateApplyService: TemplateApplyService,
    private blockScheduleService: BlockScheduleService,
    private employeeService: EmployeeService,
    private schedulingEngine: SchedulingEngineService,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(SchedulingPeriod) private periodRepo: Repository<SchedulingPeriod>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    private notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    const executors: Record<string, StepExecutor> = {
      create_booking: (step, ctx) => this.createBooking(step, ctx),
      create_service: (step, ctx) => this.createService(step, ctx),
      cancel_booking: (step, ctx) => this.cancelBooking(step, ctx),
      cancel_bookings: (step, ctx) => this.cancelBookings(step, ctx),
      hide_appointments_from_calendar: (step, ctx) => this.hideAppointmentsFromCalendar(step, ctx),
      unhide_appointments_from_calendar: (step, ctx) => this.unhideAppointmentsFromCalendar(step, ctx),
      list_appointments: (step) => this.listAppointments(step),
      fetch_current_schedule: (step) => this.fetchCurrentSchedule(step),
      analyze_utilization: (step) => this.analyzeUtilization(step),
      identify_schedule_gaps: (step, ctx) => this.identifyScheduleGaps(step, ctx),
      generate_optimization_recommendations: (step, ctx) =>
        this.generateOptimizationRecommendations(step, ctx),
      find_freed_slots: (step) => this.findFreedSlots(step),
      find_rebooking_candidates: (step, ctx) => this.findRebookingCandidates(step, ctx),
      propose_reassignment: (step, ctx) => this.proposeReassignment(step, ctx),
      detect_conflicts: (step) => this.detectConflicts(step),
      analyze_resolution_options: (step, ctx) => this.analyzeResolutionOptions(step, ctx),
      propose_resolutions: (step, ctx) => this.proposeResolutions(step, ctx),
      apply_conflict_resolutions: (step, ctx) => this.applyConflictResolutions(step, ctx),
      execute_reassignment: (step, ctx) => this.executeReassignment(step, ctx),
      notify_cancelled_customers: (step, ctx) => this.notifyCancelledCustomers(step, ctx),
      fill_schedule_gaps: (step, ctx) => this.fillScheduleGaps(step, ctx),
      apply_template: (step, ctx) => this.applyTemplate(step, ctx),
      create_block_schedule: (step, ctx) => this.createBlockSchedule(step, ctx),
      remove_block_schedule: (step, ctx) => this.removeBlockSchedule(step, ctx),
      create_direct_schedule: (step, ctx) => this.createDirectSchedule(step, ctx),
      clear_schedule: (step, ctx) => this.clearSchedule(step, ctx),
      reschedule_booking: (step, ctx) => this.rescheduleBooking(step, ctx),
      assign_employee_services: (step, ctx) => this.assignEmployeeServices(step, ctx),
      summarize_utilization: (step) => this.summarizeUtilization(step),
      create_schedule_template: (step, ctx) => this.createScheduleTemplate(step, ctx),
      update_bookings: (step, ctx) => this.updateBookings(step, ctx),
      mark_no_shows: (step, ctx) => this.updateBookings(step, { ...ctx, _forceStatus: BookingStatus.NO_SHOW }),
      payment_sweep: (step, ctx) => this.updateBookings(step, { ...ctx, _forcePaymentStatus: PaymentStatus.PAID }),
    };

    for (const [action, handler] of Object.entries(executors)) {
      this.executor.registerStepExecutor(action, handler);
      this.logger.log(`Registered workflow executor: ${action}`);
    }
  }

  private priorResult(ctx: Record<string, any>, stepId: string): any {
    return ctx[`step_${stepId}_result`];
  }

  private async loadBookingSnapshots(ids: string[]): Promise<BookingSnapshot[]> {
    if (!ids.length) return [];
    const bookings = await this.bookingRepo.find({
      where: { id: In(ids) },
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
    });
    return bookings.map((b) => toBookingSnapshot(b));
  }

  private async createBooking(step: WorkflowStep, ctx: Record<string, any>) {
    const businessId = step.params.businessId ?? ctx.businessId;
    let { employeeId, serviceId, customerId, startTime, notes, userId } = step.params;
    const { employeeName, serviceName } = step.params;

    if (!employeeId && employeeName) {
      const employee = await this.employeeRepo.findOne({
        where: { businessId, name: ILike(`%${employeeName}%`), isActive: true },
      });
      if (!employee) {
        throw new BadRequestException(`Service provider not found: ${employeeName}`);
      }
      employeeId = employee.id;
    }

    if (!serviceId && serviceName) {
      const services = await this.serviceService.findAll(businessId);
      const lower = String(serviceName).toLowerCase();
      const service =
        services.find((s) => s.name.toLowerCase() === lower) ||
        services.find((s) => s.name.toLowerCase().includes(lower)) ||
        services.find((s) => lower.includes(s.name.toLowerCase()));
      if (!service) {
        throw new BadRequestException(`Service not found: ${serviceName}`);
      }
      serviceId = service.id;
    }

    if (!employeeId || !serviceId) {
      throw new BadRequestException(
        'create_booking requires employeeId and serviceId (or resolvable employeeName and serviceName)',
      );
    }

    const employee = await this.employeeRepo.findOne({ where: { id: employeeId, businessId } });
    if (!employee) {
      throw new BadRequestException('Service provider not found');
    }
    const service = await this.serviceService.findOne(serviceId).catch(() => null);
    if (!service || service.businessId !== businessId) {
      throw new BadRequestException('Service not found');
    }

    const isoDay = String(startTime).slice(0, 10);
    const timeSlot = formatTimeDisplay(new Date(startTime));
    await this.slotResolver.assertBookable({
      businessId,
      employeeId,
      employeeName: employee.name,
      serviceId,
      serviceName: service.name,
      isoDay,
      timeSlot,
    });

    const booking = await this.bookingService.create(
      businessId,
      { employeeId, serviceId, customerId, startTime, notes },
      userId,
    );
    ctx.lastBookingId = booking.id;
    return {
      bookingId: booking.id,
      employeeName: booking.employee?.name,
      serviceName: booking.service?.name,
      startTime: booking.startTime,
      endTime: booking.endTime,
    };
  }

  private async fillScheduleGaps(step: WorkflowStep, ctx: Record<string, any>) {
    const businessId = step.params.businessId ?? ctx.businessId;
    const { employeeId, date, periods, userId } = step.params as {
      employeeId: string;
      date: string;
      periods: Array<{ startTime: string; endTime: string; serviceIds: string[] }>;
      userId?: string;
    };

    if (!employeeId || !date || !periods?.length) {
      throw new BadRequestException('fill_schedule_gaps requires employeeId, date, and at least one period');
    }

    const result = await this.scheduleService.addServicePeriods(
      businessId,
      { employeeId, date, periods },
      userId,
    );

    return {
      periodsCreated: result.periodsCreated,
      slotsCreated: result.slotsCreated,
      periods: periods.map((p) => ({
        startTime: p.startTime,
        endTime: p.endTime,
        serviceIds: p.serviceIds,
      })),
    };
  }

  private async applyTemplate(step: WorkflowStep, ctx: Record<string, any>) {
    const businessId = step.params.businessId ?? ctx.businessId;
    const { templateId, employeeId, startDate, endDate, applyDays, repeatWeeksCount, userId } =
      step.params;
    const result = await this.templateApplyService.applyTemplate(
      { templateId, employeeId, startDate, endDate, applyDays, repeatWeeksCount },
      businessId,
      userId,
    );
    return { slotsCreated: result.slotsCreated, employeeId, templateId };
  }

  private async createBlockSchedule(step: WorkflowStep, ctx: Record<string, any>) {
    const businessId = step.params.businessId ?? ctx.businessId;
    const { employeeId, placeholder, isRepetitive, singleBlock, repetitiveBlock, userId } =
      step.params;
    const result = await this.blockScheduleService.create(
      businessId,
      {
        employeeId,
        placeholder,
        isRepetitive,
        singleBlock,
        repetitiveBlock,
      } as any,
      userId,
    );
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, businessId },
    });
    return {
      blockScheduleId: result.id,
      employeeId,
      employeeName: employee?.name,
      label: result.placeholderLabel ?? placeholder ?? 'Blocked',
      isRepetitive: result.isRepetitive,
      singleStartTime: result.singleStartTime ?? undefined,
      singleEndTime: result.singleEndTime ?? undefined,
    };
  }

  private async removeBlockSchedule(step: WorkflowStep, ctx: Record<string, any>) {
    const businessId = step.params.businessId ?? ctx.businessId;
    const { blockScheduleId, userId } = step.params;
    await this.blockScheduleService.remove(businessId, blockScheduleId, userId);
    return { removedBlockScheduleId: blockScheduleId };
  }

  private async createDirectSchedule(step: WorkflowStep, ctx: Record<string, any>) {
    const businessId = step.params.businessId ?? ctx.businessId;
    const { employeeId, periods, userId } = step.params as {
      employeeId: string;
      periods: Array<Record<string, unknown>>;
      userId?: string;
    };

    if (!employeeId) {
      throw new BadRequestException('create_direct_schedule requires employeeId');
    }
    if (!Array.isArray(periods) || periods.length === 0) {
      throw new BadRequestException('create_direct_schedule requires periods');
    }

    const dates = resolveDirectScheduleDateKeys(step.params as Record<string, unknown>);
    if (!dates.length) {
      throw new BadRequestException(
        'create_direct_schedule requires date, dates, or dateFrom/dateTo in YYYY-MM-DD format',
      );
    }

    const employee = await this.employeeService.findOne(employeeId);
    const enrichedPeriods = periods.map((period) => ({
      ...period,
      serviceIds: resolveDirectSchedulePeriodServiceIds(
        {
          type: String(period.type ?? 'service_block'),
          serviceIds: Array.isArray(period.serviceIds)
            ? (period.serviceIds as string[])
            : [],
        },
        employee.serviceIds,
      ),
    }));

    let totalSlots = 0;
    for (const date of dates) {
      const result = await this.scheduleService.createDirectSchedule(
        businessId,
        { employeeId, date, periods: enrichedPeriods as any },
        userId,
      );
      totalSlots += result.slotsCreated;
    }

    return {
      slotsCreated: totalSlots,
      employeeId,
      dates,
    };
  }

  private async clearSchedule(step: WorkflowStep, ctx: Record<string, any>) {
    const businessId = step.params.businessId ?? ctx.businessId;
    const { employeeId, userId } = step.params as {
      employeeId: string;
      date?: string;
      userId?: string;
    };
    if (!employeeId) {
      throw new BadRequestException('clear_schedule requires employeeId');
    }

    const dates = resolveDirectScheduleDateKeys(step.params as Record<string, unknown>);
    if (!dates.length && step.params.date) {
      dates.push(String(step.params.date));
    }
    if (!dates.length) {
      const fromScheduleDates = resolveScheduleDates(step.params as Record<string, unknown>);
      dates.push(...fromScheduleDates);
    }
    if (!dates.length) {
      throw new BadRequestException('clear_schedule requires date, dates, or dateFrom/dateTo');
    }

    let totalPeriodsRemoved = 0;
    let totalSlotsRemoved = 0;
    for (const date of dates) {
      const result = await this.scheduleService.clearScheduleForDay(
        businessId,
        { employeeId, date },
        userId,
      );
      totalPeriodsRemoved += result.periodsRemoved;
      totalSlotsRemoved += result.slotsRemoved;
    }

    return {
      employeeId,
      dates,
      periodsRemoved: totalPeriodsRemoved,
      slotsRemoved: totalSlotsRemoved,
    };
  }

  private async rescheduleBooking(step: WorkflowStep, ctx: Record<string, any>) {
    const { bookingId, startTime, employeeId, serviceId, userId } = step.params;
    const existing = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: { service: true },
    });
    if (!existing) {
      throw new BadRequestException(`Booking not found: ${bookingId}`);
    }

    const targetStart = new Date(startTime);
    const durationMs =
      existing.endTime.getTime() - existing.startTime.getTime();
    const targetEnd = new Date(targetStart.getTime() + durationMs);
    const targetEmployeeId = employeeId ?? existing.employeeId;

    const conflicts = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.businessId = :businessId', { businessId: existing.businessId })
      .andWhere('b.employeeId = :employeeId', { employeeId: targetEmployeeId })
      .andWhere('b.id != :bookingId', { bookingId })
      .andWhere('b.status NOT IN (:...terminal)', {
        terminal: [BookingStatus.CANCELLED, BookingStatus.COMPLETED],
      })
      .andWhere('b.startTime < :targetEnd', { targetEnd })
      .andWhere('b.endTime > :targetStart', { targetStart })
      .getMany();

    if (conflicts.length > 0) {
      throw new BadRequestException(
        `Reschedule conflict: ${conflicts.length} overlapping booking(s) at the requested time`,
      );
    }

    const booking = await this.bookingService.update(
      bookingId,
      { startTime, employeeId, serviceId },
      userId,
    );
    const full = await this.bookingService.findOne(booking.id);
    return {
      bookingId: full.id,
      employeeName: full.employee?.name,
      serviceName: full.service?.name,
      customerName: full.customer?.name,
      startTime: full.startTime,
      endTime: full.endTime,
      previousStartTime: existing.startTime,
      previousEndTime: existing.endTime,
      previousEmployeeId: existing.employeeId,
      previousServiceId: existing.serviceId,
    };
  }

  private async notifyCancelledCustomers(step: WorkflowStep, ctx: Record<string, any>) {
    const { bookingIds, reason } = step.params as {
      bookingIds?: string[];
      reason?: string;
    };
    const prior = step.dependsOn?.[0]
      ? this.priorResult(ctx, step.dependsOn[0])
      : null;
    const ids =
      bookingIds ??
      prior?.cancelledIds ??
      [];

    let notified = 0;
    const errors: string[] = [];
    for (const id of ids) {
      try {
        await this.notificationsService.sendBookingCancellation(id, reason);
        notified += 1;
      } catch (error: any) {
        errors.push(`${id}: ${error.message}`);
      }
    }

    return { notifiedCount: notified, bookingIds: ids, errors };
  }

  private async assignEmployeeServices(step: WorkflowStep, ctx: Record<string, any>) {
    const { employeeId, serviceIds, userId } = step.params;
    const before = await this.employeeService.findOne(employeeId);
    const employee = await this.employeeService.update(employeeId, { serviceIds }, userId);
    return {
      employeeId: employee.id,
      serviceIds: employee.serviceIds,
      previousServiceIds: before.serviceIds ?? [],
    };
  }

  private async summarizeUtilization(step: WorkflowStep) {
    const { businessId } = step.params;
    const { start, end } = this.resolveDateRange(step.params);
    const employees = await this.employeeRepo.find({
      where: { businessId, isActive: true },
    });
    const utilization = await Promise.all(
      employees.map(async (e) => ({
        employeeId: e.id,
        employeeName: e.name,
        ...(await this.schedulingEngine.getEmployeeUtilization(e.id, start, end)),
      })),
    );
    const sorted = [...utilization].sort(
      (a, b) => (a.utilizationPercent ?? 0) - (b.utilizationPercent ?? 0),
    );
    return {
      utilization: sorted,
      lowest: sorted.slice(0, 3),
      highest: sorted.slice(-3).reverse(),
    };
  }

  private async createService(step: WorkflowStep, ctx: Record<string, any>) {
    const { businessId, name, description, durationMinutes, bufferMinutes, price, currency, userId } =
      step.params;
    const service = await this.serviceService.create(
      businessId,
      { name, description, durationMinutes, bufferMinutes, price, currency },
      userId,
    );
    ctx.lastServiceId = service.id;
    return {
      serviceId: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: service.price,
      currency: service.currency,
    };
  }

  private async cancelBooking(step: WorkflowStep, ctx: Record<string, any>) {
    const { bookingId, reason, userId } = step.params;
    const snapshots = await this.loadBookingSnapshots([bookingId]);
    await this.bookingService.cancel(bookingId, reason, userId);
    const snapshot = snapshots[0];
    return snapshot
      ? { cancelledId: bookingId, ...snapshot }
      : { cancelledId: bookingId };
  }

  private async cancelBookings(step: WorkflowStep, ctx: Record<string, any>) {
    const { bookingIds, reason, userId } = step.params as {
      bookingIds: string[];
      reason?: string;
      userId?: string;
    };
    const cancelledBookings = await this.loadBookingSnapshots(bookingIds);
    const cancelled: string[] = [];
    for (const id of bookingIds) {
      await this.bookingService.cancel(id, reason, userId);
      cancelled.push(id);
    }
    return { cancelledCount: cancelled.length, cancelledBookings, cancelledIds: cancelled };
  }

  private async hideAppointmentsFromCalendar(step: WorkflowStep, _ctx: Record<string, any>) {
    const { bookingIds, userId } = step.params as {
      bookingIds: string[];
      userId?: string;
    };
    const hiddenBookings = await this.loadBookingSnapshots(bookingIds);
    const result = await this.bookingService.setHiddenFromCalendar(bookingIds, true, userId);
    return {
      hiddenCount: result.updatedCount,
      hiddenBookings,
    };
  }

  private async unhideAppointmentsFromCalendar(step: WorkflowStep, _ctx: Record<string, any>) {
    const { bookingIds, userId } = step.params as {
      bookingIds: string[];
      userId?: string;
    };
    const unhiddenBookings = await this.loadBookingSnapshots(bookingIds);
    const result = await this.bookingService.setHiddenFromCalendar(bookingIds, false, userId);
    return {
      unhiddenCount: result.updatedCount,
      unhiddenBookings,
    };
  }

  private resolveDateRange(params: {
    date?: string;
    dateRange?: { start?: string | Date; end?: string | Date };
  }): { start: Date; end: Date } {
    if (params.dateRange?.start && params.dateRange?.end) {
      const start = new Date(params.dateRange.start);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(params.dateRange.end);
      end.setUTCHours(23, 59, 59, 999);
      return { start, end };
    }
    if (params.date) {
      const start = new Date(params.date);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setUTCHours(23, 59, 59, 999);
      return { start, end };
    }
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCHours(23, 59, 59, 999);
    return { start, end };
  }

  private async fetchCurrentSchedule(step: WorkflowStep) {
    const { businessId, employeeId } = step.params;
    const { start, end } = this.resolveDateRange(step.params);

    const bookingWhere: any = {
      businessId,
      startTime: Between(start, end),
      status: Not(In([BookingStatus.CANCELLED])),
    };
    if (employeeId) bookingWhere.employeeId = employeeId;

    const periodWhere: any = {
      businessId,
      startTime: Between(start, end),
    };
    if (employeeId) periodWhere.employeeId = employeeId;

    const [bookings, periods] = await Promise.all([
      this.bookingRepo.find({
        where: bookingWhere,
        relations: { employee: true, service: true, customer: true },
        order: { startTime: 'ASC' },
      }),
      this.periodRepo.find({
        where: periodWhere,
        order: { startTime: 'ASC' },
      }),
    ]);

    return {
      dateRange: { start, end },
      bookingCount: bookings.length,
      periodCount: periods.length,
      bookings: bookings.map((b) => ({
        id: b.id,
        employee: b.employee?.name,
        service: b.service?.name,
        customer: b.customer?.name || 'Walk-in',
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
      })),
      scheduleBlocks: periods.map((p) => ({
        type: p.type,
        startTime: p.startTime,
        endTime: p.endTime,
        employeeId: p.employeeId,
      })),
    };
  }

  private async listAppointments(step: WorkflowStep) {
    const { businessId, employeeId } = step.params;
    const { start, end } = this.resolveDateRange(step.params);

    const where: any = {
      businessId,
      startTime: Between(start, end),
    };
    if (employeeId) where.employeeId = employeeId;

    const bookings = await this.bookingRepo.find({
      where,
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
    });

    return {
      count: bookings.length,
      appointments: bookings.map((b) => ({
        id: b.id,
        employee: b.employee?.name,
        service: b.service?.name,
        customer: b.customer?.name || 'Walk-in',
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
      })),
    };
  }

  private async analyzeUtilization(step: WorkflowStep) {
    const { businessId } = step.params;
    const { start, end } = this.resolveDateRange(step.params);

    const employees = await this.employeeRepo.find({
      where: { businessId, isActive: true },
    });

    const utilization = await Promise.all(
      employees.map(async (e) => ({
        employeeId: e.id,
        employeeName: e.name,
        ...(await this.schedulingEngine.getEmployeeUtilization(e.id, start, end)),
      })),
    );

    return { utilization };
  }

  private async identifyScheduleGaps(step: WorkflowStep, ctx: Record<string, any>) {
    const prior = step.dependsOn[0] ? this.priorResult(ctx, step.dependsOn[0]) : null;
    const threshold = step.params.minUtilizationThreshold ?? 0.6;

    const utilRows =
      prior?.utilization ??
      (prior?.bookingCount === 0 && prior?.periodCount === 0
        ? [{ employeeName: 'All providers', utilizationPercent: 0 }]
        : []);

    const gaps = utilRows.filter((u: any) => (u.utilizationPercent ?? 100) / 100 < threshold);

    return {
      underutilizedEmployees: gaps,
      threshold,
      recommendation: gaps.length
        ? 'Consider filling open slots or consolidating schedules for underutilized providers.'
        : 'Utilization is healthy across providers.',
    };
  }

  private async generateOptimizationRecommendations(step: WorkflowStep, ctx: Record<string, any>) {
    const gaps = this.priorResult(ctx, step.dependsOn[0]);
    return {
      recommendations: [
        'Review underutilized time blocks and promote availability to waitlisted customers.',
        'Align high-demand services with peak availability windows.',
        ...(gaps?.underutilizedEmployees?.length
          ? gaps.underutilizedEmployees.map(
              (e: any) =>
                `Reduce idle time for ${e.employeeName} (currently ${e.utilizationPercent}% utilized).`,
            )
          : []),
      ],
      optimizationGoal: step.params.optimizationGoal,
    };
  }

  private async findFreedSlots(step: WorkflowStep) {
    const { businessId } = step.params;
    const { start, end } = this.resolveDateRange(step.params);

    const cancelled = await this.bookingRepo.find({
      where: {
        businessId,
        status: BookingStatus.CANCELLED,
        startTime: Between(start, end),
      },
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
    });

    return {
      freedSlots: cancelled.map((b) => ({
        bookingId: b.id,
        employeeId: b.employeeId,
        employeeName: b.employee?.name,
        serviceId: b.serviceId,
        serviceName: b.service?.name,
        customerId: b.customerId,
        customerName: b.customer?.name,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
    };
  }

  private async findRebookingCandidates(step: WorkflowStep, ctx: Record<string, any>) {
    const businessId = step.params.businessId ?? ctx.businessId;
    const freed = this.priorResult(ctx, step.dependsOn[0]);
    const slots = freed?.freedSlots ?? [];

    if (!slots.length) {
      return { candidates: [], waitlistCount: 0 };
    }

    const serviceIds = [...new Set(slots.map((s: any) => s.serviceId).filter(Boolean))];
    const { start, end } = this.resolveDateRange(step.params);
    const lookbackStart = new Date(start);
    lookbackStart.setUTCDate(lookbackStart.getUTCDate() - 60);

    const [taggedWaitlist, recentCancelled, activeCustomers] = await Promise.all([
      this.customerRepo
        .createQueryBuilder('c')
        .where('c.business_id = :businessId', { businessId })
        .andWhere(`'waitlist' = ANY(c.tags)`)
        .getMany(),
      this.bookingRepo.find({
        where: {
          businessId,
          status: BookingStatus.CANCELLED,
          startTime: Between(lookbackStart, end),
        },
        relations: { customer: true, service: true },
        order: { startTime: 'DESC' },
        take: 50,
      }),
      this.bookingRepo.find({
        where: {
          businessId,
          status: Not(In([BookingStatus.CANCELLED])),
          startTime: Between(start, end),
        },
        relations: { customer: true, service: true },
      }),
    ]);

    const activeCustomerIds = new Set(
      activeCustomers.map((b) => b.customerId).filter(Boolean) as string[],
    );

    const candidateMap = new Map<
      string,
      {
        customerId: string;
        customerName: string;
        phone?: string;
        email?: string;
        source: string;
        serviceNames: string[];
        score: number;
      }
    >();

    const addCandidate = (
      customer: Customer | null | undefined,
      source: string,
      serviceName: string | undefined,
      score: number,
    ) => {
      if (!customer?.id || activeCustomerIds.has(customer.id)) return;
      const existing = candidateMap.get(customer.id);
      if (existing) {
        existing.score = Math.max(existing.score, score);
        if (serviceName && !existing.serviceNames.includes(serviceName)) {
          existing.serviceNames.push(serviceName);
        }
        return;
      }
      candidateMap.set(customer.id, {
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone ?? undefined,
        email: customer.email ?? undefined,
        source,
        serviceNames: serviceName ? [serviceName] : [],
        score,
      });
    };

    for (const c of taggedWaitlist) {
      addCandidate(c, 'waitlist_tag', undefined, 100);
    }

    for (const booking of recentCancelled) {
      if (!booking.customer) continue;
      const matchesService =
        !serviceIds.length ||
        (booking.serviceId && serviceIds.includes(booking.serviceId));
      if (matchesService) {
        addCandidate(booking.customer, 'recent_cancellation', booking.service?.name, 80);
      }
    }

    const candidates = slots.flatMap((slot: any) => {
      const ranked = [...candidateMap.values()]
        .filter((c) => {
          if (!slot.serviceName) return true;
          return (
            c.source === 'waitlist_tag' ||
            c.serviceNames.length === 0 ||
            c.serviceNames.some((n) =>
              n.toLowerCase().includes(String(slot.serviceName).toLowerCase()),
            )
          );
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      return ranked.map((c) => ({
        slot,
        customerId: c.customerId,
        customerName: c.customerName,
        phone: c.phone,
        email: c.email,
        source: c.source,
        score: c.score,
        suggestion: `Offer ${slot.serviceName ?? 'appointment'} at ${new Date(slot.startTime).toISOString()} to ${c.customerName}`,
      }));
    });

    return {
      candidates,
      waitlistCount: taggedWaitlist.length,
      uniqueCandidates: candidateMap.size,
    };
  }

  private async proposeReassignment(step: WorkflowStep, ctx: Record<string, any>) {
    const prior = this.priorResult(ctx, step.dependsOn[0]);
    const grouped = new Map<string, any>();

    for (const entry of prior?.candidates ?? []) {
      const slotKey = entry.slot?.bookingId ?? entry.slot?.startTime;
      if (!slotKey) continue;
      const list = grouped.get(String(slotKey)) ?? { slot: entry.slot, options: [] };
      list.options.push({
        customerId: entry.customerId,
        customerName: entry.customerName,
        source: entry.source,
        score: entry.score,
        phone: entry.phone,
      });
      grouped.set(String(slotKey), list);
    }

    const proposals = [...grouped.values()].map((group, i) => {
      const top = [...group.options].sort((a: any, b: any) => b.score - a.score)[0];
      return {
        id: `proposal-${i + 1}`,
        slot: group.slot,
        recommendedCustomer: top ?? null,
        alternatives: group.options.slice(1, 4),
        action: top ? 'execute_reassignment' : 'manual_outreach',
        status: 'pending_review',
        params: top
          ? {
              bookingId: group.slot?.bookingId,
              customerId: top.customerId,
              employeeId: group.slot?.employeeId,
              serviceId: group.slot?.serviceId,
              startTime: group.slot?.startTime,
            }
          : undefined,
      };
    });

    return { proposals, proposalCount: proposals.length };
  }

  private async executeReassignment(step: WorkflowStep, ctx: Record<string, any>) {
    const { proposalId, customerId, employeeId, serviceId, startTime, userId, notes } =
      step.params as Record<string, any>;

    if (!customerId || !employeeId || !serviceId || !startTime) {
      throw new BadRequestException(
        'execute_reassignment requires customerId, employeeId, serviceId, and startTime',
      );
    }

    const booking = await this.bookingService.create(
      step.params.businessId ?? ctx.businessId,
      { employeeId, serviceId, customerId, startTime, notes },
      userId,
    );

    return {
      proposalId,
      reassigned: true,
      bookingId: booking.id,
      customerId,
      startTime: booking.startTime,
    };
  }

  private async detectConflicts(step: WorkflowStep) {
    const { businessId } = step.params;
    const { start, end } = this.resolveDateRange(step.params);

    const conflicts = await this.schedulingEngine.findConflicts(businessId, { start, end });
    const employees = await this.employeeRepo.find({ where: { businessId, isActive: true } });
    const employeeNames = new Map(employees.map((e) => [e.id, e.name]));
    const bookingIds = conflicts.flatMap((c) => c.bookings.map((b) => b.id));
    const detailed =
      bookingIds.length > 0
        ? await this.bookingRepo.find({
            where: { id: In(bookingIds) },
            relations: { customer: true, service: true, employee: true },
          })
        : [];
    const bookingMap = new Map(detailed.map((b) => [b.id, b]));

    return {
      conflictCount: conflicts.length,
      conflicts: conflicts.map((c) => ({
        employeeId: c.employeeId,
        employeeName: employeeNames.get(c.employeeId),
        bookings: c.bookings.map((b) => {
          const full = bookingMap.get(b.id) ?? b;
          return {
            id: full.id,
            customerName: full.customer?.name ?? 'Walk-in',
            serviceName: full.service?.name,
            startTime: full.startTime,
            endTime: full.endTime,
            status: full.status,
          };
        }),
      })),
    };
  }

  private async analyzeResolutionOptions(step: WorkflowStep, ctx: Record<string, any>) {
    const detected = this.priorResult(ctx, step.dependsOn[0]);
    const strategies = step.params.strategies ?? ['reschedule', 'reassign_employee', 'cancel_lower_priority'];

    return {
      options: (detected?.conflicts ?? []).map((c: any, index: number) => {
        const [a, b] = c.bookings ?? [];
        const overlapMinutes =
          a && b
            ? Math.max(
                0,
                Math.round((new Date(a.endTime).getTime() - new Date(b.startTime).getTime()) / 60000),
              )
            : 0;

        return {
          conflictIndex: index + 1,
          employeeId: c.employeeId,
          bookings: c.bookings,
          overlapMinutes,
          strategies,
          suggested:
            overlapMinutes <= 15
              ? 'reschedule_second_booking_plus_15min'
              : 'reschedule_lower_priority_booking',
          suggestedParams: b
            ? {
                bookingId: b.id,
                newStartTime: new Date(new Date(b.startTime).getTime() + 15 * 60000).toISOString(),
              }
            : undefined,
        };
      }),
    };
  }

  private async proposeResolutions(step: WorkflowStep, ctx: Record<string, any>) {
    const options = this.priorResult(ctx, step.dependsOn[0]);
    const employees = await this.employeeRepo.find({
      where: { businessId: step.params.businessId ?? ctx.businessId, isActive: true },
    });
    const employeeNames = new Map(employees.map((e) => [e.id, e.name]));

    return {
      resolutions: (options?.options ?? []).map((o: any, i: number) => ({
        id: `resolution-${i + 1}`,
        employeeId: o.employeeId,
        employeeName: employeeNames.get(o.employeeId) ?? o.employeeId,
        conflictIndex: o.conflictIndex,
        overlapMinutes: o.overlapMinutes,
        bookings: (o.bookings ?? []).map((b: any) => ({
          id: b.id,
          customer: b.customer?.name ?? b.customerName ?? 'Walk-in',
          service: b.service?.name ?? b.serviceName,
          startTime: b.startTime,
          endTime: b.endTime,
          status: b.status,
        })),
        action: o.suggested,
        status: 'pending_approval',
        fix: o.suggestedParams
          ? {
              type: 'reschedule_booking',
              bookingId: o.suggestedParams.bookingId,
              startTime: o.suggestedParams.newStartTime,
            }
          : null,
      })),
    };
  }

  private async applyConflictResolutions(step: WorkflowStep, ctx: Record<string, any>) {
    const businessId = step.params.businessId ?? ctx.businessId;
    const userId = step.params.userId as string | undefined;
    const proposals = this.priorResult(ctx, step.dependsOn[0]);
    const resolutions = (proposals?.resolutions ?? []) as Array<{
      fix?: { type?: string; bookingId?: string; startTime?: string } | null;
    }>;

    const reschedules = resolutions
      .map((r) => r.fix)
      .filter(
        (fix): fix is { type: string; bookingId: string; startTime: string } =>
          fix?.type === 'reschedule_booking' && !!fix.bookingId && !!fix.startTime,
      );

    if (!reschedules.length) {
      return {
        appliedCount: 0,
        skippedCount: resolutions.length,
        message: 'No auto-resolvable conflicts found',
      };
    }

    const applied: string[] = [];
    const failed: Array<{ bookingId: string; error: string }> = [];

    for (const fix of reschedules) {
      try {
        await this.rescheduleBooking(
          {
            ...step,
            params: {
              businessId,
              bookingId: fix.bookingId,
              startTime: fix.startTime,
              userId,
            },
          },
          ctx,
        );
        applied.push(fix.bookingId);
      } catch (err: any) {
        failed.push({
          bookingId: fix.bookingId,
          error: err?.message ?? String(err),
        });
      }
    }

    return {
      appliedCount: applied.length,
      appliedBookingIds: applied,
      failed,
      skippedCount: resolutions.length - reschedules.length,
    };
  }

  private async createScheduleTemplate(step: WorkflowStep, ctx: Record<string, any>) {
    const businessId = step.params.businessId ?? ctx.businessId;
    const { name, timePeriods, userId } = step.params as {
      name: string;
      timePeriods: Array<Record<string, unknown>>;
      userId?: string;
    };

    if (!name?.trim()) {
      throw new BadRequestException('create_schedule_template requires template name');
    }
    if (!timePeriods?.length) {
      throw new BadRequestException('create_schedule_template requires at least one time period');
    }

    const template = await this.scheduleService.createTemplate(
      businessId,
      { name: name.trim(), timePeriods: timePeriods as any },
      userId,
    );

    return {
      templateId: template.id,
      templateName: template.name,
      periodCount: timePeriods.length,
    };
  }

  private async updateBookings(step: WorkflowStep, ctx: Record<string, any>) {
    const businessId = step.params.businessId ?? ctx.businessId;
    const bookingIds = (step.params.bookingIds as string[] | undefined) ?? [];
    const userId = step.params.userId as string | undefined;
    const status =
      (ctx._forceStatus as BookingStatus | undefined) ??
      (step.params.status as BookingStatus | undefined);
    const paymentStatus =
      (ctx._forcePaymentStatus as PaymentStatus | undefined) ??
      (step.params.paymentStatus as PaymentStatus | undefined);

    if (!bookingIds.length) {
      return { updatedCount: 0, bookingIds: [], message: 'No bookings to update' };
    }

    let updated = 0;
    const updatedIds: string[] = [];

    for (const id of bookingIds) {
      const booking = await this.bookingRepo.findOne({ where: { id, businessId } });
      if (!booking || booking.status === BookingStatus.CANCELLED) continue;

      const payload: { status?: BookingStatus; paymentStatus?: PaymentStatus } = {};
      if (status) payload.status = status;
      if (paymentStatus) payload.paymentStatus = paymentStatus;
      if (!Object.keys(payload).length) continue;

      await this.bookingService.update(id, payload, userId);
      updated += 1;
      updatedIds.push(id);
    }

    return {
      updatedCount: updated,
      bookingIds: updatedIds,
      status: status ?? null,
      paymentStatus: paymentStatus ?? null,
    };
  }
}
