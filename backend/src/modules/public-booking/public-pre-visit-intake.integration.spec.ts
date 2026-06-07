import { PublicPreVisitIntakeService } from './public-pre-visit-intake.service.js';
import { PUBLIC_PRE_VISIT_INTAKE_CONFIG_EXPECTED } from '../../common/utils/clinic-public-pre-visit-intake.fixtures.js';

describe('PublicPreVisitIntakeService (integration)', () => {
  const business = {
    id: 'biz-clinic',
    slug: 'city-poly',
    isActive: true,
    settings: { businessType: 'polyclinic' },
  };

  const labService = {
    id: 'svc-lab',
    businessId: 'biz-clinic',
    isActive: true,
    metadata: { serviceType: 'lab_test' },
  };

  const intakeService = {
    hasPublishedIntakeQuestionnaire: jest.fn(async () => true),
    getDefaultIntakeQuestionnairePreview: jest.fn(async () => ({
      id: 'quest-2',
      title: 'Pre-visit intake',
      code: 'pre-visit-intake',
      introTitle: null,
      introBody: null,
    })),
    assignDraftForPublicCustomer: jest.fn(async () => ({ id: 'intake-1' })),
    getIntakeFlowForPublicCustomer: jest.fn(async () => ({ id: 'intake-1' })),
    startIntakeForPublicCustomer: jest.fn(async () => ({ id: 'intake-1' })),
    submitAnswersForPublicCustomer: jest.fn(async () => ({ id: 'intake-1' })),
    linkIntakeToBooking: jest.fn(async () => ({ id: 'intake-1' })),
  };

  const businessService = {
    findBySlug: jest.fn(async () => business),
    findOne: jest.fn(async () => business),
  };

  const serviceRepo = {
    findOne: jest.fn(async () => labService),
  };

  const service = new PublicPreVisitIntakeService(
    businessService as never,
    intakeService as never,
    serviceRepo as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns checkout intake config for lab test services', async () => {
    const config = await service.getCheckoutConfig('city-poly', 'svc-lab');

    expect(config.offersPreVisitIntake).toBe(
      PUBLIC_PRE_VISIT_INTAKE_CONFIG_EXPECTED.offersPreVisitIntake,
    );
    expect(config.questionnaire).toMatchObject(
      PUBLIC_PRE_VISIT_INTAKE_CONFIG_EXPECTED.questionnaire,
    );
  });

  it('creates a customer draft intake for lab test checkout', async () => {
    const draft = await service.ensureCustomerDraft('city-poly', 'cust-1', {
      serviceId: 'svc-lab',
    });

    expect(draft).toEqual({ id: 'intake-1' });
    expect(intakeService.assignDraftForPublicCustomer).toHaveBeenCalledWith(
      'biz-clinic',
      'cust-1',
      undefined,
    );
  });
});
