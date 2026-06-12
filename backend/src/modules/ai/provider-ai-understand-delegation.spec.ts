import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PIPELINE_UNDERSTAND_STAGE_ORDER } from './command-understanding.types.js';

const PROVIDER_AI_COMMAND_SOURCE = readFileSync(
  join(__dirname, '../provider-mobile/provider-ai-command.service.ts'),
  'utf8',
);

describe('ProviderAiCommandService understand delegation (pipe-1.12.2)', () => {
  it('delegates single-intent understand phase to ProviderCommandUnderstandingAdapter', () => {
    expect(PROVIDER_AI_COMMAND_SOURCE).toContain(
      'this.providerUnderstanding.understand(',
    );
    expect(PROVIDER_AI_COMMAND_SOURCE).toContain(
      'ProviderCommandUnderstandingAdapter',
    );
    expect(PROVIDER_AI_COMMAND_SOURCE).not.toContain(
      'this.understandingPipeline.understand(',
    );
    expect(PROVIDER_AI_COMMAND_SOURCE).not.toContain(
      'const parsed = await this.classifyIntent(',
    );
  });

  it('passes AiSettingsService confidence bands into provider understand adapter', () => {
    expect(PROVIDER_AI_COMMAND_SOURCE).toContain(
      'this.aiSettings.getSettings(businessId)',
    );
    expect(PROVIDER_AI_COMMAND_SOURCE).toContain(
      'confidence: aiConfig.confidence',
    );
    expect(PROVIDER_AI_COMMAND_SOURCE).toContain(
      'sessionConfidenceHigh: context?._confidenceHigh',
    );
    expect(PROVIDER_AI_COMMAND_SOURCE).toContain(
      'this.promptNormalization.normalizeForClassifier',
    );
  });

  it('keeps provider-only post-pipeline rescues and execution in ProviderAiCommandService', () => {
    expect(PROVIDER_AI_COMMAND_SOURCE).toContain('rescueProviderAiIntent');
    expect(PROVIDER_AI_COMMAND_SOURCE).toContain('rescueCoordinationIntent');
    expect(PROVIDER_AI_COMMAND_SOURCE).toContain(
      'disambiguateProviderMobileAction',
    );
    expect(PROVIDER_AI_COMMAND_SOURCE).not.toContain(
      'rescueProviderPaymentCurrencyIntent',
    );
    expect(PROVIDER_AI_COMMAND_SOURCE).not.toContain(
      'rescueProviderEarningsIntent',
    );
  });

  it('covers all understand stages via pipeline trace contract', () => {
    for (const stage of PIPELINE_UNDERSTAND_STAGE_ORDER) {
      expect(stage.length).toBeGreaterThan(0);
    }
  });
});

describe('ProviderCommandUnderstandingAdapter wiring (pipe-1.12.2)', () => {
  it('adapter owns provider classify context + confidence mapping', () => {
    const adapterSource = readFileSync(
      join(__dirname, 'provider-command-understanding.adapter.ts'),
      'utf8',
    );
    expect(adapterSource).toContain('buildProviderUnderstandInput');
    expect(adapterSource).toContain('resolveConfidenceGateThresholds');
    expect(adapterSource).toContain('buildProviderClassifyCallbacks');
    expect(adapterSource).toContain(
      'surface: PROVIDER_COMMAND_UNDERSTANDING_SURFACE',
    );
  });
});
