import { ForbiddenException } from '@nestjs/common';
import { EnterpriseTrustController } from './enterprise-trust.controller.js';
import { EnterpriseTrustService } from './enterprise-trust.service.js';
import { BusinessService } from '../business/business.service.js';

describe('EnterpriseTrustController', () => {
  const enterpriseTrustService = {
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
    renderDocuments: jest.fn(),
    getSecurityOnePager: jest.fn(),
  };
  const businessService = { ensureMember: jest.fn() };

  const controller = new EnterpriseTrustController(
    enterpriseTrustService as unknown as EnterpriseTrustService,
    businessService as unknown as BusinessService,
  );

  const user = { id: 'user-1' };
  const settings = { legalBusinessName: 'Glow Salon LLC', dpoEmail: 'privacy@glow.com' };
  const documents = [{ id: 'dpa', title: 'DPA', markdown: '# DPA', placeholdersFilled: ['businessName'] }];
  const securityOnePager = {
    title: 'Security overview',
    lastUpdated: '2026-01-01',
    summary: 'Summary',
    sections: [],
    contactEmail: 'security@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: 'owner' });
    enterpriseTrustService.getSettings.mockResolvedValue(settings);
    enterpriseTrustService.updateSettings.mockResolvedValue(settings);
    enterpriseTrustService.renderDocuments.mockResolvedValue(documents);
    enterpriseTrustService.getSecurityOnePager.mockReturnValue(securityOnePager);
  });

  it('returns trust settings after membership guard', async () => {
    const result = await controller.getSettings('biz-1', user);
    expect(businessService.ensureMember).toHaveBeenCalledWith('biz-1', 'user-1');
    expect(enterpriseTrustService.getSettings).toHaveBeenCalledWith('biz-1');
    expect(result.settings).toEqual(settings);
  });

  it('updates trust settings after membership guard', async () => {
    const dto = { dpoEmail: 'privacy@glow.com', country: 'Germany' };
    const result = await controller.updateSettings('biz-1', dto, user);
    expect(enterpriseTrustService.updateSettings).toHaveBeenCalledWith('biz-1', dto);
    expect(result.settings).toEqual(settings);
  });

  it('returns rendered trust documents after membership guard', async () => {
    const result = await controller.getDocuments('biz-1', user);
    expect(enterpriseTrustService.renderDocuments).toHaveBeenCalledWith('biz-1');
    expect(result.documents).toEqual(documents);
  });

  it('returns security one-pager after membership guard', async () => {
    const result = await controller.getSecurityOnePager('biz-1', user);
    expect(enterpriseTrustService.getSecurityOnePager).toHaveBeenCalled();
    expect(result).toEqual(securityOnePager);
  });

  it('propagates membership guard failures', async () => {
    businessService.ensureMember.mockRejectedValue(new ForbiddenException());
    await expect(controller.getSettings('biz-1', user)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.updateSettings('biz-1', {}, user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(controller.getDocuments('biz-1', user)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.getSecurityOnePager('biz-1', user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
