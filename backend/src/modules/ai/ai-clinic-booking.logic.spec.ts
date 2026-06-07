import { handleExplainClinicBookingLogic } from './ai-clinic-booking.logic.js';

describe('ai-clinic-booking.logic', () => {
  const businessRepo = { findOne: jest.fn() };
  const serviceService = { findAll: jest.fn() };

  const deps = {
    businessRepo,
    serviceService,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'clinic' },
    });
    serviceService.findAll.mockResolvedValue([
      {
        id: 'svc-lipid',
        name: 'Lipid panel',
        metadata: {
          serviceType: 'lab_test',
          requiresFasting: true,
          preparationNotes: 'Fast 12 hours before draw.',
        },
      },
      {
        id: 'svc-consult',
        name: 'GP consultation',
        metadata: { serviceType: 'consultation' },
      },
    ]);
  });

  it('explains symptoms field generically', async () => {
    const result = await handleExplainClinicBookingLogic(
      deps,
      'biz-1',
      {},
      'What should I put in the symptoms field on checkout?',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_clinic_booking');
    expect(result.summary).toContain('Symptoms or reason for visit');
  });

  it('explains service-specific lab prep', async () => {
    const result = await handleExplainClinicBookingLogic(
      deps,
      'biz-1',
      {},
      'Explain the lab prep for Lipid panel',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('Lipid panel');
    expect(result.summary).toContain('fasting is required');
    expect(result.summary).toContain('Fast 12 hours before draw.');
  });

  it('blocks non-clinic businesses', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'hair_salon' },
    });

    const result = await handleExplainClinicBookingLogic(
      deps,
      'biz-1',
      {},
      'What are referral notes for on the booking form?',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('Clinic checkout fields');
  });

  it('clarifies when service name is unknown', async () => {
    const result = await handleExplainClinicBookingLogic(
      deps,
      'biz-1',
      {},
      'Explain the lab prep for Unknown panel',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('explains pre-visit intake for a lab service', async () => {
    const result = await handleExplainClinicBookingLogic(
      deps,
      'biz-1',
      { serviceName: 'Lipid panel' },
      'Why is there a pre-visit intake step before checkout?',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('pre-visit intake');
  });

  it('explains referral notes generically', async () => {
    const result = await handleExplainClinicBookingLogic(
      deps,
      'biz-1',
      {},
      'What are referral notes for on the booking form?',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('Referral notes');
  });

  it('returns not found when business is missing', async () => {
    businessRepo.findOne.mockResolvedValue(null);

    const result = await handleExplainClinicBookingLogic(
      deps,
      'biz-1',
      {},
      'What should I put in the symptoms field on checkout?',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toBe('Business not found.');
  });

  it('clarifies when prompt does not match clinic booking FAQ', async () => {
    const result = await handleExplainClinicBookingLogic(
      deps,
      'biz-1',
      {},
      'Book a haircut tomorrow',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
