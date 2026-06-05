import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ScheduleTemplate } from '../schedule/entities/schedule-template.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { CommandOrchestrationService } from './command-orchestration.service.js';
import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import { CommandResult } from './ai-command.service.js';
import { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import {
  resolveEmployees,
  resolveTemplate,
  resolveServices,
  resolveScheduleServicesForEmployee,
  resolveDateRange,
  enumerateDaysInRange,
  resolveScheduleDates,
  parseWeekdaysFromParams,
  parseTimeWindow,
  isFullDayBlock,
  shouldAutoExecute,
  sanitizeProviderScopeFromPrompt,
  inferDirectSchedulePeriods,
  isTeamWideProviderScopePrompt,
} from './ai-orchestration.helpers.js';
import {
  formatDateDisplay,
  toIsoDay,
} from '../../common/utils/date-format.util.js';
import { formatWeekdayShortByDayIndex } from '../../common/i18n/locale-date.util.js';
import { resolveLocale, type AppLocale } from '../../common/i18n/messages.js';
import { Business } from '../business/entities/business.entity.js';
import { findScheduleGapsInWindow } from '../schedule/helpers/schedule-gap.helpers.js';
import { normalizeTime24 } from '../../common/utils/time-format.util.js';
import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';
import {
  buildBlockScheduleBlockPayloads,
  enhanceSmartBlockParams,
} from './ai-scheduling.util.js';
import { AiSchedulingService } from './ai-scheduling.service.js';

@Injectable()
export class AiScheduleHandlersService {
  constructor(
    @InjectRepository(ScheduleTemplate)
    private templateRepo: Repository<ScheduleTemplate>,
    @InjectRepository(SchedulingPeriod)
    private periodRepo: Repository<SchedulingPeriod>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    private orchestration: CommandOrchestrationService,
    private planBuilder: OperationalPlanBuilderService,
    private scheduling: AiSchedulingService,
  ) {}

  private async resolveBusinessLocale(businessId: string): Promise<AppLocale> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    const settings = (business?.settings ?? {}) as Record<string, unknown>;
    const raw = settings.locale;
    return resolveLocale(typeof raw === 'string' ? raw : undefined, 'en');
  }

  async handleApplySchedule(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    userId?: string,
  ): Promise<CommandResult> {
    const targets = resolveEmployees(employees, params);
    if (targets.length === 0) {
      return {
        success: false,
        action: 'apply_schedule',
        summary: 'Specify at least one service provider (or "all providers").',
        details: { params },
      };
    }

    const range = resolveDateRange(params, prompt);
    if (!range) {
      return {
        success: false,
        action: 'apply_schedule',
        summary: 'Specify a date or range (e.g. "this week", dateFrom/dateTo).',
        details: { params },
      };
    }

    const templates = await this.templateRepo.find({
      where: { businessId, isDeleted: false },
      order: { name: 'ASC' },
    });
    const template = resolveTemplate(templates, params.templateName);
    if (!template) {
      return {
        success: false,
        action: 'apply_schedule',
        summary: `No schedule template found${params.templateName ? ` matching "${params.templateName}"` : ''}. Create one in Schedule → Templates.`,
        details: { availableTemplates: templates.map((t) => t.name) },
      };
    }

    const applyDays = parseWeekdaysFromParams(params, prompt);
    const repeatWeeksCount = params.repeatWeeksCount ?? 1;

    const plan = this.planBuilder.buildApplySchedulePlan({
      businessId,
      templateId: template.id,
      templateName: template.name,
      employeeIds: targets.map((e) => e.id),
      employeeNames: targets.map((e) => e.name),
      startDate: range.start,
      endDate: range.end,
      applyDays,
      repeatWeeksCount,
      userId,
    });

    return this.executePlan(plan, businessId, userId, targets.length);
  }

  async handleBlockSchedule(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    userId?: string,
  ): Promise<CommandResult> {
    const plan = await this.prepareBlockSchedulePlan(
      businessId,
      prompt,
      params,
      employees,
      userId,
    );
    if (!plan) {
      return {
        success: false,
        action: 'block_schedule',
        summary:
          'Specify service provider(s), when to block, and time window (or full day).',
        details: { params },
      };
    }
    const allProviders =
      params.allProviders === true ||
      /all providers|everyone|all staff|all employees/i.test(prompt);
    const targets = allProviders
      ? employees
      : resolveEmployees(employees, params);
    return this.executePlan(plan, businessId, userId, targets.length);
  }

  async handleFillScheduleGaps(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    services: Service[],
    userId?: string,
  ): Promise<CommandResult> {
    const allProviders =
      params.allProviders === true ||
      /all providers|everyone|all staff/i.test(prompt);

    const targets = allProviders
      ? employees
      : resolveEmployees(employees, params);
    if (targets.length === 0) {
      return {
        success: false,
        action: 'fill_unused_slots',
        summary: 'Specify at least one service provider (or "all providers").',
        details: { params },
      };
    }

    const range = resolveDateRange(params, prompt);
    if (!range) {
      return {
        success: false,
        action: 'fill_unused_slots',
        summary: 'Specify a date or range (e.g. "29/05/2026" or "this week").',
        details: { params },
      };
    }

    const window = parseTimeWindow(params, prompt);
    const allPeriods: Array<{
      employeeId: string;
      employeeName: string;
      date: string;
      startTime: string;
      endTime: string;
      serviceIds: string[];
      serviceNames: string[];
    }> = [];

    for (const employee of targets) {
      const employeeServices = resolveScheduleServicesForEmployee(
        employee,
        services,
        params,
        prompt,
      );

      if (employeeServices.length === 0) continue;

      const serviceIds = employeeServices.map((s) => s.id);
      const serviceNames = employeeServices.map((s) => s.name);

      for (const day of enumerateDaysInRange(range)) {
        const isoDay = day.toISOString().split('T')[0];
        const dayStart = new Date(day);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setUTCHours(23, 59, 59, 999);

        const existingPeriods = await this.periodRepo.find({
          where: {
            businessId,
            employeeId: employee.id,
            startTime: Between(dayStart, dayEnd),
          },
          order: { startTime: 'ASC' },
        });

        const gaps = findScheduleGapsInWindow(
          day,
          window.timeFrom,
          window.timeTo,
          existingPeriods.map((p) => ({
            startTime: p.startTime,
            endTime: p.endTime,
          })),
        );

        for (const gap of gaps) {
          allPeriods.push({
            employeeId: employee.id,
            employeeName: employee.name,
            date: isoDay,
            startTime: gap.startTime,
            endTime: gap.endTime,
            serviceIds,
            serviceNames,
          });
        }
      }
    }

    if (allPeriods.length === 0) {
      return {
        success: true,
        action: 'fill_unused_slots',
        summary: `No open gaps found between ${window.timeFrom}–${window.timeTo} for the selected provider(s) and date range.`,
        details: { range, window, providers: targets.map((e) => e.name) },
      };
    }

    const plan = this.planBuilder.buildFillScheduleGapsPlan({
      businessId,
      timeFrom: window.timeFrom,
      timeTo: window.timeTo,
      periods: allPeriods,
      userId,
    });

    return this.executePlan(plan, businessId, userId, targets.length);
  }

  async handleListScheduleGaps(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
  ): Promise<CommandResult> {
    const allProviders =
      params.allProviders === true ||
      /all providers|everyone|all staff/i.test(prompt);

    const targets = allProviders
      ? employees
      : resolveEmployees(employees, params);
    if (targets.length === 0) {
      return {
        success: false,
        action: 'list_schedule_gaps',
        summary:
          'Specify which service provider to check (e.g. "which days does Gevorg have gaps").',
        details: { params },
      };
    }

    const range = resolveDateRange(params, prompt);
    if (!range) {
      return {
        success: false,
        action: 'list_schedule_gaps',
        summary:
          'Specify a date range (e.g. "this week" or the same range as your prior question).',
        details: { params },
      };
    }

    const window = parseTimeWindow(params, prompt);
    const displayLocale = await this.resolveBusinessLocale(businessId);
    const reports: Array<{
      employeeName: string;
      days: Array<{
        date: string;
        weekday: string;
        gaps: Array<{ startTime: string; endTime: string }>;
      }>;
    }> = [];

    for (const employee of targets) {
      const days: Array<{
        date: string;
        weekday: string;
        gaps: Array<{ startTime: string; endTime: string }>;
      }> = [];

      for (const day of enumerateDaysInRange(range)) {
        const isoDay = day.toISOString().split('T')[0];
        const dayStart = new Date(day);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setUTCHours(23, 59, 59, 999);

        const existingPeriods = await this.periodRepo.find({
          where: {
            businessId,
            employeeId: employee.id,
            startTime: Between(dayStart, dayEnd),
          },
          order: { startTime: 'ASC' },
        });

        const gaps = findScheduleGapsInWindow(
          day,
          window.timeFrom,
          window.timeTo,
          existingPeriods.map((p) => ({
            startTime: p.startTime,
            endTime: p.endTime,
          })),
        );

        if (gaps.length > 0) {
          days.push({
            date: formatDateDisplay(isoDay, displayLocale),
            weekday: formatWeekdayShortByDayIndex(
              day.getUTCDay(),
              displayLocale,
            ),
            gaps,
          });
        }
      }

      reports.push({ employeeName: employee.name, days });
    }

    const rangeLabel = `${formatDateDisplay(range.start, displayLocale)} → ${formatDateDisplay(range.end, displayLocale)}`;
    const windowLabel = `${window.timeFrom}–${window.timeTo}`;
    const lines: string[] = [];

    for (const report of reports) {
      if (targets.length > 1) {
        lines.push(`${report.employeeName}:`);
      } else {
        lines.push(
          `Open gaps for ${report.employeeName} · ${rangeLabel} · ${windowLabel}:`,
        );
      }

      if (report.days.length === 0) {
        lines.push(`• No open gaps in ${windowLabel} during this range.`);
        continue;
      }

      for (const day of report.days) {
        const slots = day.gaps
          .map((g) => `${g.startTime}–${g.endTime}`)
          .join(', ');
        lines.push(`• ${day.weekday} ${day.date}: ${slots}`);
      }
    }

    return {
      success: true,
      action: 'list_schedule_gaps',
      summary: lines.join('\n'),
      details: { range, window, reports },
    };
  }

  async handleCreateDirectSchedule(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    services: Service[],
    userId?: string,
  ): Promise<CommandResult> {
    const plan = await this.prepareDirectSchedulePlan(
      businessId,
      prompt,
      params,
      employees,
      services,
      userId,
    );
    if (!plan) {
      return {
        success: false,
        action: 'create_direct_schedule',
        summary:
          'Could not build a direct schedule. Specify provider(s), date range, and hours (e.g. "all employees this week 9-19, 12-13 unavailable, their services").',
        details: { params },
      };
    }
    const providerCount = new Set(plan.steps.map((s) => s.params.employeeId))
      .size;
    return this.executePlan(plan, businessId, userId, providerCount);
  }

  async prepareDirectSchedulePlan(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    services: Service[],
    userId?: string,
  ): Promise<AgentPlan | null> {
    sanitizeProviderScopeFromPrompt(prompt, params, employees);

    const allProviders =
      params.allProviders === true || isTeamWideProviderScopePrompt(prompt);
    const targets = allProviders
      ? employees
      : resolveEmployees(employees, params);
    if (!targets.length) return null;

    if (!params.date && !(params.dateFrom && params.dateTo)) return null;

    const rawPeriods = inferDirectSchedulePeriods(params, prompt);
    if (!rawPeriods.length) return null;

    const dates = resolveScheduleDates(params, prompt);
    if (!dates.length) return null;

    const plans: AgentPlan[] = [];

    for (const employee of targets) {
      const normalizedPeriods = rawPeriods.map((p: any) => {
        const isUnavailable = p.type === 'unavailable_block';
        const periodServiceParams = {
          serviceNames:
            p.serviceNames ?? (p.serviceName ? [p.serviceName] : null),
          serviceName: p.serviceName ?? null,
        };
        const matched = isUnavailable
          ? []
          : resolveScheduleServicesForEmployee(
              employee,
              services,
              periodServiceParams,
              prompt,
            );

        return {
          startTime: normalizeTime24(p.startTime),
          endTime: normalizeTime24(p.endTime),
          type: p.type ?? 'service_block',
          placeholderLabel: p.placeholderLabel ?? p.label,
          serviceIds: matched.map((s) => s.id),
          maxAppointmentCount: p.maxAppointmentCount ?? 1,
        };
      });

      const missingServices = normalizedPeriods.some(
        (p) => p.type !== 'unavailable_block' && p.serviceIds.length === 0,
      );
      if (missingServices) continue;

      plans.push(
        this.planBuilder.buildDirectSchedulePlan({
          businessId,
          employeeId: employee.id,
          employeeName: employee.name,
          dates,
          periods: normalizedPeriods,
          userId,
        }),
      );
    }

    if (!plans.length) return null;
    if (plans.length === 1) return plans[0];
    return this.planBuilder.mergePlans(
      businessId,
      'create_direct_schedule',
      plans,
    );
  }

  async handleClearSchedule(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    userId?: string,
  ): Promise<CommandResult> {
    const plan = await this.prepareClearSchedulePlan(
      businessId,
      prompt,
      params,
      employees,
      userId,
    );
    if (!plan) {
      return {
        success: false,
        action: 'clear_schedule',
        summary:
          'Specify who and when to clear. Example: "Cleanup Mary\'s schedule on 31/05/2026".',
        details: { params },
      };
    }
    return this.executePlan(plan, businessId, userId, plan.steps.length);
  }

  async prepareClearSchedulePlan(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    userId?: string,
  ) {
    sanitizeProviderScopeFromPrompt(prompt, params, employees);

    const allProviders =
      params.allProviders === true || isTeamWideProviderScopePrompt(prompt);
    const targets = allProviders
      ? employees
      : resolveEmployees(employees, params);
    if (!targets.length) return null;

    const dates = resolveScheduleDates(params, prompt);
    if (!dates.length) return null;

    const clears = targets.flatMap((employee) =>
      dates.map((date) => ({
        employeeId: employee.id,
        employeeName: employee.name,
        date,
      })),
    );

    return this.planBuilder.buildClearSchedulePlan({
      businessId,
      clears,
      userId,
    });
  }

  /** ai-s1: Single merged plan — apply template to team then fill gaps in one workflow. */
  async handleTemplateCascade(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    services: Service[],
    userId?: string,
  ): Promise<CommandResult> {
    const allProviders =
      params.allProviders === true ||
      /all providers|everyone|whole team|all staff/i.test(prompt);

    const targets = allProviders
      ? employees
      : resolveEmployees(employees, params);
    if (targets.length === 0) {
      return {
        success: false,
        action: 'setup_week_schedule',
        summary:
          'Specify provider(s) or say "all providers" for template cascade.',
        details: { params },
      };
    }

    const range = resolveDateRange(params, prompt);
    if (!range) {
      return {
        success: false,
        action: 'setup_week_schedule',
        summary: 'Specify a date range (e.g. "next week", "this week").',
        details: { params },
      };
    }

    const templates = await this.templateRepo.find({
      where: { businessId, isDeleted: false },
      order: { name: 'ASC' },
    });
    const template = resolveTemplate(templates, params.templateName);
    if (!template) {
      return {
        success: false,
        action: 'setup_week_schedule',
        summary: `No schedule template found${params.templateName ? ` matching "${params.templateName}"` : ''}.`,
        details: { availableTemplates: templates.map((t) => t.name) },
      };
    }

    const applyDays = parseWeekdaysFromParams(params, prompt);
    const repeatWeeksCount = params.repeatWeeksCount ?? 1;
    const window = parseTimeWindow(params, prompt, {
      timeFrom: '09:00',
      timeTo: '19:00',
    });

    const applyParams = {
      businessId,
      templateId: template.id,
      templateName: template.name,
      employeeIds: targets.map((e) => e.id),
      employeeNames: targets.map((e) => e.name),
      startDate: range.start,
      endDate: range.end,
      applyDays,
      repeatWeeksCount,
      userId,
    };

    const allPeriods = await this.collectGapPeriods(
      businessId,
      targets,
      services,
      range,
      window,
      params,
      prompt,
    );

    const fillParams = {
      businessId,
      timeFrom: window.timeFrom,
      timeTo: window.timeTo,
      periods: allPeriods,
      userId,
    };

    const plan = this.planBuilder.buildTemplateCascadePlan(
      applyParams,
      fillParams,
    );
    return this.executePlan(plan, businessId, userId, targets.length);
  }

  async prepareTemplateCascadePlan(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    services: Service[],
    userId?: string,
  ) {
    const allProviders =
      params.allProviders === true ||
      /all providers|everyone|whole team|all staff/i.test(prompt);
    const targets = allProviders
      ? employees
      : resolveEmployees(employees, params);
    if (!targets.length) return null;

    const range = resolveDateRange(params, prompt);
    if (!range) return null;

    const templates = await this.templateRepo.find({
      where: { businessId, isDeleted: false },
      order: { name: 'ASC' },
    });
    const template = resolveTemplate(templates, params.templateName);
    if (!template) return null;

    const window = parseTimeWindow(params, prompt, {
      timeFrom: '09:00',
      timeTo: '19:00',
    });
    const applyParams = {
      businessId,
      templateId: template.id,
      templateName: template.name,
      employeeIds: targets.map((e) => e.id),
      employeeNames: targets.map((e) => e.name),
      startDate: range.start,
      endDate: range.end,
      applyDays: parseWeekdaysFromParams(params, prompt),
      repeatWeeksCount: params.repeatWeeksCount ?? 1,
      userId,
    };
    const allPeriods = await this.collectGapPeriods(
      businessId,
      targets,
      services,
      range,
      window,
      params,
      prompt,
    );
    return this.planBuilder.buildTemplateCascadePlan(applyParams, {
      businessId,
      timeFrom: window.timeFrom,
      timeTo: window.timeTo,
      periods: allPeriods,
      userId,
    });
  }

  async prepareApplySchedulePlan(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    userId?: string,
  ) {
    const targets = resolveEmployees(employees, params);
    if (!targets.length) return null;
    const range = resolveDateRange(params, prompt);
    if (!range) return null;
    const templates = await this.templateRepo.find({
      where: { businessId, isDeleted: false },
      order: { name: 'ASC' },
    });
    const template = resolveTemplate(templates, params.templateName);
    if (!template) return null;
    return this.planBuilder.buildApplySchedulePlan({
      businessId,
      templateId: template.id,
      templateName: template.name,
      employeeIds: targets.map((e) => e.id),
      employeeNames: targets.map((e) => e.name),
      startDate: range.start,
      endDate: range.end,
      applyDays: parseWeekdaysFromParams(params, prompt),
      repeatWeeksCount: params.repeatWeeksCount ?? 1,
      userId,
    });
  }

  async prepareFillGapsPlan(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    services: Service[],
    userId?: string,
  ) {
    const allProviders =
      params.allProviders === true ||
      /all providers|everyone|all staff/i.test(prompt);
    const targets = allProviders
      ? employees
      : resolveEmployees(employees, params);
    if (!targets.length) return null;
    const range = resolveDateRange(params, prompt);
    if (!range) return null;
    const window = parseTimeWindow(params, prompt);
    const allPeriods = await this.collectGapPeriods(
      businessId,
      targets,
      services,
      range,
      window,
      params,
      prompt,
    );
    if (!allPeriods.length) return null;
    return this.planBuilder.buildFillScheduleGapsPlan({
      businessId,
      timeFrom: window.timeFrom,
      timeTo: window.timeTo,
      periods: allPeriods,
      userId,
    });
  }

  async prepareBlockSchedulePlan(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    userId?: string,
  ) {
    const enriched = enhanceSmartBlockParams(prompt, params);
    const allProviders =
      enriched.allProviders === true ||
      /all providers|everyone|all staff|all employees/i.test(prompt);
    const targets = allProviders
      ? employees
      : resolveEmployees(employees, enriched);
    if (!targets.length) return null;

    const range = resolveDateRange(enriched, prompt);
    const fullDay = isFullDayBlock(enriched, prompt);
    const window = parseTimeWindow(enriched, prompt, {
      timeFrom: '00:00',
      timeTo: '23:59',
    });
    const applyDays = parseWeekdaysFromParams(enriched, prompt);
    const placeholder =
      (enriched.reason as string | undefined) ||
      (enriched.notes as string | undefined) ||
      (enriched.placeholder as string | undefined) ||
      'Blocked';
    const isRepetitive =
      !!range && range.start !== range.end && !fullDay && applyDays.length < 7;
    const singleDate =
      range?.start ?? (enriched.date ? toIsoDay(String(enriched.date)) : null);
    if (
      !isRepetitive &&
      !singleDate &&
      !(enriched.weeksCount || enriched.repeatWeeksCount)
    ) {
      return null;
    }

    const businessHolidays =
      await this.scheduling.resolveHolidayDatesForBusiness(businessId);
    const paramHolidays = Array.isArray(enriched.holidayDates)
      ? enriched.holidayDates
      : [];
    const holidayDates = [
      ...new Set([...businessHolidays, ...paramHolidays.map(String)]),
    ];

    const blockPayloads = buildBlockScheduleBlockPayloads({
      targets,
      params: enriched,
      range,
      fullDay,
      window,
      applyDays,
      placeholder,
      singleDate,
      holidayDates,
    });

    return this.planBuilder.buildBlockSchedulePlan({
      businessId,
      blocks: blockPayloads,
      userId,
    });
  }

  private async collectGapPeriods(
    businessId: string,
    targets: Employee[],
    services: Service[],
    range: { start: string; end: string },
    window: { timeFrom: string; timeTo: string },
    params: Record<string, any>,
    prompt?: string,
  ) {
    const allPeriods: Array<{
      employeeId: string;
      employeeName: string;
      date: string;
      startTime: string;
      endTime: string;
      serviceIds: string[];
      serviceNames: string[];
    }> = [];

    for (const employee of targets) {
      const employeeServices = resolveScheduleServicesForEmployee(
        employee,
        services,
        params,
        prompt,
      );

      if (employeeServices.length === 0) continue;

      const serviceIds = employeeServices.map((s) => s.id);
      const serviceNames = employeeServices.map((s) => s.name);

      for (const day of enumerateDaysInRange(range)) {
        const isoDay = day.toISOString().split('T')[0];
        const dayStart = new Date(day);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setUTCHours(23, 59, 59, 999);

        const existingPeriods = await this.periodRepo.find({
          where: {
            businessId,
            employeeId: employee.id,
            startTime: Between(dayStart, dayEnd),
          },
          order: { startTime: 'ASC' },
        });

        const gaps = findScheduleGapsInWindow(
          day,
          window.timeFrom,
          window.timeTo,
          existingPeriods,
        );

        for (const gap of gaps) {
          allPeriods.push({
            employeeId: employee.id,
            employeeName: employee.name,
            date: isoDay,
            startTime: gap.startTime,
            endTime: gap.endTime,
            serviceIds,
            serviceNames,
          });
        }
      }
    }

    return allPeriods;
  }

  private async executePlan(
    plan: ReturnType<OperationalPlanBuilderService['buildApplySchedulePlan']>,
    businessId: string,
    userId?: string,
    providerCount = 1,
  ): Promise<CommandResult> {
    const result = await this.orchestration.executePlan({
      plan,
      businessId,
      userId,
      autoExecute: shouldAutoExecute(
        plan.intent,
        plan.steps.length,
        providerCount,
      ),
    });

    return {
      success: result.success,
      action: result.action,
      summary: result.summary,
      details: {
        ...result.details,
        taskId: result.taskId,
        requiresApproval: result.requiresApproval,
      },
    };
  }

  async handleCreateScheduleTemplate(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    services: Service[],
    userId?: string,
  ): Promise<CommandResult> {
    const plan = await this.prepareCreateScheduleTemplatePlan(
      businessId,
      prompt,
      params,
      employees,
      services,
      userId,
    );
    if (!plan) {
      return {
        success: false,
        action: 'create_schedule_template',
        summary:
          'Cannot create template — specify template name and hours (e.g. "Create template Weekday 9-17 with facemassage Mon-Fri").',
        details: { params },
      };
    }
    return this.executePlan(plan, businessId, userId, 1);
  }

  async prepareCreateScheduleTemplatePlan(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    services: Service[],
    userId?: string,
  ): Promise<AgentPlan | null> {
    const name = (params.templateName ?? params.name ?? '').trim();
    if (!name) return null;

    let rawPeriods: any[] = params.periods?.length
      ? [...params.periods]
      : [...inferDirectSchedulePeriods(params, prompt)];
    if (!rawPeriods.length) {
      if (params.timeFrom && params.timeTo) {
        rawPeriods = [
          {
            startTime: normalizeTime24(params.timeFrom),
            endTime: normalizeTime24(params.timeTo),
            type: TemplatePeriodType.SERVICE_BLOCK,
          },
        ];
      } else if (
        (prompt ?? '').match(
          /(?:between\s+)?(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?/i,
        )
      ) {
        const window = parseTimeWindow(params, prompt);
        rawPeriods = [
          {
            startTime: window.timeFrom,
            endTime: window.timeTo,
            type: TemplatePeriodType.SERVICE_BLOCK,
          },
        ];
      }
    }
    if (!rawPeriods.length) return null;

    const applyDays = parseWeekdaysFromParams(params, prompt);
    const weekdayFlags = this.applyDaysToTemplateFlags(
      applyDays.length ? applyDays : [1, 2, 3, 4, 5],
    );

    const timePeriods = rawPeriods.map((p: any) => {
      const isUnavailable = p.type === 'unavailable_block';
      const periodServiceParams = {
        serviceNames:
          p.serviceNames ??
          (p.serviceName ? [p.serviceName] : params.serviceNames),
        serviceName: p.serviceName ?? params.serviceName ?? null,
      };
      const matched = isUnavailable
        ? []
        : resolveServices(services, periodServiceParams);

      return {
        startTime: normalizeTime24(p.startTime),
        endTime: normalizeTime24(p.endTime),
        type: p.type ?? TemplatePeriodType.SERVICE_BLOCK,
        placeholderLabel: p.placeholderLabel ?? p.label,
        serviceIds: matched.map((s) => s.id),
        maxAppointmentCount: p.maxAppointmentCount ?? 1,
        ...weekdayFlags,
      };
    });

    return this.planBuilder.buildCreateScheduleTemplatePlan({
      businessId,
      name,
      timePeriods,
      userId,
    });
  }

  private applyDaysToTemplateFlags(applyDays: number[]) {
    const set = new Set(applyDays);
    return {
      isActiveOnSunday: set.has(0),
      isActiveOnMonday: set.has(1),
      isActiveOnTuesday: set.has(2),
      isActiveOnWednesday: set.has(3),
      isActiveOnThursday: set.has(4),
      isActiveOnFriday: set.has(5),
      isActiveOnSaturday: set.has(6),
    };
  }
}
