export const PATIENT_CHART_RECENT_VISITS_LIMIT = 5;

export function isPatientChartPendingResultStatus(status: string): boolean {
  return status !== 'Released' && status !== 'Rejected';
}

export function isPatientChartPendingOrderStatus(status: string): boolean {
  return status !== 'Completed' && status !== 'Cancelled';
}

export interface PatientChartVisitSummary {
  bookingId: string;
  startTime: string;
  status: string;
  serviceName: string | null;
  employeeName: string | null;
}

export interface PatientChartPendingResultSummary {
  id: string;
  testName: string | null;
  status: string;
  orderId: string | null;
  bookingId: string | null;
}

export interface PatientChartPendingOrderSummary {
  id: string;
  displayNames: string | null;
  status: string;
  bookingId: string | null;
}

export interface PatientChartSummaryView {
  customerId: string;
  customerName: string | null;
  allergies: string | null;
  chronicProblems: string | null;
  bloodType: string | null;
  phiMasked?: boolean;
  recentVisits: PatientChartVisitSummary[];
  pendingResults: PatientChartPendingResultSummary[];
  pendingOrders: PatientChartPendingOrderSummary[];
}

export type PatientChartSummaryFocus =
  | 'all'
  | 'allergies'
  | 'visits'
  | 'results'
  | 'orders';

export function formatPatientChartSummaryText(
  summary: PatientChartSummaryView,
  focus: PatientChartSummaryFocus = 'all',
): string {
  const lines: string[] = [];
  const name = summary.customerName ?? 'this patient';
  lines.push(`Patient chart summary for ${name}.`);

  if (focus === 'all' || focus === 'allergies') {
    if (summary.phiMasked) {
      lines.push('Clinical profile PHI is masked for your role.');
    } else if (summary.allergies?.trim()) {
      lines.push(`Allergies: ${summary.allergies.trim()}.`);
    } else {
      lines.push('Allergies: none documented.');
    }
    if (focus === 'allergies' && summary.chronicProblems?.trim()) {
      lines.push(`Chronic problems: ${summary.chronicProblems.trim()}.`);
    }
    if (focus === 'allergies' && summary.bloodType?.trim()) {
      lines.push(`Blood type: ${summary.bloodType.trim()}.`);
    }
  }

  if (focus === 'all' || focus === 'visits') {
    if (summary.recentVisits.length === 0) {
      lines.push('Recent visits: none on file.');
    } else {
      const visitText = summary.recentVisits
        .map((visit) => {
          const label = visit.serviceName ?? 'Visit';
          const day = visit.startTime.slice(0, 10);
          return `${label} on ${day} (${visit.status})`;
        })
        .join('; ');
      lines.push(`Recent visits: ${visitText}.`);
    }
  }

  if (focus === 'all' || focus === 'results') {
    if (summary.pendingResults.length === 0) {
      lines.push('Pending lab results: none.');
    } else {
      const resultText = summary.pendingResults
        .map(
          (result) => `${result.testName ?? 'Lab result'} (${result.status})`,
        )
        .join('; ');
      lines.push(`Pending lab results: ${resultText}.`);
    }
  }

  if (focus === 'all' || focus === 'orders') {
    if (summary.pendingOrders.length === 0) {
      lines.push('Open lab orders: none.');
    } else {
      const orderText = summary.pendingOrders
        .map(
          (order) => `${order.displayNames ?? 'Lab order'} (${order.status})`,
        )
        .join('; ');
      lines.push(`Open lab orders: ${orderText}.`);
    }
  }

  return lines.join(' ');
}
