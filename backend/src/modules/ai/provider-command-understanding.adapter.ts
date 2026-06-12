import { Injectable } from '@nestjs/common';
import { resolveConfidenceGateThresholds } from './confidence-gate.util.js';
import { CommandUnderstandingPipelineService } from './command-understanding-pipeline.service.js';
import { buildProviderClassifierContext } from './command-understanding-provider.util.js';
import type {
  CommandUnderstandingSurfaceAdapter,
  ProviderClassifyCallbacks,
  ProviderUnderstandDeps,
  BuildProviderClassifyCallbacksOpts,
  BuildProviderClassifierContextOpts,
} from './command-understanding-adapter.types.js';
import { PROVIDER_COMMAND_UNDERSTANDING_SURFACE } from './command-understanding-adapter.types.js';
import type { PipelineUnderstandInput } from './command-understanding.types.js';

export function buildProviderClassifyCallbacks(
  opts: BuildProviderClassifyCallbacksOpts,
): ProviderClassifyCallbacks {
  const resolveContext = (
    pipelineContext: BuildProviderClassifierContextOpts['pipelineContext'],
  ) =>
    buildProviderClassifierContext({
      providerName: opts.providerName,
      viewMode: opts.viewMode,
      sessionContext: opts.sessionContext,
      pipelineContext,
    });

  return {
    classify: (pipelineContext) =>
      opts.classify(
        pipelineContext.normalizedPrompt,
        resolveContext(pipelineContext),
      ),
    narrowReclassify: (shortlist, pipelineContext) =>
      opts.classify(
        pipelineContext.normalizedPrompt,
        resolveContext(pipelineContext),
        shortlist,
      ),
  };
}

/** Maps provider deps to generic pipeline input (pipe-1.12.2). */
export function buildProviderUnderstandInput(
  deps: ProviderUnderstandDeps,
): PipelineUnderstandInput {
  const confidenceThresholds = resolveConfidenceGateThresholds(
    deps.confidence,
    deps.sessionConfidenceHigh,
  );
  const classifyCallbacks = buildProviderClassifyCallbacks({
    providerName: deps.providerName,
    viewMode: deps.viewMode,
    sessionContext: deps.sessionContext,
    classify: deps.classify,
  });

  return {
    businessId: deps.businessId,
    userId: deps.userId,
    effectivePrompt: deps.effectivePrompt,
    surface: PROVIDER_COMMAND_UNDERSTANDING_SURFACE,
    confidenceLow: confidenceThresholds.low,
    confidenceHigh: confidenceThresholds.high,
    lastAction: deps.lastAction,
    employees: deps.employees,
    sessionContext: deps.sessionContext,
    promptNorm: deps.promptNorm,
    ...classifyCallbacks,
  };
}

@Injectable()
export class ProviderCommandUnderstandingAdapter
  implements CommandUnderstandingSurfaceAdapter<ProviderUnderstandDeps>
{
  readonly surface = PROVIDER_COMMAND_UNDERSTANDING_SURFACE;

  constructor(
    private readonly understandingPipeline: CommandUnderstandingPipelineService,
  ) {}

  buildInput(deps: ProviderUnderstandDeps): PipelineUnderstandInput {
    return buildProviderUnderstandInput(deps);
  }

  understand(deps: ProviderUnderstandDeps) {
    return this.understandingPipeline.understand(this.buildInput(deps));
  }
}
