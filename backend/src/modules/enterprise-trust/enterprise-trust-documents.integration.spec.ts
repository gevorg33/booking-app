import { EnterpriseTrustService } from './enterprise-trust.service.js';

describe('Enterprise trust settings + documents integration', () => {
  const businessRepo = { findOne: jest.fn(), save: jest.fn() };
  const configService = { get: jest.fn() };

  const service = new EnterpriseTrustService(
    businessRepo as any,
    configService as any,
  );

  const business = {
    id: 'biz-1',
    name: 'Glow Clinic',
    settings: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue(business);
    businessRepo.save.mockImplementation(async (b) => {
      businessRepo.findOne.mockResolvedValue(b);
      return b;
    });
  });

  it('renders updated legal profile into DPA and privacy templates', async () => {
    await service.updateSettings('biz-1', {
      legalBusinessName: 'Glow Clinic GmbH',
      dpoEmail: 'privacy@glowclinic.de',
      registeredAddress: 'Friedrichstrasse 1, Berlin',
      country: 'Germany',
      customDataProcessingNotes: 'Subprocessors limited to EU regions.',
    });

    const docs = await service.renderDocuments('biz-1');

    expect(docs).toHaveLength(2);
    expect(docs[0]?.markdown).toContain('Glow Clinic GmbH');
    expect(docs[0]?.markdown).toContain('Subprocessors limited to EU regions.');
    expect(docs[1]?.markdown).toContain('privacy@glowclinic.de');
    expect(docs[0]?.placeholdersFilled).toEqual(
      expect.arrayContaining([
        'businessName',
        'dpoEmail',
        'registeredAddress',
        'country',
      ]),
    );
  });

  it('exposes security one-pager alongside rendered trust documents', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-2',
      name: 'Fresh Salon',
      settings: {},
    });
    configService.get.mockReturnValue('security@optischedule.com');

    const [settings, docs, pager] = await Promise.all([
      service.getSettings('biz-2'),
      service.renderDocuments('biz-2'),
      Promise.resolve(service.getSecurityOnePager()),
    ]);

    expect(settings.legalBusinessName).toBeNull();
    expect(docs[0]?.markdown).toContain('Fresh Salon');
    expect(pager.contactEmail).toBe('security@optischedule.com');
    expect(pager.sections.length).toBeGreaterThan(0);
  });
});
