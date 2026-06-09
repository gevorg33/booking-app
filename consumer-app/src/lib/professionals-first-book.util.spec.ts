import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  persistProfessionalsFirstBookState,
  readProfessionalsFirstBookQuery,
  readProfessionalsFirstBookState,
} from './professionals-first-book.util.js';

describe('readProfessionalsFirstBookState', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('returns empty state for invalid input', () => {
    expect(readProfessionalsFirstBookState(null)).toEqual({});
    expect(readProfessionalsFirstBookState('x')).toEqual({});
  });

  it('reads service and employee name from router state', () => {
    expect(
      readProfessionalsFirstBookState({
        professionalsFirstService: { id: 'svc-1', name: 'Facial' },
        employeeName: 'Alex',
      }),
    ).toEqual({
      professionalsFirstService: { id: 'svc-1', name: 'Facial' },
      employeeName: 'Alex',
    });
  });

  it('falls back to session storage when router state is missing', () => {
    persistProfessionalsFirstBookState('salon-a', 'svc-1', {
      professionalsFirstService: { id: 'svc-1', name: 'Facial' },
      employeeName: 'Alex',
      employeeId: 'emp-1',
      startTime: '2026-06-09T14:00:00.000Z',
    });
    expect(
      readProfessionalsFirstBookState(undefined, { slug: 'salon-a', serviceId: 'svc-1' }),
    ).toEqual({
      professionalsFirstService: { id: 'svc-1', name: 'Facial' },
      employeeName: 'Alex',
      employeeId: 'emp-1',
      startTime: '2026-06-09T14:00:00.000Z',
    });
  });

  it('reads launch query from session when URL search params are missing', () => {
    persistProfessionalsFirstBookState('salon-a', 'svc-1', {
      employeeId: 'emp-1',
      startTime: '2026-06-09T14:00:00.000Z',
    });
    expect(readProfessionalsFirstBookQuery('salon-a', 'svc-1', new URLSearchParams())).toEqual({
      employeeId: 'emp-1',
      slot: '2026-06-09T14:00:00.000Z',
      date: '2026-06-09',
      professionalsFirst: true,
    });
  });
});
