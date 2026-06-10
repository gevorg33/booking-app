import {
  PROVIDER_CHECK_IN_ELIGIBILITY_SCENARIOS,
  PROVIDER_FLOOR_STATUS_SCENARIOS,
} from './provider-booking-check-in.fixtures.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  buildProviderCheckInEligibility,
  buildProviderCheckInPushMessage,
  DEFAULT_PROVIDER_MOBILE_SETTINGS,
  providerMobileNotifyCustomerOnVisitStatus,
  providerMobileNotifyReceptionOnCheckIn,
  readProviderMobileSettings,
  resolveProviderBookingFloorStatus,
} from './provider-booking-check-in.util.js';

describe('provider-booking-check-in.util (prov-exp-3.1)', () => {
  it('defaults provider mobile settings', () => {
    expect(DEFAULT_PROVIDER_MOBILE_SETTINGS).toEqual({
      notifyReceptionOnCheckIn: false,
      notifyCustomerOnVisitStatus: false,
    });
    expect(readProviderMobileSettings(undefined)).toEqual({
      notifyReceptionOnCheckIn: false,
      notifyCustomerOnVisitStatus: false,
    });
    expect(
      readProviderMobileSettings({
        providerMobile: { notifyReceptionOnCheckIn: true },
      }),
    ).toEqual({
      notifyReceptionOnCheckIn: true,
      notifyCustomerOnVisitStatus: false,
    });
    expect(
      providerMobileNotifyReceptionOnCheckIn({
        providerMobile: { notifyReceptionOnCheckIn: true },
      }),
    ).toBe(true);
    expect(
      providerMobileNotifyCustomerOnVisitStatus({
        providerMobile: { notifyCustomerOnVisitStatus: true },
      }),
    ).toBe(true);
  });

  it.each(PROVIDER_FLOOR_STATUS_SCENARIOS)(
    'resolveProviderBookingFloorStatus — $id',
    ({ booking, expected }) => {
      expect(resolveProviderBookingFloorStatus(booking)).toBe(expected);
    },
  );

  it.each(PROVIDER_CHECK_IN_ELIGIBILITY_SCENARIOS)(
    'buildProviderCheckInEligibility — $id',
    ({ booking, allowed }) => {
      expect(buildProviderCheckInEligibility(booking).allowed).toBe(allowed);
    },
  );

  it('treats non-boolean notify flag as disabled', () => {
    expect(
      readProviderMobileSettings({
        providerMobile: { notifyReceptionOnCheckIn: 'yes' },
      }),
    ).toEqual({
      notifyReceptionOnCheckIn: false,
      notifyCustomerOnVisitStatus: false,
    });
  });

  it('ignores invalid checked-in timestamps when resolving floor status', () => {
    expect(
      resolveProviderBookingFloorStatus({
        status: BookingStatus.CONFIRMED,
        checkedInAt: 'not-a-date',
      }),
    ).toBe('waiting');
  });
});
