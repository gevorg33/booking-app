import type {
  AiGuideHandoffDispatch,
  AiGuideNavigateTarget,
  AiGuideRelatedAction,
  AiGuideResponse,
  AiGuideStep,
} from '@/lib/ai-client.types';
import { buildDashboardNavigateUrl, type DashboardNavigateTarget } from '@/lib/compliance-dashboard-nav';

export function hasInteractiveGuideSteps(
  guide: AiGuideResponse | null | undefined,
): guide is AiGuideResponse {
  return Boolean(guide?.steps?.length);
}

function extractNavigateTarget(
  navigate: AiGuideNavigateTarget | null | undefined,
): DashboardNavigateTarget | null {
  if (!navigate || typeof navigate !== 'object') return null;
  const path = navigate.path;
  if (typeof path !== 'string' || !path.startsWith('/')) return null;
  return {
    path,
    ...(typeof navigate.hash === 'string' ? { hash: navigate.hash } : {}),
    ...(navigate.query && typeof navigate.query === 'object'
      ? { query: navigate.query as Record<string, string> }
      : {}),
  };
}

/** Plain-text assistant reply from a product-guide payload (voice + chat history). */
export function formatGuideAssistantText(
  guide: AiGuideResponse | null | undefined,
  fallbackSummary?: string,
): string {
  const summary = guide?.summary?.trim() || fallbackSummary?.trim() || '';
  if (!guide?.steps?.length) return summary;
  const steps = guide.steps
    .map((step, index) => `${index + 1}. ${step.title}\n${step.body}`)
    .join('\n\n');
  return summary ? `${summary}\n\n${steps}` : steps;
}

export function extractStepNavigate(
  step: AiGuideStep | null | undefined,
): DashboardNavigateTarget | null {
  return extractNavigateTarget(step?.navigate);
}

export function extractGuideNavigate(
  guide: AiGuideResponse | null | undefined,
): DashboardNavigateTarget | null {
  return extractNavigateTarget(guide?.navigate);
}

export function resolveActiveGuideStepNavigate(
  guide: AiGuideResponse,
  stepIndex: number,
): DashboardNavigateTarget | null {
  const stepTarget = extractStepNavigate(guide.steps[stepIndex]);
  if (stepTarget) return stepTarget;
  if (stepIndex >= guide.steps.length - 1) {
    return extractGuideNavigate(guide);
  }
  return null;
}

export function buildGuideStepNavigateUrl(
  guide: AiGuideResponse,
  stepIndex: number,
): string | null {
  const target = resolveActiveGuideStepNavigate(guide, stepIndex);
  return target ? buildDashboardNavigateUrl(target) : null;
}

export function resolveGuideNavigateUrl(
  guide: AiGuideResponse | null | undefined,
): string | null {
  const target = extractGuideNavigate(guide);
  return target ? buildDashboardNavigateUrl(target) : null;
}

export function resolveGuideRelatedActionId(
  related: AiGuideRelatedAction,
): string {
  return related.action || related.intent || '';
}

export function resolveGuideHandoffPrompt(related: AiGuideRelatedAction): string {
  if (related.prompt?.trim()) return related.prompt.trim();
  const action = resolveGuideRelatedActionId(related);
  return action ? action.replace(/_/g, ' ') : related.label;
}

/** Build API payload for direct guide handoff — skips classifier re-prompt (ai-guide-1.2.5). */
export function buildGuideHandoffRequest(
  related: AiGuideRelatedAction,
): AiGuideHandoffDispatch {
  const params = { ...(related.params ?? {}) };
  params.prompt = resolveGuideHandoffPrompt(related);
  return {
    action: related.action,
    params,
    source: 'product_guide',
  };
}

export function toAiGuideNavigateTarget(
  target: DashboardNavigateTarget | null,
): AiGuideNavigateTarget | undefined {
  if (!target) return undefined;
  return {
    path: target.path,
    ...(target.hash ? { hash: target.hash } : {}),
    ...(target.query ? { query: target.query } : {}),
  };
}
