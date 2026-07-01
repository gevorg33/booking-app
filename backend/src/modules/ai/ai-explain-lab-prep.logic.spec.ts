import { handleExplainLabPrepLogic } from './ai-explain-lab-prep.logic.js';
import { EXPLAIN_LAB_PREP_PROMPTS } from './ai-explain-lab-prep.fixtures.js';

describe('ai-explain-lab-prep.logic (ai-cmd-customer-4.7.1)', () => {
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-clinic',
      settings: { businessType: 'clinic' },
    })),
  };

  const cbcService = {
    id: 'svc-cbc',
    name: 'CBC',
    metadata: {
      serviceType: 'lab_test',
      requiresFasting: true,
      preparationNotes: 'Water only for 8 hours.',
    },
  };
  const lipidService = {
    id: 'svc-lipid',
    name: 'Lipid panel',
    metadata: {
      serviceType: 'lab_test',
      requiresFasting: true,
      preparationNotes: 'Fast 12 hours.',
    },
  };
  const tshService = {
    id: 'svc-tsh',
    name: 'TSH',
    metadata: { serviceType: 'lab_test', requiresFasting: false },
  };

  const serviceService = {
    findAll: jest.fn(async () => [cbcService, lipidService, tshService]),
  };

  const deps = { businessRepo, serviceService } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('explains fasting requirements for a named lab test', async () => {
    const result = await handleExplainLabPrepLogic(
      deps,
      'biz-clinic',
      { _prompt: 'Does CBC require fasting?' },
      'Does CBC require fasting?',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_lab_prep');
    expect(result.summary).toContain('CBC');
    expect(result.summary).toContain('fasting is required');
    expect(result.details?.requiresFasting).toBe(true);
  });

  it('summarizes catalog fasting requirements when no test is named', async () => {
    const result = await handleExplainLabPrepLogic(
      deps,
      'biz-clinic',
      { _prompt: 'Do I need to fast for blood work?' },
      'Do I need to fast for blood work?',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('Fasting required');
    expect(result.summary).toContain('CBC');
    expect(result.details?.fastingLabTests).toEqual(['CBC', 'Lipid panel']);
  });

  it('clarifies when named lab test is missing', async () => {
    const result = await handleExplainLabPrepLogic(
      deps,
      'biz-clinic',
      { serviceName: 'Vitamin D', _prompt: 'Does Vitamin D require fasting?' },
      'Does Vitamin D require fasting?',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(result.details?.missing).toEqual(['serviceName']);
  });

  it('rejects non-clinic businesses', async () => {
    businessRepo.findOne.mockResolvedValueOnce({
      id: 'biz-salon',
      settings: { businessType: 'salon' },
    });

    const result = await handleExplainLabPrepLogic(
      deps,
      'biz-salon',
      { _prompt: 'Do I need to fast for blood work?' },
      'Do I need to fast for blood work?',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('clinic vertical');
  });

  it.each(
    EXPLAIN_LAB_PREP_PROMPTS.filter(
      (row) =>
        row.serviceName && !row.serviceName.toLowerCase().includes('metabolic'),
    ).map((row) => [row.id, row] as const),
  )('resolves named lab test for $id', async (_id, row) => {
    const result = await handleExplainLabPrepLogic(
      deps,
      'biz-clinic',
      { _prompt: row.prompt },
      row.prompt,
    );

    expect(result.success).toBe(true);
    const expectedName = row.serviceName?.toLowerCase().includes('lipid')
      ? 'Lipid panel'
      : row.serviceName?.toLowerCase().includes('tsh')
        ? 'TSH'
        : 'CBC';
    expect(result.details?.serviceName).toBe(expectedName);
  });
});
