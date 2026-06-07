import { MemberRole } from '../../modules/business/entities/business-member.entity.js';
import { BookingStatus } from '../../modules/booking/entities/booking.entity.js';
import {
  canAuthorEncounterVisitNote,
  canAppendEncounterAddendum,
  isCompletedConsultationBooking,
  isEmployeeAssignedToBooking,
  readConsultationMetadata,
} from './patient-encounter-access.util.js';

describe('patient-encounter-access.util', () => {
  const consultationBooking = {
    status: BookingStatus.COMPLETED,
    employeeId: 'emp-1',
    linkedEmployeeIds: ['emp-2'],
    serviceMetadata: { serviceType: 'consultation' },
  };

  it('detects completed consultation bookings', () => {
    expect(isCompletedConsultationBooking(consultationBooking)).toBe(true);
    expect(
      isCompletedConsultationBooking({
        ...consultationBooking,
        serviceMetadata: { serviceType: 'lab_test' },
      }),
    ).toBe(false);
  });

  it('checks provider assignment including linked employees', () => {
    expect(isEmployeeAssignedToBooking(consultationBooking, 'emp-1')).toBe(
      true,
    );
    expect(isEmployeeAssignedToBooking(consultationBooking, 'emp-2')).toBe(
      true,
    );
    expect(isEmployeeAssignedToBooking(consultationBooking, 'emp-3')).toBe(
      false,
    );
  });

  it('allows managers to author visit notes', () => {
    expect(
      canAuthorEncounterVisitNote(
        {
          membershipRole: MemberRole.MANAGER,
          employeeId: 'emp-x',
          userId: 'u-1',
        },
        consultationBooking,
      ),
    ).toBe(true);
  });

  it('requires assigned provider for addenda', () => {
    expect(
      canAppendEncounterAddendum(
        {
          membershipRole: MemberRole.STAFF,
          employeeId: 'emp-1',
          userId: 'u-1',
        },
        consultationBooking,
      ),
    ).toBe(true);
    expect(
      canAppendEncounterAddendum(
        {
          membershipRole: MemberRole.STAFF,
          employeeId: 'emp-3',
          userId: 'u-1',
        },
        consultationBooking,
      ),
    ).toBe(false);
    expect(
      canAppendEncounterAddendum(
        { membershipRole: MemberRole.STAFF, employeeId: null, userId: 'u-1' },
        consultationBooking,
      ),
    ).toBe(false);
  });

  it('blocks visit notes for non-consultation or incomplete bookings', () => {
    expect(
      canAuthorEncounterVisitNote(
        {
          membershipRole: MemberRole.STAFF,
          employeeId: 'emp-1',
          userId: 'u-1',
        },
        { ...consultationBooking, status: BookingStatus.CONFIRMED },
      ),
    ).toBe(false);
    expect(readConsultationMetadata({ serviceType: 'lab_test' })).toBeNull();
  });
});
