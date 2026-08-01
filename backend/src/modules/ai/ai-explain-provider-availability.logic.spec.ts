import {
  buildExplainProviderAvailabilityClarifySummary,
  prepareExplainProviderAvailabilityParams,
  validateExplainProviderAvailabilityParams,
  wrapCheckAvailabilityAsExplainProviderAvailability,
} from './ai-explain-provider-availability.logic.js';
import * as explainProviderAvailabilityUtil from './ai-explain-provider-availability.util.js';

describe('ai-explain-provider-availability.logic (ai-cmd-customer-4.11.3)', () => {
  it('wraps check_availability results', () => {
    const wrapped = wrapCheckAvailabilityAsExplainProviderAvailability(
      {
        success: true,
        action: 'check_availability',
        summary: 'Marco has openings Saturday.',
        details: { employeeName: 'Marco' },
      },
      'named_schedule',
    );
    expect(wrapped.action).toBe('explain_provider_availability');
    expect(wrapped.details).toMatchObject({
      aspect: 'named_schedule',
      wrappedFrom: 'check_availability',
      employeeName: 'Marco',
    });
  });

  it('builds clarify summaries by aspect', () => {
    expect(
      buildExplainProviderAvailabilityClarifySummary('named_schedule'),
    ).toContain('Marco');
    expect(
      buildExplainProviderAvailabilityClarifySummary('team_openings'),
    ).toContain('openings');
  });

  it('returns clarify when named schedule lacks provider', () => {
    const result = validateExplainProviderAvailabilityParams(
      { aspect: 'named_schedule' },
      'Is working Saturday?',
    );
    expect(result?.success).toBe(false);
  });

  it('prepares enriched availability params', () => {
    const prepared = prepareExplainProviderAvailabilityParams(
      {},
      'Who has openings tomorrow?',
      'UTC',
    );
    expect(prepared).toMatchObject({ allProviders: true });
  });

  it('accepts valid team openings prompt', () => {
    expect(
      validateExplainProviderAvailabilityParams(
        {},
        'Who has openings tomorrow?',
      ),
    ).toBeNull();
  });

  it('e2e-bug.194 — does not clarify named availability-for phrasing', () => {
    const prompt =
      'Explain Gevorg availability for Swedish massage next Tuesday';
    expect(validateExplainProviderAvailabilityParams({}, prompt)).toBeNull();
    expect(
      prepareExplainProviderAvailabilityParams({}, prompt, 'UTC'),
    ).toMatchObject({
      employeeName: 'Gevorg',
      aspect: 'named_schedule',
      serviceName: expect.stringMatching(/swedish/i),
    });
  });

  it('requires employee name for named schedule aspect', () => {
    jest
      .spyOn(
        explainProviderAvailabilityUtil,
        'parseExplainProviderAvailabilityFromPrompt',
      )
      .mockReturnValue({ aspect: 'named_schedule' });
    const result = validateExplainProviderAvailabilityParams({}, 'test');
    expect(result?.success).toBe(false);
    expect(result?.details?.missing).toContain('employeeName');
    jest.restoreAllMocks();
  });
});
