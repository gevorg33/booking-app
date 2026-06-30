import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import {
  Booking,
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { User } from '../user/entities/user.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { ProviderMobileService } from './provider-mobile.service.js';
import { findScheduleGapsInWindow } from '../schedule/helpers/schedule-gap.helpers.js';
import { todayDisplay } from '../../common/utils/date-format.util.js';
import {
  getDateKeyInTimezone,
  getUtcBoundsForDateKey,
  getWallClockNow,
  isWallClockStartStrictlyFutureAt,
  resolveBusinessWallClockTimezone,
} from '../../common/utils/timezone.util.js';
import { getBusinessDefaultLocale } from '../../common/utils/business-locale.util.js';
import type { AiSuggestion } from '../ai/ai-suggestions.service.js';
import {
  providerSuggestionText,
  resolveProviderSuggestionsLocale,
} from './provider-ai-suggestions.i18n.js';

@Injectable()
export class ProviderAiSuggestionsService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(SchedulingPeriod)
    private periodRepo: Repository<SchedulingPeriod>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    private providerMobile: ProviderMobileService,
  ) {}

  async getSuggestions(
    businessId: string,
    userId: string,
  ): Promise<AiSuggestion[]> {
    const access = await this.providerMobile.resolveMobileAccess(
      businessId,
      userId,
    );
    const employeeId = this.providerMobile.getScopedEmployeeId(access);

    const [user, business] = await Promise.all([
      this.userRepo.findOne({
        where: { id: userId },
        select: { locale: true },
      }),
      this.businessRepo.findOne({
        where: { id: businessId },
        select: { settings: true, timezone: true },
      }),
    ]);
    const settings = business?.settings as { locale?: string } | undefined;
    const locale = resolveProviderSuggestionsLocale(
      user?.locale,
      settings?.locale,
    );
    const wallClockTz = resolveBusinessWallClockTimezone(
      business?.timezone,
      getBusinessDefaultLocale(settings as Record<string, unknown> | undefined),
    );
    const wallNow = getWallClockNow(wallClockTz);
    const todayKey = getDateKeyInTimezone(new Date(), wallClockTz);
    const { start: today, end: dayEnd } = getUtcBoundsForDateKey(
      todayKey,
      'UTC',
    );
    const ts = (key: string, vars?: Record<string, string | number>) =>
      providerSuggestionText(locale, key, vars);
    const suggestions: AiSuggestion[] = [];

    const where: Record<string, unknown> = {
      businessId,
      startTime: Between(today, dayEnd),
      status: Not(In([BookingStatus.CANCELLED])),
    };
    if (employeeId) where.employeeId = employeeId;

    const todayBookings = await this.bookingRepo.find({
      where: where,
      relations: { customer: true, service: true },
      order: { startTime: 'ASC' },
    });

    const pendingConfirm = todayBookings.filter(
      (b) => b.status === BookingStatus.PENDING,
    );
    if (pendingConfirm.length > 0) {
      suggestions.push({
        id: 'confirm-pending',
        priority: 'high',
        title: ts('confirmPendingTitle', { count: pendingConfirm.length }),
        prompt: ts('confirmPendingPrompt'),
        category: 'booking',
      });
    }

    const unpaid = todayBookings.filter(
      (b) =>
        (b.status === BookingStatus.COMPLETED ||
          b.status === BookingStatus.IN_PROGRESS) &&
        b.paymentStatus === PaymentStatus.PENDING,
    );
    if (unpaid.length > 0) {
      suggestions.push({
        id: 'unpaid-today',
        priority: 'high',
        title: ts('unpaidTodayTitle', { count: unpaid.length }),
        prompt: ts('unpaidTodayPrompt'),
        category: 'booking',
      });
    }

    if (employeeId) {
      const periods = await this.periodRepo.find({
        where: {
          businessId,
          employeeId,
          startTime: Between(today, dayEnd),
        },
      });
      const gaps = findScheduleGapsInWindow(today, '09:00', '19:00', periods);
      if (gaps.length > 0) {
        suggestions.push({
          id: 'gaps-today',
          priority: 'medium',
          title: ts('gapsTodayTitle', { count: gaps.length }),
          prompt: ts('gapsTodayPrompt'),
          category: 'schedule',
        });
      }
    }

    const upcoming = todayBookings.filter(
      (b) =>
        b.status !== BookingStatus.COMPLETED &&
        isWallClockStartStrictlyFutureAt(b.startTime, wallNow),
    );
    if (upcoming.length > 0) {
      const next = upcoming[0];
      const customer = next.customer?.name ?? ts('defaultClient');
      const time = next.startTime.toISOString().slice(11, 16);
      suggestions.push({
        id: 'next-up',
        priority: 'low',
        title: ts('nextUpTitle', { customer, time }),
        prompt: ts('nextUpPrompt', { customer, time }),
        category: 'booking',
      });
    }

    if (suggestions.length === 0 && todayBookings.length === 0) {
      suggestions.push({
        id: 'empty-today',
        priority: 'low',
        title: ts('emptyTodayTitle'),
        prompt: ts('emptyTodayPrompt', { date: todayDisplay() }),
        category: 'booking',
      });
    }

    return suggestions.slice(0, 3);
  }
}
