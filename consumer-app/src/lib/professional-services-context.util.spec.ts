import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  persistProfessionalServicesContext,
  readProfessionalServicesContext,
} from './professional-services-context.util.js';

describe('professional-services-context', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('reads employeeId and startTime from query params first', () => {
    const query = new URLSearchParams({
      employeeId: 'emp-1',
      startTime: '2026-06-09T14:00:00.000Z',
      employeeName: 'Anna',
    });
    expect(readProfessionalServicesContext('salon', query)).toEqual({
      employeeId: 'emp-1',
      startTime: '2026-06-09T14:00:00.000Z',
      employeeName: 'Anna',
    });
  });

  it('falls back to session storage when query params are missing', () => {
    persistProfessionalServicesContext('salon', {
      employeeId: 'emp-2',
      startTime: '2026-06-09T15:00:00.000Z',
      employeeName: 'Bob',
    });
    expect(readProfessionalServicesContext('salon', new URLSearchParams())).toEqual({
      employeeId: 'emp-2',
      startTime: '2026-06-09T15:00:00.000Z',
      employeeName: 'Bob',
    });
  });
});
