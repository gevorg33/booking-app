import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { ScheduleTemplate } from '../schedule/entities/schedule-template.entity.js';
import { DateRange } from './ai-orchestration.helpers.js';

export interface ClassifiedCommand {
  action: string;
  params: Record<string, any>;
  reasoning: string;
}

export interface BusinessCatalog {
  employees: Employee[];
  services: Service[];
  customers: Customer[];
  templates: ScheduleTemplate[];
}

export interface ResolvedEntities {
  employee?: Employee;
  employees: Employee[];
  service?: Service;
  services: Service[];
  customer?: Customer;
  customers?: Customer[];
  template?: ScheduleTemplate;
  templates?: ScheduleTemplate[];
  dateRange?: DateRange | null;
  employeeId?: string;
}

export interface ResolvedCommand extends ClassifiedCommand {
  prompt: string;
  businessId: string;
  entities: ResolvedEntities;
  /** Params enriched with resolved IDs where applicable */
  enrichedParams: Record<string, any>;
}

export interface ValidationIssue {
  field: string;
  label: string;
  message: string;
  example?: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

export type PipelineStage =
  /** pipe-1 understand phase */
  | 'normalize'
  | 'fast_heuristics'
  /**
   * e2e-bug.392 — the §15 planner contributing a routing candidate.
   *
   * Distinct from the completion-phase `plan` stage below, which is where an
   * already-chosen action gets its execution plan. This one is upstream and
   * decides *which* action, gated per domain by `AI_PLANNER_EXECUTE_DOMAINS`.
   */
  | 'planner'
  | 'classify'
  | 'confidence_gate'
  | 'semantic_match'
  | 'rerank'
  | 'narrow_reclassify'
  | 'rescue'
  | 'self_verify'
  | 'structural_enrich'
  /** completion + execution */
  | 'resolve'
  | 'validate'
  | 'plan'
  | 'execute'
  | 'clarify'
  | 'telemetry'
  | 'guide_handoff';

export interface PipelineTrace {
  stage: PipelineStage;
  action: string;
  at: string;
  detail?: string;
}

/** Deep link target for a guide step or whole response (ai-guide-1.0.4). */
export interface GuideNavigateTarget {
  path: string;
  query?: Record<string, string>;
  hash?: string;
}

/** One numbered step in a product guide response. */
export interface GuideStep {
  title: string;
  body: string;
  /** Shorter spoken copy for TTS (ai-guide-1.4.4). */
  voiceSummary?: string;
  navigate?: GuideNavigateTarget;
}

/** Optional handoff to an existing mutate/read intent after the guide. */
export interface GuideRelatedAction {
  action: string;
  label: string;
  params?: Record<string, unknown>;
  /** NL prompt for command-bar “Do this for me” execution (ai-guide-1.2.5). */
  prompt?: string;
}

/** Corpus / playbook citation backing a guide answer. */
export interface GuideSourceRef {
  topicId: string;
  label?: string;
  kind?: 'topic' | 'playbook' | 'i18n' | 'static';
}

/** Optional help-center / Zendesk article refs for a guide topic (ai-guide-1.7.1). */
export interface GuideHelpArticleRef {
  /** Dashboard contextual help topic id (`help-center-topics.ts`). */
  helpCenterTopicId?: string;
  /** Zendesk Help Center article id (numeric string). */
  zendeskArticleId?: string;
}

/** Multi-turn guide session snapshot returned with guide responses (ai-guide-1.8.2). */
export interface GuideSessionState {
  guideFlowId: string;
  guideStepIndex: number;
  completedSteps: number[];
  totalSteps: number;
}

/**
 * Shared product-guide payload for dashboard, provider, customer, and public assistants (ai-guide-1.0.4).
 * Handlers set `CommandResult.guide`; UI renders summary + steps + optional navigate / relatedActions.
 */
export interface GuideResponse {
  summary: string;
  /** Shorter spoken summary for TTS (ai-guide-1.4.4). */
  voiceSummary?: string;
  steps: GuideStep[];
  navigate?: GuideNavigateTarget;
  relatedActions?: GuideRelatedAction[];
  topicId?: string;
  sources?: GuideSourceRef[];
  /** Optional Zendesk / in-app help-center article ids (ai-guide-1.7.1). */
  helpArticle?: GuideHelpArticleRef;
  /** Still stuck? support handoff with non-PII snapshot (ai-guide-1.7.2). */
  supportHandoff?: import('./guide/guide-support-handoff.types.js').GuideSupportHandoff;
  /** Active multi-turn walkthrough position (ai-guide-1.8.2). */
  guideSession?: GuideSessionState;
}

export interface CommandResult {
  success: boolean;
  action: string;
  summary: string;
  details: Record<string, any>;
  /** Populated for product-guide intents (`explain_app_feature`, `guide_user_flow`, …). */
  guide?: GuideResponse;
}
