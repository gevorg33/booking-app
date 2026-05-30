import type { AgentPlanStep } from '../../agent/interfaces/agent.interfaces.js';

export type BookingToolCategory = 'read' | 'propose';

export interface BookingToolRunContext {
  businessId: string;
  userId?: string;
  timeZone: string;
  toolContext: Record<string, unknown>;
  stepCounter: number;
  proposals: AgentPlanStep[];
  /** Last react step id per workflow action (for chaining read tools). */
  lastStepByAction: Record<string, string>;
  employees: Array<{ id: string; name: string; serviceIds?: string[] }>;
  services: Array<{ id: string; name: string }>;
}

export interface DateRangeInput {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const READ_WORKFLOW_ACTIONS = [
  'list_appointments',
  'fetch_current_schedule',
  'analyze_utilization',
  'identify_schedule_gaps',
  'find_freed_slots',
  'find_rebooking_candidates',
  'detect_conflicts',
  'summarize_utilization',
] as const;

export type ReadWorkflowAction = (typeof READ_WORKFLOW_ACTIONS)[number];
