import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventType } from '../../../events/event-types.js';
import type { OperationalEvent } from '../../../events/store/event-store.entity.js';
import { NotificationsService } from '../../notifications/notifications.service.js';

@Injectable()
export class ClinicTestResultReleasedListener {
  private readonly logger = new Logger(ClinicTestResultReleasedListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(EventType.TEST_RESULT_RELEASED)
  async handleTestResultReleased(event: OperationalEvent): Promise<void> {
    const resultId =
      typeof event.payload?.resultId === 'string'
        ? event.payload.resultId
        : event.aggregateId;
    if (!resultId) return;

    try {
      await this.notificationsService.sendClinicResultReady(resultId);
    } catch (err) {
      this.logger.warn(
        `Result-ready notification failed for result ${resultId}`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}
