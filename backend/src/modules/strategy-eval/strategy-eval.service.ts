import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import {
  HIPAA_CHECKLIST,
  HIPAA_READINESS_MAX,
  HIPAA_RECOMMENDATION_KEYS,
  type HipaaAnswer,
  type HipaaEvalDecision,
} from './hipaa-baa.constants.js';
import {
  MARKETPLACE_CRITERIA,
  MARKETPLACE_OPTION_PROFILES,
  MARKETPLACE_RECOMMENDATION_KEYS,
  type MarketplacePositioningDecision,
} from './marketplace-positioning.constants.js';
import type {
  HipaaEvalResult,
  MarketplaceEvalResult,
  StrategyEvalSummary,
  StoredStrategyEval,
} from './strategy-eval.types.js';
import { readStoredStrategyEval } from './strategy-eval.types.js';
import { SubmitHipaaEvalDto, SubmitMarketplaceEvalDto } from './dto/submit-strategy-eval.dto.js';

@Injectable()
export class StrategyEvalService {
  constructor(@InjectRepository(Business) private businessRepo: Repository<Business>) {}

  getHipaaFramework() {
    return {
      checklist: HIPAA_CHECKLIST.map((item) => ({
        id: item.id,
        category: item.category,
        blockerOnYes: item.blockerOnYes,
      })),
      readinessMax: HIPAA_READINESS_MAX,
      decisions: ['defer', 'wellness_only', 'pursue_baa'] as HipaaEvalDecision[],
    };
  }

  getMarketplaceFramework() {
    return {
      criteria: MARKETPLACE_CRITERIA,
      options: MARKETPLACE_OPTION_PROFILES.map((profile) => ({
        id: profile.id,
        labelKey: `strategyEval.marketplace.option.${profile.id}`,
      })),
      decisions: ['software_only', 'partner_directory', 'full_marketplace', 'undecided'] as const,
    };
  }

  async getHipaaEval(businessId: string): Promise<HipaaEvalResult | null> {
    const business = await this.findBusiness(businessId);
    const stored = readStoredStrategyEval(business.settings);
    if (!stored.hipaa?.answers) return null;
    return this.buildHipaaResult(stored.hipaa.answers, stored.hipaa);
  }

  async submitHipaaEval(businessId: string, dto: SubmitHipaaEvalDto): Promise<HipaaEvalResult> {
    const business = await this.findBusiness(businessId);
    const result = this.buildHipaaResult(dto.answers, {
      notes: dto.notes ?? null,
      decidedAt: dto.decision ? new Date().toISOString() : null,
      recommendation: dto.decision,
    });

    const final: HipaaEvalResult = dto.decision
      ? { ...result, recommendation: dto.decision, recommendationKey: HIPAA_RECOMMENDATION_KEYS[dto.decision] }
      : result;

    await this.persistEval(business, { hipaa: final });
    return final;
  }

  async getMarketplaceEval(businessId: string): Promise<MarketplaceEvalResult | null> {
    const business = await this.findBusiness(businessId);
    const stored = readStoredStrategyEval(business.settings);
    if (!stored.marketplace?.criterionWeights) return null;
    return this.buildMarketplaceResult(stored.marketplace.criterionWeights, stored.marketplace);
  }

  async submitMarketplaceEval(
    businessId: string,
    dto: SubmitMarketplaceEvalDto,
  ): Promise<MarketplaceEvalResult> {
    const business = await this.findBusiness(businessId);
    const result = this.buildMarketplaceResult(dto.criterionWeights, {
      directoryOptIn: dto.directoryOptIn ?? null,
      notes: dto.notes ?? null,
      decidedAt: dto.decision && dto.decision !== 'undecided' ? new Date().toISOString() : null,
      recommendation: dto.decision,
    });

    const final: MarketplaceEvalResult =
      dto.decision && dto.decision !== 'undecided'
        ? {
            ...result,
            recommendation: dto.decision,
            recommendationKey: MARKETPLACE_RECOMMENDATION_KEYS[dto.decision],
          }
        : result;

    await this.persistEval(business, { marketplace: final });
    return final;
  }

  async getSummary(businessId: string): Promise<StrategyEvalSummary> {
    const [hipaa, marketplace] = await Promise.all([
      this.getHipaaEval(businessId),
      this.getMarketplaceEval(businessId),
    ]);

    return {
      hipaa,
      marketplace,
      medicalVerticalBlocked:
        (hipaa?.blockers?.length ?? 0) > 0 ||
        hipaa?.recommendation === 'defer' ||
        hipaa?.recommendation === 'wellness_only',
      marketplaceDecisionLocked:
        marketplace?.recommendation != null && marketplace.recommendation !== 'undecided',
    };
  }

  buildHipaaResult(
    answers: Record<string, HipaaAnswer>,
    overrides: Partial<HipaaEvalResult> = {},
  ): HipaaEvalResult {
    const blockers: string[] = [];
    let readinessPoints = 0;

    for (const item of HIPAA_CHECKLIST) {
      const answer = answers[item.id];
      if (answer === 'yes') {
        if (item.blockerOnYes) blockers.push(item.id);
        readinessPoints += item.readinessOnYes;
      }
    }

    const handlesPhi = answers.handles_phi === 'yes';
    const usPatients = answers.us_patients === 'yes';
    const diagnosisDocs = answers.diagnosis_documentation === 'yes';

    let recommendation: HipaaEvalDecision;
    if (!handlesPhi || answers.handles_phi === 'no') {
      recommendation = 'wellness_only';
    } else if (blockers.length > 0 || diagnosisDocs) {
      recommendation = 'defer';
    } else if (!usPatients) {
      recommendation = 'wellness_only';
    } else {
      const readinessPercent = Math.round((readinessPoints / HIPAA_READINESS_MAX) * 100);
      recommendation = readinessPercent >= 70 ? 'pursue_baa' : 'defer';
    }

    const readinessPercent = Math.round((readinessPoints / HIPAA_READINESS_MAX) * 100);

    return {
      answers,
      handlesPhi,
      readinessPercent,
      blockers,
      recommendation,
      recommendationKey: HIPAA_RECOMMENDATION_KEYS[recommendation],
      notes: overrides.notes ?? null,
      decidedAt: overrides.decidedAt ?? null,
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  buildMarketplaceResult(
    criterionWeights: Record<string, number>,
    overrides: Partial<MarketplaceEvalResult> = {},
  ): MarketplaceEvalResult {
    const normalizedWeights = this.normalizeCriterionWeights(criterionWeights);
    const optionScores = this.scoreMarketplaceOptions(normalizedWeights);
    const recommendation = this.recommendMarketplacePosition(optionScores);

    return {
      criterionWeights: normalizedWeights,
      optionScores,
      recommendation,
      recommendationKey:
        recommendation === 'undecided'
          ? 'strategyEval.marketplace.recUndecided'
          : MARKETPLACE_RECOMMENDATION_KEYS[recommendation],
      directoryOptIn: overrides.directoryOptIn ?? null,
      notes: overrides.notes ?? null,
      decidedAt: overrides.decidedAt ?? null,
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  normalizeCriterionWeights(raw: Record<string, number>): Record<string, number> {
    const weights: Record<string, number> = {};
    for (const criterion of MARKETPLACE_CRITERIA) {
      const value = raw[criterion.id];
      const weight = Number.isFinite(value) ? Math.min(5, Math.max(1, Math.round(value))) : criterion.defaultWeight;
      weights[criterion.id] = weight;
    }
    return weights;
  }

  scoreMarketplaceOptions(
    criterionWeights: Record<string, number>,
  ): Record<Exclude<MarketplacePositioningDecision, 'undecided'>, number> {
    const totals: Record<Exclude<MarketplacePositioningDecision, 'undecided'>, number> = {
      software_only: 0,
      partner_directory: 0,
      full_marketplace: 0,
    };
    let weightSum = 0;

    for (const criterion of MARKETPLACE_CRITERIA) {
      const weight = criterionWeights[criterion.id] ?? criterion.defaultWeight;
      weightSum += weight;
      for (const profile of MARKETPLACE_OPTION_PROFILES) {
        totals[profile.id] += (profile.scores[criterion.id] ?? 0) * weight;
      }
    }

    return {
      software_only: Math.round(totals.software_only / weightSum),
      partner_directory: Math.round(totals.partner_directory / weightSum),
      full_marketplace: Math.round(totals.full_marketplace / weightSum),
    };
  }

  recommendMarketplacePosition(
    optionScores: Record<Exclude<MarketplacePositioningDecision, 'undecided'>, number>,
  ): MarketplacePositioningDecision {
    const entries = Object.entries(optionScores) as Array<
      [Exclude<MarketplacePositioningDecision, 'undecided'>, number]
    >;
    entries.sort((a, b) => b[1] - a[1]);
    const top = entries[0];
    const second = entries[1];
    if (!top) return 'undecided';
    if (top[1] - (second?.[1] ?? 0) < 5) return 'undecided';
    return top[0];
  }

  private async persistEval(business: Business, patch: StoredStrategyEval) {
    const current = readStoredStrategyEval(business.settings);
    business.settings = {
      ...(business.settings ?? {}),
      strategyEval: {
        ...current,
        ...patch,
      },
    };
    await this.businessRepo.save(business);
  }

  private async findBusiness(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }
}
