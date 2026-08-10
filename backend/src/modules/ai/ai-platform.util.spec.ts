import * as platformUtil from './ai-platform.util.js';
import {
  aggregateCommandMetrics,
  assignAbVariant,
  buildBranchClassifierHint,
  buildCommandMetricPayload,
  buildCustomerAssistantDeniedResult,
  buildPublicAssistantDeniedResult,
  buildVerticalClassifierHints,
  classifyCommandOutcome,
  enrichPublicSessionWithOrchestrationRules,
  filterBookingsByBranch,
  isIntentAllowedForRoleProfile,
  isTaskStuck,
  mapAccessTierToRoleProfile,
  pickActiveAbExperiment,
  resolveAbSuggestionVariant,
  resolveAiRoleProfile,
  resolveBranchScope,
  resolveExperimentConfidenceHigh,
  resolveHitlSlaMinutes,
  resolveVerticalPlugin,
  rescueVerticalIntent,
  scopeEmployeesByBranchActivity,
  validatePublicAssistantAction,
  VERTICAL_AI_PLUGINS,
} from './ai-platform.util.js';
// e2e-bug.1 — load former cycle entry points before asserting the live allowlist binding.
import './ai-product-guide-session.util.js';
import './guide/guide-flow.merge.util.js';

describe('ai-platform.util', () => {
  it('resolves branch scope from context and settings', () => {
    expect(resolveBranchScope({ locationId: 'loc-1' }, {})).toEqual({
      locationId: 'loc-1',
    });
    expect(resolveBranchScope({ _locationId: 'loc-3' }, {})).toEqual({
      locationId: 'loc-3',
    });
    expect(resolveBranchScope({}, { defaultLocationId: 'loc-2' })).toEqual({
      locationId: 'loc-2',
    });
    expect(resolveBranchScope({ locationName: 'Uptown' }, {})).toEqual({
      locationName: 'Uptown',
    });
    expect(
      buildBranchClassifierHint({
        locationId: 'loc-1',
        locationName: 'Downtown',
      }),
    ).toContain('Downtown');
    expect(buildBranchClassifierHint({ locationName: 'Uptown' })).toContain(
      'Uptown',
    );
    expect(buildBranchClassifierHint({})).toBeNull();
  });

  it('filters bookings by branch', () => {
    const bookings = [
      { locationId: 'a' },
      { locationId: 'b' },
      { locationId: 'a' },
    ];
    expect(filterBookingsByBranch(bookings, 'a')).toHaveLength(2);
    expect(filterBookingsByBranch(bookings)).toHaveLength(3);
  });

  it('maps role profiles and gates intents', () => {
    expect(
      resolveAiRoleProfile('staff', {
        roleProfiles: { staff: 'receptionist' },
      }),
    ).toBe('receptionist');
    expect(resolveAiRoleProfile('STAFF', {})).toBe('receptionist');
    expect(pickActiveAbExperiment(undefined)).toBeNull();
    expect(resolveAiRoleProfile('owner', {})).toBe('owner');
    expect(
      isIntentAllowedForRoleProfile(
        'receptionist',
        'dashboard',
        'create_booking',
      ),
    ).toBe(true);
    expect(
      isIntentAllowedForRoleProfile(
        'receptionist',
        'dashboard',
        'payment_sweep',
      ),
    ).toBe(false);
    expect(validatePublicAssistantAction('book_appointment')).toBe(true);
    expect(validatePublicAssistantAction('payment_sweep')).toBe(false);
  });

  it('e2e-bug.1 / e2e-bug.90: PUBLIC_ASSISTANT_INTENTS stays defined for public-only actions', () => {
    expect(Array.isArray(platformUtil.PUBLIC_ASSISTANT_INTENTS)).toBe(true);
    expect(platformUtil.PUBLIC_ASSISTANT_INTENTS.length).toBeGreaterThan(0);
    expect(validatePublicAssistantAction('list_services')).toBe(true);
    expect(validatePublicAssistantAction('find_services_under_budget')).toBe(
      true,
    );
    expect(validatePublicAssistantAction('business_info')).toBe(true);
    expect(validatePublicAssistantAction('list_providers')).toBe(true);
    expect(validatePublicAssistantAction('list_public_promotions')).toBe(true);
    expect(validatePublicAssistantAction('find_evening_weekend_slots')).toBe(
      true,
    );
  });

  it('resolves vertical plugins and rescues intents', () => {
    expect(resolveVerticalPlugin('hair_salon', {}).id).toBe('salon');
    expect(resolveVerticalPlugin('dental', {}).id).toBe('clinic');
    expect(
      resolveVerticalPlugin('gym_fitness', { verticalPlugin: 'fitness' }).id,
    ).toBe('fitness');
    const rescued = rescueVerticalIntent(
      'assign color services to senior stylists only',
      VERTICAL_AI_PLUGINS.salon,
    );
    expect(rescued?.action).toBe('staff_service_matrix');
  });

  it('assigns stable A/B variants', () => {
    const experiment = {
      id: 'exp-1',
      name: 'Test',
      enabled: true,
      suggestionVariants: [
        { id: 'a', title: 'A', prompt: 'a' },
        { id: 'b', title: 'B', prompt: 'b' },
      ],
    };
    expect(pickActiveAbExperiment([experiment])?.id).toBe('exp-1');
    const v = resolveAbSuggestionVariant('biz-1', experiment);
    expect(v?.id).toBeDefined();
    expect(assignAbVariant('biz-1', 'exp-1', 2)).toBe(
      assignAbVariant('biz-1', 'exp-1', 2),
    );
  });

  it('classifies outcomes and aggregates metrics', () => {
    expect(
      classifyCommandOutcome({ success: true, action: 'list_bookings' }),
    ).toBe('success');
    expect(
      classifyCommandOutcome({ success: false, action: 'security_blocked' }),
    ).toBe('security_blocked');
    expect(
      classifyCommandOutcome({
        success: false,
        action: 'x',
        details: { clarify: true },
      }),
    ).toBe('clarify');

    const summary = aggregateCommandMetrics([
      {
        outcome: 'success',
        action: 'list_bookings',
        surface: 'dashboard',
        clarify: false,
        approval: false,
        timestamp: new Date().toISOString(),
      },
      {
        outcome: 'clarify',
        action: 'create_booking',
        surface: 'dashboard',
        clarify: true,
        approval: false,
        timestamp: new Date().toISOString(),
      },
    ]);
    expect(summary.totalCommands).toBe(2);
    expect(summary.successRate).toBe(0.5);
    expect(summary.clarifyRate).toBe(0.5);
  });

  it('detects stuck HITL tasks', () => {
    const old = new Date(Date.now() - 45 * 60 * 1000);
    expect(isTaskStuck(old, 'pending_validation', 30)).toBe(true);
    expect(isTaskStuck(new Date(), 'pending_validation', 30)).toBe(false);
    expect(isTaskStuck(old, 'completed', 30)).toBe(false);
    expect(
      isTaskStuck(
        '2020-01-01',
        'executing',
        1,
        new Date('2020-01-01T01:00:00Z'),
      ),
    ).toBe(true);
    expect(resolveHitlSlaMinutes({ hitlSlaMinutes: 15 })).toBe(15);
    expect(resolveHitlSlaMinutes({ hitlSlaMinutes: 0 })).toBe(30);
  });

  it('scopes employees by branch activity', () => {
    const employees = [{ id: 'e1' }, { id: 'e2' }];
    expect(scopeEmployeesByBranchActivity(employees, new Set(), 'loc')).toEqual(
      [],
    );
    expect(
      scopeEmployeesByBranchActivity(employees, new Set(['e1']), 'loc'),
    ).toEqual([{ id: 'e1' }]);
    expect(
      scopeEmployeesByBranchActivity(employees, new Set(['e1']), undefined),
    ).toEqual(employees);
  });

  it('covers role profile branches', () => {
    expect(resolveAiRoleProfile('manager', {})).toBe('manager');
    expect(resolveAiRoleProfile('contributor', {})).toBe('provider');
    expect(resolveAiRoleProfile('unknown', {})).toBe('owner');
    expect(mapAccessTierToRoleProfile('owner')).toBe('owner');
    expect(mapAccessTierToRoleProfile('manager')).toBe('manager');
    expect(mapAccessTierToRoleProfile('staff')).toBe('receptionist');
    expect(mapAccessTierToRoleProfile('client')).toBe('provider');
    expect(
      isIntentAllowedForRoleProfile('owner', 'dashboard', 'payment_sweep'),
    ).toBe(true);
    expect(
      isIntentAllowedForRoleProfile('provider', 'dashboard', 'payment_sweep'),
    ).toBe(false);
    expect(
      isIntentAllowedForRoleProfile('provider', 'provider', 'payment_sweep'),
    ).toBe(true);
    expect(
      isIntentAllowedForRoleProfile(
        'receptionist',
        'public',
        'book_appointment',
      ),
    ).toBe(true);
    expect(
      isIntentAllowedForRoleProfile('receptionist', 'public', 'hack'),
    ).toBe(false);
    expect(
      isIntentAllowedForRoleProfile(
        'invalid' as any,
        'dashboard',
        'list_bookings',
      ),
    ).toBe(false);
  });

  it('covers vertical and A/B edge cases', () => {
    expect(resolveVerticalPlugin('beauty_clinic', {}).id).toBe('clinic');
    expect(resolveVerticalPlugin('gym_fitness', {}).id).toBe('fitness');
    expect(
      rescueVerticalIntent('random text', VERTICAL_AI_PLUGINS.fitness),
    ).toBeNull();
    expect(buildVerticalClassifierHints(VERTICAL_AI_PLUGINS.clinic)).toContain(
      'Clinic',
    );
    expect(assignAbVariant('b', 'e', 1)).toBe(0);
    expect(
      pickActiveAbExperiment([{ id: 'x', name: 'x', enabled: false }]),
    ).toBeNull();
    expect(
      resolveAbSuggestionVariant('b', { id: 'x', name: 'x', enabled: true }),
    ).toBeNull();
    expect(resolveExperimentConfidenceHigh(0.85, null, 'b')).toEqual({
      high: 0.85,
    });
    const exp = {
      id: 'e',
      name: 'e',
      enabled: true,
      confidenceHigh: 0.9,
      suggestionVariants: [{ id: 'a', title: 'A', prompt: 'a' }],
    };
    expect(resolveExperimentConfidenceHigh(0.85, exp, 'b').high).toBe(0.9);
    const expNoOverride = {
      id: 'e2',
      name: 'e2',
      enabled: true,
      suggestionVariants: [
        { id: 'a', title: 'A', prompt: 'a' },
        { id: 'b', title: 'B', prompt: 'b' },
      ],
    };
    expect(
      resolveExperimentConfidenceHigh(0.85, expNoOverride, 'biz').abVariantId,
    ).toBeDefined();
  });

  it('covers outcome classification and payloads', () => {
    expect(
      classifyCommandOutcome({
        success: false,
        action: 'x',
        details: { requiresApproval: true },
      }),
    ).toBe('approval');
    expect(
      classifyCommandOutcome({
        success: false,
        action: 'clarify',
        details: { missing: ['a'] },
      }),
    ).toBe('clarify');
    expect(
      classifyCommandOutcome({
        success: false,
        action: 'x',
        details: { approvalRequired: true },
      }),
    ).toBe('approval');
    expect(classifyCommandOutcome({ success: false, action: 'error' })).toBe(
      'failed',
    );
    expect(classifyCommandOutcome({ success: false, action: 'unknown' })).toBe(
      'failed',
    );
    expect(classifyCommandOutcome({ success: true, action: 'unknown' })).toBe(
      'unknown',
    );

    const payload = buildCommandMetricPayload({
      result: { success: true, action: 'x', details: { autoExecuted: true } },
      surface: 'public',
      locationId: 'loc',
      roleProfile: 'owner',
      abVariantId: 'a',
      autoExecuted: true,
    });
    expect(payload.autoExecuted).toBe(true);
    const minimal = buildCommandMetricPayload({
      result: { success: true, action: 'y' },
      surface: 'dashboard',
    });
    expect(minimal.clarify).toBe(false);
    expect(buildPublicAssistantDeniedResult('x').action).toBe(
      'security_blocked',
    );
    // e2e-bug.127 — no snake_case action id in customer-facing summary
    expect(
      buildPublicAssistantDeniedResult('create_booking').summary,
    ).not.toMatch(/create_booking/);
    expect(
      buildCustomerAssistantDeniedResult('create_booking', 'ru').summary,
    ).toMatch(/помощнике клиента/i);
    expect(
      buildCustomerAssistantDeniedResult('create_booking', 'ru').summary,
    ).not.toMatch(/create_booking/);
    expect(
      buildPublicAssistantDeniedResult('payment_sweep', 'hy').summary,
    ).toMatch(/հասանելի չէ/);
    expect(
      buildPublicAssistantDeniedResult('payment_sweep', 'hy').details,
    ).toMatchObject({ blockedAction: 'payment_sweep' });
    expect(
      enrichPublicSessionWithOrchestrationRules(
        { foo: 1 },
        VERTICAL_AI_PLUGINS.salon,
      )._orchestrationSurface,
    ).toBe('public');
  });

  it('aggregates metrics with locations and empty set', () => {
    expect(aggregateCommandMetrics([], 7).totalCommands).toBe(0);
    const summary = aggregateCommandMetrics([
      {
        outcome: 'approval',
        action: 'swap',
        surface: 'dashboard',
        locationId: 'loc-1',
        clarify: false,
        approval: true,
        autoExecuted: true,
        timestamp: new Date().toISOString(),
      },
      {
        outcome: 'success',
        action: 'swap',
        surface: 'dashboard',
        clarify: false,
        approval: false,
        autoExecuted: false,
        timestamp: new Date().toISOString(),
      },
    ]);
    expect(summary.byLocationId['loc-1']).toBe(1);
    expect(summary.approvalRate).toBe(0.5);
    expect(summary.byIntent.swap.total).toBe(2);
  });

  it('covers remaining util branches', () => {
    expect(resolveBranchScope(undefined, undefined)).toEqual({});
    expect(resolveBranchScope({ locationId: '' }, {})).toEqual({});
    expect(
      resolveBranchScope({ locationId: 'loc', locationName: 'Branch' }, {}),
    ).toEqual({
      locationId: 'loc',
      locationName: 'Branch',
    });
    expect(resolveBranchScope({ locationName: 99 }, {})).toEqual({});
    expect(resolveBranchScope({}, { defaultLocationId: null })).toEqual({});

    expect(resolveAiRoleProfile(null, {})).toBe('owner');
    expect(
      resolveAiRoleProfile('admin', { roleProfiles: { admin: 'manager' } }),
    ).toBe('manager');

    expect(
      isIntentAllowedForRoleProfile('receptionist', 'dashboard', 'error'),
    ).toBe(true);
    expect(
      isIntentAllowedForRoleProfile(
        'receptionist',
        'dashboard',
        'security_blocked',
      ),
    ).toBe(true);
    expect(
      isIntentAllowedForRoleProfile('receptionist', 'dashboard', 'unknown'),
    ).toBe(true);

    expect(resolveVerticalPlugin('other', { verticalPlugin: 'salon' }).id).toBe(
      'salon',
    );
    expect(
      resolveVerticalPlugin('other', { verticalPlugin: 'clinic' }).id,
    ).toBe('clinic');
    expect(pickActiveAbExperiment([])).toBeNull();
    expect(
      pickActiveAbExperiment([
        {
          id: 'one',
          name: 'one',
          enabled: true,
          suggestionVariants: [{ id: 'a', title: 'A', prompt: 'a' }],
        },
      ]),
    ).toBeNull();
    expect(
      pickActiveAbExperiment([
        {
          id: 'off',
          name: 'off',
          enabled: false,
          suggestionVariants: [
            { id: 'a', title: 'A', prompt: 'a' },
            { id: 'b', title: 'B', prompt: 'b' },
          ],
        },
      ]),
    ).toBeNull();
    expect(resolveVerticalPlugin('dental_clinic', {}).id).toBe('clinic');
    expect(resolveVerticalPlugin(null, {}).id).toBe('salon');
    expect(
      resolveVerticalPlugin(undefined, { verticalPlugin: null } as any).id,
    ).toBe('salon');
    expect(resolveVerticalPlugin('local_gym', {}).id).toBe('fitness');
    expect(resolveVerticalPlugin('barbershop', {}).id).toBe('salon');
    expect(pickActiveAbExperiment(null as any)).toBeNull();
    expect(
      pickActiveAbExperiment([{ id: 'bare', name: 'bare', enabled: true }]),
    ).toBeNull();

    const sparseVariants = [
      { id: 'fallback', title: 'F', prompt: 'f' },
      undefined as any,
      { id: 'third', title: 'T', prompt: 't' },
    ];
    const sparseExperiment = {
      id: 'sparse-exp',
      name: 'Sparse',
      enabled: true,
      suggestionVariants: sparseVariants,
    };
    const assignSpy = jest
      .spyOn(platformUtil, 'assignAbVariant')
      .mockReturnValue(1);
    expect(resolveAbSuggestionVariant('biz-1', sparseExperiment)?.id).toBe(
      'fallback',
    );
    assignSpy.mockRestore();

    expect(classifyCommandOutcome({ success: true, action: 'clarify' })).toBe(
      'clarify',
    );
    expect(
      classifyCommandOutcome({
        success: false,
        action: 'x',
        details: { missing: ['field'] },
      }),
    ).toBe('clarify');
    const noAction = buildCommandMetricPayload({
      result: { success: true },
      surface: 'dashboard',
    });
    expect(noAction.action).toBe('unknown');
    const approvalPayload = buildCommandMetricPayload({
      result: {
        success: false,
        action: 'swap',
        details: { requiresApproval: true },
      },
      surface: 'dashboard',
    });
    expect(approvalPayload.approval).toBe(true);
    const clarifyPayload = buildCommandMetricPayload({
      result: {
        success: false,
        action: 'create_booking',
        details: { clarify: true },
      },
      surface: 'dashboard',
    });
    expect(clarifyPayload.clarify).toBe(true);

    expect(isTaskStuck(new Date(Date.now() - 60_000), 'validated', 1)).toBe(
      true,
    );
    expect(isTaskStuck(new Date(Date.now() - 60_000), 'executing', 1)).toBe(
      true,
    );
    expect(resolveHitlSlaMinutes(undefined)).toBe(30);

    expect(
      enrichPublicSessionWithOrchestrationRules(
        undefined,
        VERTICAL_AI_PLUGINS.fitness,
      ).foo,
    ).toBeUndefined();
    expect(
      rescueVerticalIntent(
        'walk-in slot availability',
        VERTICAL_AI_PLUGINS.salon,
      )?.action,
    ).toBe('check_availability');
    expect(
      rescueVerticalIntent(
        'follow-up patient recall',
        VERTICAL_AI_PLUGINS.clinic,
      )?.action,
    ).toBe('summarize_bookings');
    expect(
      rescueVerticalIntent(
        'trainer schedule swap Friday',
        VERTICAL_AI_PLUGINS.fitness,
      )?.action,
    ).toBe('swap_schedules');
  });
});
