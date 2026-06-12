import type { ComplexityRoute } from './command-complexity-router.service.js';
import type { Customer } from '../customer/entities/customer.entity.js';
import type { Employee } from '../employee/entities/employee.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { ScheduleTemplate } from '../schedule/entities/schedule-template.entity.js';
import { todayDisplay } from '../../common/utils/date-format.util.js';

export type ClassifiedIntent = {
  action: string;
  params: any;
  reasoning: string;
  confidence?: number;
};

export interface ClassifierCatalog {
  employees: Employee[];
  services: Service[];
  customers: Customer[];
  templates: ScheduleTemplate[];
}

export interface ComplexityRouteResolver {
  routeDeterministic(
    prompt: string,
    employees: Array<{ id: string; name: string }>,
  ): ComplexityRoute;
  mergeRoutes(
    llmRoute: ComplexityRoute | null | undefined,
    deterministic: ComplexityRoute,
  ): ComplexityRoute;
}

export interface ComplexityRouteLlm {
  routeComplexity(
    businessId: string,
    prompt: string,
    surface: 'dashboard' | 'provider_mobile',
  ): Promise<ComplexityRoute>;
}

/** Catalog block injected into classify_intent system context. */
export function buildClassifierCatalogContext(
  catalog: ClassifierCatalog,
  timeZone: string,
): string {
  const { employees, services, customers, templates } = catalog;
  return `Current date: ${todayDisplay(timeZone)} (format DD/MM/YYYY, timezone: ${timeZone}, times in 24h HH:mm)
Available employees: ${employees.map((e) => `${e.name} (id: ${e.id})`).join(', ')}
Available services: ${services.map((s) => `${s.name} (id: ${s.id})`).join(', ')}
Available customers: ${customers.map((c) => `${c.name} (id: ${c.id})`).join(', ')}
Schedule templates: ${templates.map((t) => t.name).join(', ') || 'none'}`;
}

export function appendMultilingualClassifierContext(
  catalogContext: string,
  multilingualHint: string | null,
): string {
  return multilingualHint
    ? `${catalogContext}\n${multilingualHint}`
    : catalogContext;
}

/** Merges preset, LLM, and deterministic complexity routes. */
export async function resolveMergedComplexityRoute(
  businessId: string,
  classifierPrompt: string,
  employees: Employee[],
  router: ComplexityRouteResolver,
  intelligence: ComplexityRouteLlm,
  preset?: ComplexityRoute,
): Promise<ComplexityRoute> {
  const deterministic = router.routeDeterministic(
    classifierPrompt,
    employees.map((e) => ({ id: e.id, name: e.name })),
  );
  if (preset?.tier) {
    return router.mergeRoutes(preset, deterministic);
  }
  // ai-i10: simple read-only prompts use rules only — skip complexity_route LLM
  if (deterministic.tier === 'read_only') {
    return deterministic;
  }
  const llmRoute = await intelligence.routeComplexity(
    businessId,
    classifierPrompt,
    'dashboard',
  );
  return router.mergeRoutes(llmRoute, deterministic);
}

/** Runs complexity routing and intent classification concurrently. */
export async function runParallelRouteAndClassification<T>(opts: {
  resolveRoute: () => Promise<ComplexityRoute>;
  classify: () => Promise<T | null>;
}): Promise<{ route: ComplexityRoute; classification: T | null }> {
  const [route, classification] = await Promise.all([
    opts.resolveRoute(),
    opts.classify(),
  ]);
  return { route, classification };
}

/** Uses a pre-classified intent when provided; otherwise calls the classifier. */
export async function resolveParsedIntent(opts: {
  preclassified?: ClassifiedIntent | null;
  classify: () => Promise<ClassifiedIntent | null>;
}): Promise<ClassifiedIntent | null> {
  if (opts.preclassified != null) {
    return opts.preclassified;
  }
  return opts.classify();
}
