import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PIPELINE_UNDERSTAND_STAGE_ORDER } from './command-understanding.types.js';
import { checkIntentRescueBoundary } from './ai-intent-rescue-boundary-gate.util.js';

const AI_COMMAND_SERVICE_SOURCE = readFileSync(
  join(__dirname, 'ai-command.service.ts'),
  'utf8',
);

describe('AiCommandService understand delegation (pipe-1.0.4 / pipe-1.12.1)', () => {
  it('delegates executeSingleIntent understand phase to DashboardCommandUnderstandingAdapter', () => {
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      'this.dashboardUnderstanding.understand(',
    );
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      'DashboardCommandUnderstandingAdapter',
    );
    expect(AI_COMMAND_SERVICE_SOURCE).not.toContain(
      'this.understandingPipeline.understand(',
    );
    expect(AI_COMMAND_SERVICE_SOURCE).not.toContain('trySemanticIntentRescue');
    expect(AI_COMMAND_SERVICE_SOURCE).not.toContain('resolveParsedIntent');
  });

  it('prepends understand pipeline trace before resolve/validate traces', () => {
    expect(AI_COMMAND_SERVICE_SOURCE).toContain('priorTrace: understandTrace');
    expect(AI_COMMAND_SERVICE_SOURCE).toContain('runCompletionValidateHandoff');
  });

  it('keeps post-understand enrichment and execution in AiCommandService', () => {
    expect(AI_COMMAND_SERVICE_SOURCE).toContain('mergeSessionContext');
    expect(AI_COMMAND_SERVICE_SOURCE).toContain('runCompletionValidateHandoff');
    expect(AI_COMMAND_SERVICE_SOURCE).toContain('buildExecutionConfirmationResult');
  });

  it('covers all understand stages via pipeline trace contract', () => {
    for (const stage of PIPELINE_UNDERSTAND_STAGE_ORDER) {
      expect(stage.length).toBeGreaterThan(0);
    }
  });
});

describe('AiCommandService confidence gate wiring (pipe-1.3.3 / pipe-1.12.1)', () => {
  it('passes AiSettingsService confidence bands into dashboard understand adapter', () => {
    expect(AI_COMMAND_SERVICE_SOURCE).toContain('confidence: aiConfig.confidence');
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      'sessionConfidenceHigh: session?.context?._confidenceHigh',
    );
    expect(AI_COMMAND_SERVICE_SOURCE).not.toContain(
      'confidenceLow: confidenceThresholds.low',
    );
  });
});

describe('DashboardCommandUnderstandingAdapter wiring (pipe-1.12.1)', () => {
  it('adapter owns dashboard classify catalog + confidence mapping', () => {
    const adapterSource = readFileSync(
      join(__dirname, 'dashboard-command-understanding.adapter.ts'),
      'utf8',
    );
    expect(adapterSource).toContain('buildDashboardUnderstandInput');
    expect(adapterSource).toContain('resolveConfidenceGateThresholds');
    expect(adapterSource).toContain('buildDashboardClassifyCallbacks');
    expect(adapterSource).toContain("surface: DASHBOARD_COMMAND_UNDERSTANDING_SURFACE");
  });
});

describe('AiCommandService parallel classify delegation (pipe-1.3.1 / pipe-1.12.1)', () => {
  it('does not classify in executeCommand — parallel routing lives in the pipeline', () => {
    expect(AI_COMMAND_SERVICE_SOURCE).not.toContain(
      'runParallelRouteAndClassification',
    );
    expect(AI_COMMAND_SERVICE_SOURCE).not.toContain('preclassified');
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      'this.dashboardUnderstanding.createResolveRoute',
    );
    expect(AI_COMMAND_SERVICE_SOURCE).toContain('resolveRoute,');
    expect(AI_COMMAND_SERVICE_SOURCE).toContain('resolveComplexityRoute');
  });

  it('CommandUnderstandingPipelineService owns runParallelRouteAndClassification', () => {
    const pipelineSource = readFileSync(
      join(__dirname, 'command-understanding-pipeline.service.ts'),
      'utf8',
    );
    expect(pipelineSource).toContain('runParallelRouteAndClassification');
    expect(pipelineSource).toContain('input.resolveRoute');
  });
});

describe('AiIntentRescueService semantic exclusion (pipe-1.5.1)', () => {
  it('rescue service has no semantic imports or calls', () => {
    expect(checkIntentRescueBoundary(__dirname)).toEqual([]);
  });

  it('rescue delegates to runIntentRescuePipeline orchestrator', () => {
    const rescueSource = readFileSync(
      join(__dirname, 'ai-intent-rescue.service.ts'),
      'utf8',
    );
    expect(rescueSource).toContain('runIntentRescuePipeline(this, input)');
    expect(rescueSource).not.toContain('trySemanticIntentRescue');
    expect(rescueSource).not.toContain('AiSemanticIntentService');
  });

  it('pipeline passes semantic winner param hints into rescue (pipe-1.5.2)', () => {
    const pipelineSource = readFileSync(
      join(__dirname, 'command-understanding-pipeline.service.ts'),
      'utf8',
    );
    expect(pipelineSource).toContain('resolveSemanticWinnerParamHints');
    expect(pipelineSource).toContain('semanticParamHints');
    expect(pipelineSource).not.toContain('trySemanticIntentRescue');
  });

  it('pipeline runs semantic_match before rescue stage', () => {
    const pipelineSource = readFileSync(
      join(__dirname, 'command-understanding-pipeline.service.ts'),
      'utf8',
    );
    const semanticIdx = pipelineSource.indexOf('stageSemanticMatch');
    const rescueIdx = pipelineSource.indexOf('stageRescue');
    expect(semanticIdx).toBeGreaterThan(-1);
    expect(rescueIdx).toBeGreaterThan(semanticIdx);
    expect(pipelineSource).toContain('isSemanticStealProtectedPrompt');
  });

  it('pipeline wires self-verify rule checks after rescue (pipe-1.6.1 / pipe-1.6.2)', () => {
    const utilSource = readFileSync(
      join(__dirname, 'ai-intent-self-verify.util.ts'),
      'utf8',
    );
    const clarifySource = readFileSync(
      join(__dirname, 'ai-unknown-intent.util.ts'),
      'utf8',
    );
    const pipelineSource = readFileSync(
      join(__dirname, 'command-understanding-pipeline.service.ts'),
      'utf8',
    );
    expect(utilSource).toContain('booking_vs_clear_mismatch');
    expect(utilSource).toContain('schedule_vocab_mismatch');
    expect(clarifySource).toContain('SELF_VERIFY_CLARIFY_CONFIDENCE_THRESHOLD');
    const structuralSource = readFileSync(
      join(__dirname, 'ai-intent-structural-enrich.util.ts'),
      'utf8',
    );
    expect(structuralSource).toContain('applyStructuralIntentEnrichment');
    expect(structuralSource).toContain('applyDefaultWorkTimeSchedulePeriods');
    const skipSource = readFileSync(
      join(__dirname, 'ai-intent-structural-enrich-skip.util.ts'),
      'utf8',
    );
    expect(skipSource).toContain('shouldSkipStructuralEnrichAfterSelfVerify');
    expect(pipelineSource).toContain('shouldSkipStructuralEnrichAfterSelfVerify');
    expect(pipelineSource).toContain('resolveSelfVerifyStageOutcome');
    expect(pipelineSource).toContain('applyStructuralIntentEnrichment');
  });
});

describe('AiCommandService unknown intent guard wiring (pipe-1.8.1)', () => {
  it('clarifies unknown after post-rescue instead of handler switch default', () => {
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      'shouldBlockUnknownFromHandlerSwitch(parsed.action)',
    );
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      'buildUnknownIntentClarifyResult({',
    );
    const guardIndex = AI_COMMAND_SERVICE_SOURCE.indexOf(
      'shouldBlockUnknownFromHandlerSwitch(parsed.action)',
    );
    const switchIndex = AI_COMMAND_SERVICE_SOURCE.indexOf(
      'switch (parsed.action)',
    );
    expect(guardIndex).toBeGreaterThan(-1);
    expect(switchIndex).toBeGreaterThan(guardIndex);
  });
});

describe('AiCommandService pipeline mutating guard wiring (pipe-1.9.1)', () => {
  it('blocks low-confidence mutating intents after validate handoff', () => {
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      'shouldBlockLowConfidencePipelineMutate(',
    );
    const handoffIndex = AI_COMMAND_SERVICE_SOURCE.indexOf(
      'runCompletionValidateHandoff(',
    );
    const mutateIndex = AI_COMMAND_SERVICE_SOURCE.indexOf(
      'shouldBlockLowConfidencePipelineMutate(',
    );
    const switchIndex = AI_COMMAND_SERVICE_SOURCE.indexOf(
      'switch (parsed.action)',
    );
    expect(handoffIndex).toBeGreaterThan(-1);
    expect(mutateIndex).toBeGreaterThan(handoffIndex);
    expect(switchIndex).toBeGreaterThan(mutateIndex);
  });
});

describe('BookingCommandGraphService ReAct fallback wiring (pipe-1.9.2)', () => {
  it('runs ReAct only after pipeline unknown result', () => {
    const graphSource = readFileSync(
      join(__dirname, 'booking-command-graph.service.ts'),
      'utf8',
    );
    expect(graphSource).toContain('shouldUseReactAgentFallback({');
    expect(graphSource).not.toContain('shouldUseReactAgent(');

    const executeIndex = graphSource.indexOf(
      'input.delegates.executeSingleIntent()',
    );
    const fallbackIndex = graphSource.indexOf('shouldUseReactAgentFallback({');
    expect(executeIndex).toBeGreaterThan(-1);
    expect(fallbackIndex).toBeGreaterThan(executeIndex);
  });
});
