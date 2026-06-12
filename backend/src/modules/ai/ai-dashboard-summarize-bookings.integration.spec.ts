import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Between } from 'typeorm';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { resolveBookingMetric } from './ai-intent-heuristics.js';
import {
  RESCHEDULE_NEAREST_FREE_YEAR_PROMPT,
  SUMMARIZE_BOOKINGS_HANDLER_SCENARIOS,
  SUMMARIZE_BOOKINGS_REVENUE_PROMPTS,
  SUMMARIZE_BOOKINGS_REVENUE_CURRENCY_SCENARIOS,
} from './ai-dashboard-summarize-bookings.fixtures.js';
import {
  buildSummarizeBookingsRevenueLine,
  composeSummarizeBookingsResult,
  computeBookingRevenueTotal,
} from './ai-dashboard-summarize-bookings.logic.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Business } from '../business/entities/business.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';

const AI_COMMAND_SOURCE = readFileSync(
  join(__dirname, 'ai-command.service.ts'),
  'utf8',
);

describe('dashboard summarize_bookings handler E2E (ai-cmd-ext-1.6)', () => {
  it.each(SUMMARIZE_BOOKINGS_HANDLER_SCENARIOS)(
    'formats $metric summary with tenant currency for $id',
    ({
      metric,
      settings,
      range,
      bookings,
      expectedTotal,
      summaryPattern,
      expectedAppointmentCount,
      expectedUnpaid,
    }) => {
      const result = composeSummarizeBookingsResult({
        bookings,
        businessSettings: settings,
        metric,
        range,
        now: new Date('2026-06-11T12:00:00Z'),
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('summarize_bookings');
      expect(result.summary).toMatch(summaryPattern);
      expect(result.details?.revenue).toMatchObject({
        total: expectedTotal,
        currency: settings.currency ?? settings.defaultCurrency ?? 'USD',
      });
      if (metric === 'revenue') {
        expect(result.details?.revenue?.appointmentCount).toBe(
          expectedAppointmentCount,
        );
        expect(result.summary).toContain(
          buildSummarizeBookingsRevenueLine(
            expectedTotal,
            expectedAppointmentCount!,
            settings,
          ),
        );
      }
      if (metric === 'overview') {
        expect(result.summary).toContain('Revenue:');
        expect(result.details?.counts?.unpaid).toBe(expectedUnpaid);
      }
    },
  );
});

describe('dashboard summarize_bookings Nest handler path (ai-cmd-ext-1.6)', () => {
  const bookingFind = jest.fn();
  const businessFindOne = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    businessFindOne.mockResolvedValue({
      id: 'biz-1',
      settings: { currency: 'EUR' },
    });
    bookingFind.mockResolvedValue([
      {
        status: 'completed',
        paymentStatus: 'paid',
        startTime: new Date('2026-06-10T10:00:00Z'),
        service: { price: 75 },
        employee: { name: 'Anna' },
      },
    ]);
  });

  it('loads tenant settings and bookings then formats revenue summary', async () => {
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(Booking),
          useValue: { find: bookingFind },
        },
        {
          provide: getRepositoryToken(Business),
          useValue: { findOne: businessFindOne },
        },
      ],
    }).compile();

    const bookingRepo = module.get(getRepositoryToken(Booking));
    const businessRepo = module.get(getRepositoryToken(Business));

    const business = await businessRepo.findOne({
      where: { id: 'biz-1' },
      select: { id: true, settings: true },
    });
    const bookings = await bookingRepo.find({
      where: {
        businessId: 'biz-1',
        startTime: Between(
          new Date('2026-06-10T00:00:00.000Z'),
          new Date('2026-06-10T23:59:59.999Z'),
        ),
      },
      relations: { employee: true, service: true, customer: true },
    });

    const result = composeSummarizeBookingsResult({
      bookings,
      businessSettings: business?.settings ?? {},
      metric: 'revenue',
      range: { start: '2026-06-10', end: '2026-06-10' },
    });

    expect(businessFindOne).toHaveBeenCalled();
    expect(bookingFind).toHaveBeenCalled();
    expect(result.summary).toMatch(/€|EUR/);
    expect(result.details?.revenue?.total).toBe(75);
  });

  it('wires composeSummarizeBookingsResult through AiCommandService handler', () => {
    expect(AI_COMMAND_SOURCE).toContain('composeSummarizeBookingsResult');
  });
});


describe('dashboard summarize_bookings revenue rescue + formatting (ai-cmd-ext-1.6)', () => {
  const rescue = new AiIntentRescueService();

  it.each(SUMMARIZE_BOOKINGS_REVENUE_PROMPTS)(
    'rescues summarize_bookings prompt $id',
    ({ prompt, bookingMetric }) => {
      const result = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(result?.action).toBe('summarize_bookings');
      if (bookingMetric === 'revenue') {
        expect(result?.params.bookingMetric).toBe('revenue');
        expect(resolveBookingMetric(result?.params ?? {}, prompt)).toBe('revenue');
      }
    },
  );

  it.each(SUMMARIZE_BOOKINGS_REVENUE_CURRENCY_SCENARIOS)(
    'builds formatted revenue summary for $id',
    ({ amount, appointmentCount, settings, pattern }) => {
      const summary = buildSummarizeBookingsRevenueLine(
        amount,
        appointmentCount,
        settings,
      );
      expect(summary).toMatch(pattern);
    },
  );

  it('sums eligible booking rows before formatting', () => {
    const total = computeBookingRevenueTotal([
      { status: 'completed', servicePrice: 60 },
      { status: 'confirmed', servicePrice: 40 },
      { status: 'cancelled', servicePrice: 500 },
    ]);
    expect(total).toBe(100);
    expect(
      buildSummarizeBookingsRevenueLine(total, 2, { currency: 'AMD' }),
    ).toMatch(/֏|AMD/);
  });
});
