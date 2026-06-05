import { ComplianceBreachService } from './compliance-breach.service.js';
import { BusinessService } from '../business/business.service.js';
import type { DataBreachIncident } from './entities/data-breach-incident.entity.js';

describe('ComplianceBreachService', () => {
  const incidentRepo = {
    create: jest.fn((row: Partial<DataBreachIncident>) => row),
    save: jest.fn(async (row: DataBreachIncident) => ({ ...row, id: 'inc-1' })),
    find: jest.fn(),
  };
  const businessService = {
    ensureOwner: jest.fn(),
    findOne: jest.fn(async () => ({ id: 'biz-1', name: 'Wellness Clinic' })),
  } as unknown as BusinessService;

  const service = new ComplianceBreachService(
    incidentRepo as never,
    businessService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists explicit affected customer count from the report', async () => {
    const incident = await service.reportBreach('biz-1', 'owner-1', {
      description: 'Unauthorized API access exposed customer emails',
      affectedCustomerCount: 128,
    });

    expect(incident.affectedCustomerCount).toBe(128);
    expect(incident.draftEmailSubject).toContain('Wellness Clinic');
  });

  it('requires owner access and defaults affected customer count to zero', async () => {
    const incident = await service.reportBreach('biz-1', 'owner-1', {
      description: '  Ransomware encrypted our booking database.  ',
    });

    expect(businessService.ensureOwner).toHaveBeenCalledWith(
      'biz-1',
      'owner-1',
    );
    expect(incident.description).toBe(
      'Ransomware encrypted our booking database.',
    );
    expect(incident.affectedCustomerCount).toBe(0);
    expect(incident.status).toBe('open');
    expect(incident.draftEmailSubject).toContain('Wellness Clinic');
    expect(incident.gdprNotificationDeadlineAt.getTime()).toBeGreaterThan(
      incident.reportedAt.getTime(),
    );
  });

  it('returns an empty incident list for owner', async () => {
    incidentRepo.find.mockResolvedValue([]);
    await expect(service.listIncidents('biz-1', 'owner-1')).resolves.toEqual(
      [],
    );
  });

  it('lists incidents with GDPR deadline flags', async () => {
    const approaching = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const overdue = new Date(Date.now() - 60 * 60 * 1000);
    const future = new Date(Date.now() + 48 * 60 * 60 * 1000);

    incidentRepo.find.mockResolvedValue([
      {
        id: 'inc-approaching',
        gdprNotificationDeadlineAt: approaching,
      },
      {
        id: 'inc-overdue',
        gdprNotificationDeadlineAt: overdue,
      },
      {
        id: 'inc-future',
        gdprNotificationDeadlineAt: future,
      },
    ]);

    const incidents = await service.listIncidents('biz-1', 'owner-1');

    expect(businessService.ensureOwner).toHaveBeenCalledWith(
      'biz-1',
      'owner-1',
    );
    expect(incidents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'inc-approaching',
          gdprDeadlineApproaching: true,
          gdprDeadlineOverdue: false,
        }),
        expect.objectContaining({
          id: 'inc-overdue',
          gdprDeadlineApproaching: false,
          gdprDeadlineOverdue: true,
        }),
        expect.objectContaining({
          id: 'inc-future',
          gdprDeadlineApproaching: false,
          gdprDeadlineOverdue: false,
        }),
      ]),
    );
  });
});
