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
import {
  resolveEmployees,
  resolveTemplate,
  resolveServices,
  resolveScheduleServicesForEmployee,
  getEmployeeAssignedServices,
  resolveDateRange,
  enumerateDaysInRange,
  parseWeekdaysFromParams,
  parseTimeWindow,
  isFullDayBlock,
  shouldAutoExecute,
} from './ai-orchestration.helpers.js';
import { formatDateDisplay, toIsoDay, parseDateInput } from '../../common/utils/date-format.util.js';
import { findScheduleGapsInWindow } from '../schedule/helpers/schedule-gap.helpers.js';
import { normalizeTime24 } from '../../common/utils/time-format.util.js';

@Injectable()
export class AiScheduleHandlersService {
  constructor(
    @InjectRepository(ScheduleTemplate) private templateRepo: Repository<ScheduleTemplate>,
    @InjectRepository(SchedulingPeriod) private periodRepo: Repository<SchedulingPeriod>,
    private orchestration: CommandOrchestrationService,
    private planBuilder: OperationalPlanBuilderService,
  ) {}

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
    const allProviders =
      params.allProviders === true ||
      /all providers|everyone|all staff|all employees/i.test(prompt);

    const targets = allProviders ? employees : resolveEmployees(employees, params);
    if (targets.length === 0) {
      return {
        success: false,
        action: 'block_schedule',
        summary: 'Specify service provider(s) or say "all providers".',
        details: { params },
      };
    }

    const range = resolveDateRange(params, prompt);
    const fullDay = isFullDayBlock(params, prompt);
    const window = parseTimeWindow(params, prompt, { timeFrom: '00:00', timeTo: '23:59' });
    const applyDays = parseWeekdaysFromParams(params, prompt);
    const placeholder = params.reason || params.notes || params.placeholder || 'Blocked';

    const isRepetitive = !!range && range.start !== range.end && !fullDay && applyDays.length < 7;
    const singleDate = range?.start ?? (params.date ? toIsoDay(params.date) : null);

    if (!isRepetitive && !singleDate) {
      return {
        success: false,
        action: 'block_schedule',
        summary: 'Specify when to block (date, date range, or "this week").',
        details: { params },
      };
    }

    const blockPayloads = targets.map((employee) => {
      if (fullDay && singleDate) {
        const dayStart = `${singleDate}T00:00:00.000Z`;
        const dayEnd = `${singleDate}T23:59:59.000Z`;
        return {
          employeeId: employee.id,
          employeeName: employee.name,
          isRepetitive: false,
          placeholder,
          singleBlock: { startTime: dayStart, endTime: dayEnd },
        };
      }

      if (isRepetitive && range) {
        return {
          employeeId: employee.id,
          employeeName: employee.name,
          isRepetitive: true,
          placeholder,
          repetitiveBlock: {
            startDay: range.start,
            endDay: range.end,
            startTime: normalizeTime24(window.timeFrom),
            endTime: normalizeTime24(window.timeTo),
            weeksCount: params.weeksCount ?? params.repeatWeeksCount ?? 1,
            isActiveOnMonday: applyDays.includes(1),
            isActiveOnTuesday: applyDays.includes(2),
            isActiveOnWednesday: applyDays.includes(3),
            isActiveOnThursday: applyDays.includes(4),
            isActiveOnFriday: applyDays.includes(5),
            isActiveOnSaturday: applyDays.includes(6),
            isActiveOnSunday: applyDays.includes(0),
          },
        };
      }

      const iso = singleDate!;
      const [sh, sm] = window.timeFrom.split(':').map(Number);
      const [eh, em] = window.timeTo.split(':').map(Number);
      const start = new Date(iso);
      start.setUTCHours(sh, sm, 0, 0);
      const end = new Date(iso);
      end.setUTCHours(eh, em, 0, 0);

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        isRepetitive: false,
        placeholder,
        singleBlock: { startTime: start.toISOString(), endTime: end.toISOString() },
      };
    });

    const plan = this.planBuilder.buildBlockSchedulePlan({
      businessId,
      blocks: blockPayloads,
      userId,
    });

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

    const targets = allProviders ? employees : resolveEmployees(employees, params);
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
            startTime: Between(dayStart, dayEnd) as any,
          },
          order: { startTime: 'ASC' },
        });

        const gaps = findScheduleGapsInWindow(
          day,
          window.timeFrom,
          window.timeTo,
          existingPeriods.map((p) => ({ startTime: p.startTime, endTime: p.endTime })),
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

    const targets = allProviders ? employees : resolveEmployees(employees, params);
    if (targets.length === 0) {
      return {
        success: false,
        action: 'list_schedule_gaps',
        summary: 'Specify which service provider to check (e.g. "which days does Gevorg have gaps").',
        details: { params },
      };
    }

    const range = resolveDateRange(params, prompt);
    if (!range) {
      return {
        success: false,
        action: 'list_schedule_gaps',
        summary: 'Specify a date range (e.g. "this week" or the same range as your prior question).',
        details: { params },
      };
    }

    const window = parseTimeWindow(params, prompt);
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const reports: Array<{
      employeeName: string;
      days: Array<{ date: string; weekday: string; gaps: Array<{ startTime: string; endTime: string }> }>;
    }> = [];

    for (const employee of targets) {
      const days: Array<{ date: string; weekday: string; gaps: Array<{ startTime: string; endTime: string }> }> = [];

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
            startTime: Between(dayStart, dayEnd) as any,
          },
          order: { startTime: 'ASC' },
        });

        const gaps = findScheduleGapsInWindow(
          day,
          window.timeFrom,
          window.timeTo,
          existingPeriods.map((p) => ({ startTime: p.startTime, endTime: p.endTime })),
        );

        if (gaps.length > 0) {
          days.push({
            date: formatDateDisplay(isoDay),
            weekday: weekday[day.getUTCDay()],
            gaps,
          });
        }
      }

      reports.push({ employeeName: employee.name, days });
    }

    const rangeLabel = `${formatDateDisplay(range.start)} → ${formatDateDisplay(range.end)}`;
    const windowLabel = `${window.timeFrom}–${window.timeTo}`;
    const lines: string[] = [];

    for (const report of reports) {
      if (targets.length > 1) {
        lines.push(`${report.employeeName}:`);
      } else {
        lines.push(`Open gaps for ${report.employeeName} · ${rangeLabel} · ${windowLabel}:`);
      }

      if (report.days.length === 0) {
        lines.push(`• No open gaps in ${windowLabel} during this range.`);
        continue;
      }

      for (const day of report.days) {
        const slots = day.gaps.map((g) => `${g.startTime}–${g.endTime}`).join(', ');
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
    const targets = resolveEmployees(employees, params);
    if (targets.length !== 1) {
      return {
        success: false,
        action: 'create_direct_schedule',
        summary: 'Direct schedule applies to one provider at a time. Specify employeeName.',
        details: { params },
      };
    }

    if (!params.date && !(params.dateFrom && params.dateTo)) {
      return {
        success: false,
        action: 'create_direct_schedule',
        summary: 'Specify the date or date range for the direct schedule.',
        details: { params },
      };
    }

    const periods = Array.isArray(params.periods) ? params.periods : [];
    if (periods.length === 0) {
      return {
        success: false,
        action: 'create_direct_schedule',
        summary: 'Specify schedule periods (time ranges and types). Example: "Set Gevorg on Friday 9-17 with facemassage 9-12, lunch 12-13".',
        details: { params },
      };
    }

    const employee = targets[0];
    const assigned = getEmployeeAssignedServices(employee, services);

    const normalizedPeriods = periods.map((p: any) => {
      const isUnavailable = p.type === 'unavailable_block';
      const periodServiceParams = {
        serviceNames: p.serviceNames ?? (p.serviceName ? [p.serviceName] : null),
        serviceName: p.serviceName ?? null,
      };
      const matched = isUnavailable
        ? []
        : resolveScheduleServicesForEmployee(employee, services, periodServiceParams, prompt);

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
    if (missingServices) {
      const hint =
        assigned.length > 0
          ? `Assigned services for ${employee.name}: ${assigned.map((s) => s.name).join(', ')}`
          : `No services assigned to ${employee.name} — assign services on the Employees page first.`;
      return {
        success: false,
        action: 'create_direct_schedule',
        summary: `Could not resolve services for this schedule. ${hint}`,
        details: { employeeName: employee.name, assignedServices: assigned.map((s) => s.name) },
      };
    }

    const dates: string[] = [];
    if (params.dateFrom && params.dateTo) {
      const range = resolveDateRange(params, prompt);
      if (range) {
        for (const day of enumerateDaysInRange(range)) {
          dates.push(day.toISOString().split('T')[0]);
        }
      }
    } else if (params.date) {
      dates.push(toIsoDay(params.date));
    }
    if (!dates.length) {
      return {
        success: false,
        action: 'create_direct_schedule',
        summary: 'Could not resolve the schedule date range.',
        details: { params },
      };
    }

    const plan = this.planBuilder.buildDirectSchedulePlan({
      businessId,
      employeeId: targets[0].id,
      employeeName: targets[0].name,
      dates,
      periods: normalizedPeriods,
      userId,
    });

    return this.executePlan(plan, businessId, userId, plan.steps.length);
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
    const allProviders =
      params.allProviders === true ||
      /all providers|everyone|all staff|all employees/i.test(prompt);
    const targets = allProviders ? employees : resolveEmployees(employees, params);
    if (!targets.length) return null;

    const dates: string[] = [];
    if (params.date) {
      dates.push(toIsoDay(params.date));
    } else {
      const range = resolveDateRange(params, prompt);
      if (!range) return null;
      for (const day of enumerateDaysInRange(range)) {
        dates.push(day.toISOString().split('T')[0]);
      }
    }
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

    const targets = allProviders ? employees : resolveEmployees(employees, params);
    if (targets.length === 0) {
      return {
        success: false,
        action: 'setup_week_schedule',
        summary: 'Specify provider(s) or say "all providers" for template cascade.',
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
    const window = parseTimeWindow(params, prompt, { timeFrom: '09:00', timeTo: '19:00' });

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

    const plan = this.planBuilder.buildTemplateCascadePlan(applyParams, fillParams);
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
    const targets = allProviders ? employees : resolveEmployees(employees, params);
    if (!targets.length) return null;

    const range = resolveDateRange(params, prompt);
    if (!range) return null;

    const templates = await this.templateRepo.find({
      where: { businessId, isDeleted: false },
      order: { name: 'ASC' },
    });
    const template = resolveTemplate(templates, params.templateName);
    if (!template) return null;

    const window = parseTimeWindow(params, prompt, { timeFrom: '09:00', timeTo: '19:00' });
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
    const targets = allProviders ? employees : resolveEmployees(employees, params);
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
    const allProviders =
      params.allProviders === true ||
      /all providers|everyone|all staff|all employees/i.test(prompt);
    const targets = allProviders ? employees : resolveEmployees(employees, params);
    if (!targets.length) return null;
    const range = resolveDateRange(params, prompt);
    const fullDay = isFullDayBlock(params, prompt);
    const window = parseTimeWindow(params, prompt, { timeFrom: '00:00', timeTo: '23:59' });
    const applyDays = parseWeekdaysFromParams(params, prompt);
    const placeholder = params.reason || params.notes || params.placeholder || 'Blocked';
    const isRepetitive = !!range && range.start !== range.end && !fullDay && applyDays.length < 7;
    const singleDate = range?.start ?? (params.date ? toIsoDay(params.date) : null);
    if (!isRepetitive && !singleDate) return null;

    const blockPayloads = targets.map((employee) => {
      if (fullDay && singleDate) {
        const dayStart = `${singleDate}T00:00:00.000Z`;
        const dayEnd = `${singleDate}T23:59:59.000Z`;
        return {
          employeeId: employee.id,
          employeeName: employee.name,
          isRepetitive: false,
          placeholder,
          singleBlock: { startTime: dayStart, endTime: dayEnd },
        };
      }
      if (isRepetitive && range) {
        return {
          employeeId: employee.id,
          employeeName: employee.name,
          isRepetitive: true,
          placeholder,
          repetitiveBlock: {
            startDay: range.start,
            endDay: range.end,
            startTime: normalizeTime24(window.timeFrom),
            endTime: normalizeTime24(window.timeTo),
            weeksCount: params.weeksCount ?? params.repeatWeeksCount ?? 1,
            isActiveOnMonday: applyDays.includes(1),
            isActiveOnTuesday: applyDays.includes(2),
            isActiveOnWednesday: applyDays.includes(3),
            isActiveOnThursday: applyDays.includes(4),
            isActiveOnFriday: applyDays.includes(5),
            isActiveOnSaturday: applyDays.includes(6),
            isActiveOnSunday: applyDays.includes(0),
          },
        };
      }
      const iso = singleDate!;
      const [sh, sm] = window.timeFrom.split(':').map(Number);
      const [eh, em] = window.timeTo.split(':').map(Number);
      const start = new Date(iso);
      start.setUTCHours(sh, sm, 0, 0);
      const end = new Date(iso);
      end.setUTCHours(eh, em, 0, 0);
      return {
        employeeId: employee.id,
        employeeName: employee.name,
        isRepetitive: false,
        placeholder,
        singleBlock: { startTime: start.toISOString(), endTime: end.toISOString() },
      };
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
            startTime: Between(dayStart, dayEnd) as any,
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
      autoExecute: shouldAutoExecute(plan.intent, plan.steps.length, providerCount),
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
}
