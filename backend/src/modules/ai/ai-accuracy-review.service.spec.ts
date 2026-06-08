import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Business } from '../business/entities/business.entity.js';
import { EmailService } from '../notifications/email.service.js';
import { AiAccuracyReviewService } from './ai-accuracy-review.service.js';
import { AiAccuracyRatchetService } from './ai-accuracy-ratchet.service.js';
import { AiCommandTraceService } from './ai-command-trace.service.js';
import { AiEventsService } from './ai-events.service.js';
import { AiSettingsService } from './ai-settings.service.js';

describe('AiAccuracyReviewService (acc-6.1)', () => {
  const businessRepo = { findOne: jest.fn(), find: jest.fn() };
  const commandTrace = {
    loadTraceAnalyticsRowsForEval: jest.fn(),
    getAccuracyAnalytics: jest.fn(),
  };
  const aiEvents = { emitAlert: jest.fn() };
  const emailService = { send: jest.fn() };
  const aiSettings = {
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
  };
  const ratchetService = {
    getStatus: jest.fn(),
  };

  let service: AiAccuracyReviewService;

  beforeEach(async () => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      name: 'Demo Salon',
      email: 'owner@example.com',
    });
    aiSettings.getSettings.mockResolvedValue({});
    aiSettings.updateSettings.mockResolvedValue({});
    emailService.send.mockResolvedValue({ ok: true });
    ratchetService.getStatus.mockReturnValue({
      ciTarget: 0.99,
      ciFloor: 1,
      measuredAccuracy: 1,
      floorProgressPct: 100,
      gapToTargetPts: 0,
      ratchet: { shouldBump: false, reason: 'Already at target floor' },
      ladder: { currentStage: 4, targetStage: 4, stages: [] },
      baselineUpdatedAt: '2026-06-07',
      ratchetHistory: [],
    });
    commandTrace.loadTraceAnalyticsRowsForEval.mockResolvedValue([]);
    commandTrace.getAccuracyAnalytics.mockResolvedValue({
      periodDays: 30,
      totalCommands: 0,
      noClarifyCompletionRate: 0,
      byIntent: {},
      byLocale: {},
      bySurface: {},
      confusionMatrix: [],
      worstPrompts: [],
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        AiAccuracyReviewService,
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        { provide: AiCommandTraceService, useValue: commandTrace },
        { provide: AiEventsService, useValue: aiEvents },
        { provide: EmailService, useValue: emailService },
        { provide: AiSettingsService, useValue: aiSettings },
        { provide: AiAccuracyRatchetService, useValue: ratchetService },
      ],
    }).compile();
    service = moduleRef.get(AiAccuracyReviewService);
  });

  it('publishWeeklyReviewForBusiness sends alert, email, and persists digest', async () => {
    const result = await service.publishWeeklyReviewForBusiness('biz-1');
    expect(result).toEqual({ alertSent: true, emailed: true });
    expect(aiEvents.emitAlert).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({ title: 'Weekly AI accuracy review' }),
    );
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'owner@example.com' }),
    );
    expect(aiSettings.updateSettings).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        accuracyProgram: expect.objectContaining({
          lastWeeklyReviewPublishedAt: expect.any(String),
        }),
      }),
    );
  });

  it('buildReviewDigest returns lastPublishedAt from settings', async () => {
    aiSettings.getSettings.mockResolvedValue({
      accuracyProgram: { lastWeeklyReviewPublishedAt: '2026-06-01T00:00:00.000Z' },
    });
    const digest = await service.buildReviewDigest('biz-1', 7);
    expect(digest.lastPublishedAt).toBe('2026-06-01T00:00:00.000Z');
  });

  it('buildProgramStatus includes ratchet status from ratchet service', async () => {
    const program = await service.buildProgramStatus('biz-1', 30);
    expect(ratchetService.getStatus).toHaveBeenCalled();
    expect(program.ratchet).toMatchObject({ ciTarget: 0.99 });
    expect(program.ladder).toBeDefined();
  });
});
