import type { AppLocale } from '../../common/i18n/messages.js';
import type {
  CommandResult,
  GuideResponse,
  GuideStep,
} from './command-completion.types.js';
import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';
import {
  getGuideCorpusTopic,
  resolveGuideCorpusTopic,
} from './guide/ai-guide-corpus.util.js';
import type { GuideCorpusTopicId } from './guide/ai-guide-corpus.types.js';
import {
  buildGuideResponseFromFlowPlaybook,
  buildGuideFlowListContext,
} from './guide/guide-flow.corpus.util.js';
import { resolveGuideFlowPlaybook } from './guide/guide-flow.corpus.util.js';
import { mergeGuideFlowPlaybooks } from './guide/guide-flow.merge.util.js';
import {
  GUIDE_MULTITURN_BACK_PROMPTS,
  GUIDE_MULTITURN_NEXT_PROMPTS,
  GUIDE_MULTITURN_RESTART_PROMPTS,
} from './ai-product-guide-multiturn.fixtures.js';
import {
  buildGuideResponseFromCorpus,
} from './ai-product-guide-corpus-response.util.js';
import type { ProductGuideRetrieveQuery } from './ai-product-guide-ranking.util.js';
import type { GuideFlowRoleScope } from './guide/guide-flow.types.js';
import type { GuideFlowSurface } from './guide/guide-flow.types.js';
import type { AppGuideIntent } from './ai-product-guide.util.js';
import { buildGuideCommandResult } from './ai-product-guide.util.js';

export interface GuideMultiTurnSession {
  guideFlowId: string;
  guideStepIndex: number;
  completedSteps: number[];
}

export type GuideNavigationIntent = 'next' | 'back' | 'restart';

export type GuideMultiTurnBoundary = 'first' | 'last';

export const GUIDE_MULTITURN_SESSION_KEYS = [
  'guideFlowId',
  'guideStepIndex',
  'completedSteps',
] as const;

function normalizeGuidePrompt(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesAnyPrompt(prompt: string, candidates: readonly string[]): boolean {
  const norm = normalizeGuidePrompt(prompt);
  if (!norm) return false;
  return candidates.some((candidate) => {
    const candidateNorm = normalizeGuidePrompt(candidate);
    return norm === candidateNorm || norm.includes(candidateNorm);
  });
}

export function detectGuideNavigationIntent(
  prompt: string,
): GuideNavigationIntent | null {
  if (matchesAnyPrompt(prompt, GUIDE_MULTITURN_RESTART_PROMPTS)) return 'restart';
  if (matchesAnyPrompt(prompt, GUIDE_MULTITURN_BACK_PROMPTS)) return 'back';
  if (matchesAnyPrompt(prompt, GUIDE_MULTITURN_NEXT_PROMPTS)) return 'next';
  return null;
}

export function hasActiveGuideMultiTurnSession(
  context?: Record<string, unknown> | null,
): boolean {
  return readGuideMultiTurnSession(context) != null;
}

export function readGuideMultiTurnSession(
  context?: Record<string, unknown> | null,
): GuideMultiTurnSession | null {
  if (!context) return null;
  const guideFlowId =
    typeof context.guideFlowId === 'string' && context.guideFlowId.trim()
      ? context.guideFlowId.trim()
      : undefined;
  if (!guideFlowId) return null;

  const rawIndex = context.guideStepIndex;
  const guideStepIndex =
    typeof rawIndex === 'number' && Number.isInteger(rawIndex) && rawIndex >= 0
      ? rawIndex
      : typeof rawIndex === 'string' && /^\d+$/.test(rawIndex)
        ? Number.parseInt(rawIndex, 10)
        : 0;

  const completedSteps = readCompletedSteps(context.completedSteps);
  return { guideFlowId, guideStepIndex, completedSteps };
}

function readCompletedSteps(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'number' ? entry : Number(entry)))
      .filter((entry) => Number.isInteger(entry) && entry >= 0);
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return readCompletedSteps(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

export function createInitialGuideMultiTurnSession(
  guideFlowId: string,
): GuideMultiTurnSession {
  return {
    guideFlowId,
    guideStepIndex: 0,
    completedSteps: [],
  };
}

export function mergeGuideMultiTurnSessionIntoContext(
  context: Record<string, unknown> | undefined,
  session: GuideMultiTurnSession | null,
): Record<string, unknown> {
  const next = { ...(context ?? {}) };
  if (!session) {
    delete next.guideFlowId;
    delete next.guideStepIndex;
    delete next.completedSteps;
    return next;
  }
  next.guideFlowId = session.guideFlowId;
  next.guideStepIndex = session.guideStepIndex;
  next.completedSteps = [...session.completedSteps];
  return next;
}

export function serializeGuideMultiTurnSessionFields(
  session: GuideMultiTurnSession,
): Record<string, string | number | string[]> {
  return {
    guideFlowId: session.guideFlowId,
    guideStepIndex: session.guideStepIndex,
    completedSteps: session.completedSteps.map(String),
  };
}

export function applyGuideNavigation(
  session: GuideMultiTurnSession,
  intent: GuideNavigationIntent,
  totalSteps: number,
): {
  session: GuideMultiTurnSession;
  boundary?: GuideMultiTurnBoundary;
} {
  const maxIndex = Math.max(0, totalSteps - 1);
  if (intent === 'restart') {
    return { session: createInitialGuideMultiTurnSession(session.guideFlowId) };
  }
  if (intent === 'back') {
    if (session.guideStepIndex <= 0) {
      return { session, boundary: 'first' };
    }
    const guideStepIndex = session.guideStepIndex - 1;
    const completedSteps = session.completedSteps.filter(
      (step) => step < guideStepIndex,
    );
    return { session: { ...session, guideStepIndex, completedSteps } };
  }
  if (session.guideStepIndex >= maxIndex) {
    return { session, boundary: 'last' };
  }
  const completedSteps = Array.from(
    new Set([...session.completedSteps, session.guideStepIndex]),
  ).sort((a, b) => a - b);
  return {
    session: {
      ...session,
      guideStepIndex: session.guideStepIndex + 1,
      completedSteps,
    },
  };
}

export function resolveGuideFlowIdFromGuide(guide: GuideResponse): string | undefined {
  return guide.topicId?.trim() || guide.sources?.[0]?.topicId?.trim() || undefined;
}

export type GuideMultiTurnLogicInput = {
  prompt: string;
  route?: string;
  role?: ProductGuideRetrieveQuery['role'];
  roleProfile?: GuideFlowRoleScope;
  vertical?: string;
  locale?: string;
  retailPosEnabled?: boolean;
  enabledModules?: readonly string[];
  surface?: GuideFlowSurface;
  session?: { context?: Record<string, unknown> };
};

export function resolveStoredGuideContent(
  guideFlowId: string,
  input: GuideMultiTurnLogicInput,
  locale: AppLocale,
): GuideResponse | null {
  const messages = getFrontendGuideCorpusMessages(locale);
  const ctx = buildGuideFlowListContext({
    prompt: input.prompt,
    intent: 'guide_user_flow',
    route: input.route,
    role: input.role,
    roleProfile: input.roleProfile,
    vertical: input.vertical,
    locale,
    topicId: guideFlowId,
    retailPosEnabled: input.retailPosEnabled,
    enabledModules: input.enabledModules,
    surface: input.surface ?? 'dashboard',
  });
  const playbooks = mergeGuideFlowPlaybooks(ctx);
  const playbook =
    playbooks.find(
      (row) => row.topicId === guideFlowId || row.corpusTopicId === guideFlowId,
    ) ?? null;
  if (playbook) {
    return buildGuideResponseFromFlowPlaybook(
      resolveGuideFlowPlaybook(playbook, messages),
    );
  }

  const topic = getGuideCorpusTopic(guideFlowId as GuideCorpusTopicId);
  if (!topic) return null;
  const resolved = resolveGuideCorpusTopic(guideFlowId as GuideCorpusTopicId, messages);
  if (!resolved) return null;
  return buildGuideResponseFromCorpus(resolved, topic);
}

export function buildGuideResponseForMultiTurnStep(
  fullGuide: GuideResponse,
  session: GuideMultiTurnSession,
): GuideResponse {
  const totalSteps = fullGuide.steps.length;
  const currentIndex = Math.min(
    Math.max(session.guideStepIndex, 0),
    Math.max(totalSteps - 1, 0),
  );
  const currentStep = fullGuide.steps[currentIndex];
  const progressSummary = `Step ${currentIndex + 1} of ${totalSteps}: ${currentStep?.title ?? 'Guide step'}`;

  return {
    ...fullGuide,
    summary: progressSummary,
    voiceSummary: currentStep?.voiceSummary ?? currentStep?.body ?? progressSummary,
    steps: fullGuide.steps.map((step, index) => annotateGuideStep(step, index, currentIndex)),
    guideSession: {
      guideFlowId: session.guideFlowId,
      guideStepIndex: session.guideStepIndex,
      completedSteps: [...session.completedSteps],
      totalSteps,
    },
  };
}

function annotateGuideStep(
  step: GuideStep,
  index: number,
  currentIndex: number,
): GuideStep {
  if (index === currentIndex) return step;
  if (index < currentIndex) {
    return {
      ...step,
      title: step.title.startsWith('✓ ') ? step.title : `✓ ${step.title}`,
    };
  }
  return step;
}

export function attachGuideMultiTurnSessionToResult(
  result: CommandResult,
  session: GuideMultiTurnSession | null,
  sessionContext?: Record<string, unknown>,
): CommandResult {
  if (!session) {
    const clearedContext = mergeGuideMultiTurnSessionIntoContext(sessionContext, null);
    return {
      ...result,
      details: {
        ...result.details,
        sessionContext: clearedContext,
      },
    };
  }

  const mergedContext = mergeGuideMultiTurnSessionIntoContext(sessionContext, session);
  const guide =
    result.guide != null
      ? {
          ...result.guide,
          guideSession: {
            guideFlowId: session.guideFlowId,
            guideStepIndex: session.guideStepIndex,
            completedSteps: [...session.completedSteps],
            totalSteps: result.guide.steps.length,
          },
        }
      : undefined;

  return {
    ...result,
    guide,
    details: {
      ...result.details,
      guideFlowId: session.guideFlowId,
      guideStepIndex: session.guideStepIndex,
      completedSteps: session.completedSteps,
      sessionContext: mergedContext,
      guideNavigation: result.details?.guideNavigation,
    },
  };
}

function buildGuideNavigationSummary(
  intent: GuideNavigationIntent,
  boundary: GuideMultiTurnBoundary | undefined,
  session: GuideMultiTurnSession,
  totalSteps: number,
): string {
  if (boundary === 'first' && intent === 'back') {
    return 'You are already on the first step of this guide.';
  }
  if (boundary === 'last' && intent === 'next') {
    return `You are on the last step (${totalSteps} of ${totalSteps}). Use the actions below or ask for help.`;
  }
  if (intent === 'restart') {
    return 'Restarted the guide from step 1.';
  }
  if (intent === 'back') {
    return `Back to step ${session.guideStepIndex + 1} of ${totalSteps}.`;
  }
  return `Showing step ${session.guideStepIndex + 1} of ${totalSteps}.`;
}

export function tryHandleGuideMultiTurnNavigation(
  intent: AppGuideIntent,
  input: GuideMultiTurnLogicInput,
  locale: AppLocale,
): CommandResult | null {
  const navigation = detectGuideNavigationIntent(input.prompt);
  if (!navigation) return null;

  const activeSession = readGuideMultiTurnSession(input.session?.context);
  if (!activeSession) {
    return null;
  }

  const fullGuide = resolveStoredGuideContent(activeSession.guideFlowId, input, locale);
  if (!fullGuide?.steps.length) {
    return {
      success: false,
      action: intent,
      summary:
        'I could not reload that guide walkthrough. Ask your question again to start fresh.',
      details: {
        needsClarification: true,
        guideNavigation: navigation,
        reason: 'guide_not_found',
        guideFlowId: activeSession.guideFlowId,
      },
    };
  }

  const { session: nextSession, boundary } = applyGuideNavigation(
    activeSession,
    navigation,
    fullGuide.steps.length,
  );
  const guide = buildGuideResponseForMultiTurnStep(fullGuide, nextSession);
  guide.summary = buildGuideNavigationSummary(
    navigation,
    boundary,
    nextSession,
    fullGuide.steps.length,
  );

  const result = buildGuideCommandResult(intent, guide);
  result.details = {
    ...result.details,
    guideNavigation: navigation,
    guideBoundary: boundary ?? null,
    retrievalPath: 'guide-multiturn',
    deterministic: true,
  };
  return attachGuideMultiTurnSessionToResult(
    result,
    nextSession,
    input.session?.context,
  );
}

export function initializeGuideMultiTurnResult(
  result: CommandResult,
  sessionContext?: Record<string, unknown>,
): CommandResult {
  if (!result.success || !result.guide) return result;
  const flowId = resolveGuideFlowIdFromGuide(result.guide);
  if (!flowId || result.guide.steps.length === 0) return result;

  const existing = readGuideMultiTurnSession(sessionContext);
  const session =
    existing?.guideFlowId === flowId
      ? existing
      : createInitialGuideMultiTurnSession(flowId);

  const positionedGuide = buildGuideResponseForMultiTurnStep(result.guide, session);
  const nextResult = {
    ...result,
    guide: positionedGuide,
    summary: positionedGuide.summary,
  };
  return attachGuideMultiTurnSessionToResult(nextResult, session, sessionContext);
}
