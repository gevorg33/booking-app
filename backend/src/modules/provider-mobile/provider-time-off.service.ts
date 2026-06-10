import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessService } from '../business/business.service.js';
import { BlockScheduleService } from '../schedule/services/block-schedule.service.js';
import { isMobileManagerRole } from './provider-mobile-access.js';
import { ProviderTimeOffRequest } from './entities/provider-time-off-request.entity.js';
import {
  buildBlockScheduleDtoFromTimeOffRequest,
  isProviderTimeOffEnabled,
  mapProviderTimeOffRequestView,
  OPEN_TIME_OFF_STATUSES,
  PROVIDER_TIME_OFF_REASON_MAX,
  readProviderTimeOffSettings,
  validateProviderTimeOffRange,
  type ProviderTimeOffRangeInput,
} from './provider-time-off.util.js';

export interface CreateProviderTimeOffRequestInput extends ProviderTimeOffRangeInput {
  reason?: string | null;
}

@Injectable()
export class ProviderTimeOffService {
  constructor(
    @InjectRepository(ProviderTimeOffRequest)
    private requestRepo: Repository<ProviderTimeOffRequest>,
    private businessService: BusinessService,
    private blockScheduleService: BlockScheduleService,
  ) {}

  private async readSettings(businessId: string) {
    const business = await this.businessService.findOne(businessId);
    return readProviderTimeOffSettings(
      business?.settings as Record<string, unknown> | undefined,
    );
  }

  private assertFeatureEnabled(settings: ReturnType<typeof readProviderTimeOffSettings>) {
    if (!isProviderTimeOffEnabled(settings)) {
      throw new ForbiddenException(
        'Time-off requests are not enabled. Ask your manager to turn this on in Settings.',
      );
    }
  }

  async createRequest(
    businessId: string,
    userId: string,
    employeeId: string,
    input: CreateProviderTimeOffRequestInput,
  ) {
    const settings = await this.readSettings(businessId);
    this.assertFeatureEnabled(settings);

    const validationError = validateProviderTimeOffRange(input);
    if (validationError) {
      throw new BadRequestException(validationError);
    }

    const reason = input.reason?.trim().slice(0, PROVIDER_TIME_OFF_REASON_MAX) || null;
    const request = this.requestRepo.create({
      businessId,
      employeeId,
      requestedByUserId: userId,
      startDate: input.startDate.trim(),
      endDate: input.endDate.trim(),
      dailyStartTime: input.dailyStartTime.trim(),
      dailyEndTime: input.dailyEndTime.trim(),
      reason,
      status: 'pending',
    });

    const saved = await this.requestRepo.save(request);
    return mapProviderTimeOffRequestView(saved);
  }

  async listForEmployee(
    businessId: string,
    employeeId: string,
    limit = 20,
  ) {
    const rows = await this.requestRepo.find({
      where: { businessId, employeeId },
      relations: { employee: true },
      order: { createdAt: 'DESC' },
      take: Math.min(50, Math.max(1, limit)),
    });
    return rows.map(mapProviderTimeOffRequestView);
  }

  async listForBusiness(
    businessId: string,
    status?: string,
    limit = 50,
  ) {
    const where: Record<string, unknown> = { businessId };
    if (status?.trim()) {
      where.status = status.trim();
    }

    const rows = await this.requestRepo.find({
      where,
      relations: { employee: true },
      order: { createdAt: 'DESC' },
      take: Math.min(100, Math.max(1, limit)),
    });
    return rows.map(mapProviderTimeOffRequestView);
  }

  async getRequestOrThrow(businessId: string, requestId: string) {
    const request = await this.requestRepo.findOne({
      where: { id: requestId, businessId },
      relations: { employee: true },
    });
    if (!request) {
      throw new NotFoundException('Time-off request not found');
    }
    return request;
  }

  async cancelRequest(businessId: string, employeeId: string, requestId: string) {
    const request = await this.getRequestOrThrow(businessId, requestId);
    if (request.employeeId !== employeeId) {
      throw new ForbiddenException('You can only cancel your own time-off requests');
    }
    if (request.status !== 'pending') {
      throw new BadRequestException('Only pending requests can be cancelled');
    }

    request.status = 'cancelled';
    const saved = await this.requestRepo.save(request);
    return mapProviderTimeOffRequestView(saved);
  }

  async approveRequest(
    businessId: string,
    reviewerUserId: string,
    requestId: string,
    reviewNotes?: string | null,
  ) {
    const settings = await this.readSettings(businessId);
    this.assertFeatureEnabled(settings);

    const request = await this.getRequestOrThrow(businessId, requestId);
    if (request.status !== 'pending') {
      throw new BadRequestException('This request has already been resolved');
    }

    const blockDto = buildBlockScheduleDtoFromTimeOffRequest(
      request.employeeId,
      request,
    );
    if (!blockDto) {
      throw new BadRequestException('Could not build schedule block for this request');
    }

    const block = await this.blockScheduleService.create(
      businessId,
      blockDto,
      reviewerUserId,
    );

    request.status = 'approved';
    request.reviewedByUserId = reviewerUserId;
    request.reviewedAt = new Date();
    request.reviewNotes = reviewNotes?.trim().slice(0, 500) || null;
    request.blockScheduleId = block.id;

    const saved = await this.requestRepo.save(request);
    return mapProviderTimeOffRequestView(saved);
  }

  async denyRequest(
    businessId: string,
    reviewerUserId: string,
    requestId: string,
    reviewNotes?: string | null,
  ) {
    const settings = await this.readSettings(businessId);
    this.assertFeatureEnabled(settings);

    const request = await this.getRequestOrThrow(businessId, requestId);
    if (request.status !== 'pending') {
      throw new BadRequestException('This request has already been resolved');
    }

    request.status = 'denied';
    request.reviewedByUserId = reviewerUserId;
    request.reviewedAt = new Date();
    request.reviewNotes = reviewNotes?.trim().slice(0, 500) || null;

    const saved = await this.requestRepo.save(request);
    return mapProviderTimeOffRequestView(saved);
  }

  async assertManagerAccess(businessId: string, userId: string) {
    const membership = await this.businessService.ensureMember(businessId, userId);
    if (!isMobileManagerRole(membership.role)) {
      throw new ForbiddenException('Manager access required');
    }
    return membership;
  }

  countOpenRequests(businessId: string) {
    return this.requestRepo.count({
      where: {
        businessId,
        status: OPEN_TIME_OFF_STATUSES[0],
      },
    });
  }
}
