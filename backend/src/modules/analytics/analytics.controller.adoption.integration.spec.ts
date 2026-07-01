import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { AppEventService } from './app-event.service.js';
import { BusinessService } from '../business/business.service.js';

describe('AnalyticsController adoption integration (adopt-1.7)', () => {
  const analyticsService = {} as AnalyticsService;
  const appEventService = {
    getAdoptionDashboard: jest.fn(),
  } as unknown as AppEventService;
  const businessService = {
    ensureMember: jest.fn(),
  } as unknown as BusinessService;

  const controller = new AnalyticsController(
    analyticsService,
    appEventService,
    businessService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /businesses/:id/analytics/adoption delegates to app event service', async () => {
    appEventService.getAdoptionDashboard = jest.fn().mockResolvedValue({
      periodDays: 30,
      funnel: { steps: [], breakdowns: [] },
      retention: { cohortSize: 0 },
      activation: {
        installedCount: 0,
        activatedCount: 0,
        activationRate: 0,
        windowDays: 7,
      },
      qualifiedActivation: {
        installedCount: 0,
        activatedCount: 0,
        activationRate: 0,
        windowDays: 7,
      },
      coldActivation: {
        installedCount: 0,
        activatedCount: 0,
        activationRate: 0,
        windowDays: 7,
      },
      n99QualifiedExitGate: {
        met: false,
        failures: ['Intent-qualified install → activation (7d)'],
        criteria: [],
        periodDays: 7,
        target: 0.99,
        floor: 0.9,
        qualifiedActivationRate: 0,
        sampleSize: 0,
        localeSpread: 0,
      },
      headlines: {
        pushOptInRate: null,
        crashFreeSessionRate: null,
        crashFreeSessionSloMet: null,
        startupTtiWithinBudgetRate: null,
        startupTtiSloMet: null,
        referralKFactor: null,
      },
      weeklyActivationAlert: {
        triggered: false,
        currentWeekRate: 0,
        previousWeekRate: 0,
        deltaPoints: 0,
        thresholdPoints: 0.02,
      },
      weeklyStartupTtiRegressionAlert: {
        triggered: false,
        currentWeekRate: null,
        previousWeekRate: null,
        deltaPoints: 0,
        thresholdPoints: 0.03,
      },
      exitGate: {
        met: false,
        failures: ['Install → activation (7d)'],
        criteria: [],
        periodDays: 30,
      },
    });

    const result = await controller.adoption(
      'biz-1',
      { days: 30 },
      { id: 'user-1' },
    );

    expect(businessService.ensureMember).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
    );
    expect(appEventService.getAdoptionDashboard).toHaveBeenCalledWith(
      'biz-1',
      30,
    );
    expect(result.periodDays).toBe(30);
  });
});
