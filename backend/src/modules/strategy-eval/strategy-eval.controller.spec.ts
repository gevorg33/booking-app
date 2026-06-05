import { ForbiddenException } from '@nestjs/common';
import { StrategyEvalController } from './strategy-eval.controller.js';
import { StrategyEvalService } from './strategy-eval.service.js';
import { BusinessService } from '../business/business.service.js';

describe('StrategyEvalController', () => {
  const strategyEvalService = {
    getSummary: jest.fn(),
    getHipaaFramework: jest.fn(),
    getHipaaEval: jest.fn(),
    submitHipaaEval: jest.fn(),
    getMarketplaceFramework: jest.fn(),
    getMarketplaceEval: jest.fn(),
    submitMarketplaceEval: jest.fn(),
  };
  const businessService = { ensureMember: jest.fn() };

  const controller = new StrategyEvalController(
    strategyEvalService as unknown as StrategyEvalService,
    businessService as unknown as BusinessService,
  );

  const user = { id: 'user-1' };
  const summary = {
    hipaa: null,
    marketplace: null,
    medicalVerticalBlocked: false,
    marketplaceDecisionLocked: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: 'owner' });
    strategyEvalService.getSummary.mockResolvedValue(summary);
    strategyEvalService.getHipaaFramework.mockReturnValue({
      checklist: [],
      decisions: [],
    });
    strategyEvalService.getHipaaEval.mockResolvedValue(null);
    strategyEvalService.submitHipaaEval.mockResolvedValue({
      recommendation: 'wellness_only',
    });
    strategyEvalService.getMarketplaceFramework.mockReturnValue({
      criteria: [],
      options: [],
    });
    strategyEvalService.getMarketplaceEval.mockResolvedValue(null);
    strategyEvalService.submitMarketplaceEval.mockResolvedValue({
      recommendation: 'software_only',
    });
  });

  it('returns strategy summary after membership guard', async () => {
    const result = await controller.getSummary('biz-1', user);
    expect(businessService.ensureMember).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
    );
    expect(result.summary).toEqual(summary);
  });

  it('returns HIPAA framework and evaluation endpoints', async () => {
    await controller.getHipaaFramework('biz-1', user);
    await controller.getHipaaEval('biz-1', user);
    expect(strategyEvalService.getHipaaFramework).toHaveBeenCalled();
    expect(strategyEvalService.getHipaaEval).toHaveBeenCalledWith('biz-1');
  });

  it('submits HIPAA evaluation', async () => {
    const dto = { answers: { handles_phi: 'no' as const } };
    const result = await controller.submitHipaaEval('biz-1', dto, user);
    expect(strategyEvalService.submitHipaaEval).toHaveBeenCalledWith(
      'biz-1',
      dto,
    );
    expect(result.evaluation.recommendation).toBe('wellness_only');
  });

  it('submits marketplace evaluation', async () => {
    const dto = { criterionWeights: { tenant_autonomy: 5 } };
    const result = await controller.submitMarketplaceEval('biz-1', dto, user);
    expect(strategyEvalService.submitMarketplaceEval).toHaveBeenCalledWith(
      'biz-1',
      dto,
    );
    expect(result.evaluation.recommendation).toBe('software_only');
  });

  it('returns marketplace framework and evaluation endpoints', async () => {
    await controller.getMarketplaceFramework('biz-1', user);
    await controller.getMarketplaceEval('biz-1', user);
    expect(strategyEvalService.getMarketplaceFramework).toHaveBeenCalled();
    expect(strategyEvalService.getMarketplaceEval).toHaveBeenCalledWith(
      'biz-1',
    );
  });

  it('propagates membership guard failures', async () => {
    businessService.ensureMember.mockRejectedValue(new ForbiddenException());
    await expect(controller.getSummary('biz-1', user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(
      controller.submitHipaaEval('biz-1', { answers: {} }, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
