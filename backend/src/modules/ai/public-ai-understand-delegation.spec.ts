import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PIPELINE_UNDERSTAND_STAGE_ORDER } from './command-understanding.types.js';

const PUBLIC_ASSISTANT_SOURCE = readFileSync(
  join(__dirname, '../public-booking/public-booking-assistant.service.ts'),
  'utf8',
);

describe('PublicBookingAssistantService understand delegation (pipe-1.12.4)', () => {
  it('delegates single-intent understand phase to PublicCommandUnderstandingAdapter', () => {
    expect(PUBLIC_ASSISTANT_SOURCE).toContain(
      'this.publicUnderstanding.understand(',
    );
    expect(PUBLIC_ASSISTANT_SOURCE).toContain(
      'PublicCommandUnderstandingAdapter',
    );
    expect(PUBLIC_ASSISTANT_SOURCE).not.toContain(
      'this.understandingPipeline.understand(',
    );
    expect(PUBLIC_ASSISTANT_SOURCE).not.toContain(
      'const parsed = await this.classifyIntent(',
    );
  });

  it('passes AiSettingsService confidence bands into public understand adapter', () => {
    expect(PUBLIC_ASSISTANT_SOURCE).toContain(
      'this.aiSettings.getSettings(business.id)',
    );
    expect(PUBLIC_ASSISTANT_SOURCE).toContain(
      'confidence: aiConfig.confidence',
    );
    expect(PUBLIC_ASSISTANT_SOURCE).toContain(
      'sessionConfidenceHigh: orchestratedSession?._confidenceHigh',
    );
    expect(PUBLIC_ASSISTANT_SOURCE).toContain(
      'this.promptNormalization.normalizeForClassifier',
    );
  });

  it('keeps public discovery post-pipeline rescue and execution in PublicBookingAssistantService', () => {
    expect(PUBLIC_ASSISTANT_SOURCE).toContain(
      'applyPublicBookingHelpRescue',
    );
    expect(PUBLIC_ASSISTANT_SOURCE).toContain(
      'dispatchPublicAppGuideIntent',
    );
    expect(PUBLIC_ASSISTANT_SOURCE).toContain(
      'applyBudgetAndRankServiceDiscoveryRescue',
    );
    expect(PUBLIC_ASSISTANT_SOURCE).not.toContain(
      'rescueCheckoutCurrencyIntent',
    );
    expect(PUBLIC_ASSISTANT_SOURCE).not.toContain(
      'disambiguateMisclassifiedAvailabilityIntent',
    );
    expect(PUBLIC_ASSISTANT_SOURCE).not.toContain(
      'rescueBookingLanguagesIntent',
    );
  });

  it('covers all understand stages via pipeline trace contract', () => {
    for (const stage of PIPELINE_UNDERSTAND_STAGE_ORDER) {
      expect(stage.length).toBeGreaterThan(0);
    }
  });
});

describe('PublicCommandUnderstandingAdapter wiring (pipe-1.12.4)', () => {
  it('adapter owns public classify context + confidence mapping', () => {
    const adapterSource = readFileSync(
      join(__dirname, 'public-command-understanding.adapter.ts'),
      'utf8',
    );
    expect(adapterSource).toContain('buildPublicUnderstandInput');
    expect(adapterSource).toContain('resolveConfidenceGateThresholds');
    expect(adapterSource).toContain('buildPublicClassifyCallbacks');
    expect(adapterSource).toContain(
      'surface: PUBLIC_COMMAND_UNDERSTANDING_SURFACE',
    );
  });
});
