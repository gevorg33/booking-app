import { describe, expect, it } from 'vitest';
import {
  buildProviderBookingPrompt,
  formatProviderTimes,
  normalizeAvailableProviders,
} from './ai-available-providers.util';

describe('normalizeAvailableProviders', () => {
  it('returns empty list for missing details', () => {
    expect(normalizeAvailableProviders()).toEqual([]);
    expect(normalizeAvailableProviders(undefined)).toEqual([]);
    expect(normalizeAvailableProviders({})).toEqual([]);
  });

  it('normalizes structured provider availability rows', () => {
    expect(
      normalizeAvailableProviders({
        availability: [
          {
            id: 'emp-1',
            name: 'Karo Mazmanyan',
            role: 'Cosmetologist',
            previewTimes: ['14:00', '14:30'],
          },
        ],
      }),
    ).toEqual([
      {
        id: 'emp-1',
        name: 'Karo Mazmanyan',
        role: 'Cosmetologist',
        previewTimes: ['14:00', '14:30'],
      },
    ]);
  });

  it('normalizes providers array when availability is absent', () => {
    expect(
      normalizeAvailableProviders({
        providers: [
          {
            id: 'emp-2',
            name: 'Mary Torgomyan',
            earliestStartTime: '15:00',
          },
        ],
      }),
    ).toEqual([
      {
        id: 'emp-2',
        name: 'Mary Torgomyan',
        earliestStartTime: '15:00',
      },
    ]);
  });

  it('falls back to available provider names', () => {
    expect(
      normalizeAvailableProviders({
        availableProviders: ['Mary Torgomyan', 'Karo Mazmanyan'],
      }),
    ).toEqual([{ name: 'Mary Torgomyan' }, { name: 'Karo Mazmanyan' }]);
  });

  it('deduplicates providers by id, preferring first structured row', () => {
    expect(
      normalizeAvailableProviders({
        providers: [{ id: 'emp-1', name: 'Karo' }],
        availability: [{ id: 'emp-1', name: 'Karo', previewTimes: ['15:00'] }],
      }),
    ).toEqual([
      {
        id: 'emp-1',
        name: 'Karo',
        previewTimes: ['15:00'],
      },
    ]);
  });

  it('deduplicates providers without ids by name', () => {
    expect(
      normalizeAvailableProviders({
        availability: [
          { name: 'Karo', previewTimes: ['14:00'] },
          { name: 'Karo', previewTimes: ['15:00'] },
        ],
      }),
    ).toEqual([{ name: 'Karo', previewTimes: ['14:00'] }]);
  });

  it('ignores malformed provider rows', () => {
    expect(
      normalizeAvailableProviders({
        availability: [{ id: 'emp-1' }, null, 'bad', { name: '   ' }],
        availableProviders: ['Valid Name'],
      }),
    ).toEqual([{ name: 'Valid Name' }]);
  });

  it('maps lookup_service_assignment open slots', () => {
    expect(
      normalizeAvailableProviders({
        availability: [
          {
            name: 'Karo Mazmanyan',
            openSlots: [{ start: '14:00', end: '15:00' }],
          },
        ],
      }),
    ).toEqual([
      {
        name: 'Karo Mazmanyan',
        openSlots: [{ start: '14:00', end: '15:00' }],
      },
    ]);
  });

  it('maps scheduled blocks from lookup_service_assignment rows', () => {
    expect(
      normalizeAvailableProviders({
        availability: [
          {
            name: 'Karo Mazmanyan',
            scheduledBlocks: [{ start: '09:00', end: '13:00' }],
          },
        ],
      }),
    ).toEqual([
      {
        name: 'Karo Mazmanyan',
        scheduledBlocks: [{ start: '09:00', end: '13:00' }],
      },
    ]);
  });

  it('returns empty list when structured and name fallbacks are empty', () => {
    expect(
      normalizeAvailableProviders({
        availableProviders: [],
        providers: [],
        availability: [],
      }),
    ).toEqual([]);
  });
});

describe('formatProviderTimes', () => {
  it('prefers preview times', () => {
    expect(
      formatProviderTimes({
        name: 'Karo',
        previewTimes: ['14:00', '14:30'],
        earliestStartTime: '13:00',
      }),
    ).toBe('14:00, 14:30');
  });

  it('formats scheduled blocks when only shift blocks are known', () => {
    expect(
      formatProviderTimes({
        name: 'Karo',
        scheduledBlocks: [{ start: '09:00', end: '13:00' }],
      }),
    ).toBeNull();
  });

  it('formats open slot ranges', () => {
    expect(
      formatProviderTimes({
        name: 'Karo',
        openSlots: [
          { start: '14:00', end: '15:00' },
          { start: '16:00', end: '17:00' },
        ],
      }),
    ).toBe('14:00–15:00, 16:00–17:00');
  });

  it('falls back to earliest start time', () => {
    expect(
      formatProviderTimes({
        name: 'Karo',
        earliestStartTime: '14:00',
      }),
    ).toBe('14:00');
  });

  it('returns null when no times are available', () => {
    expect(formatProviderTimes({ name: 'Karo' })).toBeNull();
  });
});

describe('buildProviderBookingPrompt', () => {
  it('builds a booking prompt with service, date, and first preview time', () => {
    expect(
      buildProviderBookingPrompt({
        provider: {
          name: 'Karo Mazmanyan',
          previewTimes: ['14:00', '14:30'],
        },
        serviceName: 'Permanent lips',
        date: '2026-06-06',
      }),
    ).toBe('Book Permanent lips with Karo Mazmanyan on 2026-06-06 at 14:00');
  });

  it('uses earliest start time when preview times are missing', () => {
    expect(
      buildProviderBookingPrompt({
        provider: {
          name: 'Mary Torgomyan',
          earliestStartTime: '16:30',
        },
        serviceName: 'Massage',
      }),
    ).toBe('Book Massage with Mary Torgomyan at 16:30');
  });

  it('uses open slot start when only slot ranges exist', () => {
    expect(
      buildProviderBookingPrompt({
        provider: {
          name: 'Anna',
          openSlots: [{ start: '11:00', end: '12:00' }],
        },
        serviceName: 'Facial',
        date: '2026-06-07',
      }),
    ).toBe('Book Facial with Anna on 2026-06-07 at 11:00');
  });

  it('falls back to generic service wording without a time', () => {
    expect(
      buildProviderBookingPrompt({
        provider: { name: 'Sam' },
      }),
    ).toBe('Book the service with Sam');
  });

  it('trims blank service names', () => {
    expect(
      buildProviderBookingPrompt({
        provider: { name: 'Sam', previewTimes: ['10:00'] },
        serviceName: '   ',
      }),
    ).toBe('Book the service with Sam at 10:00');
  });
});
