import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionRule } from './entities/commission-rule.entity.js';

@Injectable()
export class CommissionsService {
  constructor(@InjectRepository(CommissionRule) private ruleRepo: Repository<CommissionRule>) {}

  async list(businessId: string): Promise<CommissionRule[]> {
    return this.ruleRepo.find({
      where: { businessId, isActive: true },
      relations: { employee: true, service: true },
    });
  }

  async create(businessId: string, dto: Partial<CommissionRule>): Promise<CommissionRule> {
    return this.ruleRepo.save(
      this.ruleRepo.create({
        businessId,
        employeeId: dto.employeeId || undefined,
        serviceId: dto.serviceId || undefined,
        type: dto.type || 'percent',
        value: dto.value ?? 0,
      }),
    );
  }

  async remove(id: string, businessId: string): Promise<void> {
    await this.ruleRepo.update({ id, businessId }, { isActive: false });
  }
}
