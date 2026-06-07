import type { ExternalDoctor } from './entities/external-doctor.entity.js';

export const EXTERNAL_DOCTOR_FIXTURES = [
  {
    id: 'doc-1',
    businessId: 'biz-1',
    name: 'Dr Jane Referrer',
    clinicName: 'City Family Medicine',
    specialty: 'Family medicine',
    street: '100 King St W',
    unit: 'Suite 5',
    city: 'Toronto',
    province: 'ON',
    country: 'Canada',
    postalCode: 'M5X 1A9',
    faxNumber: '416-555-0100',
    phone: '416-555-0101',
    email: 'referrals@cityfm.example',
    isActive: true,
    createdAt: new Date('2026-06-01T10:00:00.000Z'),
    updatedAt: new Date('2026-06-02T10:00:00.000Z'),
  },
] as const satisfies ReadonlyArray<Partial<ExternalDoctor>>;

export const EXTERNAL_DOCTOR_CREATE_PAYLOAD = {
  name: 'Dr Jane Referrer',
  clinicName: 'City Family Medicine',
  specialty: 'Family medicine',
  address: {
    street: '100 King St W',
    unit: 'Suite 5',
    city: 'Toronto',
    province: 'ON',
    country: 'Canada',
    postalCode: 'M5X 1A9',
  },
  fax: '416-555-0100',
  phone: '416-555-0101',
  email: 'referrals@cityfm.example',
} as const;
