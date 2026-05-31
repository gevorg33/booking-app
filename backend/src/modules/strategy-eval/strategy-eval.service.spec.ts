import { NotFoundException } from '@nestjs/common';
import { StrategyEvalService } from './strategy-eval.service.js';

describe('StrategyEvalService', () => {
  const businessRepo = { findOne: jest.fn(), save: jest.fn() };
  const service = new StrategyEvalService(businessRepo as any);

  const business = { id: 'biz-1', name: 'Demo', settings: {} };

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue(business);
    businessRepo.save.mockImplementation(async (b) => b);
  });

  it('returns HIPAA framework checklist', () => {
    const framework = service.getHipaaFramework();
    expect(framework.checklist.length).toBeGreaterThan(0);
    expect(framework.decisions).toContain('pursue_baa');
  });

  it('recommends wellness_only when business does not handle PHI', () => {
    const result = service.buildHipaaResult({
      handles_phi: 'no',
      us_patients: 'yes',
      diagnosis_documentation: 'no',
    });
    expect(result.recommendation).toBe('wellness_only');
    expect(result.handlesPhi).toBe(false);
  });

  it('defers when clinical documentation blockers are present', () => {
    const result = service.buildHipaaResult({
      handles_phi: 'yes',
      us_patients: 'yes',
      diagnosis_documentation: 'yes',
    });
    expect(result.recommendation).toBe('defer');
    expect(result.blockers).toContain('diagnosis_documentation');
  });

  it('recommends pursue_baa when readiness is high', () => {
    const answers = Object.fromEntries(
      [
        'handles_phi',
        'us_patients',
        'baa_with_vendors',
        'privacy_officer',
        'encryption_at_rest',
        'encryption_in_transit',
        'access_audit_logs',
        'mfa_admin_access',
        'staff_hipaa_training',
        'incident_response_plan',
        'minimum_necessary_policy',
      ].map((id) => [id, 'yes']),
    ) as Record<string, 'yes'>;
    answers.diagnosis_documentation = 'no';

    const result = service.buildHipaaResult(answers);
    expect(result.recommendation).toBe('pursue_baa');
    expect(result.readinessPercent).toBeGreaterThanOrEqual(70);
  });

  it('persists HIPAA evaluation on business settings', async () => {
    const evaluation = await service.submitHipaaEval('biz-1', {
      answers: { handles_phi: 'no', us_patients: 'no', diagnosis_documentation: 'no' },
      decision: 'wellness_only',
      notes: 'Beauty salon only',
    });

    expect(evaluation.recommendation).toBe('wellness_only');
    expect(businessRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          strategyEval: expect.objectContaining({
            hipaa: expect.objectContaining({ notes: 'Beauty salon only' }),
          }),
        }),
      }),
    );
  });

  it('returns marketplace framework metadata', () => {
    const framework = service.getMarketplaceFramework();
    expect(framework.criteria.length).toBeGreaterThan(0);
    expect(framework.options.some((o) => o.id === 'software_only')).toBe(true);
  });

  it('normalizes invalid criterion weights to defaults', () => {
    const weights = service.normalizeCriterionWeights({ tenant_autonomy: 99, new_client_acquisition: NaN });
    expect(weights.tenant_autonomy).toBe(5);
    expect(weights.new_client_acquisition).toBe(5);
  });

  it('scores marketplace options from criterion weights', () => {
    const weights = {
      tenant_autonomy: 5,
      new_client_acquisition: 1,
      implementation_speed: 5,
      brand_control: 5,
      seo_discoverability: 1,
      operational_complexity: 5,
      marketplace_fees_tolerance: 5,
      support_burden: 5,
    };
    const result = service.buildMarketplaceResult(weights);
    expect(result.optionScores.software_only).toBeGreaterThan(result.optionScores.full_marketplace);
    expect(result.recommendation).toBe('software_only');
  });

  it('returns undecided when marketplace top scores are within threshold', () => {
    expect(
      service.recommendMarketplacePosition({
        software_only: 72,
        partner_directory: 70,
        full_marketplace: 55,
      }),
    ).toBe('undecided');
  });

  it('loads stored HIPAA and marketplace evaluations', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        strategyEval: {
          hipaa: {
            answers: { handles_phi: 'no', us_patients: 'no', diagnosis_documentation: 'no' },
            notes: 'Stored',
          },
          marketplace: {
            criterionWeights: { tenant_autonomy: 5, new_client_acquisition: 1 },
          },
        },
      },
    });

    await expect(service.getHipaaEval('biz-1')).resolves.toMatchObject({
      recommendation: 'wellness_only',
      notes: 'Stored',
    });
    await expect(service.getMarketplaceEval('biz-1')).resolves.toMatchObject({
      optionScores: expect.any(Object),
    });
  });

  it('defers HIPAA when US PHI readiness is below threshold', () => {
    const result = service.buildHipaaResult({
      handles_phi: 'yes',
      us_patients: 'yes',
      diagnosis_documentation: 'no',
      baa_with_vendors: 'no',
    });
    expect(result.recommendation).toBe('defer');
  });

  it('recommends wellness_only when PHI is handled outside the US', () => {
    const result = service.buildHipaaResult({
      handles_phi: 'yes',
      us_patients: 'no',
      diagnosis_documentation: 'no',
    });
    expect(result.recommendation).toBe('wellness_only');
  });

  it('returns null when no stored eval exists', async () => {
    businessRepo.findOne.mockResolvedValue({ ...business, settings: {} });
    await expect(service.getHipaaEval('biz-1')).resolves.toBeNull();
    await expect(service.getMarketplaceEval('biz-1')).resolves.toBeNull();
  });

  it('submits HIPAA eval without locking decision', async () => {
    const evaluation = await service.submitHipaaEval('biz-1', {
      answers: { handles_phi: 'no', us_patients: 'no', diagnosis_documentation: 'no' },
    });
    expect(evaluation.decidedAt).toBeNull();
  });

  it('recommends full marketplace when it clearly leads fit scores', () => {
    expect(
      service.recommendMarketplacePosition({
        software_only: 50,
        partner_directory: 60,
        full_marketplace: 85,
      }),
    ).toBe('full_marketplace');
  });

  it('scores marketplace options with partial criterion weights', () => {
    const scores = service.scoreMarketplaceOptions({ tenant_autonomy: 5 });
    expect(scores.software_only).toBeGreaterThan(0);
    expect(scores.partner_directory).toBeGreaterThan(0);
  });

  it('uses undecided recommendation key when computed fit is inconclusive', () => {
    const result = service.buildMarketplaceResult(
      Object.fromEntries(
        service.getMarketplaceFramework().criteria.map((criterion) => [criterion.id, 3]),
      ),
    );
    if (result.recommendation === 'undecided') {
      expect(result.recommendationKey).toBe('strategyEval.marketplace.recUndecided');
    } else {
      expect(result.recommendationKey).toContain('strategyEval.marketplace.rec');
    }
  });

  it('marks marketplace decision locked after committed decision', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        strategyEval: {
          marketplace: {
            ...service.buildMarketplaceResult({ tenant_autonomy: 5 }),
            decidedAt: '2026-01-01T00:00:00.000Z',
            recommendation: 'software_only',
          },
        },
      },
    });
    const summary = await service.getSummary('biz-1');
    expect(summary.marketplaceDecisionLocked).toBe(true);
  });

  it('merges strategy eval with existing business settings', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: { integrations: { zapier: { enabled: true } } },
    });
    await service.submitHipaaEval('biz-1', {
      answers: { handles_phi: 'no' },
    });
    expect(businessRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          integrations: { zapier: { enabled: true } },
          strategyEval: expect.any(Object),
        }),
      }),
    );
  });

  it('returns undecided when marketplace score list is empty', () => {
    expect(service.recommendMarketplacePosition({} as any)).toBe('undecided');
  });

  it('submits marketplace evaluation with undecided decision', async () => {
    const evaluation = await service.submitMarketplaceEval('biz-1', {
      criterionWeights: { tenant_autonomy: 3 },
      decision: 'undecided',
    });
    expect(evaluation.recommendation).toBe('undecided');
    expect(evaluation.decidedAt).toBeNull();
  });

  it('submits marketplace evaluation without explicit decision', async () => {
    const evaluation = await service.submitMarketplaceEval('biz-1', {
      criterionWeights: { tenant_autonomy: 5, new_client_acquisition: 1 },
    });
    expect(evaluation.decidedAt).toBeNull();
  });

  it('persists marketplace evaluation with directory opt-in', async () => {
    const evaluation = await service.submitMarketplaceEval('biz-1', {
      criterionWeights: { tenant_autonomy: 4, new_client_acquisition: 5 },
      directoryOptIn: true,
      decision: 'partner_directory',
    });

    expect(evaluation.directoryOptIn).toBe(true);
    expect(evaluation.recommendation).toBe('partner_directory');
    expect(businessRepo.save).toHaveBeenCalled();
  });

  it('returns summary with medical vertical blocked flag', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        strategyEval: {
          hipaa: service.buildHipaaResult({
            handles_phi: 'yes',
            us_patients: 'yes',
            diagnosis_documentation: 'yes',
          }),
        },
      },
    });

    const summary = await service.getSummary('biz-1');
    expect(summary.medicalVerticalBlocked).toBe(true);
    expect(summary.hipaa?.recommendation).toBe('defer');
  });

  it('throws when business is missing', async () => {
    businessRepo.findOne.mockResolvedValue(null);
    await expect(service.getSummary('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
