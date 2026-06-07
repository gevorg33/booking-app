import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import {
  assertAllowedClinicTaskType,
  canTransitionClinicTaskStatus,
  CLINIC_TASK_LIST_DEFAULT_PAGE_SIZE,
  defaultClinicTaskTitle,
  normalizeClinicTaskNotes,
  validateClinicTaskLinks,
} from '../../common/utils/clinic-task.util.js';
import {
  canAssignClinicTask,
  canCancelClinicTask,
  canClaimClinicTask,
  canCompleteClinicTask,
  canCreateClinicTask,
  canListClinicTasks,
  canManageClinicTasks,
  resolveClinicTaskAssigneeFilter,
} from '../../common/utils/clinic-task-access.util.js';
import type { ClinicLabStaffContext } from '../../common/utils/clinic-lab-access.util.js';
import type {
  ClinicTaskListResponse,
  ClinicTaskView,
} from '../../common/utils/clinic-task.types.js';
import { BusinessService } from '../business/business.service.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { ClinicSpecimen } from '../clinic-test-results/entities/clinic-specimen.entity.js';
import { ClinicTestOrder } from '../clinic-test-results/entities/clinic-test-order.entity.js';
import { ClinicTestResult } from '../clinic-test-results/entities/clinic-test-result.entity.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../clinic-test-results/shared/clinic-test-results-gate.util.js';
import { PatientEncounter } from '../patient-clinical-profiles/entities/patient-encounter.entity.js';
import type {
  AssignClinicTaskDto,
  CompleteClinicTaskDto,
  CreateClinicTaskDto,
  ListClinicTasksQueryDto,
  UpdateClinicTaskDto,
} from './dto/clinic-task.dto.js';
import { ClinicTask } from './entities/clinic-task.entity.js';
import { mapClinicTaskView } from './clinic-task-map.util.js';
import { ClinicTaskAutoService } from './clinic-task-auto.service.js';
import type { ClinicAutoTaskSyncSummary } from './clinic-task-auto.service.js';

@Injectable()
export class ClinicTasksService {
  constructor(
    @InjectRepository(ClinicTask)
    private readonly taskRepo: Repository<ClinicTask>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(ClinicTestOrder)
    private readonly testOrderRepo: Repository<ClinicTestOrder>,
    @InjectRepository(ClinicTestResult)
    private readonly testResultRepo: Repository<ClinicTestResult>,
    @InjectRepository(ClinicSpecimen)
    private readonly specimenRepo: Repository<ClinicSpecimen>,
    @InjectRepository(PatientEncounter)
    private readonly encounterRepo: Repository<PatientEncounter>,
    private readonly businessService: BusinessService,
    @Optional() private readonly clinicTaskAutoService?: ClinicTaskAutoService,
  ) {}

  private async assertEnabled(businessId: string): Promise<void> {
    const business = await this.businessService.findOne(businessId);
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );
  }

  private async resolveStaffContext(
    businessId: string,
    userId: string,
  ): Promise<ClinicLabStaffContext> {
    const membership = await this.businessService.ensureMember(
      businessId,
      userId,
    );
    const employee = await this.employeeRepo.findOne({
      where: { businessId, userId, isActive: true },
      select: { id: true },
    });
    return {
      userId,
      membershipRole: membership.role,
      employeeId: employee?.id ?? null,
    };
  }

  private async assertListAccess(businessId: string, userId: string) {
    await this.assertEnabled(businessId);
    const ctx = await this.resolveStaffContext(businessId, userId);
    if (!canListClinicTasks(ctx)) {
      throw new ForbiddenException('You do not have access to clinic tasks');
    }
    return ctx;
  }

  private async assertCreateAccess(businessId: string, userId: string) {
    const ctx = await this.assertListAccess(businessId, userId);
    if (!canCreateClinicTask(ctx)) {
      throw new ForbiddenException(
        'You do not have permission to create clinic tasks',
      );
    }
    return ctx;
  }

  private async assertManageAccess(businessId: string, userId: string) {
    const ctx = await this.assertListAccess(businessId, userId);
    if (!canManageClinicTasks(ctx)) {
      throw new ForbiddenException(
        'You do not have permission to manage clinic tasks',
      );
    }
    return ctx;
  }

  private async loadTaskOrThrow(
    businessId: string,
    taskId: string,
  ): Promise<ClinicTask> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, businessId },
    });
    if (!task) {
      throw new NotFoundException('Clinic task not found');
    }
    return task;
  }

  private parseDueAt(value?: string | null): Date | null {
    if (!value?.trim()) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid due date');
    }
    return parsed;
  }

  private extractLinks(dto: CreateClinicTaskDto | UpdateClinicTaskDto) {
    return {
      customerId: dto.customerId ?? null,
      bookingId: dto.bookingId ?? null,
      testOrderId: dto.testOrderId ?? null,
      testResultId: dto.testResultId ?? null,
      specimenId: dto.specimenId ?? null,
      encounterId: dto.encounterId ?? null,
    };
  }

  private async assertEmployeeInBusiness(
    businessId: string,
    employeeId?: string | null,
  ): Promise<void> {
    if (!employeeId?.trim()) return;
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId.trim(), businessId, isActive: true },
      select: { id: true },
    });
    if (!employee) {
      throw new NotFoundException('Assignee employee not found');
    }
  }

  private async assertLinkedRecords(
    businessId: string,
    links: ReturnType<ClinicTasksService['extractLinks']>,
  ): Promise<void> {
    if (links.customerId) {
      const customer = await this.customerRepo.findOne({
        where: { id: links.customerId, businessId },
        select: { id: true },
      });
      if (!customer) throw new NotFoundException('Customer not found');
    }
    if (links.bookingId) {
      const booking = await this.bookingRepo.findOne({
        where: { id: links.bookingId, businessId },
        select: { id: true },
      });
      if (!booking) throw new NotFoundException('Booking not found');
    }
    if (links.testOrderId) {
      const order = await this.testOrderRepo.findOne({
        where: { id: links.testOrderId, businessId },
        select: { id: true },
      });
      if (!order) throw new NotFoundException('Test order not found');
    }
    if (links.testResultId) {
      const result = await this.testResultRepo.findOne({
        where: { id: links.testResultId, businessId },
        select: { id: true },
      });
      if (!result) throw new NotFoundException('Test result not found');
    }
    if (links.specimenId) {
      const specimen = await this.specimenRepo.findOne({
        where: { id: links.specimenId, businessId },
        select: { id: true },
      });
      if (!specimen) throw new NotFoundException('Specimen not found');
    }
    if (links.encounterId) {
      const encounter = await this.encounterRepo.findOne({
        where: { id: links.encounterId, businessId },
        select: { id: true },
      });
      if (!encounter) throw new NotFoundException('Encounter not found');
    }
  }

  async listClinicTasks(
    businessId: string,
    userId: string,
    query: ListClinicTasksQueryDto = {},
  ): Promise<ClinicTaskListResponse> {
    const ctx = await this.assertListAccess(businessId, userId);

    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize =
      query.pageSize && query.pageSize > 0
        ? Math.min(query.pageSize, 100)
        : CLINIC_TASK_LIST_DEFAULT_PAGE_SIZE;

    const qb = this.taskRepo
      .createQueryBuilder('task')
      .where('task.businessId = :businessId', { businessId });

    if (query.status) {
      qb.andWhere('task.status = :status', { status: query.status });
    }
    if (query.taskType) {
      qb.andWhere('task.taskType = :taskType', { taskType: query.taskType });
    }
    if (query.customerId) {
      qb.andWhere('task.customerId = :customerId', {
        customerId: query.customerId,
      });
    }
    if (query.assigneeEmployeeId) {
      qb.andWhere('task.assigneeEmployeeId = :assigneeEmployeeId', {
        assigneeEmployeeId: query.assigneeEmployeeId,
      });
    }
    if (query.dueBefore) {
      qb.andWhere('task.dueAt <= :dueBefore', {
        dueBefore: this.parseDueAt(query.dueBefore),
      });
    }
    if (query.dueAfter) {
      qb.andWhere('task.dueAt >= :dueAfter', {
        dueAfter: this.parseDueAt(query.dueAfter),
      });
    }

    const providerFilter = resolveClinicTaskAssigneeFilter(ctx);
    if (providerFilter) {
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('task.assigneeEmployeeId IS NULL')
            .orWhere('task.assigneeEmployeeId = :providerEmployeeId', {
              providerEmployeeId: providerFilter,
            });
        }),
      );
    }

    qb.orderBy('task.dueAt', 'ASC', 'NULLS LAST')
      .addOrderBy('task.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [tasks, totalItems] = await qb.getManyAndCount();

    return {
      items: tasks.map(mapClinicTaskView),
      totalItems,
      page,
      pageSize,
    };
  }

  async getClinicTask(
    businessId: string,
    userId: string,
    taskId: string,
  ): Promise<ClinicTaskView> {
    const ctx = await this.assertListAccess(businessId, userId);
    const task = await this.loadTaskOrThrow(businessId, taskId);
    const providerFilter = resolveClinicTaskAssigneeFilter(ctx);
    if (
      providerFilter &&
      task.assigneeEmployeeId != null &&
      task.assigneeEmployeeId !== providerFilter
    ) {
      throw new ForbiddenException(
        'You do not have access to this clinic task',
      );
    }
    return mapClinicTaskView(task);
  }

  async createClinicTask(
    businessId: string,
    userId: string,
    dto: CreateClinicTaskDto,
  ): Promise<ClinicTaskView> {
    const ctx = await this.assertCreateAccess(businessId, userId);
    let taskType;
    try {
      taskType = assertAllowedClinicTaskType(dto.taskType);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Unsupported clinic task type',
      );
    }
    const links = this.extractLinks(dto);
    const linkError = validateClinicTaskLinks(taskType, links);
    if (linkError) {
      throw new BadRequestException(linkError);
    }
    await this.assertLinkedRecords(businessId, links);
    await this.assertEmployeeInBusiness(businessId, dto.assigneeEmployeeId);

    const task = this.taskRepo.create({
      businessId,
      taskType,
      status: 'open',
      title: dto.title?.trim() || defaultClinicTaskTitle(taskType),
      notes: normalizeClinicTaskNotes(dto.notes),
      priority: dto.priority ?? 'normal',
      dueAt: this.parseDueAt(dto.dueAt),
      ...links,
      assigneeEmployeeId: dto.assigneeEmployeeId?.trim() || null,
      createdByEmployeeId: ctx.employeeId,
    });

    const saved = await this.taskRepo.save(task);
    return mapClinicTaskView(saved);
  }

  async updateClinicTask(
    businessId: string,
    userId: string,
    taskId: string,
    dto: UpdateClinicTaskDto,
  ): Promise<ClinicTaskView> {
    const ctx = await this.assertListAccess(businessId, userId);
    const task = await this.loadTaskOrThrow(businessId, taskId);

    const links = {
      customerId:
        (dto.customerId !== undefined ? dto.customerId : task.customerId) ??
        null,
      bookingId:
        (dto.bookingId !== undefined ? dto.bookingId : task.bookingId) ?? null,
      testOrderId:
        (dto.testOrderId !== undefined ? dto.testOrderId : task.testOrderId) ??
        null,
      testResultId:
        (dto.testResultId !== undefined
          ? dto.testResultId
          : task.testResultId) ?? null,
      specimenId:
        (dto.specimenId !== undefined ? dto.specimenId : task.specimenId) ??
        null,
      encounterId:
        (dto.encounterId !== undefined ? dto.encounterId : task.encounterId) ??
        null,
    };

    const linkError = validateClinicTaskLinks(task.taskType, links);
    if (linkError) {
      throw new BadRequestException(linkError);
    }
    await this.assertLinkedRecords(businessId, links);

    if (dto.assigneeEmployeeId !== undefined) {
      if (
        !canAssignClinicTask(ctx) &&
        dto.assigneeEmployeeId !== task.assigneeEmployeeId
      ) {
        throw new ForbiddenException(
          'You do not have permission to assign clinic tasks',
        );
      }
      await this.assertEmployeeInBusiness(businessId, dto.assigneeEmployeeId);
      task.assigneeEmployeeId = dto.assigneeEmployeeId?.trim() || null;
    }

    if (dto.status !== undefined) {
      if (!canManageClinicTasks(ctx)) {
        throw new ForbiddenException(
          'You do not have permission to change task status',
        );
      }
      if (!canTransitionClinicTaskStatus(task.status, dto.status)) {
        throw new BadRequestException('Invalid clinic task status transition');
      }
      task.status = dto.status;
      if (dto.status === 'completed') {
        task.completedAt = new Date();
        task.completedByEmployeeId = ctx.employeeId;
      }
      if (dto.status === 'cancelled') {
        task.cancelledAt = new Date();
      }
    }

    if (dto.title !== undefined) task.title = dto.title.trim();
    if (dto.notes !== undefined)
      task.notes = normalizeClinicTaskNotes(dto.notes);
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.dueAt !== undefined) task.dueAt = this.parseDueAt(dto.dueAt);

    task.customerId = links.customerId ?? null;
    task.bookingId = links.bookingId ?? null;
    task.testOrderId = links.testOrderId ?? null;
    task.testResultId = links.testResultId ?? null;
    task.specimenId = links.specimenId ?? null;
    task.encounterId = links.encounterId ?? null;

    const saved = await this.taskRepo.save(task);
    return mapClinicTaskView(saved);
  }

  async assignClinicTask(
    businessId: string,
    userId: string,
    taskId: string,
    dto: AssignClinicTaskDto,
  ): Promise<ClinicTaskView> {
    const ctx = await this.assertManageAccess(businessId, userId);
    const task = await this.loadTaskOrThrow(businessId, taskId);
    await this.assertEmployeeInBusiness(businessId, dto.assigneeEmployeeId);
    task.assigneeEmployeeId = dto.assigneeEmployeeId.trim();
    if (task.status === 'open') {
      task.status = 'in_progress';
    }
    task.updatedAt = new Date();
    const saved = await this.taskRepo.save(task);
    return mapClinicTaskView(saved);
  }

  async claimClinicTask(
    businessId: string,
    userId: string,
    taskId: string,
  ): Promise<ClinicTaskView> {
    const ctx = await this.assertListAccess(businessId, userId);
    const task = await this.loadTaskOrThrow(businessId, taskId);
    if (!canClaimClinicTask(ctx, task)) {
      throw new ForbiddenException(
        'You do not have permission to claim this task',
      );
    }
    task.assigneeEmployeeId = ctx.employeeId!;
    if (task.status === 'open') {
      task.status = 'in_progress';
    }
    task.updatedAt = new Date();
    const saved = await this.taskRepo.save(task);
    return mapClinicTaskView(saved);
  }

  async completeClinicTask(
    businessId: string,
    userId: string,
    taskId: string,
    dto: CompleteClinicTaskDto = {},
  ): Promise<ClinicTaskView> {
    const ctx = await this.assertListAccess(businessId, userId);
    const task = await this.loadTaskOrThrow(businessId, taskId);
    if (!canCompleteClinicTask(ctx, task)) {
      throw new ForbiddenException(
        'You do not have permission to complete this task',
      );
    }
    if (!canTransitionClinicTaskStatus(task.status, 'completed')) {
      throw new BadRequestException(
        'Task cannot be completed from its current status',
      );
    }
    task.status = 'completed';
    task.completedAt = new Date();
    task.completedByEmployeeId = ctx.employeeId;
    if (dto.notes !== undefined) {
      task.notes = normalizeClinicTaskNotes(dto.notes);
    }
    const saved = await this.taskRepo.save(task);
    return mapClinicTaskView(saved);
  }

  async cancelClinicTask(
    businessId: string,
    userId: string,
    taskId: string,
  ): Promise<ClinicTaskView> {
    const ctx = await this.assertListAccess(businessId, userId);
    const task = await this.loadTaskOrThrow(businessId, taskId);
    if (!canCancelClinicTask(ctx, task)) {
      throw new ForbiddenException(
        'You do not have permission to cancel this task',
      );
    }
    task.status = 'cancelled';
    task.cancelledAt = new Date();
    const saved = await this.taskRepo.save(task);
    return mapClinicTaskView(saved);
  }

  async syncAutoTasks(
    businessId: string,
    userId: string,
  ): Promise<ClinicAutoTaskSyncSummary> {
    await this.assertManageAccess(businessId, userId);
    if (!this.clinicTaskAutoService) {
      return {
        resultReviewTasksCreated: 0,
        specimenTasksCreated: 0,
        patientCallbackTasksCreated: 0,
      };
    }
    return this.clinicTaskAutoService.syncAutoTasksForBusiness(businessId);
  }
}
