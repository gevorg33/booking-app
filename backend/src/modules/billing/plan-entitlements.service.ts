import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { AiUsageService } from '../integrations/openai/ai-usage.service.js';
import {
  getLimitsForTier,
  resolvePlanTier,
  type PlanFeatureFlag,
  type PlanLimitKind,
  type PlanLimits,
  type PlanTierId,
} from './plan-limits.js';
import { PlanLimitExceededException } from './plan-limit.exception.js';

export interface PlanEntitlementsView {
  tierId: PlanTierId;
  tierName: string;
  isPaid: boolean;
  subscriptionPlanId: string | null;
  limits: PlanLimits;
  usage: {
    providerSeats: number;
    aiCommandsThisMonth: number;
  };
  flags: PlanLimits['flags'];
  atLimit: {
    providerSeats: boolean;
    aiCommands: boolean;
  };
  aiUsageWarning: boolean;
}

@Injectable()
export class PlanEntitlementsService {
  private readonly businessRepo: Repository<Business>;
  private readonly employeeRepo: Repository<Employee>;
  private readonly aiUsageService: AiUsageService;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Employee) employeeRepo: Repository<Employee>,
    aiUsageService: AiUsageService,
  ) {
    this.businessRepo = businessRepo;
    this.employeeRepo = employeeRepo;
    this.aiUsageService = aiUsageService;
  }

  async getEntitlements(businessId: string): Promise<PlanEntitlementsView> {
    const business = await this.findBusiness(businessId);
    const tierId = resolvePlanTier(business.subscriptionPlanId, business.subscriptionStatus);
    const limits = getLimitsForTier(tierId);
    const providerSeats = await this.countActiveProviderSeats(businessId);
    const aiCommandsThisMonth = await this.countDashboardAiCommands(businessId);

    const atProviderLimit = providerSeats >= limits.maxProviderSeats;
    const atAiLimit = aiCommandsThisMonth >= limits.aiCommandsPerMonth;
    const aiWarningThreshold = Math.floor(limits.aiCommandsPerMonth * 0.8);

    return {
      tierId,
      tierName: limits.tierName,
      isPaid: tierId === 'starter',
      subscriptionPlanId: business.subscriptionPlanId,
      limits,
      usage: {
        providerSeats,
        aiCommandsThisMonth,
      },
      flags: limits.flags,
      atLimit: {
        providerSeats: atProviderLimit,
        aiCommands: atAiLimit,
      },
      aiUsageWarning:
        !atAiLimit &&
        limits.aiCommandsPerMonth > 0 &&
        aiCommandsThisMonth >= aiWarningThreshold,
    };
  }

  async assertCanAddProviderSeat(businessId: string): Promise<void> {
    const view = await this.getEntitlements(businessId);
    if (view.usage.providerSeats >= view.limits.maxProviderSeats) {
      throw new PlanLimitExceededException(
        'provider_seats',
        view.usage.providerSeats,
        view.limits.maxProviderSeats,
      );
    }
  }

  async assertCanRunDashboardAiCommand(businessId: string): Promise<void> {
    const view = await this.getEntitlements(businessId);
    if (view.usage.aiCommandsThisMonth >= view.limits.aiCommandsPerMonth) {
      throw new PlanLimitExceededException(
        'ai_commands',
        view.usage.aiCommandsThisMonth,
        view.limits.aiCommandsPerMonth,
      );
    }
  }

  async assertFeature(businessId: string, feature: PlanFeatureFlag): Promise<void> {
    const view = await this.getEntitlements(businessId);
    if (!view.flags[feature]) {
      throw new PlanLimitExceededException(feature as PlanLimitKind);
    }
  }

  private async countActiveProviderSeats(businessId: string): Promise<number> {
    return this.employeeRepo.count({
      where: { businessId, isActive: true },
    });
  }

  private async countDashboardAiCommands(businessId: string): Promise<number> {
    const summary = await this.aiUsageService.getMonthlySummary(businessId);
    const dashboard = summary.bySurface.find((s) => s.surface === 'dashboard');
    return dashboard?.requests ?? 0;
  }

  private async findBusiness(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }
}
