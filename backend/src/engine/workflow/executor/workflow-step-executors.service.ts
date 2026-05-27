import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { WorkflowExecutorService, StepExecutor } from './workflow-executor.service.js';
import { BookingService } from '../../../modules/booking/booking.service.js';
import { ServiceService } from '../../../modules/service/service.service.js';
import { SchedulingEngineService } from '../../scheduling/scheduling-engine.service.js';
import { Booking, BookingStatus } from '../../../modules/booking/entities/booking.entity.js';
import { Employee } from '../../../modules/employee/entities/employee.entity.js';
import { SchedulingPeriod } from '../../../modules/schedule/entities/scheduling-period.entity.js';
import { WorkflowStep } from '../interfaces/workflow.interfaces.js';

@Injectable()
export class WorkflowStepExecutorsService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowStepExecutorsService.name);

  constructor(
    private executor: WorkflowExecutorService,
    private bookingService: BookingService,
    private serviceService: ServiceService,
    private schedulingEngine: SchedulingEngineService,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(SchedulingPeriod) private periodRepo: Repository<SchedulingPeriod>,
  ) {}

  onModuleInit() {
    const executors: Record<string, StepExecutor> = {
      create_booking: (step, ctx) => this.createBooking(step, ctx),
      create_service: (step, ctx) => this.createService(step, ctx),
      cancel_booking: (step, ctx) => this.cancelBooking(step, ctx),
      cancel_bookings: (step, ctx) => this.cancelBookings(step, ctx),
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
    };

    for (const [action, handler] of Object.entries(executors)) {
      this.executor.registerStepExecutor(action, handler);
      this.logger.log(`Registered workflow executor: ${action}`);
    }
  }

  private priorResult(ctx: Record<string, any>, stepId: string): any {
    return ctx[`step_${stepId}_result`];
  }

  private async createBooking(step: WorkflowStep, ctx: Record<string, any>) {
    const { businessId, employeeId, serviceId, customerId, startTime, notes, userId } =
      step.params;
    const booking = await this.bookingService.create(
      businessId,
      { employeeId, serviceId, customerId, startTime, notes },
      userId,
    );
    ctx.lastBookingId = booking.id;
    return { bookingId: booking.id, startTime: booking.startTime, endTime: booking.endTime };
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
    await this.bookingService.cancel(bookingId, reason, userId);
    return { cancelledId: bookingId };
  }

  private async cancelBookings(step: WorkflowStep, ctx: Record<string, any>) {
    const { bookingIds, reason, userId } = step.params as {
      bookingIds: string[];
      reason?: string;
      userId?: string;
    };
    const cancelled: string[] = [];
    for (const id of bookingIds) {
      await this.bookingService.cancel(id, reason, userId);
      cancelled.push(id);
    }
    return { cancelledCount: cancelled.length, cancelledIds: cancelled };
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
      relations: { employee: true, service: true },
      order: { startTime: 'ASC' },
    });

    return {
      freedSlots: cancelled.map((b) => ({
        bookingId: b.id,
        employeeId: b.employeeId,
        employeeName: b.employee?.name,
        serviceName: b.service?.name,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
    };
  }

  private async findRebookingCandidates(step: WorkflowStep, ctx: Record<string, any>) {
    const freed = this.priorResult(ctx, step.dependsOn[0]);
    return {
      candidates: (freed?.freedSlots ?? []).map((slot: any) => ({
        slot,
        suggestion: 'Match with waitlisted or flexible customers for this service window.',
      })),
    };
  }

  private async proposeReassignment(step: WorkflowStep, ctx: Record<string, any>) {
    const candidates = this.priorResult(ctx, step.dependsOn[0]);
    return {
      proposals: (candidates?.candidates ?? []).map((c: any, i: number) => ({
        id: `proposal-${i + 1}`,
        slot: c.slot,
        action: 'rebook_when_customer_confirms',
        status: 'pending_review',
      })),
    };
  }

  private async detectConflicts(step: WorkflowStep) {
    const { businessId } = step.params;
    const { start, end } = this.resolveDateRange(step.params);

    const conflicts = await this.schedulingEngine.findConflicts(businessId, { start, end });
    return { conflictCount: conflicts.length, conflicts };
  }

  private async analyzeResolutionOptions(step: WorkflowStep, ctx: Record<string, any>) {
    const detected = this.priorResult(ctx, step.dependsOn[0]);
    const strategies = step.params.strategies ?? ['reschedule', 'reassign_employee'];
    return {
      options: (detected?.conflicts ?? []).map((c: any) => ({
        employeeId: c.employeeId,
        strategies,
        suggested: 'reschedule_lower_priority_booking',
      })),
    };
  }

  private async proposeResolutions(step: WorkflowStep, ctx: Record<string, any>) {
    const options = this.priorResult(ctx, step.dependsOn[0]);
    return {
      resolutions: (options?.options ?? []).map((o: any, i: number) => ({
        id: `resolution-${i + 1}`,
        employeeId: o.employeeId,
        action: o.suggested,
        status: 'pending_approval',
      })),
    };
  }
}
