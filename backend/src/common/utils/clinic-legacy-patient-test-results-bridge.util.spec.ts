import {
  buildLegacyPatientTestResultViewId,
  isLegacyPatientTestResultViewId,
  mapLegacyPatientTestResultRowsToViews,
  parseLegacyPatientTestResultViewId,
  resolveLegacyPatientTestResultTestName,
} from './clinic-legacy-patient-test-results-bridge.util.js';

describe('clinic-legacy-patient-test-results-bridge.util', () => {
  it('builds and parses legacy result view ids', () => {
    const id = buildLegacyPatientTestResultViewId('booking-1', 2);
    expect(isLegacyPatientTestResultViewId(id)).toBe(true);
    expect(parseLegacyPatientTestResultViewId(id)).toEqual({
      bookingId: 'booking-1',
      index: 2,
    });
    expect(isLegacyPatientTestResultViewId('result-1')).toBe(false);
  });

  it('maps legacy metadata rows to structured result views', () => {
    const views = mapLegacyPatientTestResultRowsToViews({
      businessId: 'biz-1',
      bookingId: 'booking-1',
      customerId: 'cust-1',
      rows: [
        {
          notes: 'WBC high',
          name: 'CBC',
          status: 'Released',
          measurementFlag: 'Abnormal',
        },
      ],
      phiMasked: false,
    });

    expect(views).toEqual([
      expect.objectContaining({
        id: buildLegacyPatientTestResultViewId('booking-1', 0),
        comment: 'WBC high',
        testName: 'CBC',
        legacySource: 'booking_metadata',
        legacyMetadataIndex: 0,
        orderId: null,
      }),
    ]);
  });

  it('masks legacy notes on structured views when access is denied', () => {
    const views = mapLegacyPatientTestResultRowsToViews({
      businessId: 'biz-1',
      bookingId: 'booking-1',
      customerId: 'cust-1',
      rows: [{ notes: 'secret' }],
      phiMasked: true,
    });

    expect(views[0]?.comment).toBeNull();
    expect(views[0]?.phiMasked).toBe(true);
  });

  it('resolves legacy test names from name or testName', () => {
    expect(resolveLegacyPatientTestResultTestName({ name: ' Lipid ' })).toBe(
      'Lipid',
    );
    expect(
      resolveLegacyPatientTestResultTestName({ testName: 'Glucose' }),
    ).toBe('Glucose');
  });
});
