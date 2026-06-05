import {
  applyProviderEntityMemory,
  buildCoordinateWaitlistConfirmation,
  buildProviderClassifierAppendix,
  buildProviderSessionContextBlock,
  formatProviderHistoryBlock,
  matchEmployeeByName,
  matchWaitlistCustomerByName,
  rescueCoordinationIntent,
} from './provider-ai-sprint22.util.js';

describe('provider-ai-sprint22.util', () => {
  it('rescues coordination intents', () => {
    expect(rescueCoordinationIntent('If Maria cancels offer waitlist John', 'unknown')).toBe(
      'coordinate_waitlist_offer',
    );
  });

  it('applies provider entity memory from gateway aliases', () => {
    const params = applyProviderEntityMemory(
      {},
      'book facemassage for gevorg',
      { _entityMemoryAliases: { gevorg: { employeeName: 'Gevorg' }, facemassage: { serviceName: 'Face massage' } } },
    );
    expect(params.employeeName).toBe('Gevorg');
    expect(params.serviceName).toBe('Face massage');
  });

  it('builds classifier appendix and session blocks', () => {
    expect(
      buildProviderClassifierAppendix({
        _entityMemoryBlock: 'memory',
        _conversationSummary: 'summary',
      }),
    ).toContain('summary');
    expect(buildProviderSessionContextBlock({ confirmed: true, _ragContextBlock: 'rag' })).toContain(
      'confirmed',
    );
    expect(
      formatProviderHistoryBlock([{ role: 'user', content: 'hello' }]),
    ).toContain('user: hello');
  });

  it('matches employees and waitlist customers by name', () => {
    const employees = [{ name: 'Maria Lopez' }];
    const customers = [{ name: 'John Smith' }];
    expect(matchEmployeeByName(employees, 'maria')).toEqual(employees[0]);
    expect(matchWaitlistCustomerByName(customers, 'john')).toEqual(customers[0]);
    expect(matchEmployeeByName(employees, '')).toBeNull();
    expect(matchWaitlistCustomerByName(customers, undefined)).toBeNull();
    expect(matchEmployeeByName(employees, 'unknown')).toBeNull();
    expect(matchWaitlistCustomerByName([{ name: 'Johnny Walker' }], 'johnny')).toEqual({
      name: 'Johnny Walker',
    });
    expect(matchWaitlistCustomerByName([{ name: 'John Smith' }], 'john smith')).toEqual({
      name: 'John Smith',
    });
    expect(matchEmployeeByName([{ name: 'Maria Lopez' }], 'maria lopez')).toEqual({
      name: 'Maria Lopez',
    });
    expect(matchWaitlistCustomerByName([{ name: 'Jonathan' }], 'athan')).toEqual({
      name: 'Jonathan',
    });
  });

  it('returns empty appendix and session blocks when context is empty', () => {
    expect(buildProviderClassifierAppendix({})).toBe('');
    expect(buildProviderSessionContextBlock(undefined)).toBe('');
    expect(formatProviderHistoryBlock()).toBe('');
  });

  it('skips entity memory when aliases missing', () => {
    expect(applyProviderEntityMemory({ date: 'today' }, 'gevorg')).toEqual({ date: 'today' });
    expect(applyProviderEntityMemory({ date: 'today' }, 'gevorg', {})).toEqual({ date: 'today' });
    expect(
      applyProviderEntityMemory({ date: 'today' }, 'gevorg', { _entityMemoryAliases: {} }),
    ).toEqual({ date: 'today' });
  });

  it('omits session block when only intelligence keys are present', () => {
    expect(buildProviderSessionContextBlock({ _entityMemoryBlock: 'memory only' })).toBe('');
    expect(buildProviderSessionContextBlock({ note: '' })).toBe('');
  });

  it('handles whitespace-only names and empty history', () => {
    expect(matchWaitlistCustomerByName([{ name: 'John' }], '   ')).toBeNull();
    expect(matchWaitlistCustomerByName([{ name: 'John' }], 'zzz')).toBeNull();
    expect(formatProviderHistoryBlock([])).toBe('');
  });

  it('builds coordinate waitlist confirmation payload', () => {
    const result = buildCoordinateWaitlistConfirmation({
      employeeName: 'Maria',
      waitlistCustomerName: 'John',
      bookings: [{ id: 'b1', label: 'Maria — 14:00 John' }],
      params: { date: '02/06/2026' },
    });
    expect(result.action).toBe('coordinate_waitlist_offer');
    expect(result.details.requiresConfirmation).toBe(true);

    const emptyBookings = buildCoordinateWaitlistConfirmation({
      employeeName: 'Maria',
      waitlistCustomerName: 'John',
      bookings: [],
      params: {},
    });
    expect(emptyBookings.summary).toContain('the appointment');
  });
});
