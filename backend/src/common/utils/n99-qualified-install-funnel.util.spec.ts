import { describe, expect, it } from '@jest/globals';
import {
  N99_QUALIFIED_FUNNEL_AUDIT_SCENARIOS,
  buildN99QualifiedFunnelHealthyRows,
} from './n99-qualified-install-funnel.fixtures.js';
import {
  assertN99QualifiedInstallDeadEndAudit,
  auditQualifiedInstallDeadEnds,
  buildQualifiedInstallFunnel,
  formatN99QualifiedInstallDeadEndAudit,
} from './n99-qualified-install-funnel.util.js';

describe('n99-qualified-install-funnel.util (n99-3.6)', () => {
  it('builds strict qualified-install funnel steps', () => {
    const funnel = buildQualifiedInstallFunnel(
      buildN99QualifiedFunnelHealthyRows(),
    );
    expect(funnel.cohortSize).toBe(1);
    expect(funnel.steps.map((step) => step.count)).toEqual([
      1, 1, 1, 1, 1, 1, 1,
    ]);
    expect(funnel.steps[1]?.dropOffFromPrevious).toBe(0);
  });

  it.each(N99_QUALIFIED_FUNNEL_AUDIT_SCENARIOS)(
    'auditQualifiedInstallDeadEnds $id',
    ({ rows, expectPassed, expectTicketSteps }) => {
      const audit = auditQualifiedInstallDeadEnds(rows);
      expect(audit.passed).toBe(expectPassed);
      expect(audit.fixTickets.map((ticket) => ticket.stepId)).toEqual(
        expectTicketSteps,
      );
    },
  );

  it('throws when dead-end audit fails', () => {
    const audit = auditQualifiedInstallDeadEnds(
      N99_QUALIFIED_FUNNEL_AUDIT_SCENARIOS[1].rows,
    );
    expect(() => assertN99QualifiedInstallDeadEndAudit(audit)).toThrow(
      /Confirm step/,
    );
  });

  it('formats audit summary', () => {
    const audit = auditQualifiedInstallDeadEnds(
      buildN99QualifiedFunnelHealthyRows(),
    );
    expect(formatN99QualifiedInstallDeadEndAudit(audit)).toContain('PASS');
  });
});
