import {
  buildIntakeIncompleteAlerts,
  buildLabBookingRequestPendingAlerts,
  buildPatientAlertId,
  buildTestResultReleasedAlerts,
  isPatientAlertDismissed,
  mergePatientChartAlerts,
  patientAlertAccountAnchor,
  resolvePatientAlertAccountSection,
  shouldSurfaceIntakeIncompleteAlert,
  shouldSurfaceLabBookingRequestPendingAlert,
  shouldSurfaceTestResultReleasedAlert,
} from './clinic-patient-alert.util.js';
import {
  CLINIC_PATIENT_ALERT_DISMISSAL_SCENARIOS,
  CLINIC_PATIENT_ALERT_INTAKE_FIXTURES,
  CLINIC_PATIENT_ALERT_LAB_BOOKING_REQUEST_FIXTURES,
  CLINIC_PATIENT_ALERT_LIST_EXPECTED,
  CLINIC_PATIENT_ALERT_RESULT_FIXTURES,
} from '../../modules/patient-clinical-profiles/clinic-patient-alert.fixtures.js';

describe('clinic-patient-alert.util', () => {
  it.each(CLINIC_PATIENT_ALERT_DISMISSAL_SCENARIOS)(
    '$id tracks dismissal state',
    (scenario) => {
      expect(
        isPatientAlertDismissed(
          scenario.dismissals,
          scenario.alertType,
          scenario.sourceId,
        ),
      ).toBe(scenario.expected);
    },
  );

  it('builds alert ids with PatientAlertType prefix', () => {
    expect(buildPatientAlertId('TestResultReleased', 'result-1')).toBe(
      'TestResultReleased:result-1',
    );
  });

  it('surfaces pending lab booking requests only when pushed and unbooked', () => {
    expect(
      shouldSurfaceLabBookingRequestPendingAlert(
        CLINIC_PATIENT_ALERT_LAB_BOOKING_REQUEST_FIXTURES[0],
      ),
    ).toBe(true);
    expect(
      shouldSurfaceLabBookingRequestPendingAlert(
        CLINIC_PATIENT_ALERT_LAB_BOOKING_REQUEST_FIXTURES[1],
      ),
    ).toBe(false);
    expect(
      shouldSurfaceLabBookingRequestPendingAlert(
        CLINIC_PATIENT_ALERT_LAB_BOOKING_REQUEST_FIXTURES[2],
      ),
    ).toBe(false);
  });

  it('builds lab booking request pending alerts from fixtures', () => {
    const alerts = buildLabBookingRequestPendingAlerts({
      orders: CLINIC_PATIENT_ALERT_LAB_BOOKING_REQUEST_FIXTURES.map(
        (order) => ({
          id: order.id,
          bookingId: order.bookingId,
          displayNames: order.displayNames,
          collectionServiceName: order.collectionServiceName,
          status: order.status,
          bookingRequestPushedAt: order.bookingRequestPushedAt,
          collectionBookingId: order.collectionBookingId,
        }),
      ),
      dismissals: [],
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      id: 'LabBookingRequestPending:order-1',
      type: 'LabBookingRequestPending',
      chartTab: 'orders',
      orderDisplayNames: 'CBC, Lipid panel',
      collectionServiceName: 'Lab blood draw',
    });
  });

  it('surfaces released results and incomplete intakes only', () => {
    expect(
      shouldSurfaceTestResultReleasedAlert(
        CLINIC_PATIENT_ALERT_RESULT_FIXTURES[0],
      ),
    ).toBe(true);
    expect(
      shouldSurfaceTestResultReleasedAlert(
        CLINIC_PATIENT_ALERT_RESULT_FIXTURES[1],
      ),
    ).toBe(false);
    expect(
      shouldSurfaceIntakeIncompleteAlert(
        CLINIC_PATIENT_ALERT_INTAKE_FIXTURES[0],
      ),
    ).toBe(true);
    expect(
      shouldSurfaceIntakeIncompleteAlert(
        CLINIC_PATIENT_ALERT_INTAKE_FIXTURES[1],
      ),
    ).toBe(false);
  });

  it('merges chart alerts from fixtures', () => {
    const list = mergePatientChartAlerts({
      results: CLINIC_PATIENT_ALERT_RESULT_FIXTURES.map((result) => ({
        id: result.id,
        bookingId: result.bookingId,
        testName: result.testName,
        releasedAt: result.releasedAt,
        patientVisibility: result.patientVisibility,
        status: result.status,
      })),
      intakes: CLINIC_PATIENT_ALERT_INTAKE_FIXTURES.map((intake) => ({
        id: intake.id,
        bookingId: intake.bookingId,
        questionnaireTitle: intake.questionnaireTitle,
        status: intake.status,
        updatedAt: intake.updatedAt,
      })),
      dismissals: [],
    });

    expect(list.totalCount).toBe(CLINIC_PATIENT_ALERT_LIST_EXPECTED.totalCount);
    expect(list.alerts.map((alert) => alert.id)).toEqual(
      CLINIC_PATIENT_ALERT_LIST_EXPECTED.alerts.map((alert) => alert.id),
    );
  });

  it('respects dismissals when building alert groups', () => {
    const resultAlerts = buildTestResultReleasedAlerts({
      results: [
        {
          id: 'result-1',
          bookingId: null,
          testName: 'CBC panel',
          releasedAt: new Date('2026-06-21T10:00:00.000Z'),
          patientVisibility: 'New',
          status: 'Released',
        },
      ],
      dismissals: [{ alertType: 'TestResultReleased', sourceId: 'result-1' }],
    });
    const intakeAlerts = buildIntakeIncompleteAlerts({
      intakes: [
        {
          id: 'intake-1',
          bookingId: null,
          questionnaireTitle: 'Referral intake questionnaire',
          status: 'assigned',
          updatedAt: new Date('2026-06-21T09:00:00.000Z'),
        },
      ],
      dismissals: [],
    });

    expect(resultAlerts).toHaveLength(0);
    expect(intakeAlerts).toHaveLength(1);
  });

  it('uses collection service copy when order display names are missing', () => {
    const alerts = buildLabBookingRequestPendingAlerts({
      orders: [
        {
          id: 'order-4',
          bookingId: null,
          displayNames: null,
          collectionServiceName: 'Lab blood draw',
          status: 'NotCollected',
          bookingRequestPushedAt: new Date('2026-06-22T11:00:00.000Z'),
          collectionBookingId: null,
        },
      ],
      dismissals: [],
    });

    expect(alerts[0]?.messages[0]?.title).toBe(
      'Patient has not booked Lab blood draw yet.',
    );
  });

  it('uses generic lab booking copy when names are missing', () => {
    const alerts = buildLabBookingRequestPendingAlerts({
      orders: [
        {
          id: 'order-5',
          bookingId: null,
          displayNames: null,
          collectionServiceName: null,
          status: 'NotCollected',
          bookingRequestPushedAt: new Date('2026-06-22T10:00:00.000Z'),
          collectionBookingId: null,
        },
      ],
      dismissals: [],
    });

    expect(alerts[0]?.messages[0]?.title).toBe(
      'Patient has not booked lab collection yet.',
    );
    expect(alerts[0]?.createdAt).toBe('2026-06-22T10:00:00.000Z');
  });

  it('uses generic copy when test name is missing', () => {
    const alerts = buildTestResultReleasedAlerts({
      results: [
        {
          id: 'result-3',
          bookingId: null,
          testName: null,
          releasedAt: null,
          patientVisibility: 'Pending',
          status: 'Released',
        },
      ],
      dismissals: [],
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.messages[0]?.title).toBe(
      'A lab result is available for review.',
    );
    expect(alerts[0]?.testName).toBeNull();
  });

  it.each([
    ['results', 'results', 'my-results'],
    ['orders', 'lab-requests', 'my-lab-requests'],
    ['intake', 'intake', 'my-intake'],
  ] as const)(
    'maps chart tab %s to account section %s and anchor %s',
    (chartTab, section, anchor) => {
      expect(resolvePatientAlertAccountSection(chartTab)).toBe(section);
      expect(patientAlertAccountAnchor(section)).toBe(anchor);
    },
  );
});
