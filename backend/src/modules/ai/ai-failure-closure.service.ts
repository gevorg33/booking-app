import { Injectable, Logger } from '@nestjs/common';
import type { AiEvalLabelQueue } from './entities/ai-eval-label-queue.entity.js';
import { AiSettingsService } from './ai-settings.service.js';
import {
  buildClarifyPromptFix,
  buildEntityAliasesFromExpectedParams,
  buildFailureClosurePlan,
  buildLearnedTelemetryRescueRule,
  markFailureClosureApplied,
  mergeClarifyPromptFixes,
  mergeLearnedTelemetryRescueRules,
  type FailureClosurePlan,
} from './ai-failure-closure.util.js';

/** acc-6.2 — apply eval + fix tracks when a triaged failure is approved. */
@Injectable()
export class AiFailureClosureService {
  private readonly logger = new Logger(AiFailureClosureService.name);

  constructor(private readonly aiSettings: AiSettingsService) {}

  async executePipeline(
    businessId: string,
    row: AiEvalLabelQueue,
  ): Promise<FailureClosurePlan> {
    const plan = buildFailureClosurePlan({
      classifiedAction: row.classifiedAction,
      correctedAction: row.correctedAction,
      expectedAction: row.expectedAction,
      expectedRescuedAction: row.expectedRescuedAction,
      labelOutcome: row.labelOutcome,
      expectedClarifyFields: row.expectedClarifyFields,
      expectedParams: row.expectedParams,
      evalCaseId: row.evalCaseId,
    });

    const applied = await this.applyFix(businessId, row, plan);
    return applied ? markFailureClosureApplied(plan) : plan;
  }

  applyClosureFieldsToRow(
    row: AiEvalLabelQueue,
    plan: FailureClosurePlan,
  ): void {
    row.fixType = plan.fixType;
    row.fixStatus = plan.fixStatus;
    row.fixRef = plan.fixRef;
    row.closureSummary = plan.summary;
    if (plan.fixStatus === 'applied') {
      row.closureAppliedAt = new Date();
    }
  }

  private async applyFix(
    businessId: string,
    row: AiEvalLabelQueue,
    plan: FailureClosurePlan,
  ): Promise<boolean> {
    switch (plan.fixType) {
      case 'rescue':
        return this.applyRescueRule(businessId, row);
      case 'fewshot':
        return true;
      case 'prompt':
        return this.applyClarifyPromptFix(businessId, row);
      case 'alias':
        return this.applyEntityAliases(businessId, row);
      default:
        return false;
    }
  }

  private async applyRescueRule(
    businessId: string,
    row: AiEvalLabelQueue,
  ): Promise<boolean> {
    const rule = buildLearnedTelemetryRescueRule(row);
    if (!rule) return false;

    const settings = await this.aiSettings.getSettings(businessId);
    const merged = mergeLearnedTelemetryRescueRules(
      settings.accuracyProgram?.learnedRescueRules ?? [],
      rule,
    );
    await this.aiSettings.updateSettings(businessId, {
      accuracyProgram: {
        ...settings.accuracyProgram,
        learnedRescueRules: merged,
      },
    });
    this.logger.log(
      `Learned telemetry rescue ${rule.fromAction} → ${rule.toAction} for ${businessId}`,
    );
    return true;
  }

  private async applyClarifyPromptFix(
    businessId: string,
    row: AiEvalLabelQueue,
  ): Promise<boolean> {
    const fix = buildClarifyPromptFix(row);
    if (!fix) return false;

    const settings = await this.aiSettings.getSettings(businessId);
    const merged = mergeClarifyPromptFixes(
      settings.accuracyProgram?.clarifyPromptFixes ?? [],
      fix,
    );
    await this.aiSettings.updateSettings(businessId, {
      accuracyProgram: {
        ...settings.accuracyProgram,
        clarifyPromptFixes: merged,
      },
    });
    this.logger.log(
      `Stored clarify prompt fix (${fix.clarifyFields.join(', ')}) for ${businessId}`,
    );
    return true;
  }

  private async applyEntityAliases(
    businessId: string,
    row: AiEvalLabelQueue,
  ): Promise<boolean> {
    if (!row.expectedParams) return false;
    const aliases = buildEntityAliasesFromExpectedParams(row.expectedParams);
    if (Object.keys(aliases).length === 0) return false;
    await this.aiSettings.mergeEntityMemory(businessId, aliases);
    this.logger.log(
      `Applied entity aliases from closure pipeline for ${businessId}`,
    );
    return true;
  }
}
