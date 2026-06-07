import {
  formatPatientChartSummaryText,
  isPatientChartPendingResultStatus,
  type PatientChartSummaryView,
} from './patient-chart-summary.util.js';

describe('patient-chart-summary.util', () => {
  const summary: PatientChartSummaryView = {
    customerId: 'cust-1',
    customerName: 'Maria Lopez',
    allergies: 'Penicillin',
    chronicProblems: 'Hypertension',
    bloodType: 'O+',
    recentVisits: [
      {
        bookingId: 'booking-1',
        startTime: '2026-06-08T10:00:00.000Z',
        status: 'CONFIRMED',
        serviceName: 'Consultation',
        employeeName: 'Dr Smith',
      },
    ],
    pendingResults: [
      {
        id: 'result-1',
        testName: 'CBC',
        status: 'Completed',
        orderId: 'order-1',
        bookingId: 'booking-1',
      },
    ],
    pendingOrders: [
      {
        id: 'order-1',
        displayNames: 'CBC panel',
        status: 'AwaitingResults',
        bookingId: 'booking-1',
      },
    ],
  };

  it('detects pending result statuses', () => {
    expect(isPatientChartPendingResultStatus('Completed')).toBe(true);
    expect(isPatientChartPendingResultStatus('Released')).toBe(false);
  });

  it('formats full chart summary text', () => {
    const text = formatPatientChartSummaryText(summary);
    expect(text).toContain('Allergies: Penicillin');
    expect(text).toContain('Recent visits:');
    expect(text).toContain('Pending lab results: CBC (Completed)');
  });

  it('formats allergies-only focus', () => {
    const text = formatPatientChartSummaryText(summary, 'allergies');
    expect(text).toContain('Allergies: Penicillin');
    expect(text).not.toContain('Recent visits');
  });
});
