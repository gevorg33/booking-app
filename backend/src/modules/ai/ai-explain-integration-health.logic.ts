import type { CommandResult } from './command-completion.types.js';
import {
  buildFocusedIntegrationHealthSummary,
  buildIntegrationHealthOverviewSummary,
  integrationHealthNavigatePath,
  loadIntegrationHealthSnapshot,
  type IntegrationHealthFocus,
  type IntegrationHealthSnapshotDeps,
} from './ai-integration-health.snapshot.js';
import {
  isExplainIntegrationHealthPrompt,
  parseIntegrationHealthFocusFromPrompt,
} from './ai-explain-integration-health.util.js';

export type ExplainIntegrationHealthLogicDeps =
  IntegrationHealthSnapshotDeps & {
    integrationsDocsService?: { buildDocs: (businessId: string) => unknown };
  };

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

export async function handleExplainIntegrationHealthLogic(
  deps: ExplainIntegrationHealthLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  if (!isExplainIntegrationHealthPrompt(effectivePrompt)) {
    return failure(
      'explain_integration_health',
      'Ask whether an integration is connected (e.g. "Is WhatsApp connected?" or "Which integrations are connected?").',
    );
  }

  const snapshot = await loadIntegrationHealthSnapshot(deps, businessId);
  const integrationFocus = parseIntegrationHealthFocusFromPrompt(
    effectivePrompt,
    params,
  );

  const summary = integrationFocus
    ? buildFocusedIntegrationHealthSummary(snapshot, integrationFocus)
    : buildIntegrationHealthOverviewSummary(snapshot);

  return success('explain_integration_health', summary, {
    health: snapshot,
    integrationFocus,
    docsAvailable: Boolean(deps.integrationsDocsService),
    navigate: integrationHealthNavigatePath(integrationFocus),
  });
}

export { type IntegrationHealthFocus };
