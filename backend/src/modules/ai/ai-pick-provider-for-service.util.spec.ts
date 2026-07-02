import { PICK_PROVIDER_FOR_SERVICE_MULTILINGUAL_SCENARIOS } from './ai-pick-provider-for-service-multilingual.fixtures.js';
import {
  PICK_PROVIDER_FOR_SERVICE_PROMPTS,
  PICK_PROVIDER_FOR_SERVICE_RESCUE_SCENARIOS,
} from './ai-pick-provider-for-service.fixtures.js';
import {
  detectPickProviderForServiceAction,
  enrichPickProviderForServiceParamsFromPrompt,
  extractNamedProviderFromPrompt,
  inferPickProviderMode,
  isPickProviderForServiceIntent,
  isPickProviderForServicePrompt,
  parsePickProviderForServiceFromPrompt,
  rescuePickProviderForServiceIntent,
} from './ai-pick-provider-for-service.util.js';

describe('ai-pick-provider-for-service.util (ai-cmd-customer-4.11.2)', () => {
  it.each(PICK_PROVIDER_FOR_SERVICE_PROMPTS)(
    'detects pick provider prompt for $id',
    ({ prompt, mode, providerName, serviceName }) => {
      expect(isPickProviderForServicePrompt(prompt)).toBe(true);
      const parsed = parsePickProviderForServiceFromPrompt(prompt);
      expect(parsed?.mode).toBe(mode);
      if (providerName) expect(parsed?.providerName).toBe(providerName);
      if (serviceName) expect(parsed?.serviceName).toBe(serviceName);
    },
  );

  it.each(PICK_PROVIDER_FOR_SERVICE_MULTILINGUAL_SCENARIOS)(
    'detects multilingual pick provider prompt for $id',
    ({ prompt, mode }) => {
      expect(isPickProviderForServicePrompt(prompt)).toBe(true);
      expect(parsePickProviderForServiceFromPrompt(prompt)?.mode).toBe(mode);
    },
  );

  it.each(PICK_PROVIDER_FOR_SERVICE_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescuePickProviderForServiceIntent(prompt, misclassifiedAction)?.action,
      ).toBe('pick_provider_for_service');
    },
  );

  it('does not steal full rebook prompts', () => {
    expect(isPickProviderForServicePrompt('Book the same as last time')).toBe(
      false,
    );
    expect(isPickProviderForServicePrompt('Rebook my last appointment')).toBe(
      false,
    );
  });

  it('does not steal explain provider specialty prompts', () => {
    expect(isPickProviderForServicePrompt('Tell me about Anna')).toBe(false);
    expect(isPickProviderForServicePrompt('Who specializes in color?')).toBe(
      false,
    );
  });

  it('does not steal slot booking prompts', () => {
    expect(
      isPickProviderForServicePrompt('Book with Anna tomorrow at 3pm'),
    ).toBe(false);
  });

  it('extracts named provider and service', () => {
    expect(extractNamedProviderFromPrompt('Book with Anna for color')).toEqual({
      providerName: 'Anna',
      serviceName: 'color',
    });
  });

  it('infers same_as_last mode', () => {
    expect(inferPickProviderMode('Use my usual stylist')).toBe('same_as_last');
  });

  it('enriches params from prompt', () => {
    expect(
      enrichPickProviderForServiceParamsFromPrompt(
        {},
        'Book with Anna for color',
      ),
    ).toMatchObject({
      mode: 'named_provider',
      providerName: 'Anna',
      serviceName: 'color',
    });
  });

  it('detects action and intent id', () => {
    expect(
      detectPickProviderForServiceAction('Pick Maria for highlights'),
    ).toBe('pick_provider_for_service');
    expect(isPickProviderForServiceIntent('pick_provider_for_service')).toBe(
      true,
    );
  });
});
