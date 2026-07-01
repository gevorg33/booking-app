import { Injectable } from '@nestjs/common';
import { resolveConfidenceGateThresholds } from './confidence-gate.util.js';
import { CommandUnderstandingPipelineService } from './command-understanding-pipeline.service.js';
import { buildPublicClassifierContext } from './command-understanding-public.util.js';
import type {
  CommandUnderstandingSurfaceAdapter,
  PublicClassifyCallbacks,
  PublicUnderstandDeps,
  BuildPublicClassifyCallbacksOpts,
  BuildPublicClassifierContextOpts,
} from './command-understanding-adapter.types.js';
import { PUBLIC_COMMAND_UNDERSTANDING_SURFACE } from './command-understanding-adapter.types.js';
import type { PipelineUnderstandInput } from './command-understanding.types.js';

export function buildPublicClassifyCallbacks(
  opts: BuildPublicClassifyCallbacksOpts,
): PublicClassifyCallbacks {
  const resolveContext = (
    pipelineContext: BuildPublicClassifierContextOpts['pipelineContext'],
    narrowShortlist?: readonly string[],
  ) =>
    buildPublicClassifierContext({
      locale: opts.locale,
      businessContextBlock: opts.businessContextBlock,
      pipelineContext,
      narrowShortlist,
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
        resolveContext(pipelineContext, shortlist),
        shortlist,
      ),
  };
}

/** Maps public deps to generic pipeline input (pipe-1.12.4). */
export function buildPublicUnderstandInput(
  deps: PublicUnderstandDeps,
): PipelineUnderstandInput {
  const confidenceThresholds = resolveConfidenceGateThresholds(
    deps.confidence,
    deps.sessionConfidenceHigh,
  );
  const classifyCallbacks = buildPublicClassifyCallbacks({
    locale: deps.locale,
    businessContextBlock: deps.businessContextBlock,
    classify: deps.classify,
  });

  return {
    businessId: deps.businessId,
    effectivePrompt: deps.effectivePrompt,
    surface: PUBLIC_COMMAND_UNDERSTANDING_SURFACE,
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
export class PublicCommandUnderstandingAdapter implements CommandUnderstandingSurfaceAdapter<PublicUnderstandDeps> {
  readonly surface = PUBLIC_COMMAND_UNDERSTANDING_SURFACE;

  constructor(
    private readonly understandingPipeline: CommandUnderstandingPipelineService,
  ) {}

  buildInput(deps: PublicUnderstandDeps): PipelineUnderstandInput {
    return buildPublicUnderstandInput(deps);
  }

  understand(deps: PublicUnderstandDeps) {
    return this.understandingPipeline.understand(this.buildInput(deps));
  }
}
