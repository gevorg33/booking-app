import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { Employee } from '../employee/entities/employee.entity.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { BlockSchedule } from '../schedule/entities/block-schedule.entity.js';
import { ScheduleTemplate } from '../schedule/entities/schedule-template.entity.js';
import { SchedulingEngineService } from '../../engine/scheduling/scheduling-engine.service.js';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import { resolveDateRange } from './ai-orchestration.helpers.js';
import type { AiSuggestion } from './ai-suggestions.service.js';
import type { AiSuggestionsContext } from './ai-suggestions.service.js';

interface LlmSuggestionsResult {
  suggestions: Array<{
    id: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    prompt: string;
    category: 'schedule' | 'booking' | 'utilization' | 'conflict';
  }>;
}

@Injectable()
export class AiSuggestionsLlmService {
  private readonly logger = new Logger(AiSuggestionsLlmService.name);

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
    private openAi: OpenAiGatewayService,
  ) {}

  async generateSuggestions(
    businessId: string,
    context?: AiSuggestionsContext,
    surface: 'dashboard' | 'provider_mobile' = 'dashboard',
  ): Promise<AiSuggestion[]> {
    const snapshot = await this.buildOperationalSnapshot(businessId, context);

    if (!(await this.openAi.isAvailableForBusiness(businessId))) {
      return [];
    }

    const system = `You are Orchestrix proactive AI. Given operational data, suggest 3-6 actionable NL commands the user should run.
Return JSON: { "suggestions": [{ "id": "unique_snake_id", "priority": "high"|"medium"|"low", "title": "short label", "prompt": "full command to run", "category": "schedule"|"booking"|"utilization"|"conflict" }] }
Surface: ${surface}. Route context: ${context?.route ?? 'home'}.
Use real employee/service/template names from data. Prioritize conflicts, gaps, unpaid, no-shows.`;

    const result = await this.openAi.completeJson<LlmSuggestionsResult>(
      {
        businessId,
        surface,
        operation: 'proactive_suggestions',
        actorType: 'system',
      },
      system,
      JSON.stringify(snapshot),
      { maxTokens: 900 },
    );

    return (result?.suggestions ?? []).slice(0, 8);
  }

  private async buildOperationalSnapshot(
    businessId: string,
    context?: AiSuggestionsContext,
  ): Promise<Record<string, unknown>> {
    const range = resolveDateRange({}, 'this week');
    const start = range ? new Date(range.start) : new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = range ? new Date(range.end) : new Date();
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
          take: 200,
        }),
        this.schedulingEngine.findConflicts(businessId, { start, end }),
      ]);

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const todayBookings = bookings.filter(
      (b) => b.startTime >= todayStart && b.startTime <= todayEnd,
    );

    return {
      route: context?.route,
      scheduleTab: context?.scheduleTab,
      viewMode: context?.viewMode,
      employees: employees.map((e) => e.name),
      templates: templates.map((t) => t.name),
      periodCount: periods.length,
      bookingCountWeek: bookings.length,
      todayBookingCount: todayBookings.length,
      conflictCount: conflicts.length,
      conflicts: conflicts.slice(0, 5),
      unpaidToday: todayBookings.filter((b) => b.paymentStatus === 'pending')
        .length,
      cancelledToday: todayBookings.filter(
        (b) => b.status === BookingStatus.CANCELLED,
      ).length,
    };
  }
}
