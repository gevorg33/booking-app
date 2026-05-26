import { Injectable, Logger } from '@nestjs/common';
import {
  PolicyContext,
  PolicyResult,
  PolicyDecision,
  PolicyRule,
  RiskLevel,
} from './policy.interfaces.js';

@Injectable()
export class PolicyEngineService {
  private readonly logger = new Logger(PolicyEngineService.name);
  private rules: PolicyRule[] = [];

  registerRule(rule: PolicyRule): void {
    this.rules.push(rule);
    this.logger.log(`Registered policy rule: ${rule.name}`);
  }

  async evaluate(context: PolicyContext): Promise<PolicyResult> {
    const results = await Promise.all(
      this.rules.map(async (rule) => {
        try {
          return await rule.evaluate(context);
        } catch (error: any) {
          this.logger.error(`Policy rule ${rule.name} failed: ${error.message}`);
          return {
            passed: false,
            message: `Rule evaluation failed: ${rule.name}`,
            riskContribution: RiskLevel.HIGH,
          };
        }
      }),
    );

    const violations = results
      .filter((r) => !r.passed)
      .map((r) => r.message);

    const riskLevel = this.calculateOverallRisk(
      results.map((r) => r.riskContribution),
    );

    let decision: PolicyDecision;
    if (violations.length > 0 && riskLevel === RiskLevel.CRITICAL) {
      decision = PolicyDecision.DENY;
    } else if (violations.length > 0 || riskLevel === RiskLevel.HIGH) {
      decision = PolicyDecision.REQUIRES_APPROVAL;
    } else {
      decision = PolicyDecision.ALLOW;
    }

    return {
      decision,
      riskLevel,
      reasons: results.map((r) => r.message),
      violations,
      requiredApprovals: decision === PolicyDecision.REQUIRES_APPROVAL
        ? ['business_admin']
        : undefined,
    };
  }

  private calculateOverallRisk(levels: RiskLevel[]): RiskLevel {
    const riskOrder: RiskLevel[] = [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL];
    let maxIndex = 0;
    for (const level of levels) {
      const idx = riskOrder.indexOf(level);
      if (idx > maxIndex) maxIndex = idx;
    }
    return riskOrder[maxIndex];
  }
}
