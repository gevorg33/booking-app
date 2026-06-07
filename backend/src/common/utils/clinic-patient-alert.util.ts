import { isClinicLabBookingRequestPending } from './clinic-lab-booking-request.util.js';
import type {
  ClinicPatientAlertListView,
  ClinicPatientAlertType,
  ClinicPatientAlertView,
} from './clinic-patient-alert.types.js';

export interface ClinicPatientAlertDismissalKey {
  alertType: ClinicPatientAlertType;
  sourceId: string;
}

export interface ClinicPatientAlertResultCandidate {
  id: string;
  bookingId: string | null;
  testName: string | null;
  releasedAt: Date | null;
  patientVisibility: string | null;
  status: string;
}

export interface ClinicPatientAlertIntakeCandidate {
  id: string;
  bookingId: string | null;
  questionnaireTitle: string;
  status: string;
  updatedAt: Date;
}

export interface ClinicPatientAlertLabBookingRequestCandidate {
  id: string;
  bookingId: string | null;
  displayNames: string | null;
  collectionServiceName: string | null;
  status: string;
  bookingRequestPushedAt: Date | null;
  collectionBookingId: string | null;
}

export function buildPatientAlertId(
  alertType: ClinicPatientAlertType,
  sourceId: string,
): string {
  return `${alertType}:${sourceId}`;
}

export function isPatientAlertDismissed(
  dismissals: ClinicPatientAlertDismissalKey[],
  alertType: ClinicPatientAlertType,
  sourceId: string,
): boolean {
  return dismissals.some(
    (entry) => entry.alertType === alertType && entry.sourceId === sourceId,
  );
}

export function shouldSurfaceTestResultReleasedAlert(
  result: ClinicPatientAlertResultCandidate,
): boolean {
  return (
    result.status === 'Released' &&
    (result.patientVisibility === 'New' ||
      result.patientVisibility === 'Pending')
  );
}

export function shouldSurfaceIntakeIncompleteAlert(
  intake: ClinicPatientAlertIntakeCandidate,
): boolean {
  return intake.status === 'assigned' || intake.status === 'in_progress';
}

export function shouldSurfaceLabBookingRequestPendingAlert(
  order: ClinicPatientAlertLabBookingRequestCandidate,
): boolean {
  return isClinicLabBookingRequestPending(order);
}

export function buildTestResultReleasedAlerts(input: {
  results: ClinicPatientAlertResultCandidate[];
  dismissals: ClinicPatientAlertDismissalKey[];
}): ClinicPatientAlertView[] {
  return input.results
    .filter(shouldSurfaceTestResultReleasedAlert)
    .filter(
      (result) =>
        !isPatientAlertDismissed(
          input.dismissals,
          'TestResultReleased',
          result.id,
        ),
    )
    .map((result) => ({
      id: buildPatientAlertId('TestResultReleased', result.id),
      type: 'TestResultReleased' as const,
      sourceId: result.id,
      bookingId: result.bookingId,
      title: 'New lab result released',
      messages: [
        {
          title: result.testName
            ? `${result.testName} is available for review.`
            : 'A lab result is available for review.',
        },
      ],
      chartTab: 'results' as const,
      createdAt: (result.releasedAt ?? new Date()).toISOString(),
      testName: result.testName,
    }));
}

export function buildIntakeIncompleteAlerts(input: {
  intakes: ClinicPatientAlertIntakeCandidate[];
  dismissals: ClinicPatientAlertDismissalKey[];
}): ClinicPatientAlertView[] {
  return input.intakes
    .filter(shouldSurfaceIntakeIncompleteAlert)
    .filter(
      (intake) =>
        !isPatientAlertDismissed(
          input.dismissals,
          'IntakeIncomplete',
          intake.id,
        ),
    )
    .map((intake) => ({
      id: buildPatientAlertId('IntakeIncomplete', intake.id),
      type: 'IntakeIncomplete' as const,
      sourceId: intake.id,
      bookingId: intake.bookingId,
      title: 'Pre-visit intake incomplete',
      messages: [
        {
          title: `${intake.questionnaireTitle} still needs answers.`,
        },
      ],
      chartTab: 'intake' as const,
      createdAt: intake.updatedAt.toISOString(),
      questionnaireTitle: intake.questionnaireTitle,
    }));
}

export function buildLabBookingRequestPendingAlerts(input: {
  orders: ClinicPatientAlertLabBookingRequestCandidate[];
  dismissals: ClinicPatientAlertDismissalKey[];
}): ClinicPatientAlertView[] {
  return input.orders
    .filter(shouldSurfaceLabBookingRequestPendingAlert)
    .filter(
      (order) =>
        !isPatientAlertDismissed(
          input.dismissals,
          'LabBookingRequestPending',
          order.id,
        ),
    )
    .map((order) => ({
      id: buildPatientAlertId('LabBookingRequestPending', order.id),
      type: 'LabBookingRequestPending' as const,
      sourceId: order.id,
      bookingId: order.bookingId,
      title: 'Lab collection booking pending',
      messages: [
        {
          title: order.displayNames
            ? `${order.displayNames} — patient has not booked collection yet.`
            : order.collectionServiceName
              ? `Patient has not booked ${order.collectionServiceName} yet.`
              : 'Patient has not booked lab collection yet.',
        },
      ],
      chartTab: 'orders' as const,
      createdAt: (order.bookingRequestPushedAt ?? new Date()).toISOString(),
      orderDisplayNames: order.displayNames,
      collectionServiceName: order.collectionServiceName,
    }));
}

export type ClinicPatientAccountSection =
  | 'results'
  | 'lab-requests'
  | 'intake'
  | 'bookings';

export function resolvePatientAlertAccountSection(
  chartTab: ClinicPatientAlertView['chartTab'],
): ClinicPatientAccountSection {
  switch (chartTab) {
    case 'results':
      return 'results';
    case 'orders':
      return 'lab-requests';
    case 'intake':
      return 'intake';
    default:
      return 'bookings';
  }
}

export function patientAlertAccountAnchor(
  section: ClinicPatientAccountSection,
): string {
  switch (section) {
    case 'results':
      return 'my-results';
    case 'lab-requests':
      return 'my-lab-requests';
    case 'intake':
      return 'my-intake';
    case 'bookings':
      return 'my-bookings';
  }
}

export function mergePatientChartAlerts(input: {
  results: ClinicPatientAlertResultCandidate[];
  intakes: ClinicPatientAlertIntakeCandidate[];
  labBookingRequests?: ClinicPatientAlertLabBookingRequestCandidate[];
  dismissals: ClinicPatientAlertDismissalKey[];
}): ClinicPatientAlertListView {
  const alerts = [
    ...buildTestResultReleasedAlerts({
      results: input.results,
      dismissals: input.dismissals,
    }),
    ...buildIntakeIncompleteAlerts({
      intakes: input.intakes,
      dismissals: input.dismissals,
    }),
    ...buildLabBookingRequestPendingAlerts({
      orders: input.labBookingRequests ?? [],
      dismissals: input.dismissals,
    }),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    alerts,
    totalCount: alerts.length,
  };
}
