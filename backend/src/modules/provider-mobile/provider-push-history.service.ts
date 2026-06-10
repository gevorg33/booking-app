/** prov-exp-10.1 — persist and query provider push notification history. */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThanOrEqual, Repository } from 'typeorm';
import { ProviderPushNotification } from './entities/provider-push-notification.entity.js';
import {
  buildProviderPushNotificationCenterView,
  PROVIDER_PUSH_HISTORY_DAYS,
  PROVIDER_PUSH_HISTORY_LIMIT,
  providerPushHistoryCutoff,
  resolveProviderPushHistoryKind,
  type ProviderPushHistoryKind,
  type ProviderPushNotificationCenterView,
} from './provider-push-history.util.js';

export interface RecordProviderPushDeliveryInput {
  userId: string;
  businessId: string;
  title: string;
  body: string;
  bookingId?: string | null;
  url?: string | null;
  kind: ProviderPushHistoryKind | string;
}

@Injectable()
export class ProviderPushHistoryService {
  constructor(
    @InjectRepository(ProviderPushNotification)
    private repo: Repository<ProviderPushNotification>,
  ) {}

  async recordDelivery(input: RecordProviderPushDeliveryInput): Promise<void> {
    await this.repo.save(
      this.repo.create({
        userId: input.userId,
        businessId: input.businessId,
        bookingId: input.bookingId ?? null,
        title: input.title.trim(),
        body: input.body.trim(),
        url: input.url?.trim() || null,
        kind: resolveProviderPushHistoryKind(input.kind),
        readAt: null,
      }),
    );
  }

  async listNotificationCenter(
    businessId: string,
    userId: string,
    referenceDate: Date = new Date(),
  ): Promise<ProviderPushNotificationCenterView> {
    const since = providerPushHistoryCutoff(referenceDate, PROVIDER_PUSH_HISTORY_DAYS);
    const rows = await this.repo.find({
      where: {
        businessId,
        userId,
        sentAt: MoreThanOrEqual(since),
      },
      order: { sentAt: 'DESC' },
      take: PROVIDER_PUSH_HISTORY_LIMIT,
    });
    return buildProviderPushNotificationCenterView(rows, referenceDate);
  }

  async markNotificationRead(
    businessId: string,
    userId: string,
    notificationId: string,
    readAt: Date = new Date(),
  ): Promise<ProviderPushNotification> {
    const row = await this.repo.findOne({
      where: { id: notificationId, businessId, userId },
    });
    if (!row) {
      throw new NotFoundException('Notification not found');
    }
    if (!row.readAt) {
      row.readAt = readAt;
      await this.repo.save(row);
    }
    return row;
  }

  async markAllNotificationsRead(
    businessId: string,
    userId: string,
    readAt: Date = new Date(),
  ): Promise<{ updated: number }> {
    const result = await this.repo.update(
      {
        businessId,
        userId,
        readAt: IsNull(),
      },
      { readAt },
    );
    return { updated: result.affected ?? 0 };
  }

  async markLatestBookingNotificationRead(
    businessId: string,
    userId: string,
    bookingId: string,
    readAt: Date = new Date(),
  ): Promise<void> {
    const row = await this.repo.findOne({
      where: { businessId, userId, bookingId, readAt: IsNull() },
      order: { sentAt: 'DESC' },
    });
    if (!row) return;
    row.readAt = readAt;
    await this.repo.save(row);
  }
}
