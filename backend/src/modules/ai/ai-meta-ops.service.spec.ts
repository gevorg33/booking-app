import { AiMetaOpsService } from './ai-meta-ops.service.js';

function buildService(overrides: Record<string, any> = {}) {
  const briefingService = {
    getMorningBriefing: jest.fn(async () => ({
      date: '2026-07-13',
      utilizationPercent: 62,
      todaysBookings: 8,
      cancellationsToday: 1,
      conflictsToday: 0,
      unpaidToday: 2,
      highlights: ['Maria fully booked'],
      suggestedActions: [],
    })),
    ...overrides.briefingService,
  };
  const weeklyReportService = {
    getWeeklyReport: jest.fn(async () => ({
      title: 'Weekly operations summary',
      sections: [{ heading: 'Overview', body: '40 bookings, $2,000 revenue' }],
      generated: true,
    })),
    ...overrides.weeklyReportService,
  };
  const auditService = {
    getAuditLog: jest.fn(async () => [
      {
        id: 'a1',
        eventType: 'AGENT_PLAN_COMPLETED',
        taskId: 't1',
        summary: 'Filled schedule gaps for Gevorg',
        payload: {},
        timestamp: '2026-07-13T09:00:00.000Z',
      },
    ]),
    ...overrides.auditService,
  };
  const aiSettings = {
    getSettings: jest.fn(async () => ({
      autopilot: {
        enabled: true,
        rules: [
          {
            id: 'r1',
            name: 'Auto-fill small gaps',
            enabled: true,
            prompt: 'x',
          },
          {
            id: 'r2',
            name: 'Sunday weekday template',
            enabled: false,
            prompt: 'y',
          },
        ],
      },
      macros: [{ id: 'm1', name: 'Monday setup', prompt: 'z' }],
      playbooks: [],
      confidence: { low: 0.4, high: 0.8 },
    })),
    updateSettings: jest.fn(async (_biz, patch) => ({
      autopilot: {
        enabled: true,
        rules: [
          {
            id: 'r1',
            name: 'Auto-fill small gaps',
            enabled: true,
            prompt: 'x',
          },
          {
            id: 'r2',
            name: 'Sunday weekday template',
            enabled: false,
            prompt: 'y',
          },
        ],
        ...patch.autopilot,
      },
      macros: [{ id: 'm1', name: 'Monday setup', prompt: 'z' }],
      playbooks: [],
      confidence: { low: 0.4, high: 0.8 },
    })),
    ...overrides.aiSettings,
  };
  const platform = {
    getCommandAnalytics: jest.fn(async () => ({
      periodDays: 30,
      totalCommands: 120,
      successRate: 0.9,
      clarifyRate: 0.05,
      approvalRate: 0.2,
      autoExecuteRate: 0.6,
      byIntent: {},
      byLocationId: {},
      targets: {
        completionRate: 0.9,
        clarifyRecoveryRate: 0.5,
        autoExecuteRate: 0.5,
        approvalExecuteRate: 0.5,
      },
    })),
    ...overrides.platform,
  };
  const planEntitlements = {
    getEntitlements: jest.fn(async () => ({
      tierId: 'growth',
      tierName: 'Growth',
      isPaid: true,
      subscriptionPlanId: 'plan-1',
      limits: {
        tierId: 'growth',
        tierName: 'Growth',
        maxProviderSeats: 5,
        aiCommandsPerMonth: 500,
        flags: {},
      },
      usage: { providerSeats: 3, aiCommandsThisMonth: 120 },
      flags: {},
      atLimit: { providerSeats: false, aiCommands: false },
      aiUsageWarning: false,
    })),
    ...overrides.planEntitlements,
  };

  const service = new AiMetaOpsService(
    briefingService as any,
    weeklyReportService as any,
    auditService as any,
    aiSettings as any,
    platform as any,
    planEntitlements as any,
  );
  return {
    service,
    briefingService,
    weeklyReportService,
    auditService,
    aiSettings,
    platform,
    planEntitlements,
  };
}

describe('AiMetaOpsService (ai-cmd-dashboard-6.1.4/6.1.5)', () => {
  describe('handleSummarizeAiBriefing', () => {
    it('summarizes the morning briefing', async () => {
      const { service } = buildService();
      const result = await service.handleSummarizeAiBriefing('biz-1');
      expect(result.success).toBe(true);
      expect(result.action).toBe('summarize_ai_briefing');
      expect(result.summary).toContain('8 booking(s)');
      expect(result.summary).toContain('Maria fully booked');
    });
  });

  describe('handleSummarizeAiWeeklyReport', () => {
    it('summarizes the weekly report sections', async () => {
      const { service } = buildService();
      const result = await service.handleSummarizeAiWeeklyReport('biz-1');
      expect(result.success).toBe(true);
      expect(result.action).toBe('summarize_ai_weekly_report');
      expect(result.summary).toContain('Overview: 40 bookings, $2,000 revenue');
    });
  });

  describe('handleExplainAiAuditLog', () => {
    it('reports no actions when the log is empty', async () => {
      const { service } = buildService({
        auditService: { getAuditLog: jest.fn(async () => []) },
      });
      const result = await service.handleExplainAiAuditLog('biz-1', {});
      expect(result.success).toBe(true);
      expect(result.summary).toBe('No AI actions recorded yet.');
    });

    it('lists recent audit entries and respects limit', async () => {
      const { service, auditService } = buildService();
      const result = await service.handleExplainAiAuditLog('biz-1', {
        limit: 10,
      });
      expect(auditService.getAuditLog).toHaveBeenCalledWith('biz-1', 10);
      expect(result.success).toBe(true);
      expect(result.summary).toContain('1 recent AI action(s):');
      expect(result.summary).toContain('Filled schedule gaps for Gevorg');
    });
  });

  describe('handleExplainAiUsageAnalytics', () => {
    it('summarizes usage rates', async () => {
      const { service, platform } = buildService();
      const result = await service.handleExplainAiUsageAnalytics('biz-1', {
        days: 14,
      });
      expect(platform.getCommandAnalytics).toHaveBeenCalledWith('biz-1', 14);
      expect(result.success).toBe(true);
      expect(result.summary).toContain('120 command(s)');
      expect(result.summary).toContain('Success rate: 90%');
    });
  });

  describe('handleExplainAiCapabilities', () => {
    it('summarizes plan tier and grounded monthly quota', async () => {
      const { service } = buildService();
      const result = await service.handleExplainAiCapabilities(
        'biz-1',
        'owner',
      );
      expect(result.success).toBe(true);
      expect(result.summary).toContain('Plan: Growth');
      expect(result.summary).toContain(
        'AI commands this month: 120 used of 500 (380 left)',
      );
      expect(result.summary).toContain('within your AI command quota');
      expect(result.summary).toContain('not a usage quota');
      expect(result.details).toMatchObject({
        aiCommandsThisMonth: 120,
        aiCommandsPerMonth: 500,
        aiCommandsRemaining: 380,
        atAiCommandLimit: false,
        allowedIntentCountIsNotUsageQuota: true,
      });
      // e2e-bug.162 — never present allowedIntentCount as the monthly limit.
      expect(result.summary).not.toMatch(/limit of \d+/i);
      expect(result.details!.aiCommandsPerMonth).not.toBe(
        result.details!.allowedIntentCount,
      );
    });

    it('e2e-bug.162: under-quota business reports remaining, not exceeded', async () => {
      const { service } = buildService({
        planEntitlements: {
          getEntitlements: jest.fn(async () => ({
            tierId: 'business',
            tierName: 'Business',
            isPaid: true,
            subscriptionPlanId: 'plan-biz',
            limits: {
              tierId: 'business',
              tierName: 'Business',
              maxProviderSeats: 10,
              aiCommandsPerMonth: 5000,
              flags: {},
            },
            usage: { providerSeats: 4, aiCommandsThisMonth: 661 },
            flags: {},
            atLimit: { providerSeats: false, aiCommands: false },
            aiUsageWarning: false,
          })),
        },
      });
      const result = await service.handleExplainAiCapabilities(
        'biz-1',
        'owner',
      );
      expect(result.summary).toContain(
        'AI commands this month: 661 used of 5000 (4339 left)',
      );
      expect(result.summary).toContain('within your AI command quota');
      expect(result.summary).not.toMatch(/exceeded/i);
      expect(result.details).toMatchObject({
        aiCommandsPerMonth: 5000,
        aiCommandsRemaining: 4339,
        atAiCommandLimit: false,
      });
      // Fabricated "limit of 382" came from allowedIntents.length — must not leak as quota.
      expect(String(result.summary)).not.toContain('limit of 382');
      expect(result.details!.aiCommandsPerMonth).toBe(5000);
    });

    it('flags when at the AI command limit', async () => {
      const { service } = buildService({
        planEntitlements: {
          getEntitlements: jest.fn(async () => ({
            tierId: 'solo',
            tierName: 'Solo',
            isPaid: false,
            subscriptionPlanId: null,
            limits: {
              tierId: 'solo',
              tierName: 'Solo',
              maxProviderSeats: 1,
              aiCommandsPerMonth: 25,
              flags: {},
            },
            usage: { providerSeats: 1, aiCommandsThisMonth: 25 },
            flags: {},
            atLimit: { providerSeats: false, aiCommands: true },
            aiUsageWarning: false,
          })),
        },
      });
      const result = await service.handleExplainAiCapabilities(
        'biz-1',
        'owner',
      );
      expect(result.summary).toContain('at your AI command limit');
      expect(result.summary).toContain('25 used of 25 (0 left)');
      expect(result.details).toMatchObject({
        atAiCommandLimit: true,
        aiCommandsRemaining: 0,
      });
    });
  });

  describe('handleSummarizeAiSettings', () => {
    it('summarizes current settings', async () => {
      const { service } = buildService();
      const result = await service.handleSummarizeAiSettings('biz-1');
      expect(result.success).toBe(true);
      expect(result.summary).toContain('Autopilot: ON (1/2 rule(s) enabled)');
      expect(result.summary).toContain('Macros: 1 saved');
    });
  });

  describe('handleConfigureAiAutopilot', () => {
    it('asks for clarification when nothing to change is specified', async () => {
      const { service } = buildService();
      const result = await service.handleConfigureAiAutopilot('biz-1', {});
      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({ clarify: true });
    });

    it('toggles the overall autopilot switch', async () => {
      const { service, aiSettings } = buildService();
      const result = await service.handleConfigureAiAutopilot('biz-1', {
        enabled: false,
      });
      expect(result.success).toBe(true);
      expect(result.summary).toBe('AI autopilot turned off.');
      expect(aiSettings.updateSettings).toHaveBeenCalledWith('biz-1', {
        autopilot: expect.objectContaining({ enabled: false }),
      });
    });

    it('toggles a specific rule by name', async () => {
      const { service } = buildService();
      const result = await service.handleConfigureAiAutopilot('biz-1', {
        ruleName: 'Sunday weekday template',
        enabled: true,
      });
      expect(result.success).toBe(true);
      expect(result.summary).toBe(
        'Sunday weekday template autopilot rule enabled.',
      );
    });

    it('fails clearly when no rule matches', async () => {
      const { service } = buildService();
      const result = await service.handleConfigureAiAutopilot('biz-1', {
        ruleName: 'Nonexistent rule',
      });
      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({ clarify: true });
    });
  });

  describe('dispatchIntent', () => {
    it('routes known meta-ops actions and returns null otherwise', async () => {
      const { service } = buildService();
      const result = await service.dispatchIntent({
        businessId: 'biz-1',
        action: 'summarize_ai_briefing',
        params: {},
      });
      expect(result?.action).toBe('summarize_ai_briefing');

      const unknown = await service.dispatchIntent({
        businessId: 'biz-1',
        action: 'list_bookings',
        params: {},
      });
      expect(unknown).toBeNull();
    });
  });
});
