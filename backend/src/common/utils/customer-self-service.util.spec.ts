import {
  DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS,
  applyCustomerSelfServiceToBusinessSettings,
  applyPublicPaymentSettingsToBusinessSettings,
  evaluateCustomerBookingPolicy,
  canCustomerManageBookingOnline,
  resolveBookingManageLinkLabel,
  mergeCustomerSelfServiceSettingsPatch,
  readRescheduleCount,
  resolveCustomerSelfServiceSettings,
  resolvePublicPaymentSettings,
} from './customer-self-service.util.js';

describe('customer-self-service.util', () => {
  const futureStart = new Date(Date.now() + 48 * 60 * 60 * 1000);

  it('resolves defaults when settings missing', () => {
    expect(resolveCustomerSelfServiceSettings(null)).toEqual(DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS);
    expect(resolvePublicPaymentSettings(null)).toEqual({ acceptCashPayments: false });
  });

  it('merges stored self-service settings and falls back invalid numbers', () => {
    expect(
      resolveCustomerSelfServiceSettings({
        publicBooking: {
          customerSelfService: {
            allowCancel: false,
            allowReschedule: false,
            minimumNoticeHours: -5,
            maxReschedulesPerBooking: 0,
          },
          acceptCashPayments: true,
        },
      }),
    ).toMatchObject({
      allowCancel: false,
      allowReschedule: false,
      minimumNoticeHours: 24,
      maxReschedulesPerBooking: 3,
    });
    expect(
      resolvePublicPaymentSettings({ publicBooking: { acceptCashPayments: true } }),
    ).toEqual({ acceptCashPayments: true });
  });

  it('mergeCustomerSelfServiceSettingsPatch keeps current values for omitted fields', () => {
    const current = {
      allowCancel: true,
      allowReschedule: false,
      minimumNoticeHours: 12,
      maxReschedulesPerBooking: 2,
      allowProviderChangeOnReschedule: false,
    };
    expect(mergeCustomerSelfServiceSettingsPatch(current, { allowReschedule: true })).toEqual({
      allowCancel: true,
      allowReschedule: true,
      minimumNoticeHours: 12,
      maxReschedulesPerBooking: 2,
      allowProviderChangeOnReschedule: false,
    });
    expect(
      mergeCustomerSelfServiceSettingsPatch(current, {
        allowCancel: false,
        minimumNoticeHours: 6,
        maxReschedulesPerBooking: 5,
        allowProviderChangeOnReschedule: true,
      }),
    ).toEqual({
      allowCancel: false,
      allowReschedule: false,
      minimumNoticeHours: 6,
      maxReschedulesPerBooking: 5,
      allowProviderChangeOnReschedule: true,
    });
  });

  it('applyCustomerSelfServiceToBusinessSettings and payment patch preserve other keys', () => {
    const settings = { locale: 'en', publicBooking: { enabled: true } };
    const nextCss = { ...DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS, minimumNoticeHours: 6 };
    expect(applyCustomerSelfServiceToBusinessSettings(settings, nextCss)).toEqual({
      locale: 'en',
      publicBooking: { enabled: true, customerSelfService: nextCss },
    });
    expect(
      applyPublicPaymentSettingsToBusinessSettings(settings, { acceptCashPayments: true }),
    ).toEqual({
      locale: 'en',
      publicBooking: { enabled: true, acceptCashPayments: true },
    });
  });

  it('allows cancel when policy permits', () => {
    const result = evaluateCustomerBookingPolicy(
      { status: 'confirmed', startTime: futureStart },
      DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS,
      'cancel',
    );
    expect(result.allowed).toBe(true);
  });

  it('blocks terminal statuses', () => {
    expect(
      evaluateCustomerBookingPolicy(
        { status: 'cancelled', startTime: futureStart },
        DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS,
        'cancel',
      ).reason,
    ).toContain('already cancelled');
    expect(
      evaluateCustomerBookingPolicy(
        { status: 'completed', startTime: futureStart },
        DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS,
        'cancel',
      ).reason,
    ).toContain('Completed');
    expect(
      evaluateCustomerBookingPolicy(
        { status: 'no_show', startTime: futureStart },
        DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS,
        'cancel',
      ).reason,
    ).toContain('no-show');
  });

  it('blocks when business disables cancel or reschedule', () => {
    const disabled = {
      ...DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS,
      allowCancel: false,
      allowReschedule: false,
    };
    expect(
      evaluateCustomerBookingPolicy({ status: 'confirmed', startTime: futureStart }, disabled, 'cancel')
        .reason,
    ).toContain('cancellation');
    expect(
      evaluateCustomerBookingPolicy(
        { status: 'confirmed', startTime: futureStart },
        disabled,
        'reschedule',
      ).reason,
    ).toContain('rescheduling');
  });

  it('blocks cancel inside notice window', () => {
    const soon = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const result = evaluateCustomerBookingPolicy(
      { status: 'confirmed', startTime: soon },
      DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS,
      'cancel',
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('24 hours');
  });

  it('blocks reschedule when max reached', () => {
    const result = evaluateCustomerBookingPolicy(
      {
        status: 'confirmed',
        startTime: futureStart,
        metadata: { customerRescheduleCount: 3 },
      },
      DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS,
      'reschedule',
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('maximum');
  });

  it('reads reschedule count from metadata', () => {
    expect(readRescheduleCount({ customerRescheduleCount: 2 })).toBe(2);
    expect(readRescheduleCount({ customerRescheduleCount: -1 })).toBe(0);
    expect(readRescheduleCount({ customerRescheduleCount: 'bad' })).toBe(0);
    expect(readRescheduleCount({})).toBe(0);
  });

  it('detects when online manage link should be offered', () => {
    const booking = { status: 'confirmed', startTime: futureStart };
    const disabled = {
      ...DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS,
      allowCancel: false,
      allowReschedule: false,
    };
    expect(canCustomerManageBookingOnline(booking, DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS)).toBe(true);
    expect(canCustomerManageBookingOnline(booking, disabled)).toBe(false);
    expect(
      canCustomerManageBookingOnline(booking, {
        ...DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS,
        allowCancel: false,
        allowReschedule: true,
      }),
    ).toBe(true);
  });

  it('builds manage link label for allowed actions only', () => {
    const booking = { status: 'confirmed', startTime: futureStart };
    expect(resolveBookingManageLinkLabel(booking, DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS)).toBe(
      'Manage your booking (reschedule or cancel)',
    );
    expect(
      resolveBookingManageLinkLabel(booking, {
        ...DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS,
        allowCancel: false,
      }),
    ).toBe('Manage your booking (reschedule)');
    expect(
      resolveBookingManageLinkLabel(booking, {
        ...DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS,
        allowReschedule: false,
      }),
    ).toBe('Manage your booking (cancel)');
    expect(
      resolveBookingManageLinkLabel(booking, {
        ...DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS,
        allowCancel: false,
        allowReschedule: false,
      }),
    ).toBeNull();
  });
});
