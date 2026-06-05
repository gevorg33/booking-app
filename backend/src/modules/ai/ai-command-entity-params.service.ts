import { Injectable } from '@nestjs/common';
import {
  getSharedParamsForIntent,
  intentAcceptsSharedParam,
  listIntentsForSharedParam,
} from './ai-command-entity-params.registry.js';
import type { SharedEntityParamId } from './ai-command-entity-params.types.js';
import {
  buildSharedEntityParamsPromptBlock,
  enrichParamsWithSharedEntities,
  extractSharedEntityParamsFromPrompt,
  filterSharedParamsForIntent,
  inheritSharedEntityParams,
  mergeCompoundStepParams,
  normalizeSharedEntityParams,
  pickSharedEntitySessionSlice,
  propagateSharedEntityParamsAcrossSteps,
  summarizeSharedParamsForIntent,
} from './ai-command-entity-params.util.js';
import type { CompoundStepWithParams } from './ai-command-entity-params.util.js';

@Injectable()
export class AiCommandEntityParamsService {
  acceptedParams(intentId: string): readonly SharedEntityParamId[] {
    return [...getSharedParamsForIntent(intentId)];
  }

  accepts(intentId: string, param: SharedEntityParamId): boolean {
    return intentAcceptsSharedParam(intentId, param);
  }

  intentsForParam(param: SharedEntityParamId): string[] {
    return listIntentsForSharedParam(param);
  }

  extractFromPrompt(prompt: string) {
    return extractSharedEntityParamsFromPrompt(prompt);
  }

  normalize(params: Record<string, unknown>) {
    return normalizeSharedEntityParams(params);
  }

  filterForIntent(intentId: string, params: Record<string, unknown>) {
    return filterSharedParamsForIntent(intentId, params);
  }

  inherit(
    params: Record<string, unknown>,
    session?: Record<string, unknown>,
    intentId?: string,
  ) {
    return inheritSharedEntityParams(params, session, intentId);
  }

  sessionSlice(params: Record<string, unknown>) {
    return pickSharedEntitySessionSlice(params);
  }

  mergeCompoundStep(
    context: Record<string, unknown>,
    stepParams: Record<string, unknown>,
    intentId: string,
  ) {
    return mergeCompoundStepParams(context, stepParams, intentId);
  }

  propagateAcrossSteps<T extends CompoundStepWithParams>(steps: T[]): T[] {
    return propagateSharedEntityParamsAcrossSteps(steps);
  }

  enrich(params: Record<string, unknown>, prompt?: string) {
    return enrichParamsWithSharedEntities(params, prompt);
  }

  promptBlock(): string {
    return buildSharedEntityParamsPromptBlock();
  }

  summarize(intentId: string): string {
    return summarizeSharedParamsForIntent(intentId);
  }
}
