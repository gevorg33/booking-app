import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { Booking, BookingStatus, PaymentStatus } from '../booking/entities/booking.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { ProviderMobileService } from './provider-mobile.service.js';
import { findScheduleGapsInWindow } from '../schedule/helpers/schedule-gap.helpers.js';
import { todayDisplay } from '../../common/utils/date-format.util.js';
import type { AiSuggestion } from '../ai/ai-suggestions.service.js';

@Injectable()
export class ProviderAiSuggestionsService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(SchedulingPeriod) private periodRepo: Repository<SchedulingPeriod>,
    private providerMobile: ProviderMobileService,
  ) {}

  async getSuggestions(businessId: string, userId: string): Promise<AiSuggestion[]> {
    const access = await this.providerMobile.resolveMobileAccess(businessId, userId);
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const suggestions: AiSuggestion[] = [];

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(today);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const where: Record<string, unknown> = {
      businessId,
      startTime: Between(today, dayEnd),
      status: Not(In([BookingStatus.CANCELLED])),
    };
    if (employeeId) where.employeeId = employeeId;

    const todayBookings = await this.bookingRepo.find({
      where: where as any,
      relations: { customer: true, service: true },
      order: { startTime: 'ASC' },
    });

    const pendingConfirm = todayBookings.filter((b) => b.status === BookingStatus.PENDING);
    if (pendingConfirm.length > 0) {
      suggestions.push({
        id: 'confirm-pending',
        priority: 'high',
        title: `${pendingConfirm.length} appointment${pendingConfirm.length === 1 ? '' : 's'} need confirmation`,
        prompt: 'Show my appointments today that still need confirmation',
        category: 'booking',
      });
    }

    const unpaid = todayBookings.filter(
      (b) =>
        (b.status === BookingStatus.COMPLETED || b.status === BookingStatus.IN_PROGRESS) &&
        b.paymentStatus === PaymentStatus.PENDING,
    );
    if (unpaid.length > 0) {
      suggestions.push({
        id: 'unpaid-today',
        priority: 'high',
        title: `${unpaid.length} unpaid appointment${unpaid.length === 1 ? '' : 's'} today`,
        prompt: 'Mark all completed appointments today as paid',
        category: 'booking',
      });
    }

    if (employeeId) {
      const periods = await this.periodRepo.find({
        where: {
          businessId,
          employeeId,
          startTime: Between(today, dayEnd) as any,
        },
      });
      const gaps = findScheduleGapsInWindow(today, '09:00', '19:00', periods);
      if (gaps.length > 0) {
        suggestions.push({
          id: 'gaps-today',
          priority: 'medium',
          title: `${gaps.length} open slot${gaps.length === 1 ? '' : 's'} this afternoon`,
          prompt: "What's on my schedule this afternoon? Any gaps?",
          category: 'schedule',
        });
      }
    }

    const upcoming = todayBookings.filter(
      (b) => b.startTime > new Date() && b.status !== BookingStatus.COMPLETED,
    );
    if (upcoming.length > 0) {
      const next = upcoming[0];
      const customer = next.customer?.name ?? 'client';
      const time = next.startTime.toISOString().slice(11, 16);
      suggestions.push({
        id: 'next-up',
        priority: 'low',
        title: `Next: ${customer} at ${time}`,
        prompt: `Mark ${customer}'s appointment at ${time} as done and paid`,
        category: 'booking',
      });
    }

    if (suggestions.length === 0 && todayBookings.length === 0) {
      suggestions.push({
        id: 'empty-today',
        priority: 'low',
        title: 'No appointments today',
        prompt: `Summarize my schedule for ${todayDisplay()}`,
        category: 'booking',
      });
    }

    return suggestions.slice(0, 3);
  }
}
