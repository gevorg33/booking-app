import { Injectable, Logger } from '@nestjs/common';
import { toIsoDay, formatDateDisplay } from '../../common/utils/date-format.util.js';
import {
  resolveEmployees,
  resolveServices,
  resolveTemplate,
  resolveDateRange,
  fuzzyMatchByName,
} from './ai-orchestration.helpers.js';
import {
  ClassifiedCommand,
  BusinessCatalog,
  ResolvedCommand,
  ResolvedEntities,
  ValidationResult,
  PipelineTrace,
} from './command-completion.types.js';
import {
  validateCommand,
  buildClarifySummary,
} from './command-completion.validator.js';
import { CommandResult } from './command-completion.types.js';

const SESSION_INHERIT_KEYS = [
  'employeeName',
  'date',
  'dateFrom',
  'dateTo',
  'serviceName',
  'timeSlot',
  'customerName',
  'templateName',
  'timeFrom',
  'timeTo',
  'allProviders',
  'lastAction',
  'lastMetric',
  'appointmentMetric',
  'customerMetric',
  'bookingMetric',
  'route',
  'statusFilter',
  'todayOnly',
  'segmentFilter',
] as const;

const PROVIDER_SESSION_INHERIT_KEYS = [
  'customerName',
  'date',
  'timeSlot',
  'serviceName',
  'allAppointments',
] as const;

@Injectable()
export class CommandCompletionPipelineService {
  private readonly logger = new Logger(CommandCompletionPipelineService.name);

  mergeSessionContext(
    params: Record<string, any>,
    session?: Record<string, any>,
  ): Record<string, any> {
    if (!session) return params;
    const merged = { ...params };
    for (const key of SESSION_INHERIT_KEYS) {
      const value = merged[key];
      if ((value == null || value === '') && session[key]) {
        merged[key] = session[key];
      }
    }
    return merged;
  }

  mergeProviderSessionContext(
    params: Record<string, any>,
    session?: Record<string, any>,
  ): Record<string, any> {
    if (!session) return params;
    const merged = { ...params };
    for (const key of PROVIDER_SESSION_INHERIT_KEYS) {
      const value = merged[key];
      if ((value == null || value === '') && session[key] != null && session[key] !== '') {
        merged[key] = session[key];
      }
    }
    return merged;
  }

  normalizeDateParams(params: Record<string, any>): void {
    for (const key of ['date', 'dateFrom', 'dateTo'] as const) {
      if (params[key]) params[key] = toIsoDay(params[key]);
    }
  }

  /** Stage 2: Resolve entities and enrich params with IDs */
  resolve(
    businessId: string,
    prompt: string,
    classified: ClassifiedCommand,
    catalog: BusinessCatalog,
  ): ResolvedCommand {
    const params = { ...classified.params };
    const allProviders =
      params.allProviders === true ||
      /all providers|everyone|all staff|all employees/i.test(prompt);

    if (allProviders) params.allProviders = true;

    const employees = resolveEmployees(catalog.employees, { ...params, allProviders });
    const services = resolveServices(catalog.services, params);
    const customer = params.customerName
      ? fuzzyMatchByName(catalog.customers, params.customerName)
      : undefined;
    const template = resolveTemplate(catalog.templates, params.templateName);
    const dateRange = resolveDateRange(params, prompt);

    const employee = employees.length === 1 ? employees[0] : undefined;

    const entities: ResolvedEntities = {
      employee,
      employees,
      service: services.length === 1 ? services[0] : services[0],
      services,
      customer,
      template,
      dateRange,
      employeeId: employee?.id ?? employees[0]?.id,
    };

    const enrichedParams: Record<string, any> = {
      ...params,
      _availableEmployees: catalog.employees.map((e) => e.name).join(', '),
      _availableServices: catalog.services.map((s) => s.name).join(', '),
    };

    if (employee) {
      enrichedParams.employeeId = employee.id;
      enrichedParams.employeeName = employee.name;
    } else if (employees.length > 1) {
      enrichedParams.employeeIds = employees.map((e) => e.id);
      enrichedParams.employeeNames = employees.map((e) => e.name);
    }

    if (services.length === 1) {
      enrichedParams.serviceId = services[0].id;
      enrichedParams.serviceName = services[0].name;
    }

    if (customer) {
      enrichedParams.customerId = customer.id;
      enrichedParams.customerName = customer.name;
    }

    if (template) {
      enrichedParams.templateId = template.id;
      enrichedParams.templateName = template.name;
    }

    if (dateRange) {
      if (!enrichedParams.date) enrichedParams.date = dateRange.start;
      if (!enrichedParams.dateFrom) enrichedParams.dateFrom = dateRange.start;
      if (!enrichedParams.dateTo) enrichedParams.dateTo = dateRange.end;
    }

    return {
      ...classified,
      prompt,
      businessId,
      params,
      entities,
      enrichedParams,
    };
  }

  /** Stage 3: Preflight validation */
  validate(resolved: ResolvedCommand): ValidationResult {
    return validateCommand(resolved);
  }

  /** Stage 6: Clarify — structured follow-up instead of generic failure */
  toClarifyResult(resolved: ResolvedCommand, validation: ValidationResult): CommandResult {
    const summary = buildClarifySummary(validation.issues);
    return {
      success: false,
      action: resolved.action,
      summary,
      details: {
        needsClarification: true,
        missing: validation.issues,
        partialParams: resolved.params,
        enrichedParams: resolved.enrichedParams,
        reasoning: resolved.reasoning,
        pipelineStage: 'clarify',
        sessionContext: this.buildSessionContext(resolved),
      },
    };
  }

  buildSessionContext(resolved: ResolvedCommand): Record<string, any> {
    const p = resolved.enrichedParams;
    return {
      employeeName: p.employeeName ?? resolved.params.employeeName ?? null,
      date: p.date ? formatDateDisplay(p.date) : null,
      dateFrom: p.dateFrom ? formatDateDisplay(p.dateFrom) : null,
      dateTo: p.dateTo ? formatDateDisplay(p.dateTo) : null,
      serviceName: p.serviceName ?? null,
      timeSlot: p.timeSlot ?? null,
      customerName: p.customerName ?? null,
      templateName: p.templateName ?? null,
      timeFrom: p.timeFrom ?? null,
      timeTo: p.timeTo ?? null,
      allProviders: p.allProviders ?? null,
      lastAction: resolved.action ?? null,
      lastMetric:
        p.lastMetric ??
        resolved.params.appointmentMetric ??
        resolved.params.customerMetric ??
        resolved.params.bookingMetric ??
        null,
      appointmentMetric: resolved.params.appointmentMetric ?? null,
      customerMetric: resolved.params.customerMetric ?? null,
      bookingMetric: resolved.params.bookingMetric ?? null,
      route: resolved.params.route ?? null,
    };
  }

  buildProviderSessionContext(params: Record<string, any>): Record<string, unknown> {
    return {
      customerName: params.customerName ?? null,
      date: params.date ? formatDateDisplay(String(params.date)) : null,
      timeSlot: params.timeSlot ?? null,
      serviceName: params.serviceName ?? null,
      allAppointments: params.allAppointments ?? null,
    };
  }

  toProviderClarifyResult(
    action: string,
    params: Record<string, unknown>,
    reasoning: string,
    validation: ValidationResult,
  ): { success: false; action: string; summary: string; details: Record<string, unknown> } {
    return {
      success: false,
      action,
      summary: buildClarifySummary(validation.issues),
      details: {
        needsClarification: true,
        missing: validation.issues,
        partialParams: params,
        reasoning,
        pipelineStage: 'clarify',
        sessionContext: this.buildProviderSessionContext(params as Record<string, any>),
      },
    };
  }

  attachSessionToResult(result: CommandResult, resolved: ResolvedCommand): CommandResult {
    const sessionContext = this.buildSessionContext(resolved);
    const range = result.details?.range as { start?: string; end?: string } | undefined;
    if (range?.start && !sessionContext.dateFrom) {
      sessionContext.dateFrom = formatDateDisplay(range.start);
    }
    if (range?.end && !sessionContext.dateTo) {
      sessionContext.dateTo = formatDateDisplay(range.end);
    }
    if (result.details?.metric && !sessionContext.customerMetric) {
      sessionContext.customerMetric = String(result.details.metric);
      sessionContext.lastMetric = String(result.details.metric);
    }
    if (result.details?.appointmentMetric) {
      sessionContext.appointmentMetric = String(result.details.appointmentMetric);
      sessionContext.lastMetric = String(result.details.appointmentMetric);
    }
    if (result.details?.bookingMetric) {
      sessionContext.bookingMetric = String(result.details.bookingMetric);
      sessionContext.lastMetric = String(result.details.bookingMetric);
    }
    if (result.details?.date && !sessionContext.date) {
      sessionContext.date = String(result.details.date);
    }

    return {
      ...result,
      details: {
        ...result.details,
        sessionContext,
        pipelineTrace: result.details?.pipelineTrace,
      },
    };
  }

  trace(stage: PipelineTrace['stage'], action: string, detail?: string): PipelineTrace {
    const entry: PipelineTrace = {
      stage,
      action,
      at: new Date().toISOString(),
      detail,
    };
    this.logger.debug(`Pipeline [${stage}] ${action}${detail ? `: ${detail}` : ''}`);
    return entry;
  }
}
