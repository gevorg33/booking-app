import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { WebhooksService } from './webhooks.service.js';
import { WebhookDelivery } from './entities/webhook-delivery.entity.js';
import { WebhookSubscription } from './entities/webhook-subscription.entity.js';
import type { OperationalEvent } from '../../events/store/event-store.entity.js';

@Injectable()
export class WebhookDispatcherListener {
  private readonly logger = new Logger(WebhookDispatcherListener.name);

  constructor(
    private webhooksService: WebhooksService,
    @InjectRepository(WebhookDelivery)
    private deliveryRepo: Repository<WebhookDelivery>,
  ) {}

  @OnEvent('domain.event')
  async handleDomainEvent(event: OperationalEvent): Promise<void> {
    if (!event.businessId) return;

    const subscriptions =
      await this.webhooksService.getActiveSubscriptionsForEvent(
        event.businessId,
        event.eventType,
      );
    if (subscriptions.length === 0) return;

    const payload = {
      id: event.id,
      type: event.eventType,
      businessId: event.businessId,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      payload: event.payload,
      timestamp: event.createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
    const body = JSON.stringify(payload);

    await Promise.all(
      subscriptions.map((sub) =>
        this.deliver(sub, event.eventType, event.id ?? null, body),
      ),
    );
  }

  private async deliver(
    sub: WebhookSubscription,
    eventType: string,
    eventId: string | null,
    body: string,
  ): Promise<void> {
    let secret: string;
    try {
      secret = this.webhooksService.decryptSubscriptionSecret(sub);
    } catch {
      this.logger.warn(
        `Could not decrypt webhook secret for subscription ${sub.id}`,
      );
      return;
    }

    const signature = createHmac('sha256', secret).update(body).digest('hex');
    const delivery = await this.deliveryRepo.save(
      this.deliveryRepo.create({
        subscriptionId: sub.id,
        businessId: sub.businessId,
        eventType,
        eventId,
        status: 'pending',
        attemptCount: 1,
      }),
    );

    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(sub.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-OptiSchedule-Signature': signature,
            'X-OptiSchedule-Event': eventType,
            'User-Agent': 'OptiSchedule-Webhooks/1.0',
          },
          body,
          signal: AbortSignal.timeout(15000),
        });

        const responseText = (await response.text()).slice(0, 2000);
        delivery.httpStatus = response.status;
        delivery.responseBody = responseText;
        delivery.attemptCount = attempt;

        if (response.ok) {
          delivery.status = 'success';
          await this.deliveryRepo.save(delivery);
          return;
        }

        delivery.errorMessage = `HTTP ${response.status}`;
        if (attempt === maxAttempts) {
          delivery.status = 'failed';
          await this.deliveryRepo.save(delivery);
        }
      } catch (err: any) {
        delivery.errorMessage = err.message?.slice(0, 500) ?? 'Delivery failed';
        delivery.attemptCount = attempt;
        if (attempt === maxAttempts) {
          delivery.status = 'failed';
          await this.deliveryRepo.save(delivery);
        }
      }
    }
  }
}
