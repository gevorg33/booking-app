import { DASHBOARD_INTENTS } from './ai-command-registry.build.js';

/** Sorted `"intent_id"` fragments for dashboard `INTENT_SCHEMA` action union (ai-cmd-ext-0.1). */
export const DASHBOARD_CLASSIFIER_ACTION_UNION = [...DASHBOARD_INTENTS]
  .sort((left, right) => left.localeCompare(right))
  .map((intent) => `"${intent}"`)
  .join(' | ');

export function dashboardClassifierUnionActionIds(): Set<string> {
  return new Set(DASHBOARD_INTENTS);
}
