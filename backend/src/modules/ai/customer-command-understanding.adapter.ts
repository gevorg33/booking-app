import { Injectable } from '@nestjs/common';
import { resolveConfidenceGateThresholds } from './confidence-gate.util.js';
import { CommandUnderstandingPipelineService } from './command-understanding-pipeline.service.js';
import { buildCustomerClassifierContext } from './command-understanding-customer.util.js';
import type {
  CommandUnderstandingSurfaceAdapter,
  CustomerClassifyCallbacks,
  CustomerUnderstandDeps,
  BuildCustomerClassifyCallbacksOpts,
  BuildCustomerClassifierContextOpts,
} from './command-understanding-adapter.types.js';
import { CUSTOMER_COMMAND_UNDERSTANDING_SURFACE } from './command-understanding-adapter.types.js';
import type { PipelineUnderstandInput } from './command-understanding.types.js';

export function buildCustomerClassifyCallbacks(
  opts: BuildCustomerClassifyCallbacksOpts,
): CustomerClassifyCallbacks {
  const resolveContext = (
    pipelineContext: BuildCustomerClassifierContextOpts['pipelineContext'],
    narrowShortlist?: readonly string[],
  ) =>
    buildCustomerClassifierContext({
      sessionContext: opts.sessionContext,
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

/** Maps customer deps to generic pipeline input (pipe-1.12.3). */
export function buildCustomerUnderstandInput(
  deps: CustomerUnderstandDeps,
): PipelineUnderstandInput {
  const confidenceThresholds = resolveConfidenceGateThresholds(
    deps.confidence,
    deps.sessionConfidenceHigh,
  );
  const classifyCallbacks = buildCustomerClassifyCallbacks({
    sessionContext: deps.sessionContext,
    classify: deps.classify,
  });

  return {
    businessId: deps.businessId,
    effectivePrompt: deps.effectivePrompt,
    surface: CUSTOMER_COMMAND_UNDERSTANDING_SURFACE,
    confidenceLow: confidenceThresholds.low,
    confidenceHigh: confidenceThresholds.high,
    lastAction: deps.lastAction,
    sessionContext: deps.sessionContext,
    promptNorm: deps.promptNorm,
    ...classifyCallbacks,
  };
}

@Injectable()
export class CustomerCommandUnderstandingAdapter implements CommandUnderstandingSurfaceAdapter<CustomerUnderstandDeps> {
  readonly surface = CUSTOMER_COMMAND_UNDERSTANDING_SURFACE;

  constructor(
    private readonly understandingPipeline: CommandUnderstandingPipelineService,
  ) {}

  buildInput(deps: CustomerUnderstandDeps): PipelineUnderstandInput {
    return buildCustomerUnderstandInput(deps);
  }

  understand(deps: CustomerUnderstandDeps) {
    return this.understandingPipeline.understand(this.buildInput(deps));
  }
}
