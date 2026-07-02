import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { BusinessService } from '../business/business.service.js';
import { AppEvent } from './entities/app-event.entity.js';
import type { IngestAppEventsDto } from './dto/ingest-app-events.dto.js';
import {
  buildAdoptionDashboardExport,
  buildAppEventRecordPayload,
  filterRowsByPeriod,
  shouldRateLimitAppEvents,
  type AppEventAnalyticsRow,
  type RateLimitState,
} from '../../common/utils/app-adoption-analytics.util.js';
import { ConsumerPushTokenService } from '../notifications/consumer-push-token.service.js';

@Injectable()
export class AppEventService {
  private readonly logger = new Logger(AppEventService.name);
  private readonly rateLimits = new Map<string, RateLimitState>();

  constructor(
    @InjectRepository(AppEvent)
    private readonly appEventRepo: Repository<AppEvent>,
    private readonly businessService: BusinessService,
    private readonly consumerPushTokens: ConsumerPushTokenService,
  ) {}

  async ingestEvents(
    dto: IngestAppEventsDto,
  ): Promise<{ recorded: number; skipped: number }> {
    if (!dto.consentGranted) {
      throw new BadRequestException('Analytics consent is required');
    }

    const businessId = await this.resolveBusinessId(
      dto.businessId,
      dto.tenantSlug,
    );
    let recorded = 0;
    let skipped = 0;

    for (const input of dto.events) {
      const payload = buildAppEventRecordPayload(businessId, input);
      if (!payload) {
        skipped += 1;
        continue;
      }

      const rateKey = `${businessId}:${payload.anonId}`;
      const { limited, next } = shouldRateLimitAppEvents(
        this.rateLimits.get(rateKey),
        Date.now(),
      );
      this.rateLimits.set(rateKey, next);
      if (limited) {
        throw new HttpException(
          'App event rate limit exceeded',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      await this.appEventRepo.save(this.appEventRepo.create(payload));
      recorded += 1;
    }

    return { recorded, skipped };
  }

  async getAdoptionDashboard(businessId: string, periodDays: number) {
    const clampedDays = Math.min(90, Math.max(7, periodDays));
    const cutoff = new Date(Date.now() - clampedDays * 24 * 60 * 60 * 1000);
    const entities = await this.appEventRepo.find({
      where: { businessId, createdAt: MoreThanOrEqual(cutoff) },
      order: { createdAt: 'ASC' },
    });

    const rows: AppEventAnalyticsRow[] = entities.map((entity) => ({
      anonId: entity.anonId,
      event: entity.event,
      platform: entity.platform,
      appSurface: entity.appSurface,
      locale: entity.locale,
      tenantSlug: entity.tenantSlug,
      createdAt: entity.createdAt,
      props: entity.props,
    }));

    return buildAdoptionDashboardExport(
      filterRowsByPeriod(rows, clampedDays),
      clampedDays,
      new Date(),
      await this.consumerPushTokens.getDeliverabilityAggregate(businessId),
    );
  }

  private async resolveBusinessId(
    businessId: string | undefined,
    tenantSlug: string | undefined,
  ): Promise<string> {
    if (businessId?.trim()) return businessId.trim();
    const slug = tenantSlug?.trim();
    if (!slug) {
      throw new BadRequestException('businessId or tenantSlug is required');
    }
    const business = await this.businessService.findBySlug(slug);
    if (!business) {
      throw new BadRequestException('Unknown tenant slug');
    }
    return business.id;
  }
}
