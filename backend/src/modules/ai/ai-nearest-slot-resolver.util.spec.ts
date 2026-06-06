import { buildNearestBookableSlotQuery } from './ai-nearest-slot-resolver.util.js';

describe('ai-nearest-slot-resolver.util (ai-cmd-h2.3)', () => {
  it('maps evening window to notBeforeTime 17:00', () => {
    const query = buildNearestBookableSlotQuery(
      { serviceName: 'massage', timeOfDay: 'evening', date: '2026-06-07' },
      'book nearest massage tomorrow evening',
    );
    expect(query.notBeforeTime).toBe('17:00');
    expect(query.timeOfDay).toBe('evening');
    expect(query.startDateKey).toBe('2026-06-07');
  });

  it('clears employeeId when allProviders is true', () => {
    const query = buildNearestBookableSlotQuery(
      { allProviders: true, employeeId: 'e1' },
      '',
      'e2',
    );
    expect(query.employeeId).toBeNull();
  });

  it('prefers named employee over params.employeeId when not allProviders', () => {
    const query = buildNearestBookableSlotQuery(
      { employeeId: 'e1' },
      '',
      'e2',
    );
    expect(query.employeeId).toBe('e2');
  });

  it('falls back to timeFrom when no time-of-day window', () => {
    const query = buildNearestBookableSlotQuery(
      { timeFrom: '16:00', date: '2026-06-08' },
      'book nearest after 16:00',
    );
    expect(query.notBeforeTime).toBe('16:00');
  });

  it('resolves tomorrow start date from prompt', () => {
    const query = buildNearestBookableSlotQuery(
      {},
      'book the nearest slot tomorrow',
    );
    expect(query.startDateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
