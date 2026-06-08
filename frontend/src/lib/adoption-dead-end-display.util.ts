export interface QualifiedInstallDeadEndTicketView {
  id: string;
  stepId: string;
  stepLabel: string;
  dropOffRate: number;
  usersDropped: number;
  usersEntered: number;
  title: string;
  suggestedFix: string;
}

export interface QualifiedInstallDeadEndAuditView {
  passed: boolean;
  dropThreshold: number;
  fixTickets: QualifiedInstallDeadEndTicketView[];
}

export function formatDeadEndDropRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function readQualifiedInstallDeadEndAudit(
  audit: QualifiedInstallDeadEndAuditView | undefined,
): QualifiedInstallDeadEndAuditView {
  return (
    audit ?? {
      passed: true,
      dropThreshold: 0.01,
      fixTickets: [],
    }
  );
}
