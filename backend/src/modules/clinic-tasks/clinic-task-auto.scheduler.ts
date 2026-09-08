import { Injectable, Logger } from '@nestjs/common';
import { SchedulerLockService } from '../../common/scheduler-lock/scheduler-lock.service.js';
import { Cron } from '@nestjs/schedule';
import { ClinicTaskAutoService } from './clinic-task-auto.service.js';

@Injectable()
export class ClinicTaskAutoScheduler {
  private readonly logger = new Logger(ClinicTaskAutoScheduler.name);

  constructor(
    private readonly clinicTaskAutoService: ClinicTaskAutoService,
    private readonly schedulerLock: SchedulerLockService,
  ) {}

  /** Every 15 minutes — overdue specimen collection auto-tasks across clinic businesses. */
  @Cron('0 */15 * * * *')
  async syncOverdueSpecimenTasksScheduled(): Promise<void> {
    // e2e-bug.497 — the cron entry point; `syncOverdueSpecimenTasks` stays callable directly
    // (and is what the specs drive) so the lock wraps scheduling, not the work.
    await this.schedulerLock.runExclusively(
      'clinic-task-auto.syncOverdueSpecimenTasks',
      () => this.syncOverdueSpecimenTasks(),
    );
  }

  async syncOverdueSpecimenTasks(): Promise<void> {
    try {
      const created =
        await this.clinicTaskAutoService.syncAllClinicBusinessAutoTasks();
      if (created > 0) {
        this.logger.log(`Created ${created} auto-managed clinic task(s)`);
      }
    } catch (error) {
      this.logger.error(
        'Clinic auto-task sync failed',
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
