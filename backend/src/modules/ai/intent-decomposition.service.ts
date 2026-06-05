import { Injectable } from '@nestjs/common';
import { LlmService } from '../../engine/agent/llm.service.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type { DecomposedIntentStep } from './intent-decomposition.types.js';
import {
  decomposeCompoundPrompt,
  isCompoundPrompt,
} from './intent-decomposition.util.js';

export type DecomposedIntent = DecomposedIntentStep;

@Injectable()
export class IntentDecompositionService {
  constructor(private readonly llm: LlmService) {}

  isCompoundPrompt(prompt: string): boolean {
    return isCompoundPrompt(prompt);
  }

  /** Registry handler path — deterministic first, LLM fallback for dashboard. */
  async decomposePrompt(
    businessId: string,
    userId: string | undefined,
    prompt: string,
    timeZone = 'UTC',
    surface: CommandSurface = 'dashboard',
  ): Promise<DecomposedIntent[]> {
    return this.decompose(businessId, userId, prompt, timeZone, surface);
  }

  async decompose(
    businessId: string,
    userId: string | undefined,
    prompt: string,
    timeZone = 'UTC',
    surface: CommandSurface = 'dashboard',
  ): Promise<DecomposedIntent[]> {
    return decomposeCompoundPrompt(
      this.llm,
      businessId,
      userId,
      prompt,
      timeZone,
      surface,
    );
  }
}
