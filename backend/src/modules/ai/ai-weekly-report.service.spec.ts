import { describe, expect, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { SchedulingEngineService } from '../../engine/scheduling/scheduling-engine.service.js';
import { AiIntelligenceService } from './ai-intelligence.service.js';
import { AiWeeklyReportService } from './ai-weekly-report.service.js';
import * as helpers from './ai-orchestration.helpers.js';

describe('AiWeeklyReportService', () => {
  const bookingRepo = {
    find: jest.fn(),
    count: jest.fn(),
  };
  const businessRepo = {
    findOne: jest
      .fn()
      .mockResolvedValue({ id: 'biz-1', settings: { currency: 'USD' } }),
  };
  const employeeRepo = {
    find: jest.fn(),
  };
  const schedulingEngine = {
    findConflicts: jest.fn(),
  };
  const intelligence = {
    generateWeeklyReport: jest.fn(),
  };

  const service = new AiWeeklyReportService(
    bookingRepo as any,
    businessRepo as any,
    employeeRepo as any,
    schedulingEngine as any,
    intelligence as any,
  );

  it('constructs through Nest DI', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiWeeklyReportService,
        { provide: getRepositoryToken(Booking), useValue: bookingRepo },
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        { provide: getRepositoryToken(Employee), useValue: employeeRepo },
        { provide: SchedulingEngineService, useValue: schedulingEngine },
        { provide: AiIntelligenceService, useValue: intelligence },
      ],
    }).compile();
    expect(moduleRef.get(AiWeeklyReportService)).toBeInstanceOf(
      AiWeeklyReportService,
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
    employeeRepo.find.mockResolvedValue([
      { id: 'e1', name: 'Anna', isActive: true },
    ]);
    bookingRepo.find.mockResolvedValue([
      {
        status: BookingStatus.COMPLETED,
        startTime: new Date(),
        service: { price: 50 },
        metadata: {},
      },
    ]);
    bookingRepo.count.mockResolvedValue(2);
    schedulingEngine.findConflicts.mockResolvedValue([{ bookings: [] }]);
  });

  it('returns empty report when date range cannot be resolved', async () => {
    const spy = jest.spyOn(helpers, 'resolveDateRange').mockReturnValue(null);
    const report = await service.getWeeklyReport('biz-1');
    expect(report.sections).toEqual([]);
    expect(report.generated).toBe(false);
    spy.mockRestore();
  });

  it('returns fallback report with tenant-formatted revenue when LLM is unavailable', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { currency: 'AMD' },
    });
    intelligence.generateWeeklyReport.mockResolvedValue(null);
    const report = await service.getWeeklyReport('biz-1');
    expect(report.generated).toBe(false);
    expect(report.sections.length).toBeGreaterThan(0);
    expect(report.sections[0]?.body).toMatch(/(֏|AMD)/);
    expect(report.snapshot).toMatchObject({
      staffCount: 1,
      conflictCount: 1,
    });
  });

  it('aggregates revenue from metadata and counts no-shows', async () => {
    bookingRepo.find.mockResolvedValue([
      {
        status: BookingStatus.NO_SHOW,
        startTime: new Date(),
        service: null,
        metadata: { price: 40 },
      },
      {
        status: BookingStatus.COMPLETED,
        startTime: new Date(),
        service: { price: 60 },
        metadata: {},
      },
      {
        status: BookingStatus.CONFIRMED,
        startTime: new Date(),
        service: null,
        metadata: {},
      },
    ]);
    intelligence.generateWeeklyReport.mockResolvedValue(null);
    const report = await service.getWeeklyReport('biz-1');
    expect(report.snapshot).toMatchObject({
      totalBookings: 3,
      revenue: 100,
      noShows: 1,
    });
  });

  it('returns AI-generated sections when available', async () => {
    intelligence.generateWeeklyReport.mockResolvedValue({
      title: 'Week in review',
      sections: [{ heading: 'Gaps', body: 'Anna has open slots Tue–Thu.' }],
    });
    const report = await service.getWeeklyReport('biz-1');
    expect(report.generated).toBe(true);
    expect(report.title).toBe('Week in review');
    expect(report.sections[0].heading).toBe('Gaps');
    expect(intelligence.generateWeeklyReport).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({ totalBookings: 1 }),
    );
  });
});
