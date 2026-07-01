import {
  buildExplainAnyProviderOptionSummary,
  handleExplainAnyProviderOptionLogic,
} from './ai-explain-any-provider-option.logic.js';

describe('ai-explain-any-provider-option.logic (ai-cmd-customer-4.11.1)', () => {
  const employeeRepo = {
    count: jest.fn(async () => 4),
  };

  const deps = () => ({ employeeRepo });

  beforeEach(() => {
    jest.clearAllMocks();
    employeeRepo.count.mockResolvedValue(4);
  });

  it('explains what Any stylist means', async () => {
    const result = await handleExplainAnyProviderOptionLogic(
      deps(),
      'biz-1',
      {},
      'What does Any stylist mean?',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_any_provider_option');
    expect(result.summary).toContain('do not pick a named stylist');
    expect(result.details).toMatchObject({
      aspect: 'what_it_means',
      activeProviderCount: 4,
      label: 'Any available specialist',
    });
  });

  it('explains assignment behavior', async () => {
    const result = await handleExplainAnyProviderOptionLogic(
      deps(),
      'biz-1',
      {},
      'Will someone be assigned?',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('assigns an available specialist');
    expect(result.details?.aspect).toBe('assignment');
  });

  it('explains picker steps', async () => {
    const result = await handleExplainAnyProviderOptionLogic(
      deps(),
      'biz-1',
      {},
      'How do I pick any provider on this booking page?',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('Tap the specialist row');
    expect(result.details?.navigate).toEqual({
      path: 'booking',
      query: { focus: 'specialistPicker' },
    });
  });

  it('returns clarify for unrelated prompts', async () => {
    const result = await handleExplainAnyProviderOptionLogic(
      deps(),
      'biz-1',
      {},
      'Who is best for curly hair?',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('builds summary fragments per aspect', () => {
    expect(
      buildExplainAnyProviderOptionSummary({
        aspect: 'all',
        activeProviderCount: 3,
      }),
    ).toContain('active specialists');
    expect(
      buildExplainAnyProviderOptionSummary({ aspect: 'picker' }),
    ).toContain('Any available specialist at the top');
  });
});
