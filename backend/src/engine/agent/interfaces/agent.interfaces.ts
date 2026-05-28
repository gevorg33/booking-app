export enum AgentType {
  SCHEDULING_OPTIMIZATION = 'scheduling_optimization',
  CANCELLATION_RECOVERY = 'cancellation_recovery',
  CONFLICT_RESOLUTION = 'conflict_resolution',
  UTILIZATION_OPTIMIZATION = 'utilization_optimization',
}

export enum PlanStatus {
  DRAFT = 'draft',
  PENDING_VALIDATION = 'pending_validation',
  VALIDATED = 'validated',
  REQUIRES_APPROVAL = 'requires_approval',
  REJECTED = 'rejected',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface AgentPlanStep {
  id: string;
  action: string;
  description: string;
  params: Record<string, any>;
  dependsOn: string[];
  estimatedImpact?: string;
}

export interface AgentPlan {
  id: string;
  agentType: AgentType;
  businessId: string;
  intent: string;
  reasoning: string;
  steps: AgentPlanStep[];
  constraints: string[];
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  status: PlanStatus;
  createdAt: Date;
}

export interface AgentContext {
  businessId: string;
  dateRange?: { start: Date; end: Date };
  employees?: any[];
  services?: any[];
  bookings?: any[];
  schedules?: any[];
  templates?: any[];
  blockSchedules?: any[];
  constraints?: string[];
}

export interface AgentResult {
  plan: AgentPlan;
  executionMode: 'suggestion' | 'requires_approval' | 'autonomous';
}
