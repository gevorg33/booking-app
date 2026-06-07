import { describe, expect, it } from 'vitest';
import {
  defaultExternalDoctorForm,
  externalDoctorFormToPayload,
  externalDoctorToForm,
} from './external-doctors';

describe('external-doctors', () => {
  it('maps form state to API payload with trimmed optional fields', () => {
    expect(
      externalDoctorFormToPayload(
        defaultExternalDoctorForm({
          name: ' Dr Jane Referrer ',
          clinicName: ' City Family Medicine ',
          address: {
            street: '100 King St W',
            unit: 'Suite 5',
            city: 'Toronto',
            province: 'ON',
            country: 'Canada',
            postalCode: 'M5X 1A9',
          },
          fax: '416-555-0100',
        }),
      ),
    ).toEqual({
      name: 'Dr Jane Referrer',
      clinicName: 'City Family Medicine',
      specialty: null,
      address: {
        street: '100 King St W',
        unit: 'Suite 5',
        city: 'Toronto',
        province: 'ON',
        country: 'Canada',
        postalCode: 'M5X 1A9',
      },
      fax: '416-555-0100',
      phone: null,
      email: null,
      isActive: true,
    });
  });

  it('hydrates edit form from registry row', () => {
    expect(
      externalDoctorToForm({
        id: 'doc-1',
        businessId: 'biz-1',
        name: 'Dr Jane Referrer',
        clinicName: 'City Family Medicine',
        specialty: 'Family medicine',
        address: 'formatted',
        street: '100 King St W',
        unit: 'Suite 5',
        city: 'Toronto',
        province: 'ON',
        country: 'Canada',
        postalCode: 'M5X 1A9',
        fax: '416-555-0100',
        phone: null,
        email: null,
        isActive: true,
        createdAt: '2026-06-01T10:00:00.000Z',
        updatedAt: '2026-06-02T10:00:00.000Z',
      }),
    ).toMatchObject({
      name: 'Dr Jane Referrer',
      clinicName: 'City Family Medicine',
      address: expect.objectContaining({ street: '100 King St W' }),
    });
  });
});
