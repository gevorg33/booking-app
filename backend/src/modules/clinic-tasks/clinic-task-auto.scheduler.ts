import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ClinicTaskAutoService } from './clinic-task-auto.service.js';

@Injectable()
export class ClinicTaskAutoScheduler {
  private readonly logger = new Logger(ClinicTaskAutoScheduler.name);

  constructor(private readonly clinicTaskAutoService: ClinicTaskAutoService) {}

  /** Every 15 minutes — overdue specimen collection auto-tasks across clinic businesses. */
  @Cron('0 */15 * * * *')
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
