import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not } from 'typeorm';
import { Employee } from '../employee/entities/employee.entity.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { BlockSchedule } from '../schedule/entities/block-schedule.entity.js';
import { ScheduleTemplate } from '../schedule/entities/schedule-template.entity.js';
import { SchedulingEngineService } from '../../engine/scheduling/scheduling-engine.service.js';
import { findScheduleGapsInWindow } from '../schedule/helpers/schedule-gap.helpers.js';
import { resolveDateRange } from './ai-orchestration.helpers.js';
import { PlanEntitlementsService } from '../billing/plan-entitlements.service.js';
import { isDashboardAiIntentAllowedByPlan } from '../billing/plan-dashboard-ai-intents.util.js';
import { AiSettingsService } from './ai-settings.service.js';
import { AiPlatformService } from './ai-platform.service.js';

export interface AiSuggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  prompt: string;
  category: 'schedule' | 'booking' | 'utilization' | 'conflict';
  /** When set, suggestion is hidden if the business plan blocks this intent. */
  intentHint?: string;
}

export interface AiSuggestionsContext {
  route?: string;
  scheduleTab?: string;
  viewMode?: string;
}

const ROUTE_CATEGORY_PRIORITY: Record<string, AiSuggestion['category'][]> = {
  '/dashboard/schedule': ['schedule', 'utilization', 'booking'],
  '/dashboard/calendar': ['conflict', 'schedule', 'utilization'],
  '/dashboard/bookings': ['booking', 'schedule'],
  '/dashboard/appointments': ['booking', 'utilization'],
};

@Injectable()
export class AiSuggestionsService {
  constructor(
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(SchedulingPeriod)
    private periodRepo: Repository<SchedulingPeriod>,
    @InjectRepository(BlockSchedule)
    private blockScheduleRepo: Repository<BlockSchedule>,
    @InjectRepository(ScheduleTemplate)
    private templateRepo: Repository<ScheduleTemplate>,
    private schedulingEngine: SchedulingEngineService,
    private planEntitlements: PlanEntitlementsService,
    private aiSettings: AiSettingsService,
    private platform: AiPlatformService,
  ) {}

  async getSuggestions(
    businessId: string,
    context?: AiSuggestionsContext,
  ): Promise<AiSuggestion[]> {
    const suggestions: AiSuggestion[] = [];
    const range = resolveDateRange({}, 'this week');
    if (!range) return suggestions;

    const start = new Date(range.start);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(range.end);
    end.setUTCHours(23, 59, 59, 999);

    const [employees, templates, periods, bookings, conflicts] =
      await Promise.all([
        this.employeeRepo.find({ where: { businessId, isActive: true } }),
        this.templateRepo.find({
          where: { businessId, isDeleted: false, isActive: true },
        }),
        this.periodRepo.find({
          where: { businessId, startTime: Between(start, end) as any },
        }),
        this.bookingRepo.find({
          where: {
            businessId,
            startTime: Between(start, end) as any,
            status: Not(BookingStatus.CANCELLED) as any,
          },
        }),
        this.schedulingEngine.findConflicts(businessId, { start, end }),
      ]);

    if (templates.length > 0 && employees.length > 0) {
      const template = templates[0];
      suggestions.push({
        id: 'apply-week',
        priority: 'high',
        title: 'Apply schedule template for this week',
        prompt: `Apply "${template.name}" template to all providers this week`,
        category: 'schedule',
        intentHint: 'apply_schedule',
      });
    }

    const employeesWithGaps: string[] = [];
    for (const employee of employees) {
      for (
        let d = new Date(start);
        d <= end;
        d.setUTCDate(d.getUTCDate() + 1)
      ) {
        const day = new Date(d);
        const dayStart = new Date(day);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setUTCHours(23, 59, 59, 999);
        const dayPeriods = periods.filter(
          (p) =>
            p.employeeId === employee.id &&
            p.startTime >= dayStart &&
            p.startTime <= dayEnd,
        );
        const gaps = findScheduleGapsInWindow(
          day,
          '09:00',
          '19:00',
          dayPeriods,
        );
        if (gaps.length > 0) {
          employeesWithGaps.push(employee.name);
          break;
        }
      }
    }

    if (employeesWithGaps.length > 0) {
      const names = [...new Set(employeesWithGaps)].slice(0, 3).join(', ');
      suggestions.push({
        id: 'fill-gaps',
        priority: 'medium',
        title: 'Fill schedule gaps this week',
        prompt: `Fill gaps between 9-19:00 for ${names} this week`,
        category: 'schedule',
        intentHint: 'fill_unused_slots',
      });
    }

    if (conflicts.length > 0) {
      suggestions.push({
        id: 'resolve-conflicts',
        priority: 'high',
        title: `${conflicts.length} scheduling conflict(s) detected`,
        prompt: 'Resolve scheduling conflicts this week',
        category: 'conflict',
        intentHint: 'resolve_conflicts',
      });
    }

    const cancelled = await this.bookingRepo.count({
      where: {
        businessId,
        status: BookingStatus.CANCELLED,
        startTime: Between(start, end),
      },
    });
    if (cancelled > 0) {
      suggestions.push({
        id: 'reassign-cancelled',
        priority: 'medium',
        title: `${cancelled} cancelled slot(s) this week`,
        prompt: 'Reassign cancelled appointments this week',
        category: 'booking',
        intentHint: 'reassign_cancelled',
      });
    }

    const util = await Promise.all(
      employees.map(async (e) => ({
        name: e.name,
        ...(await this.schedulingEngine.getEmployeeUtilization(
          e.id,
          start,
          end,
        )),
      })),
    );
    const lowUtil = util.filter((u) => (u.utilizationPercent ?? 100) < 50);
    if (lowUtil.length > 0) {
      suggestions.push({
        id: 'utilization',
        priority: 'low',
        title: 'Low utilization detected',
        prompt: `Summarize utilization this week — who has the most gaps?`,
        category: 'utilization',
        intentHint: 'summarize_utilization',
      });
    }

    if (bookings.length === 0 && employees.length > 0) {
      suggestions.push({
        id: 'no-bookings',
        priority: 'low',
        title: 'No bookings this week yet',
        prompt: 'Show all appointments for this week',
        category: 'booking',
      });
    }

    const entitlements =
      await this.planEntitlements.getEntitlements(businessId);
    const planFiltered = suggestions.filter(
      (s) =>
        !s.intentHint ||
        isDashboardAiIntentAllowedByPlan(entitlements.tierId, s.intentHint),
    );

    const filtered = this.filterForContext(planFiltered.slice(0, 6), context);
    const settings = await this.aiSettings.getSettings(businessId);
    const { suggestions: abSuggestions } = this.platform.applyAbToSuggestions(
      businessId,
      filtered,
      settings,
    );
    return abSuggestions;
  }

  private filterForContext(
    suggestions: AiSuggestion[],
    context?: AiSuggestionsContext,
  ): AiSuggestion[] {
    if (!context?.route || suggestions.length === 0) return suggestions;

    const categories = ROUTE_CATEGORY_PRIORITY[context.route];
    if (!categories) return suggestions;

    const prioritized = [
      ...categories.flatMap((cat) =>
        suggestions.filter((s) => s.category === cat),
      ),
      ...suggestions.filter((s) => !categories.includes(s.category)),
    ];

    const seen = new Set<string>();
    const unique = prioritized.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });

    return unique.slice(0, 4);
  }
}
