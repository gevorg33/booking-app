/** Shared AI command / gateway types (dashboard + provider surfaces). */

import type { AiPageContext } from '@/lib/ai-orchestration';

export type AiSurface = 'dashboard' | 'provider';

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
  status?: string;
  plan?: unknown;
}

export interface AiCommandResult {
  success: boolean;
  action?: string;
  summary?: string;
  details?: AiCommandDetails;
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
