import type { Employee } from '../employee/entities/employee.entity.js';
import type { ComplexityRoute } from './command-complexity-router.service.js';
import {
  resolveMergedComplexityRoute,
  type ComplexityRouteLlm,
  type ComplexityRouteResolver,
} from './ai-command-routing.util.js';

export type DashboardResolveRouteOpts = {
  businessId: string;
  classifierPrompt: string;
  employees: Employee[];
  router: ComplexityRouteResolver;
  intelligence: ComplexityRouteLlm;
  presetRoute?: ComplexityRoute;
};

/** Builds parallel complexity routing for dashboard understand pipeline (pipe-1.3.1). */
export function buildDashboardResolveRoute(
  opts: DashboardResolveRouteOpts,
): () => Promise<ComplexityRoute> {
  return () =>
    resolveMergedComplexityRoute(
      opts.businessId,
      opts.classifierPrompt,
      opts.employees,
      opts.router,
      opts.intelligence,
      opts.presetRoute,
    );
}

/**
 * Memoized route resolver — graph pre-routing and pipeline classify share one LLM call.
 */
export function createMemoizedDashboardResolveRoute(
  opts: DashboardResolveRouteOpts,
): () => Promise<ComplexityRoute> {
  let promise: Promise<ComplexityRoute> | undefined;
  return () => {
    promise ??= resolveMergedComplexityRoute(
      opts.businessId,
      opts.classifierPrompt,
      opts.employees,
      opts.router,
      opts.intelligence,
      opts.presetRoute,
    );
    return promise;
  };
}
