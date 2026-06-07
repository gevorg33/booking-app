import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  buildAutoLabBookingRequestCallbackTaskDraft,
  buildAutoResultReviewTaskDraft,
  buildAutoSpecimenCollectionTaskDraft,
  isOverdueLabBookingRequestCallback,
  isOverdueSpecimenCollection,
  isResultInReviewQueue,
  shouldResolveAutoResultReviewTask,
  shouldResolveAutoSpecimenCollectionTask,
} from '../../common/utils/clinic-task-auto.util.js';
import { isClinicVerticalBusinessType } from '../../common/utils/clinic-service.util.js';
import type { ClinicTestResultStatus } from '../../common/utils/clinic-lab-state.util.js';
import type { ClinicSpecimenStatus } from '../../common/utils/clinic-lab-state.util.js';
import type { ClinicTaskType } from '../../common/utils/clinic-task.types.js';
import { isClinicTaskOpen } from '../../common/utils/clinic-task.util.js';
import { Business } from '../business/entities/business.entity.js';
import { ClinicSpecimen } from '../clinic-test-results/entities/clinic-specimen.entity.js';
import { ClinicTestOrder } from '../clinic-test-results/entities/clinic-test-order.entity.js';
import { ClinicTestResult } from '../clinic-test-results/entities/clinic-test-result.entity.js';
import { Service } from '../service/entities/service.entity.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../clinic-test-results/shared/clinic-test-results-gate.util.js';
import { ClinicTask } from './entities/clinic-task.entity.js';

export interface ClinicAutoTaskSyncSummary {
  resultReviewTasksCreated: number;
  specimenTasksCreated: number;
  patientCallbackTasksCreated: number;
}

@Injectable()
export class ClinicTaskAutoService {
  private readonly logger = new Logger(ClinicTaskAutoService.name);

  constructor(
    @InjectRepository(ClinicTask)
    private readonly taskRepo: Repository<ClinicTask>,
    @InjectRepository(ClinicTestResult)
    private readonly resultRepo: Repository<ClinicTestResult>,
    @InjectRepository(ClinicSpecimen)
    private readonly specimenRepo: Repository<ClinicSpecimen>,
    @InjectRepository(ClinicTestOrder)
    private readonly orderRepo: Repository<ClinicTestOrder>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
  ) {}

  private async assertEnabled(businessId: string): Promise<void> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
      select: { id: true, settings: true },
    });
    if (!business) return;
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );
  }

  private async findOpenAutoTask(
    businessId: string,
    taskType: ClinicTaskType,
    link: { testResultId?: string; specimenId?: string; testOrderId?: string },
  ): Promise<ClinicTask | null> {
    const qb = this.taskRepo
      .createQueryBuilder('task')
      .where('task.businessId = :businessId', { businessId })
      .andWhere('task.taskType = :taskType', { taskType })
      .andWhere('task.isAutoManaged = :isAutoManaged', { isAutoManaged: true })
      .andWhere('task.status IN (:...statuses)', {
        statuses: ['open', 'in_progress'],
      });

    if (link.testResultId) {
      qb.andWhere('task.testResultId = :testResultId', {
        testResultId: link.testResultId,
      });
    }
    if (link.specimenId) {
      qb.andWhere('task.specimenId = :specimenId', {
        specimenId: link.specimenId,
      });
    }
    if (link.testOrderId) {
      qb.andWhere('task.testOrderId = :testOrderId', {
        testOrderId: link.testOrderId,
      });
    }

    return qb.getOne();
  }

  private async completeOpenAutoTask(task: ClinicTask): Promise<void> {
    if (!isClinicTaskOpen(task.status)) return;
    task.status = 'completed';
    task.completedAt = new Date();
    await this.taskRepo.save(task);
  }

  private async cancelOpenAutoTask(task: ClinicTask): Promise<void> {
    if (!isClinicTaskOpen(task.status)) return;
    task.status = 'cancelled';
    task.cancelledAt = new Date();
    await this.taskRepo.save(task);
  }

  async syncResultReviewTaskForResult(
    businessId: string,
    resultId: string,
  ): Promise<ClinicTask | null> {
    await this.assertEnabled(businessId);

    const result = await this.resultRepo.findOne({
      where: { id: resultId, businessId },
      relations: { booking: true, testType: true, order: true },
    });
    if (!result || !isResultInReviewQueue(result.status)) {
      return null;
    }

    const existing = await this.findOpenAutoTask(businessId, 'ResultReview', {
      testResultId: result.id,
    });
    if (existing) return existing;

    const draft = buildAutoResultReviewTaskDraft({
      businessId,
      resultId: result.id,
      customerId: result.customerId,
      bookingId: result.bookingId ?? null,
      testOrderId: result.orderId ?? null,
      testName: result.testType?.title ?? result.order?.displayNames ?? null,
      completedAt: result.completedAt ?? new Date(),
      assigneeEmployeeId: result.booking?.employeeId ?? null,
    });

    return this.taskRepo.save(
      this.taskRepo.create({
        businessId,
        status: 'open',
        ...draft,
      }),
    );
  }

  async resolveResultReviewTaskForResult(
    businessId: string,
    resultId: string,
    resolution: 'completed' | 'cancelled' = 'completed',
  ): Promise<void> {
    await this.assertEnabled(businessId);
    const task = await this.findOpenAutoTask(businessId, 'ResultReview', {
      testResultId: resultId,
    });
    if (!task) return;
    if (resolution === 'cancelled') {
      await this.cancelOpenAutoTask(task);
      return;
    }
    await this.completeOpenAutoTask(task);
  }

  async handleResultStatusTransition(
    businessId: string,
    resultId: string,
    fromStatus: ClinicTestResultStatus,
    toStatus: ClinicTestResultStatus,
  ): Promise<void> {
    if (toStatus === fromStatus) return;
    if (isResultInReviewQueue(toStatus)) {
      await this.syncResultReviewTaskForResult(businessId, resultId);
      return;
    }
    if (shouldResolveAutoResultReviewTask(fromStatus, toStatus)) {
      await this.resolveResultReviewTaskForResult(
        businessId,
        resultId,
        toStatus === 'Rejected' ? 'cancelled' : 'completed',
      );
    }
  }

  async syncOverdueSpecimenCollectionTask(
    businessId: string,
    specimenId: string,
    now: Date = new Date(),
  ): Promise<{ task: ClinicTask | null; created: boolean }> {
    await this.assertEnabled(businessId);

    const specimen = await this.specimenRepo.findOne({
      where: { id: specimenId, businessId },
      relations: { order: { booking: true } },
    });
    if (!specimen) return { task: null, created: false };

    const overdue = isOverdueSpecimenCollection(
      {
        status: specimen.status,
        bookingStartTime: specimen.order?.booking?.startTime ?? null,
        specimenCreatedAt: specimen.createdAt,
      },
      now,
    );
    if (!overdue) return { task: null, created: false };

    const existing = await this.findOpenAutoTask(
      businessId,
      'SpecimenCollection',
      { specimenId: specimen.id },
    );
    if (existing) return { task: existing, created: false };

    const draft = buildAutoSpecimenCollectionTaskDraft({
      customerId: specimen.customerId,
      bookingId: specimen.bookingId ?? null,
      testOrderId: specimen.orderId,
      specimenId: specimen.id,
      orderDisplayNames: specimen.order?.displayNames ?? null,
      bookingStartTime: specimen.order?.booking?.startTime ?? null,
      specimenCreatedAt: specimen.createdAt,
      assigneeEmployeeId: specimen.order?.booking?.employeeId ?? null,
      now,
    });

    const task = await this.taskRepo.save(
      this.taskRepo.create({
        businessId,
        status: 'open',
        ...draft,
      }),
    );
    return { task, created: true };
  }

  async resolveSpecimenCollectionTaskForSpecimen(
    businessId: string,
    specimenId: string,
  ): Promise<void> {
    await this.assertEnabled(businessId);
    const task = await this.findOpenAutoTask(businessId, 'SpecimenCollection', {
      specimenId,
    });
    if (!task) return;
    await this.completeOpenAutoTask(task);
  }

  async handleSpecimenStatusTransition(
    businessId: string,
    specimenId: string,
    fromStatus: ClinicSpecimenStatus,
    toStatus: ClinicSpecimenStatus,
  ): Promise<void> {
    if (toStatus === fromStatus) return;
    if (shouldResolveAutoSpecimenCollectionTask(fromStatus, toStatus)) {
      await this.resolveSpecimenCollectionTaskForSpecimen(
        businessId,
        specimenId,
      );
    }
  }

  async syncOverdueLabBookingRequestCallbackTask(
    businessId: string,
    orderId: string,
    now: Date = new Date(),
  ): Promise<{ task: ClinicTask | null; created: boolean }> {
    await this.assertEnabled(businessId);

    const order = await this.orderRepo.findOne({
      where: { id: orderId, businessId },
    });
    if (!order) return { task: null, created: false };

    const overdue = isOverdueLabBookingRequestCallback(order, now);
    if (!overdue) return { task: null, created: false };

    const existing = await this.findOpenAutoTask(
      businessId,
      'PatientCallback',
      { testOrderId: order.id },
    );
    if (existing) return { task: existing, created: false };

    let collectionServiceName: string | null = null;
    if (order.collectionServiceId) {
      const service = await this.serviceRepo.findOne({
        where: { id: order.collectionServiceId, businessId },
        select: { id: true, name: true },
      });
      collectionServiceName = service?.name ?? null;
    }

    const draft = buildAutoLabBookingRequestCallbackTaskDraft({
      customerId: order.customerId,
      bookingId: order.bookingId ?? null,
      testOrderId: order.id,
      orderDisplayNames: order.displayNames ?? null,
      collectionServiceName,
      pushedAt: order.bookingRequestPushedAt!,
      assigneeEmployeeId:
        order.bookingRequestPushedByEmployeeId ?? order.employeeId ?? null,
    });

    const task = await this.taskRepo.save(
      this.taskRepo.create({
        businessId,
        status: 'open',
        ...draft,
      }),
    );
    return { task, created: true };
  }

  async resolveLabBookingRequestCallbackTask(
    businessId: string,
    orderId: string,
  ): Promise<void> {
    await this.assertEnabled(businessId);
    const task = await this.findOpenAutoTask(businessId, 'PatientCallback', {
      testOrderId: orderId,
    });
    if (!task) return;
    await this.completeOpenAutoTask(task);
  }

  async syncOverdueLabBookingRequestCallbackTasks(
    businessId: string,
    now: Date = new Date(),
  ): Promise<number> {
    await this.assertEnabled(businessId);

    const orders = await this.orderRepo
      .createQueryBuilder('order')
      .where('order.businessId = :businessId', { businessId })
      .andWhere('order.bookingRequestPushedAt IS NOT NULL')
      .andWhere('order.collectionBookingId IS NULL')
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['NotCollected', 'Collecting', 'AwaitingResults'],
      })
      .getMany();

    let created = 0;
    for (const order of orders) {
      const result = await this.syncOverdueLabBookingRequestCallbackTask(
        businessId,
        order.id,
        now,
      );
      if (result.created) {
        created += 1;
      }
    }
    return created;
  }

  async syncOverdueSpecimenCollectionTasks(
    businessId: string,
    now: Date = new Date(),
  ): Promise<number> {
    await this.assertEnabled(businessId);

    const specimens = await this.specimenRepo
      .createQueryBuilder('specimen')
      .leftJoinAndSelect('specimen.order', 'order')
      .leftJoinAndSelect('order.booking', 'booking')
      .where('specimen.businessId = :businessId', { businessId })
      .andWhere('specimen.status IN (:...statuses)', {
        statuses: ['NotCollected', 'RecollectRequired'],
      })
      .getMany();

    let created = 0;
    for (const specimen of specimens) {
      const result = await this.syncOverdueSpecimenCollectionTask(
        businessId,
        specimen.id,
        now,
      );
      if (result.created) {
        created += 1;
      }
    }
    return created;
  }

  async syncAutoTasksForBusiness(
    businessId: string,
    now: Date = new Date(),
  ): Promise<ClinicAutoTaskSyncSummary> {
    await this.assertEnabled(businessId);

    const reviewResults = await this.resultRepo.find({
      where: { businessId, status: 'Completed' },
      select: { id: true },
    });

    let resultReviewTasksCreated = 0;
    for (const result of reviewResults) {
      const before = await this.findOpenAutoTask(businessId, 'ResultReview', {
        testResultId: result.id,
      });
      const task = await this.syncResultReviewTaskForResult(
        businessId,
        result.id,
      );
      if (task && !before) {
        resultReviewTasksCreated += 1;
      }
    }

    const specimenTasksCreated = await this.syncOverdueSpecimenCollectionTasks(
      businessId,
      now,
    );

    const patientCallbackTasksCreated =
      await this.syncOverdueLabBookingRequestCallbackTasks(businessId, now);

    return {
      resultReviewTasksCreated,
      specimenTasksCreated,
      patientCallbackTasksCreated,
    };
  }

  async syncAllClinicBusinessAutoTasks(
    now: Date = new Date(),
  ): Promise<number> {
    const businesses = await this.businessRepo.find({
      select: { id: true, settings: true },
    });

    let totalCreated = 0;
    for (const business of businesses) {
      const businessType = readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      );
      if (!isClinicVerticalBusinessType(businessType)) continue;

      try {
        const summary = await this.syncAutoTasksForBusiness(business.id, now);
        totalCreated +=
          summary.resultReviewTasksCreated +
          summary.specimenTasksCreated +
          summary.patientCallbackTasksCreated;
      } catch (error) {
        this.logger.warn(
          `Auto-task sync skipped for business ${business.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return totalCreated;
  }
}
