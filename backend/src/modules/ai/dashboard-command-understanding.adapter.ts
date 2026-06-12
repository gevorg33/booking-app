import { Injectable } from '@nestjs/common';
import {
  appendMultilingualClassifierContext,
  buildClassifierCatalogContext,
} from './ai-command-routing.util.js';
import { resolveConfidenceGateThresholds } from './confidence-gate.util.js';
import { CommandUnderstandingPipelineService } from './command-understanding-pipeline.service.js';
import {
  buildDashboardResolveRoute,
  createMemoizedDashboardResolveRoute,
} from './command-understanding-dashboard.util.js';
import type {
  CommandUnderstandingSurfaceAdapter,
  DashboardClassifyCallbacks,
  DashboardResolveRouteDeps,
  DashboardUnderstandDeps,
  BuildDashboardClassifierContextOpts,
  BuildDashboardClassifyCallbacksOpts,
} from './command-understanding-adapter.types.js';
import {
  DASHBOARD_COMMAND_UNDERSTANDING_SURFACE,
} from './command-understanding-adapter.types.js';
import type { PipelineUnderstandInput } from './command-understanding.types.js';

export function buildDashboardClassifierContext(
  opts: BuildDashboardClassifierContextOpts,
): string {
  const catalogContext = buildClassifierCatalogContext(
    opts.catalog,
    opts.timeZone,
  );
  return appendMultilingualClassifierContext(
    catalogContext,
    opts.pipelineContext.classifierContext,
  );
}

/** Wires dashboard classify + narrow re-classify with catalog + HY/RU context (pipe-1.12.1). */
export function buildDashboardClassifyCallbacks(
  opts: BuildDashboardClassifyCallbacksOpts,
): DashboardClassifyCallbacks {
  const resolveContext = (pipelineContext: BuildDashboardClassifierContextOpts['pipelineContext']) =>
    buildDashboardClassifierContext({
      catalog: opts.catalog,
      timeZone: opts.timeZone,
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

/** Maps dashboard deps to generic pipeline input (pipe-1.12.1). */
export function buildDashboardUnderstandInput(
  deps: DashboardUnderstandDeps,
): PipelineUnderstandInput {
  const { employees, customers } = deps.catalog;
  const confidenceThresholds = resolveConfidenceGateThresholds(
    deps.confidence,
    deps.sessionConfidenceHigh,
  );
  const classifyCallbacks = buildDashboardClassifyCallbacks({
    catalog: deps.catalog,
    timeZone: deps.timeZone,
    classify: deps.classify,
  });

  return {
    businessId: deps.businessId,
    userId: deps.userId,
    effectivePrompt: deps.effectivePrompt,
    surface: DASHBOARD_COMMAND_UNDERSTANDING_SURFACE,
    timeZone: deps.timeZone,
    confidenceLow: confidenceThresholds.low,
    confidenceHigh: confidenceThresholds.high,
    lastAction: deps.lastAction,
    employees: employees.map((employee) => ({
      id: employee.id,
      name: employee.name,
    })),
    customers: customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
    })),
    sessionContext: deps.sessionContext,
    promptNorm: deps.promptNorm,
    resolveRoute: deps.resolveRoute,
    ...classifyCallbacks,
  };
}

@Injectable()
export class DashboardCommandUnderstandingAdapter
  implements CommandUnderstandingSurfaceAdapter<DashboardUnderstandDeps>
{
  readonly surface = DASHBOARD_COMMAND_UNDERSTANDING_SURFACE;

  constructor(
    private readonly understandingPipeline: CommandUnderstandingPipelineService,
  ) {}

  buildInput(deps: DashboardUnderstandDeps): PipelineUnderstandInput {
    return buildDashboardUnderstandInput(deps);
  }

  understand(deps: DashboardUnderstandDeps) {
    return this.understandingPipeline.understand(this.buildInput(deps));
  }

  createResolveRoute(deps: DashboardResolveRouteDeps) {
    return createMemoizedDashboardResolveRoute(deps);
  }

  buildResolveRoute(deps: DashboardResolveRouteDeps) {
    return buildDashboardResolveRoute(deps);
  }
}
