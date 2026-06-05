import { describe, expect, it } from 'vitest';
import {
  employeeAvatarUrl,
  employeeTitle,
  employeeToForm,
  emptyEmployeeForm,
  formToPayload,
  validateEmployeeServices,
} from './employee-types';

describe('employee-types', () => {
  it('emptyEmployeeForm returns blank defaults', () => {
    expect(emptyEmployeeForm()).toEqual({
      name: '',
      email: '',
      phone: '',
      title: '',
      avatarUrl: '',
      serviceIds: [],
    });
  });

  it('employeeTitle prefers metadata.title over metadata.role', () => {
    expect(employeeTitle({ metadata: { title: 'Cosmetologist', role: 'staff' } })).toBe(
      'Cosmetologist',
    );
    expect(employeeTitle({ metadata: { role: 'Provider' } })).toBe('Provider');
    expect(employeeTitle({ metadata: {} })).toBe('');
  });

  it('employeeAvatarUrl returns avatar url or null', () => {
    expect(employeeAvatarUrl({ metadata: { avatarUrl: 'https://x.test/a.png' } })).toBe(
      'https://x.test/a.png',
    );
    expect(employeeAvatarUrl({ metadata: {} })).toBeNull();
  });

  it('employeeToForm maps employee record fields', () => {
    expect(
      employeeToForm({
        id: 'emp-1',
        name: 'Anna',
        email: 'anna@test.com',
        phone: '+37495018418',
        serviceIds: ['svc-1'],
        metadata: { title: 'Stylist', avatarUrl: 'https://x.test/a.png' },
      }),
    ).toEqual({
      name: 'Anna',
      email: 'anna@test.com',
      phone: '+37495018418',
      title: 'Stylist',
      avatarUrl: 'https://x.test/a.png',
      serviceIds: ['svc-1'],
    });
  });

  it('employeeToForm falls back to empty defaults for missing optional fields', () => {
    expect(
      employeeToForm({
        id: 'emp-2',
        name: undefined as unknown as string,
        metadata: {},
      }),
    ).toEqual({
      name: '',
      email: '',
      phone: '',
      title: '',
      avatarUrl: '',
      serviceIds: [],
    });
  });

  it('validateEmployeeServices requires services when catalog is non-empty', () => {
    expect(validateEmployeeServices([], 0)).toBeNull();
    expect(validateEmployeeServices(['svc-1'], 2)).toBeNull();
    expect(validateEmployeeServices([], 2)).toBe('SERVICES_REQUIRED');
  });

  it('formToPayload trims fields and formats phone', () => {
    expect(
      formToPayload({
        name: '  Anna  ',
        email: '  anna@test.com  ',
        phone: '+37495018418',
        title: '  Stylist  ',
        avatarUrl: '  https://x.test/a.png  ',
        serviceIds: ['svc-1'],
      }),
    ).toEqual({
      name: 'Anna',
      email: 'anna@test.com',
      phone: '+37495018418',
      title: 'Stylist',
      avatarUrl: 'https://x.test/a.png',
      serviceIds: ['svc-1'],
    });
  });

  it('formToPayload omits blank optional fields', () => {
    expect(
      formToPayload({
        name: 'Anna',
        email: '',
        phone: '',
        title: '',
        avatarUrl: '',
        serviceIds: [],
      }),
    ).toEqual({
      name: 'Anna',
      email: undefined,
      phone: undefined,
      title: undefined,
      avatarUrl: undefined,
      serviceIds: [],
    });
  });

  it('formToPayload throws INVALID_PHONE for invalid numbers', () => {
    expect(() =>
      formToPayload({
        name: 'Anna',
        email: '',
        phone: 'not-a-phone',
        title: '',
        avatarUrl: '',
        serviceIds: [],
      }),
    ).toThrow('INVALID_PHONE');
  });
});
