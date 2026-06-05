import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MembershipPlan,
  CustomerMembership,
} from './entities/membership-plan.entity.js';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(MembershipPlan)
    private planRepo: Repository<MembershipPlan>,
    @InjectRepository(CustomerMembership)
    private membershipRepo: Repository<CustomerMembership>,
  ) {}

  async listPlans(businessId: string): Promise<MembershipPlan[]> {
    return this.planRepo.find({
      where: { businessId, isActive: true },
      order: { price: 'ASC' },
    });
  }

  async createPlan(
    businessId: string,
    dto: Partial<MembershipPlan>,
  ): Promise<MembershipPlan> {
    return this.planRepo.save(
      this.planRepo.create({
        businessId,
        name: dto.name!,
        description: dto.description,
        price: dto.price ?? 0,
        currency: dto.currency || 'USD',
        billingInterval: dto.billingInterval || 'monthly',
        visitCredits: dto.visitCredits ?? 0,
      }),
    );
  }

  async assignPlan(
    businessId: string,
    customerId: string,
    planId: string,
  ): Promise<CustomerMembership> {
    const plan = await this.planRepo.findOne({
      where: { id: planId, businessId, isActive: true },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const startsAt = new Date();
    const expiresAt = new Date(startsAt);
    if (plan.billingInterval === 'yearly')
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    return this.membershipRepo.save(
      this.membershipRepo.create({
        businessId,
        customerId,
        planId,
        creditsRemaining: plan.visitCredits,
        startsAt,
        expiresAt,
        status: 'active',
      }),
    );
  }

  async getCustomerMembership(
    businessId: string,
    customerId: string,
  ): Promise<CustomerMembership | null> {
    return this.membershipRepo.findOne({
      where: { businessId, customerId, status: 'active' },
      relations: { plan: true },
      order: { createdAt: 'DESC' },
    });
  }

  async useCredit(businessId: string, customerId: string): Promise<void> {
    const membership = await this.getCustomerMembership(businessId, customerId);
    if (!membership || membership.creditsRemaining <= 0) {
      throw new BadRequestException('No membership credits available');
    }
    membership.creditsRemaining -= 1;
    await this.membershipRepo.save(membership);
  }
}
