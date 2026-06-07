import {
  mapExternalDoctorSummary,
  mapExternalDoctorView,
} from './external-doctors.util.js';
import { EXTERNAL_DOCTOR_FIXTURES } from './external-doctors.fixtures.js';

describe('external-doctors.util', () => {
  it('maps registry rows with formatted address and contact fields', () => {
    const doctor = EXTERNAL_DOCTOR_FIXTURES[0];
    expect(mapExternalDoctorView(doctor as never)).toEqual(
      expect.objectContaining({
        id: 'doc-1',
        name: 'Dr Jane Referrer',
        clinicName: 'City Family Medicine',
        address: 'Suite 5 100 King St W, Toronto, ON, M5X 1A9, Canada',
        fax: '416-555-0100',
        phone: '416-555-0101',
        email: 'referrals@cityfm.example',
        isActive: true,
      }),
    );
  });

  it('maps nullable doctor fields to null in list views', () => {
    expect(
      mapExternalDoctorView({
        ...EXTERNAL_DOCTOR_FIXTURES[0],
        clinicName: null,
        specialty: null,
        unit: null,
        faxNumber: null,
        phone: null,
        email: null,
      } as never),
    ).toMatchObject({
      clinicName: null,
      specialty: null,
      unit: null,
      fax: null,
      phone: null,
      email: null,
    });
  });

  it('maps compact summary for patient chart profile', () => {
    const doctor = EXTERNAL_DOCTOR_FIXTURES[0];
    expect(mapExternalDoctorSummary(doctor as never)).toEqual({
      id: 'doc-1',
      name: 'Dr Jane Referrer',
      clinicName: 'City Family Medicine',
      address: 'Suite 5 100 King St W, Toronto, ON, M5X 1A9, Canada',
      fax: '416-555-0100',
    });
  });
});
