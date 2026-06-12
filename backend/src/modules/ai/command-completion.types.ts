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
  | 'telemetry';

export interface PipelineTrace {
  stage: PipelineStage;
  action: string;
  at: string;
  detail?: string;
}

export interface CommandResult {
  success: boolean;
  action: string;
  summary: string;
  details: Record<string, any>;
}
