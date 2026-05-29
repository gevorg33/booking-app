import {
  applyUnavailableBlocksToPeriods,
  extractUnavailableBlocksFromPrompt,
  inferDirectSchedulePeriods,
} from './ai-orchestration.helpers.js';

describe('inferDirectSchedulePeriods', () => {
  it('builds service blocks around lunch from prompt when periods are omitted', () => {
    const periods = inferDirectSchedulePeriods(
      { timeFrom: '09:00', timeTo: '19:00' },
      'Set schedule 9-19 with 12-13 unavailable',
    );
    expect(periods).toEqual([
      { startTime: '09:00', endTime: '12:00', type: 'service_block' },
      { startTime: '12:00', endTime: '13:00', type: 'unavailable_block', placeholderLabel: 'Unavailable' },
      { startTime: '13:00', endTime: '19:00', type: 'service_block' },
    ]);
  });

  it('fills gap when LLM returns split service blocks without unavailable period', () => {
    const periods = inferDirectSchedulePeriods(
      {
        periods: [
          { startTime: '09:00', endTime: '12:00', type: 'service_block' },
          { startTime: '13:00', endTime: '19:00', type: 'service_block' },
        ],
      },
      'Create schedule for Gevorg 9-19 and make 12-13 unavailable',
    );
    expect(periods).toEqual([
      { startTime: '09:00', endTime: '12:00', type: 'service_block' },
      { startTime: '12:00', endTime: '13:00', type: 'unavailable_block', placeholderLabel: 'Unavailable' },
      { startTime: '13:00', endTime: '19:00', type: 'service_block' },
    ]);
  });

  it('splits a single long service block when lunch is requested', () => {
    const periods = inferDirectSchedulePeriods(
      {
        periods: [{ startTime: '09:00', endTime: '19:00', type: 'service_block' }],
      },
      'Schedule 9-19, lunch 12-13 unavailable',
    );
    expect(periods).toEqual([
      { startTime: '09:00', endTime: '12:00', type: 'service_block', placeholderLabel: undefined },
      { startTime: '12:00', endTime: '13:00', type: 'unavailable_block', placeholderLabel: 'Lunch' },
      { startTime: '13:00', endTime: '19:00', type: 'service_block', placeholderLabel: undefined },
    ]);
  });
});

describe('extractUnavailableBlocksFromPrompt', () => {
  it('parses make X-Y unavailable phrasing', () => {
    expect(extractUnavailableBlocksFromPrompt('make 12-13 unavailable')).toEqual([
      { from: '12:00', to: '13:00', label: 'Unavailable' },
    ]);
  });
});

describe('applyUnavailableBlocksToPeriods', () => {
  it('inserts unavailable block into a bracketed gap', () => {
    const result = applyUnavailableBlocksToPeriods(
      [
        { startTime: '09:00', endTime: '12:00', type: 'service_block' },
        { startTime: '13:00', endTime: '19:00', type: 'service_block' },
      ],
      [{ from: '12:00', to: '13:00', label: 'Lunch' }],
    );
    expect(result[1]).toMatchObject({
      startTime: '12:00',
      endTime: '13:00',
      type: 'unavailable_block',
    });
  });
});
