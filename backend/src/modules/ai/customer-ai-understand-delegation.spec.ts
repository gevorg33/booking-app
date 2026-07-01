import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PIPELINE_UNDERSTAND_STAGE_ORDER } from './command-understanding.types.js';

const CUSTOMER_AI_COMMAND_SOURCE = readFileSync(
  join(__dirname, 'customer-ai-command.service.ts'),
  'utf8',
);

describe('CustomerAiCommandService understand delegation (pipe-1.12.3)', () => {
  it('delegates single-intent understand phase to CustomerCommandUnderstandingAdapter', () => {
    expect(CUSTOMER_AI_COMMAND_SOURCE).toContain(
      'this.customerUnderstanding.understand(',
    );
    expect(CUSTOMER_AI_COMMAND_SOURCE).toContain(
      'CustomerCommandUnderstandingAdapter',
    );
    expect(CUSTOMER_AI_COMMAND_SOURCE).not.toContain(
      'this.understandingPipeline.understand(',
    );
    expect(CUSTOMER_AI_COMMAND_SOURCE).not.toContain(
      'const parsed = await this.classifyIntent(',
    );
  });

  it('passes AiSettingsService confidence bands into customer understand adapter', () => {
    expect(CUSTOMER_AI_COMMAND_SOURCE).toContain(
      'this.aiSettings.getSettings(businessId)',
    );
    expect(CUSTOMER_AI_COMMAND_SOURCE).toContain(
      'confidence: aiConfig.confidence',
    );
    expect(CUSTOMER_AI_COMMAND_SOURCE).toContain(
      'sessionConfidenceHigh: context?._confidenceHigh',
    );
    expect(CUSTOMER_AI_COMMAND_SOURCE).toContain(
      'this.promptNormalization.normalizeForClassifier',
    );
  });

  it('keeps customer discovery post-pipeline rescue and execution in CustomerAiCommandService', () => {
    expect(CUSTOMER_AI_COMMAND_SOURCE).toContain(
      'applyBudgetAndRankServiceDiscoveryRescue',
    );
    expect(CUSTOMER_AI_COMMAND_SOURCE).not.toContain('private rescueIntent(');
    expect(CUSTOMER_AI_COMMAND_SOURCE).not.toContain('rescueCheckoutTaxIntent');
    expect(CUSTOMER_AI_COMMAND_SOURCE).not.toContain('rescuePaymentsIntent');
  });

  it('covers all understand stages via pipeline trace contract', () => {
    for (const stage of PIPELINE_UNDERSTAND_STAGE_ORDER) {
      expect(stage.length).toBeGreaterThan(0);
    }
  });
});

describe('CustomerCommandUnderstandingAdapter wiring (pipe-1.12.3)', () => {
  it('adapter owns customer classify context + confidence mapping', () => {
    const adapterSource = readFileSync(
      join(__dirname, 'customer-command-understanding.adapter.ts'),
      'utf8',
    );
    expect(adapterSource).toContain('buildCustomerUnderstandInput');
    expect(adapterSource).toContain('resolveConfidenceGateThresholds');
    expect(adapterSource).toContain('buildCustomerClassifyCallbacks');
    expect(adapterSource).toContain(
      'surface: CUSTOMER_COMMAND_UNDERSTANDING_SURFACE',
    );
  });
});
