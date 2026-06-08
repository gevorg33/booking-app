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
  template?: ScheduleTemplate;
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
  | 'classify'
  | 'resolve'
  | 'validate'
  | 'plan'
  | 'execute'
  | 'clarify';

export interface PipelineTrace {
  stage: PipelineStage;
  action: string;
  at: string;
  detail?: string;
  /** acc-1.3 — correlation id threaded through the pipeline */
  traceId?: string;
}

export interface CommandResult {
  success: boolean;
  action: string;
  summary: string;
  details: Record<string, any>;
}
