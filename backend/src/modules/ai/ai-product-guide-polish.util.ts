import type { LlmService } from '../../engine/agent/llm.service.js';
import type { GuideResponse } from './command-completion.types.js';
import {
  buildVoiceFriendlyFallback,
  enrichGuideResponseVoiceSummaries,
} from './ai-product-guide-voice.util.js';
import { verifyGuideResponseGrounding } from './ai-product-guide-grounding.util.js';
import { GUIDE_CORPUS_MATCH_THRESHOLD } from './ai-product-guide-ranking.util.js';
import type { AppGuideIntent } from './ai-product-guide.util.js';

/** Minimum corpus match confidence before LLM polish (ai-guide-1.2.3). */
export const GUIDE_LLM_POLISH_MIN_CONFIDENCE = GUIDE_CORPUS_MATCH_THRESHOLD;

export interface GuidePolishLlmOutput {
  summary: string;
  steps: Array<{ title: string; body: string }>;
}

export interface GuidePolishDeps {
  completeJson: LlmService['completeJson'];
  isAvailableForBusiness: LlmService['isAvailableForBusiness'];
}

export interface GuidePolishInput {
  businessId: string;
  userId?: string;
  prompt: string;
  intent: AppGuideIntent;
  locale: string;
  baseGuide: GuideResponse;
  corpusTitle: string;
  matchConfidence: number;
  corpusSettingsPaths?: readonly string[];
}

const GUIDE_POLISH_SCHEMA = `
Return JSON with this exact shape:
{
  "summary": "1-3 sentences answering the user's question in plain language",
  "steps": [
    { "title": "short step title", "body": "step instructions grounded in the corpus" }
  ]
}

Rules:
- Rewrite for the user's phrasing; keep the same factual content as the input steps.
- Preserve the same number of steps as the input (do not add or remove steps).
- Do NOT invent routes, URLs, menu paths, intent ids, product features, or business.settings paths.
- Do NOT cite snake_case intent names unless they already appear in the input.
- Do NOT introduce new settings.* or business.settings.* paths.
- Keep titles concise; bodies actionable.
`;

export function mergePolishedGuideResponse(
  baseGuide: GuideResponse,
  polished: GuidePolishLlmOutput,
): GuideResponse {
  const steps = baseGuide.steps.map((step, index) => {
    const row = polished.steps[index];
    if (!row) return step;
    return {
      ...step,
      title: row.title?.trim() || step.title,
      body: row.body?.trim() || step.body,
      voiceSummary: buildVoiceFriendlyFallback(row.body?.trim() || step.body),
    };
  });

  return enrichGuideResponseVoiceSummaries({
    ...baseGuide,
    summary: polished.summary?.trim() || baseGuide.summary,
    steps,
  });
}

export function buildGuidePolishSystemPrompt(intent: AppGuideIntent): string {
  return `You polish in-app product guide answers for a salon/spa dashboard assistant.
Intent: ${intent}
${GUIDE_POLISH_SCHEMA}`;
}

export function buildGuidePolishUserPrompt(input: GuidePolishInput): string {
  return `User question: ${input.prompt}
Locale: ${input.locale}
Corpus topic: ${input.corpusTitle}
Topic id (do not change): ${input.baseGuide.topicId ?? 'unknown'}

Current summary:
${input.baseGuide.summary}

Current steps (JSON):
${JSON.stringify(
  input.baseGuide.steps.map((step) => ({ title: step.title, body: step.body })),
  null,
  2,
)}`;
}

/**
 * LLM polish for confident corpus matches — rewrites summary/step copy only;
 * navigates, topicId, sources, and handoffs stay on the deterministic base.
 */
export async function polishGuideResponseWithLlm(
  input: GuidePolishInput,
  deps: GuidePolishDeps,
): Promise<{ guide: GuideResponse; polished: boolean }> {
  if (input.matchConfidence < GUIDE_LLM_POLISH_MIN_CONFIDENCE) {
    return { guide: input.baseGuide, polished: false };
  }

  if (!(await deps.isAvailableForBusiness(input.businessId))) {
    return { guide: input.baseGuide, polished: false };
  }

  try {
    const polished = await deps.completeJson<GuidePolishLlmOutput>(
      input.businessId,
      buildGuidePolishSystemPrompt(input.intent),
      buildGuidePolishUserPrompt(input),
      {
        surface: 'dashboard',
        operation: 'product_guide_polish',
        actorType: input.userId ? 'manager' : 'system',
        userId: input.userId,
      },
      0.2,
      1200,
    );

    if (
      !polished?.summary?.trim() ||
      !Array.isArray(polished.steps) ||
      polished.steps.length !== input.baseGuide.steps.length
    ) {
      return { guide: input.baseGuide, polished: false };
    }

    const merged = mergePolishedGuideResponse(input.baseGuide, polished);
    const grounding = verifyGuideResponseGrounding(merged, {
      validateSettingsKeys: true,
      corpusSettingsPaths: input.corpusSettingsPaths,
    });
    if (!grounding.ok) {
      return { guide: input.baseGuide, polished: false };
    }

    return { guide: merged, polished: true };
  } catch {
    return { guide: input.baseGuide, polished: false };
  }
}
