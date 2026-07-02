import { DASHBOARD_INTENTS } from './ai-command-registry.build.js';
import {
  DASHBOARD_CLASSIFIER_ACTION_UNION,
  dashboardClassifierUnionActionIds,
} from './ai-command-intent-schema.build.js';

describe('ai-command-intent-schema.build (ai-cmd-ext-0.1)', () => {
  it('includes every dashboard registry intent in the classifier action union', () => {
    const unionIds = dashboardClassifierUnionActionIds();
    expect(unionIds.size).toBe(DASHBOARD_INTENTS.length);
    for (const intent of DASHBOARD_INTENTS) {
      expect(unionIds.has(intent)).toBe(true);
      expect(DASHBOARD_CLASSIFIER_ACTION_UNION).toContain(`"${intent}"`);
    }
  });

  it('keeps the union string stable and sorted', () => {
    const ids = [
      ...DASHBOARD_CLASSIFIER_ACTION_UNION.matchAll(/"([a-z0-9_]+)"/g),
    ].map((match) => match[1]);
    expect(ids).toEqual(
      [...ids].sort((left, right) => left.localeCompare(right)),
    );
    expect(ids.length).toBe(DASHBOARD_INTENTS.length);
  });
});
