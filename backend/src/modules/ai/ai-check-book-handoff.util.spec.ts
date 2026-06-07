import {
  attachCheckProvidersHandoff,
  buildCheckProvidersHandoffFromResult,
  mergeCheckProvidersHandoffIntoContext,
  pickCheckProvidersHandoff,
} from './ai-check-book-handoff.util.js';

describe('ai-check-book-handoff.util (ai-cmd-h2.2)', () => {
  const checkResult = {
    success: true,
    action: 'check_providers_for_service',
    summary:
      '2 provider(s) available for massage on 07/06/2026:\n• Karo — 09:00',
    details: {
      serviceName: 'massage',
      serviceId: 's1',
      date: '2026-06-07',
      timeOfDay: 'evening',
      notBeforeTime: '17:00',
      availableProviders: ['Karo Mazmanyan'],
      availability: [{ id: 'e1', name: 'Karo Mazmanyan' }],
      noProviders: false,
    },
  };

  it('builds structured handoff from check step result', () => {
    const handoff = buildCheckProvidersHandoffFromResult(checkResult);
    expect(handoff?.summary).toContain('2 provider(s) available');
    expect(handoff?.serviceName).toBe('massage');
    expect(handoff?.availableProviders).toEqual(['Karo Mazmanyan']);
    expect(handoff?.timeOfDay).toBe('evening');
  });

  it('merges handoff into compound context after check step', () => {
    const merged = mergeCheckProvidersHandoffIntoContext({}, checkResult);
    expect(merged.checkProvidersHandoff).toMatchObject({
      serviceName: 'massage',
      availableProviders: ['Karo Mazmanyan'],
    });
    expect(merged.priorCheckSummary).toContain('2 provider(s) available');
  });

  it('picks handoff object from book step params', () => {
    const handoff = pickCheckProvidersHandoff({
      checkProvidersHandoff: buildCheckProvidersHandoffFromResult(checkResult),
    });
    expect(handoff?.serviceName).toBe('massage');
  });

  it('attaches handoff onto book_nearest_slot details', () => {
    const handoff = buildCheckProvidersHandoffFromResult(checkResult);
    const details = attachCheckProvidersHandoff(
      { slot: { startTime: '18:00' } },
      handoff,
    );
    expect(details.checkProvidersHandoff).toMatchObject({
      serviceName: 'massage',
    });
    expect(details.slot).toEqual({ startTime: '18:00' });
  });
});
