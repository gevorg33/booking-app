import type { CommandSurface } from './ai-command-registry.types.js';
import type {
  ClassifiedIntent,
  ClassifierCatalog,
  ComplexityRouteLlm,
  ComplexityRouteResolver,
} from './ai-command-routing.util.js';
import type { ComplexityRoute } from './command-complexity-router.service.js';
import type { AiConfidenceThresholds } from './ai-settings.types.js';
import type { PromptNormalizationResult } from './ai-prompt-normalization.service.js';
import type {
  PipelineContext,
  PipelineUnderstandInput,
  PipelineUnderstandResult,
} from './command-understanding.types.js';
import type { Employee } from '../employee/entities/employee.entity.js';

/** pipe-1.12.1 — dashboard surface adapter for the understand pipeline. */
export const DASHBOARD_UNDERSTANDING_ADAPTER_PIPE_MARKER = 'pipe-1.12.1';

/** pipe-1.12.2 — provider mobile surface adapter for the understand pipeline. */
export const PROVIDER_UNDERSTANDING_ADAPTER_PIPE_MARKER = 'pipe-1.12.2';

export const DASHBOARD_COMMAND_UNDERSTANDING_SURFACE =
  'dashboard' as const satisfies CommandSurface;

export const PROVIDER_COMMAND_UNDERSTANDING_SURFACE =
  'provider' as const satisfies CommandSurface;

/** Shared contract for surface-specific understand adapters (pipe-1.12). */
export interface CommandUnderstandingSurfaceAdapter<TDeps> {
  readonly surface: CommandSurface;
  understand(deps: TDeps): Promise<PipelineUnderstandResult>;
}

export type DashboardClassifyFn = (
  normalizedPrompt: string,
  classifierContext: string,
  narrowShortlist?: readonly string[],
) => Promise<ClassifiedIntent | null>;

/** Inputs required to run the dashboard understand pipeline via the adapter. */
export type DashboardUnderstandDeps = {
  businessId: string;
  userId?: string;
  effectivePrompt: string;
  timeZone: string;
  catalog: ClassifierCatalog;
  confidence: AiConfidenceThresholds;
  /** A/B `_confidenceHigh` override from ai-gateway session context. */
  sessionConfidenceHigh?: number;
  lastAction?: string;
  sessionContext?: Record<string, unknown>;
  promptNorm?: PromptNormalizationResult;
  resolveRoute?: () => Promise<ComplexityRoute>;
  classify: DashboardClassifyFn;
};

export type DashboardResolveRouteDeps = {
  businessId: string;
  classifierPrompt: string;
  employees: Employee[];
  router: ComplexityRouteResolver;
  intelligence: ComplexityRouteLlm;
  presetRoute?: ComplexityRoute;
};

export type DashboardClassifyCallbacks = Pick<
  PipelineUnderstandInput,
  'classify' | 'narrowReclassify'
>;

export type BuildDashboardClassifyCallbacksOpts = {
  catalog: ClassifierCatalog;
  timeZone: string;
  classify: DashboardClassifyFn;
};

export type BuildDashboardClassifierContextOpts = {
  catalog: ClassifierCatalog;
  timeZone: string;
  pipelineContext: PipelineContext;
};

export type ProviderClassifyFn = (
  normalizedPrompt: string,
  classifierContext: string,
  narrowShortlist?: readonly string[],
) => Promise<ClassifiedIntent | null>;

/** Inputs required to run the provider understand pipeline via the adapter. */
export type ProviderUnderstandDeps = {
  businessId: string;
  userId: string;
  effectivePrompt: string;
  providerName: string;
  viewMode: string;
  confidence: AiConfidenceThresholds;
  sessionConfidenceHigh?: number;
  lastAction?: string;
  sessionContext?: Record<string, unknown>;
  employees?: Array<{ id: string; name: string }>;
  promptNorm?: PromptNormalizationResult;
  classify: ProviderClassifyFn;
};

export type ProviderClassifyCallbacks = Pick<
  PipelineUnderstandInput,
  'classify' | 'narrowReclassify'
>;

export type BuildProviderClassifyCallbacksOpts = {
  providerName: string;
  viewMode: string;
  sessionContext?: Record<string, unknown>;
  classify: ProviderClassifyFn;
};

export type BuildProviderClassifierContextOpts = {
  providerName: string;
  viewMode: string;
  sessionContext?: Record<string, unknown>;
  pipelineContext: PipelineContext;
};

/** pipe-1.12.3 — customer mobile surface adapter for the understand pipeline. */
export const CUSTOMER_UNDERSTANDING_ADAPTER_PIPE_MARKER = 'pipe-1.12.3';

export const CUSTOMER_COMMAND_UNDERSTANDING_SURFACE =
  'customer' as const satisfies CommandSurface;

export type CustomerClassifyFn = (
  normalizedPrompt: string,
  classifierSystemContext: string,
  narrowShortlist?: readonly string[],
) => Promise<ClassifiedIntent | null>;

/** Inputs required to run the customer understand pipeline via the adapter. */
export type CustomerUnderstandDeps = {
  businessId: string;
  effectivePrompt: string;
  confidence: AiConfidenceThresholds;
  sessionConfidenceHigh?: number;
  lastAction?: string;
  sessionContext?: Record<string, unknown>;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  promptNorm?: PromptNormalizationResult;
  classify: CustomerClassifyFn;
};

export type CustomerClassifyCallbacks = Pick<
  PipelineUnderstandInput,
  'classify' | 'narrowReclassify'
>;

export type BuildCustomerClassifyCallbacksOpts = {
  sessionContext?: Record<string, unknown>;
  classify: CustomerClassifyFn;
};

export type BuildCustomerClassifierContextOpts = {
  sessionContext?: Record<string, unknown>;
  pipelineContext: PipelineContext;
  narrowShortlist?: readonly string[];
};

/** pipe-1.12.4 — public booking surface adapter for the understand pipeline. */
export const PUBLIC_UNDERSTANDING_ADAPTER_PIPE_MARKER = 'pipe-1.12.4';

export const PUBLIC_COMMAND_UNDERSTANDING_SURFACE =
  'public' as const satisfies CommandSurface;

export type PublicClassifyFn = (
  normalizedPrompt: string,
  classifierSystemContext: string,
  narrowShortlist?: readonly string[],
) => Promise<ClassifiedIntent | null>;

/** Inputs required to run the public understand pipeline via the adapter. */
export type PublicUnderstandDeps = {
  businessId: string;
  effectivePrompt: string;
  confidence: AiConfidenceThresholds;
  sessionConfidenceHigh?: number;
  lastAction?: string;
  sessionContext?: Record<string, unknown>;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  locale: string;
  businessContextBlock: string;
  employees?: Array<{ id: string; name: string }>;
  promptNorm?: PromptNormalizationResult;
  classify: PublicClassifyFn;
};

export type PublicClassifyCallbacks = Pick<
  PipelineUnderstandInput,
  'classify' | 'narrowReclassify'
>;

export type BuildPublicClassifyCallbacksOpts = {
  locale: string;
  businessContextBlock: string;
  classify: PublicClassifyFn;
};

export type BuildPublicClassifierContextOpts = {
  locale: string;
  businessContextBlock: string;
  pipelineContext: PipelineContext;
  narrowShortlist?: readonly string[];
};
