import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessService } from '../business/business.service.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { EmailService } from '../notifications/email.service.js';
import {
  buildBreachNotificationDraft,
  computeGdprNotificationDeadline,
  isGdprDeadlineApproaching,
  isGdprDeadlineOverdue,
} from '../../common/utils/breach-notification.util.js';
import { DataBreachIncident } from './entities/data-breach-incident.entity.js';
import type { ReportDataBreachDto } from './dto/report-data-breach.dto.js';

export type SendBreachNotificationResult =
  | {
      ok: true;
      incident: DataBreachIncident;
      emailsSent: number;
      emailsFailed: number;
      recipientsSkipped: number;
      resent: boolean;
    }
  | { ok: false; reason: 'not_found' | 'closed' | 'no_recipients' };

@Injectable()
export class ComplianceBreachService {
  constructor(
    @InjectRepository(DataBreachIncident)
    private readonly incidentRepo: Repository<DataBreachIncident>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly businessService: BusinessService,
    private readonly emailService: EmailService,
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

  async sendBreachNotification(
    businessId: string,
    userId: string,
    incidentRef: string,
  ): Promise<SendBreachNotificationResult> {
    await this.businessService.ensureOwner(businessId, userId);
    const incident = await this.resolveIncident(businessId, incidentRef);
    if (!incident) {
      return { ok: false, reason: 'not_found' };
    }
    if (incident.status === 'closed') {
      return { ok: false, reason: 'closed' };
    }

    const customers = await this.customerRepo.find({
      where: { businessId, isActive: true },
    });
    const recipients = customers.filter(
      (customer) =>
        typeof customer.email === 'string' && customer.email.trim().includes('@'),
    );
    if (recipients.length === 0) {
      return { ok: false, reason: 'no_recipients' };
    }

    const html = incident.draftEmailBody.replace(/\n/g, '<br>\n');
    let emailsSent = 0;
    let emailsFailed = 0;

    for (const customer of recipients) {
      const result = await this.emailService.send({
        to: customer.email.trim(),
        subject: incident.draftEmailSubject,
        html,
        text: incident.draftEmailBody,
      });
      if (result.ok) {
        emailsSent += 1;
      } else {
        emailsFailed += 1;
      }
    }

    const resent = incident.status === 'notified';
    incident.status = 'notified';
    const saved = await this.incidentRepo.save(incident);

    return {
      ok: true,
      incident: saved,
      emailsSent,
      emailsFailed,
      recipientsSkipped: customers.length - recipients.length,
      resent,
    };
  }

  private async resolveIncident(
    businessId: string,
    incidentRef: string,
  ): Promise<DataBreachIncident | null> {
    const trimmed = incidentRef.trim();
    if (!trimmed) return null;

    const incidents = await this.incidentRepo.find({
      where: { businessId },
      order: { reportedAt: 'DESC' },
    });
    if (incidents.length === 0) return null;

    const lower = trimmed.toLowerCase();
    const exact = incidents.find((item) => item.id.toLowerCase() === lower);
    if (exact) return exact;

    const normalizedRef = lower.replace(/^br-/, '').replace(/-/g, '');
    const byNormalizedPrefix = incidents.find((item) => {
      const normalizedId = item.id.replace(/-/g, '').toLowerCase();
      return (
        normalizedId.startsWith(normalizedRef) ||
        item.id.toLowerCase().startsWith(lower)
      );
    });
    if (byNormalizedPrefix) return byNormalizedPrefix;

    const shortRef = normalizedRef.slice(0, 8);
    if (shortRef.length >= 1) {
      const byShortPrefix = incidents.find((item) =>
        item.id.replace(/-/g, '').toLowerCase().startsWith(shortRef),
      );
      if (byShortPrefix) return byShortPrefix;
    }

    return null;
  }
}
