export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REQUIRES_APPROVAL = 'requires_approval',
}

export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  COMPENSATING = 'compensating',
  COMPENSATED = 'compensated',
}

export interface WorkflowStep {
  id: string;
  name: string;
  action: string;
  params: Record<string, any>;
  dependsOn: string[];
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
  compensationAction?: string;
  compensationParams?: Record<string, any>;
  timeout?: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  businessId: string;
  steps: WorkflowStep[];
  triggeredBy: string;
  context: Record<string, any>;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  status: WorkflowStatus;
  steps: {
    stepId: string;
    status: StepStatus;
    result?: any;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
  }[];
  startedAt: Date;
  completedAt?: Date;
}
