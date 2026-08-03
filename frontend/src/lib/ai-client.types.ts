/** Shared AI command / gateway types (dashboard + provider surfaces). */

import type { AiPageContext } from '@/lib/ai-orchestration';

export type AiSurface = 'dashboard' | 'provider';

export type AssistantMode = 'guide' | 'act';

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiClarifyIssue {
  field: string;
  label: string;
  message: string;
  example?: string;
}

export interface AiPlanDiffStep {
  id: string;
  action: string;
  description: string;
  impact: string;
  estimatedImpact?: string;
}

export interface AiPolicyPreview {
  decision: string;
  riskLevel: string;
  violations: string[];
  reasons: string[];
}

export interface AiPolicyExplain {
  headline: string;
  explanation: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AiWizardStep extends AiPlanDiffStep {
  index: number;
  status: 'pending' | 'current' | 'done';
}

export interface AiExecutionTimelineEntry {
  stepId: string;
  description?: string;
  status: string;
  error?: string;
  canRetry?: boolean;
}

export interface AiAvailableProviderRow {
  id?: string;
  name?: string;
  role?: string;
  earliestDateKey?: string;
  earliestStartTime?: string;
  previewTimes?: string[];
  matchedServiceName?: string;
  openSlots?: Array<{ start: string; end: string }>;
  scheduledBlocks?: Array<{ start: string; end: string }>;
}

export interface AiConflictResolutionData {
  conflicts?: Array<{
    id?: string;
    employeeName?: string;
    overlapMinutes?: number;
    bookings?: Array<{
      id: string;
      customerName: string;
      serviceName?: string;
      startTime: string;
      endTime: string;
    }>;
    fix?: { type: string; bookingId: string; startTime: string } | null;
  }>;
  resolutions?: Array<{
    id: string;
    employeeName?: string;
    overlapMinutes?: number;
    bookings?: Array<{
      id: string;
      customer: string;
      service?: string;
      startTime: string;
      endTime: string;
    }>;
    action: string;
    fix?: { type: string; bookingId: string; startTime: string } | null;
  }>;
}

export interface AiCancellationRecoveryData {
  freedSlots?: Array<{
    bookingId: string;
    employeeName?: string;
    serviceName?: string;
    customerName?: string;
    startTime: string;
    endTime: string;
  }>;
  candidates?: Array<{
    customerName: string;
    source: string;
    score: number;
    suggestion: string;
  }>;
  proposals?: Array<{
    id: string;
    slot: NonNullable<AiCancellationRecoveryData['freedSlots']>[number];
    recommendedCustomer?: { customerName: string; source: string; score: number } | null;
  }>;
}

export interface AiAgentTaskPreview {
  planDiff?: AiPlanDiffStep[];
  policyPreview?: AiPolicyPreview;
  policyExplain?: AiPolicyExplain;
  executionTimeline?: AiExecutionTimelineEntry[];
  conflictResolution?: AiConflictResolutionData;
  cancellationRecovery?: AiCancellationRecoveryData;
}

export interface AiCommandSessionContext extends Partial<AiPageContext> {
  lastAction?: string | null;
  lastMetric?: string | null;
  availableProviders?: string[];
  /** Multi-turn guide walkthrough (ai-guide-1.8.2). */
  guideFlowId?: string | null;
  guideStepIndex?: number | null;
  completedSteps?: number[] | null;
  /** e2e-bug.304 — mid-compound clarify resume token. */
  compoundResumePlans?: unknown[] | null;
  compoundResumeSubIntents?: unknown[] | null;
  compoundStepIndex?: number | null;
  compoundActions?: string[] | null;
  compoundConfirmationPrompt?: string | null;
}

export interface AiGuideSessionState {
  guideFlowId: string;
  guideStepIndex: number;
  completedSteps: number[];
  totalSteps: number;
}

export interface AiGuideNavigateTarget {
  path: string;
  query?: Record<string, string>;
  hash?: string;
}

export interface AiGuideStep {
  title: string;
  body: string;
  navigate?: AiGuideNavigateTarget;
}

export interface AiGuideRelatedAction {
  action: string;
  label: string;
  params?: Record<string, unknown>;
  /** NL prompt for command-bar execution (ai-guide-1.2.5). */
  prompt?: string;
  /** Legacy alias — prefer `action`. */
  intent?: string;
}

/** Direct dispatch payload for product-guide “Do this for me” (ai-guide-1.2.5). */
export interface AiGuideHandoffDispatch {
  action: string;
  params?: Record<string, unknown>;
  source?: 'product_guide';
}

export interface AiGuideSourceRef {
  topicId: string;
  label?: string;
  kind?: 'topic' | 'playbook' | 'i18n' | 'static';
}

export interface AiGuideHelpArticleRef {
  helpCenterTopicId?: string;
  zendeskArticleId?: string;
}

export interface AiGuideSupportSnapshot {
  surface: 'dashboard' | 'provider' | 'customer' | 'public';
  route?: string;
  topicId?: string;
  locale: string;
}

export interface AiGuideSupportHandoff {
  action: 'create_support_ticket';
  label: string;
  snapshot: AiGuideSupportSnapshot;
  ticket: {
    subject: string;
    body: string;
    tags: readonly string[];
  };
}

/** Product-guide payload from dashboard AI command API (ai-guide-1.0.4). */
export interface AiGuideResponse {
  summary: string;
  steps: AiGuideStep[];
  navigate?: AiGuideNavigateTarget;
  relatedActions?: AiGuideRelatedAction[];
  topicId?: string;
  sources?: AiGuideSourceRef[];
  helpArticle?: AiGuideHelpArticleRef;
  supportHandoff?: AiGuideSupportHandoff;
  /** Active multi-turn walkthrough position (ai-guide-1.8.2). */
  guideSession?: AiGuideSessionState;
}

export interface AiCommandDetails {
  needsClarification?: boolean;
  missing?: AiClarifyIssue[];
  availableProviders?: string[];
  providers?: AiAvailableProviderRow[];
  executionTimeline?: AiExecutionTimelineEntry[];
  taskId?: string;
  requiresExecutionConfirmation?: boolean;
  requiresApproval?: boolean;
  wizardMode?: boolean;
  wizardSteps?: AiWizardStep[];
  planDiff?: AiPlanDiffStep[];
  policyPreview?: AiPolicyPreview;
  policyExplain?: AiPolicyExplain;
  confirmationPrompt?: string;
  /** Round-trip direct handoff on confirm retry (ai-guide-1.2.5). */
  guideHandoff?: AiGuideHandoffDispatch;
  directGuideHandoff?: boolean;
  response?: unknown;
  conflictResolution?: AiConflictResolutionData;
  cancellationRecovery?: AiCancellationRecoveryData;
  sessionContext?: AiCommandSessionContext;
  employee?: string;
  date?: string;
  serviceName?: string;
  params?: Record<string, unknown>;
  metric?: unknown;
  appointmentMetric?: unknown;
  bookingMetric?: unknown;
  customerMetric?: unknown;
  navigate?: { path: string; query?: Record<string, string>; hash?: string };
  guideFlowId?: string | number;
  guideStepIndex?: number;
  completedSteps?: number[];
  /** e2e-bug.304 */
  compoundResumePlans?: unknown[];
  compoundResumeSubIntents?: unknown[];
  compoundStepIndex?: number;
  compoundActions?: string[];
  compoundStep?: string;
  decomposed?: boolean;
  status?: string;
  plan?: unknown;
}

export interface AiCommandResult {
  success: boolean;
  action?: string;
  summary?: string;
  details?: AiCommandDetails;
  guide?: AiGuideResponse;
}

export interface AiSuggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  prompt: string;
  category: string;
  intentHint?: string;
}

export interface AiCapabilities {
  surface: AiSurface;
  accessTier: string;
  planTierId: string;
  allowedIntents: readonly string[];
  planDeniedIntents: readonly string[];
  hints: string;
  usage?: {
    providerSeats: number;
    aiCommandsThisMonth: number;
  };
  atAiLimit?: boolean;
  aiUsageWarning?: boolean;
}
