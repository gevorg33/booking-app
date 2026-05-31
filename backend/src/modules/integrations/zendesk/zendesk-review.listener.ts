import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventType } from '../../../events/event-types.js';
import type { OperationalEvent } from '../../../events/store/event-store.entity.js';
import { ZendeskIntegrationService } from './zendesk-integration.service.js';

@Injectable()
export class ZendeskReviewListener {
  private readonly logger = new Logger(ZendeskReviewListener.name);

  constructor(private readonly zendesk: ZendeskIntegrationService) {}

  @OnEvent(EventType.REVIEW_RECEIVED, { async: true })
  async handleReviewReceived(event: OperationalEvent): Promise<void> {
    if (!event.businessId) return;

    const payload = event.payload ?? {};
    try {
      const ticket = await this.zendesk.createTicketFromReviewIfEnabled(event.businessId, {
        reviewId: typeof payload.reviewId === 'string' ? payload.reviewId : event.aggregateId,
        employeeId: typeof payload.employeeId === 'string' ? payload.employeeId : undefined,
        rating: typeof payload.rating === 'number' ? payload.rating : Number(payload.rating),
        comment: typeof payload.comment === 'string' ? payload.comment : undefined,
        customerId: typeof payload.customerId === 'string' ? payload.customerId : undefined,
        bookingId: typeof payload.bookingId === 'string' ? payload.bookingId : undefined,
        customerName: typeof payload.customerName === 'string' ? payload.customerName : undefined,
      });
      if (ticket) {
        this.logger.log(
          `Zendesk review ticket #${ticket.ticketId} for review ${event.aggregateId}`,
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Zendesk review ticket failed for review ${event.aggregateId}: ${message}`,
      );
    }
  }
}
