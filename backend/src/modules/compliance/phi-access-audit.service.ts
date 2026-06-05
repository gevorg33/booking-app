import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { MIN_PHI_AUDIT_RETENTION_DAYS } from '../../common/utils/business-compliance.util.js';
import {
  PhiAccessAuditLog,
  type PhiAccessAction,
} from './entities/phi-access-audit-log.entity.js';

export interface PhiAccessAuditContext {
  businessId: string;
  userId: string | null;
  role: string;
  ip?: string | null;
}

@Injectable()
export class PhiAccessAuditService {
  constructor(
    @InjectRepository(PhiAccessAuditLog)
    private readonly auditRepo: Repository<PhiAccessAuditLog>,
  ) {}

  async logAccess(input: {
    context: PhiAccessAuditContext;
    action: PhiAccessAction;
    resourceType: string;
    resourceId: string;
    fieldName?: string | null;
  }): Promise<void> {
    const entry = this.auditRepo.create({
      businessId: input.context.businessId,
      userId: input.context.userId,
      role: input.context.role,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      fieldName: input.fieldName ?? null,
      ip: input.context.ip ?? null,
    });
    await this.auditRepo.save(entry);
  }

  async logBatch(
    context: PhiAccessAuditContext,
    action: PhiAccessAction,
    resourceType: string,
    resourceId: string,
    fieldNames: string[],
  ): Promise<void> {
    if (fieldNames.length === 0) return;
    await Promise.all(
      fieldNames.map((fieldName) =>
        this.logAccess({
          context,
          action,
          resourceType,
          resourceId,
          fieldName,
        }),
      ),
    );
  }

  async listForOwner(
    businessId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ items: PhiAccessAuditLog[]; total: number }> {
    const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
    const offset = Math.max(options?.offset ?? 0, 0);
    const [items, total] = await this.auditRepo.findAndCount({
      where: { businessId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { items, total };
  }

  async purgeExpired(businessId: string, now = new Date()): Promise<number> {
    const cutoff = new Date(
      now.getTime() - MIN_PHI_AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );
    const result = await this.auditRepo.delete({
      businessId,
      createdAt: LessThan(cutoff),
    });
    return result.affected ?? 0;
  }
}
