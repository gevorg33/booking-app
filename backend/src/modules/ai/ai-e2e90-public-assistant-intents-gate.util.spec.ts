import {
  gatePublicAssistantActionLogic,
} from './ai-platform.logic.js';
import {
  intentAllowlistIncludes,
  readRegistryIntentList,
  resolvePublicAssistantIntentAllowlist,
  resolvePublicAssistantIntentAllowlistFrom,
  validatePublicAssistantAction,
} from './ai-platform.util.js';
import { PUBLIC_ONLY_ASSISTANT_ACTIONS } from './ai-public-only-assistant-actions.js';
import {
  E2E90_DISCOVERY_ACTIONS,
  E2E90_DISCOVERY_PROMPTS,
} from './ai-e2e90-public-assistant-intents-gate.fixtures.js';

describe('e2e-bug.90 public assistant intents gate never throws on undefined allowlist', () => {
  it('readRegistryIntentList treats undefined/empty as missing', () => {
    expect(readRegistryIntentList(undefined)).toBeUndefined();
    expect(readRegistryIntentList(null)).toBeUndefined();
    expect(readRegistryIntentList([])).toBeUndefined();
    expect(readRegistryIntentList(['list_services'])).toEqual(['list_services']);
  });

  it('resolvePublicAssistantIntentAllowlistFrom falls back when registry is undefined', () => {
    const fallback = resolvePublicAssistantIntentAllowlistFrom(undefined);
    expect(fallback).toEqual([...PUBLIC_ONLY_ASSISTANT_ACTIONS, 'unknown']);
    for (const action of E2E90_DISCOVERY_ACTIONS) {
      expect(fallback.includes(action)).toBe(true);
    }
  });

  it('resolvePublicAssistantIntentAllowlist uses the live registry when healthy', () => {
    const live = resolvePublicAssistantIntentAllowlist();
    expect(live.length).toBeGreaterThan(PUBLIC_ONLY_ASSISTANT_ACTIONS.length);
    expect(live.includes('list_services')).toBe(true);
  });

  it('intentAllowlistIncludes never throws when list is undefined', () => {
    expect(() =>
      intentAllowlistIncludes(undefined, 'list_services', PUBLIC_ONLY_ASSISTANT_ACTIONS),
    ).not.toThrow();
    expect(
      intentAllowlistIncludes(undefined, 'list_services', PUBLIC_ONLY_ASSISTANT_ACTIONS),
    ).toBe(true);
    expect(
      intentAllowlistIncludes(undefined, 'payment_sweep', PUBLIC_ONLY_ASSISTANT_ACTIONS),
    ).toBe(false);
  });

  it.each(E2E90_DISCOVERY_PROMPTS)(
    '$id: validatePublicAssistantAction allows $action',
    ({ action }) => {
      expect(validatePublicAssistantAction(action)).toBe(true);
    },
  );

  it.each(E2E90_DISCOVERY_ACTIONS)(
    'gatePublicAssistantActionLogic allows %s (null = pass)',
    (action) => {
      expect(gatePublicAssistantActionLogic(action, 'en')).toBeNull();
    },
  );

  it('gatePublicAssistantActionLogic denies non-public actions without throwing', () => {
    const denied = gatePublicAssistantActionLogic('payment_sweep', 'en');
    expect(denied).not.toBeNull();
    expect(denied?.action).toBe('security_blocked');
    expect(denied?.success).toBe(false);
  });

  it('simulated undefined registry list still allows discovery via fallback', () => {
    const allowlist = resolvePublicAssistantIntentAllowlistFrom(undefined);
    for (const { id, action } of E2E90_DISCOVERY_PROMPTS) {
      expect({ id, ok: allowlist.includes(action) }).toEqual({ id, ok: true });
    }
    // The exact crash shape from the live bug: `.includes` on undefined.
    const broken: readonly string[] | undefined = undefined;
    expect(() => {
      const list = resolvePublicAssistantIntentAllowlistFrom(broken);
      return list.includes('list_services');
    }).not.toThrow();
  });
});
