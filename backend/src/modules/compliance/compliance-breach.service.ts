import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessService } from '../business/business.service.js';
import {
  buildBreachNotificationDraft,
  computeGdprNotificationDeadline,
  isGdprDeadlineApproaching,
  isGdprDeadlineOverdue,
} from '../../common/utils/breach-notification.util.js';
import { DataBreachIncident } from './entities/data-breach-incident.entity.js';
import type { ReportDataBreachDto } from './dto/report-data-breach.dto.js';

@Injectable()
export class ComplianceBreachService {
  constructor(
    @InjectRepository(DataBreachIncident)
    private readonly incidentRepo: Repository<DataBreachIncident>,
    private readonly businessService: BusinessService,
  ) {}

  async reportBreach(
    businessId: string,
    userId: string,
    dto: ReportDataBreachDto,
  ): Promise<DataBreachIncident> {
    await this.businessService.ensureOwner(businessId, userId);
    const business = await this.businessService.findOne(businessId);
    const reportedAt = new Date();
    const affectedCustomerCount = dto.affectedCustomerCount ?? 0;
    const draft = buildBreachNotificationDraft({
      businessName: business.name,
      incidentDescription: dto.description,
      reportedAt,
      affectedCustomerCount,
    });
    const incident = this.incidentRepo.create({
      businessId,
      reportedByUserId: userId,
      description: dto.description.trim(),
      affectedCustomerCount,
      draftEmailSubject: draft.subject,
      draftEmailBody: draft.body,
      gdprNotificationDeadlineAt: computeGdprNotificationDeadline(reportedAt),
      status: 'open',
      reportedAt,
    });
    return this.incidentRepo.save(incident);
  }

  async listIncidents(
    businessId: string,
    userId: string,
  ): Promise<
    Array<
      DataBreachIncident & {
        gdprDeadlineApproaching: boolean;
        gdprDeadlineOverdue: boolean;
      }
    >
  > {
    await this.businessService.ensureOwner(businessId, userId);
    const incidents = await this.incidentRepo.find({
      where: { businessId },
      order: { reportedAt: 'DESC' },
    });
    const now = new Date();
    return incidents.map((incident) => ({
      ...incident,
      gdprDeadlineApproaching: isGdprDeadlineApproaching(
        incident.gdprNotificationDeadlineAt,
        now,
      ),
      gdprDeadlineOverdue: isGdprDeadlineOverdue(
        incident.gdprNotificationDeadlineAt,
        now,
      ),
    }));
  }
}
