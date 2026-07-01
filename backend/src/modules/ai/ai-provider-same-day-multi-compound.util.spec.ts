import {
  PROVIDER_SAME_DAY_MULTI_COMPOUND_PROMPTS,
  PROVIDER_SAME_DAY_MULTI_NEGATIVE_PROMPTS,
  PROVIDER_SAME_DAY_MULTI_RESCUE_SCENARIOS,
} from './ai-provider-same-day-multi-compound.fixtures.js';
import { PROVIDER_SAME_DAY_MULTI_MULTILINGUAL_SCENARIOS } from './ai-provider-same-day-multi-compound-multilingual.fixtures.js';
import { isMultiServiceDayCompoundPrompt } from './ai-multi-service-day-compound.util.js';
import { isPickProviderForServicePrompt } from './ai-pick-provider-for-service.util.js';
import {
  decomposeProviderSameDayMultiCompoundPrompt,
  extractProviderNameFromSameDayMultiPrompt,
  hasProviderSameDayMultiBlockCue,
  hasProviderSameDayMultiProviderCue,
  isProviderSameDayMultiCompoundPrompt,
  rescueProviderSameDayMultiCompoundIntent,
} from './ai-provider-same-day-multi-compound.util.js';

describe('ai-provider-same-day-multi-compound.util (ai-cmd-customer-4.21.3)', () => {
  it.each(PROVIDER_SAME_DAY_MULTI_COMPOUND_PROMPTS)(
    'detects provider_same_day_multi compound for $id',
    ({ prompt, orderedActions, providerName, serviceNames, timeOfDay }) => {
      expect(isProviderSameDayMultiCompoundPrompt(prompt)).toBe(true);
      expect(hasProviderSameDayMultiProviderCue(prompt)).toBe(true);
      expect(hasProviderSameDayMultiBlockCue(prompt)).toBe(true);
      const decompose = decomposeProviderSameDayMultiCompoundPrompt(prompt);
      expect(decompose.map((step) => step.action)).toEqual([...orderedActions]);
      expect(decompose[0]?.params.providerName).toBe(providerName);
      expect(decompose[0]?.params.mode).toBe('named_provider');
      expect(decompose[0]?.params.providerSameDayMulti).toBe(true);
      expect(decompose[1]?.params.continueAfterProviderPick).toBe(true);
      expect(decompose[0]?.params.serviceNames).toEqual(serviceNames);
      if (timeOfDay) {
        expect(decompose[0]?.params.timeOfDay).toBe(timeOfDay);
      }
    },
  );

  it.each(PROVIDER_SAME_DAY_MULTI_MULTILINGUAL_SCENARIOS)(
    'detects multilingual compound $id',
    ({ prompt, orderedActions }) => {
      expect(isProviderSameDayMultiCompoundPrompt(prompt)).toBe(true);
      expect(
        decomposeProviderSameDayMultiCompoundPrompt(prompt).map(
          (s) => s.action,
        ),
      ).toEqual([...orderedActions]);
    },
  );

  it.each(PROVIDER_SAME_DAY_MULTI_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueProviderSameDayMultiCompoundIntent(prompt, misclassifiedAction!),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'provider_same_day_multi_compound',
      });
    },
  );

  it.each(PROVIDER_SAME_DAY_MULTI_NEGATIVE_PROMPTS)(
    'does not steal $id',
    ({ prompt }) => {
      expect(isProviderSameDayMultiCompoundPrompt(prompt)).toBe(false);
    },
  );

  it('multi-service day without provider stays on multi_service_day', () => {
    const prompt = 'Massage and facial same afternoon — find a time';
    expect(isMultiServiceDayCompoundPrompt(prompt)).toBe(true);
    expect(isProviderSameDayMultiCompoundPrompt(prompt)).toBe(false);
  });

  it('single-service pick provider stays on pick_provider_for_service', () => {
    const prompt = 'Book with Anna for color';
    expect(isPickProviderForServicePrompt(prompt)).toBe(true);
    expect(isProviderSameDayMultiCompoundPrompt(prompt)).toBe(false);
  });

  it('extracts provider from em dash phrasing', () => {
    expect(
      extractProviderNameFromSameDayMultiPrompt(
        'Anna — massage and facial same afternoon',
      ),
    ).toBe('Anna');
  });

  it('uses heuristic detection outside fixtures', () => {
    const prompt = 'Claire — wax and facial same afternoon please';
    expect(isProviderSameDayMultiCompoundPrompt(prompt)).toBe(true);
    expect(decomposeProviderSameDayMultiCompoundPrompt(prompt)).toHaveLength(3);
  });

  it('returns null rescue when already compound_intent', () => {
    expect(
      rescueProviderSameDayMultiCompoundIntent(
        'Anna — massage and facial same afternoon',
        'compound_intent',
      ),
    ).toBeNull();
  });
});
