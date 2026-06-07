import { Injectable, Logger } from '@nestjs/common';
import {
  toIsoDay,
  formatDateDisplay,
} from '../../common/utils/date-format.util.js';
import { resolveRescheduleParams } from './ai-intent-heuristics.js';
import {
  resolveEmployees,
  resolveServices,
  resolveTemplate,
  resolveDateRange,
  enrichDateRangeFromPrompt,
  fuzzyMatchByName,
  sanitizeProviderScopeFromPrompt,
  applyPromptDateOverride,
} from './ai-orchestration.helpers.js';
import { resolveServicesForEmployeeAssignment } from './ai-category-assignment.util.js';
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
import {
  inheritSharedEntityParams,
  pickSharedEntitySessionSlice,
} from './ai-command-entity-params.util.js';
import {
  getSharedParamsForIntent,
  SHARED_ENTITY_SESSION_INHERIT_KEYS,
} from './ai-command-entity-params.registry.js';

const SESSION_INHERIT_KEYS = [
  'employeeName',
  'employeeNames',
  'date',
  'dateFrom',
  'dateTo',
  'serviceName',
  'timeSlot',
  'customerName',
  'templateName',
  'packageName',
  'packageId',
  'packageLines',
  'serviceNames',
  'giftCardCode',
  'paymentMethod',
  'giftCardOrderId',
  'deliveryMethod',
  'amount',
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
  'statusFilters',
  'limit',
  'todayOnly',
  'segmentFilter',
] as const;

const RESCHEDULE_SESSION_SKIP_KEYS = new Set([
  'date',
  'dateFrom',
  'dateTo',
  'timeSlot',
]);

const PROVIDER_SESSION_INHERIT_KEYS = [
  'customerName',
  'date',
  'timeSlot',
  'serviceName',
  'allAppointments',
  'bookingId',
  'lastPush',
  'pushActionId',
] as const;

@Injectable()
export class CommandCompletionPipelineService {
  private readonly logger = new Logger(CommandCompletionPipelineService.name);

  mergeSessionContext(
    params: Record<string, any>,
    session?: Record<string, any>,
    action?: string,
  ): Record<string, any> {
    if (!session) return params;
    const merged = { ...params };
    for (const key of SESSION_INHERIT_KEYS) {
      if (
        action === 'reschedule_booking' &&
        RESCHEDULE_SESSION_SKIP_KEYS.has(key)
      )
        continue;
      const value = merged[key];
      const empty =
        value == null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);
      if (empty && session[key] != null && session[key] !== '') {
        merged[key] = session[key];
      }
    }
    const inherited = inheritSharedEntityParams(merged, session, action);
    if (action) {
      const allowed = getSharedParamsForIntent(action);
      if (allowed) {
        for (const key of SHARED_ENTITY_SESSION_INHERIT_KEYS) {
          if (!allowed.has(key)) {
            delete inherited[key];
          }
        }
      }
    }
    return inherited;
  }

  mergeProviderSessionContext(
    params: Record<string, any>,
    session?: Record<string, any>,
  ): Record<string, any> {
    if (!session) return params;
    const merged = { ...params };
    for (const key of PROVIDER_SESSION_INHERIT_KEYS) {
      const value = merged[key];
      if (
        (value == null || value === '') &&
        session[key] != null &&
        session[key] !== ''
      ) {
        merged[key] = session[key];
      }
    }
    return merged;
  }

  normalizeDateParams(
    params: Record<string, any>,
    prompt?: string,
    timeZone = 'UTC',
  ): void {
    applyPromptDateOverride(params, prompt, timeZone);
    for (const key of ['date', 'dateFrom', 'dateTo', 'fromDate'] as const) {
      if (params[key]) params[key] = toIsoDay(params[key], timeZone);
    }
  }

  finalizeRescheduleParams(
    params: Record<string, any>,
    prompt: string,
    timeZone = 'UTC',
  ): void {
    resolveRescheduleParams(params, prompt, timeZone);
    for (const key of ['fromDate', 'date'] as const) {
      if (params[key]) params[key] = toIsoDay(params[key], timeZone);
    }
    delete params.dateFrom;
    delete params.dateTo;
  }

  enrichDateRangeParams(
    params: Record<string, any>,
    prompt: string,
    timeZone = 'UTC',
  ): void {
    enrichDateRangeFromPrompt(params, prompt, timeZone);
  }

  /** Stage 2: Resolve entities and enrich params with IDs */
  resolve(
    businessId: string,
    prompt: string,
    classified: ClassifiedCommand,
    catalog: BusinessCatalog,
    timeZone = 'UTC',
  ): ResolvedCommand {
    const params: Record<string, any> = {
      ...classified.params,
      _timeZone: timeZone,
    };
    sanitizeProviderScopeFromPrompt(prompt, params, catalog.employees);
    const allProviders = params.allProviders === true;

    const employees = resolveEmployees(catalog.employees, {
      ...params,
      allProviders,
    });
    const services =
      classified.action === 'assign_employee_services'
        ? resolveServicesForEmployeeAssignment(catalog.services, params)
        : resolveServices(catalog.services, params);
    const customer = params.customerName
      ? fuzzyMatchByName(catalog.customers, params.customerName)
      : undefined;
    const template = resolveTemplate(catalog.templates, params.templateName);
    const dateRange = resolveDateRange(params, prompt, timeZone);

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

    if (dateRange && classified.action !== 'reschedule_booking') {
      const promptHasRelativeDate =
        /\b(tomorrow|today|yesterday|tonight)\b/i.test(prompt.toLowerCase());
      if (promptHasRelativeDate) {
        const relativeOnly = resolveDateRange(
          { _timeZone: timeZone },
          prompt,
          timeZone,
        );
        if (relativeOnly) enrichedParams.date = relativeOnly.start;
      } else if (!enrichedParams.date) {
        enrichedParams.date = dateRange.start;
      }
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
  toClarifyResult(
    resolved: ResolvedCommand,
    validation: ValidationResult,
  ): CommandResult {
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
      employeeNames: p.employeeNames ?? resolved.params.employeeNames ?? null,
      date: p.date ? formatDateDisplay(p.date) : null,
      dateFrom: p.dateFrom ? formatDateDisplay(p.dateFrom) : null,
      dateTo: p.dateTo ? formatDateDisplay(p.dateTo) : null,
      serviceName: p.serviceName ?? null,
      timeSlot: p.timeSlot ?? null,
      customerName: p.customerName ?? null,
      templateName: p.templateName ?? null,
      packageName: p.packageName ?? resolved.params.packageName ?? null,
      packageId: p.packageId ?? resolved.params.packageId ?? null,
      packageLines: p.packageLines ?? resolved.params.packageLines ?? null,
      giftCardCode: p.giftCardCode ?? resolved.params.giftCardCode ?? null,
      paymentMethod: p.paymentMethod ?? resolved.params.paymentMethod ?? null,
      giftCardOrderId:
        p.giftCardOrderId ?? resolved.params.giftCardOrderId ?? null,
      deliveryMethod:
        p.deliveryMethod ?? resolved.params.deliveryMethod ?? null,
      amount: p.amount ?? resolved.params.amount ?? null,
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
      ...pickSharedEntitySessionSlice(p),
    };
  }

  buildProviderSessionContext(
    params: Record<string, any>,
  ): Record<string, unknown> {
    return {
      customerName: params.customerName ?? null,
      date: params.date ? formatDateDisplay(String(params.date)) : null,
      timeSlot: params.timeSlot ?? null,
      serviceName: params.serviceName ?? null,
      allAppointments: params.allAppointments ?? null,
      bookingId: params.bookingId ?? null,
      lastPush: params.lastPush ?? null,
      pushActionId: params.pushActionId ?? null,
      ...pickSharedEntitySessionSlice(params),
    };
  }

  toProviderClarifyResult(
    action: string,
    params: Record<string, unknown>,
    reasoning: string,
    validation: ValidationResult,
  ): {
    success: false;
    action: string;
    summary: string;
    details: Record<string, unknown>;
  } {
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
        sessionContext: this.buildProviderSessionContext(
          params as Record<string, any>,
        ),
      },
    };
  }

  attachSessionToResult(
    result: CommandResult,
    resolved: ResolvedCommand,
  ): CommandResult {
    const sessionContext = this.buildSessionContext(resolved);
    const range = result.details?.range as
      | { start?: string; end?: string }
      | undefined;
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
      sessionContext.appointmentMetric = String(
        result.details.appointmentMetric,
      );
      sessionContext.lastMetric = String(result.details.appointmentMetric);
    }
    if (result.details?.bookingMetric) {
      sessionContext.bookingMetric = String(result.details.bookingMetric);
      sessionContext.lastMetric = String(result.details.bookingMetric);
    }
    if (result.details?.date && !sessionContext.date) {
      sessionContext.date = String(result.details.date);
    }
    if (Array.isArray(result.details?.availableProviders)) {
      sessionContext.availableProviders = result.details.availableProviders;
    } else if (Array.isArray(result.details?.providers)) {
      sessionContext.availableProviders = (
        result.details.providers as Array<{ name?: string }>
      )
        .map((provider) => provider.name)
        .filter((name): name is string => Boolean(name));
    }
    if (result.details?.serviceName && !sessionContext.serviceName) {
      sessionContext.serviceName = String(result.details.serviceName);
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

  trace(
    stage: PipelineTrace['stage'],
    action: string,
    detail?: string,
  ): PipelineTrace {
    const entry: PipelineTrace = {
      stage,
      action,
      at: new Date().toISOString(),
      detail,
    };
    this.logger.debug(
      `Pipeline [${stage}] ${action}${detail ? `: ${detail}` : ''}`,
    );
    return entry;
  }
}
