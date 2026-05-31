import { NotFoundException } from '@nestjs/common';
import { EnterpriseTrustService } from './enterprise-trust.service.js';
import { DPA_TEMPLATE, PROCESSOR_NAME } from './enterprise-trust.constants.js';

describe('EnterpriseTrustService', () => {
  const businessRepo = { findOne: jest.fn(), save: jest.fn() };
  const configService = { get: jest.fn() };

  const service = new EnterpriseTrustService(businessRepo as any, configService as any);

  const business = {
    id: 'biz-1',
    name: 'Glow Salon',
    settings: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue(business);
    businessRepo.save.mockImplementation(async (b) => b);
  });

  it('returns default trust settings', async () => {
    await expect(service.getSettings('biz-1')).resolves.toMatchObject({
      legalBusinessName: null,
      dpoEmail: null,
    });
  });

  it('updates trust settings on business record', async () => {
    const next = await service.updateSettings('biz-1', {
      legalBusinessName: 'Glow Salon LLC',
      dpoEmail: 'privacy@glow.com',
      country: 'Germany',
    });
    expect(next.dpoEmail).toBe('privacy@glow.com');
    expect(businessRepo.save).toHaveBeenCalled();
  });

  it('renders DPA and privacy policy with business placeholders', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        enterpriseTrust: {
          legalBusinessName: 'Glow Salon LLC',
          dpoEmail: 'privacy@glow.com',
          registeredAddress: 'Berlin, DE',
          country: 'Germany',
        },
      },
    });

    const docs = await service.renderDocuments('biz-1');
    expect(docs).toHaveLength(2);
    expect(docs[0]?.markdown).toContain('Glow Salon LLC');
    expect(docs[0]?.markdown).toContain(PROCESSOR_NAME);
    expect(docs[1]?.markdown).toContain('privacy@glow.com');
    expect(DPA_TEMPLATE).toContain('{{businessName}}');
  });

  it('returns security one-pager with encryption and backup sections', () => {
    const pager = service.getSecurityOnePager();
    expect(pager.sections.some((s) => s.id === 'encryption')).toBe(true);
    expect(pager.sections.some((s) => s.id === 'backups')).toBe(true);
    expect(pager.sections.some((s) => s.id === 'access_control')).toBe(true);
  });

  it('throws when business is missing', async () => {
    businessRepo.findOne.mockResolvedValue(null);
    await expect(service.getSettings('missing')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.updateSettings('missing', {})).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.renderDocuments('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('uses configured security contact email when available', () => {
    configService.get.mockReturnValue('security@custom.com');
    const pager = service.getSecurityOnePager();
    expect(pager.contactEmail).toBe('security@custom.com');
  });

  it('renders documents with default placeholder fallbacks', async () => {
    businessRepo.findOne.mockResolvedValue({ id: 'biz-2', name: 'Fallback Co', settings: null });
    const docs = await service.renderDocuments('biz-2');
    expect(docs[0]?.markdown).toContain('Fallback Co');
    expect(docs[0]?.markdown).toContain('[Registered business address]');
    expect(docs[0]?.placeholdersFilled).toContain('businessName');
    expect(docs[0]?.placeholdersFilled).not.toContain('registeredAddress');
  });

  it('persists settings when business.settings is initially null', async () => {
    businessRepo.findOne.mockResolvedValue({ id: 'biz-3', name: 'New Co', settings: null });
    await service.updateSettings('biz-3', { country: 'France' });
    expect(businessRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          enterpriseTrust: expect.objectContaining({ country: 'France' }),
        }),
      }),
    );
  });
});
