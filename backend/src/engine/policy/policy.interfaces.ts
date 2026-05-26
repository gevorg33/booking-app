export enum PolicyDecision {
  ALLOW = 'allow',
  DENY = 'deny',
  REQUIRES_APPROVAL = 'requires_approval',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface PolicyContext {
  userId?: string;
  businessId: string;
  action: string;
  resource: string;
  params: Record<string, any>;
}

export interface PolicyResult {
  decision: PolicyDecision;
  riskLevel: RiskLevel;
  reasons: string[];
  violations: string[];
  requiredApprovals?: string[];
}

export interface PolicyRule {
  name: string;
  description: string;
  evaluate(context: PolicyContext): Promise<PolicyRuleResult>;
}

export interface PolicyRuleResult {
  passed: boolean;
  message: string;
  riskContribution: RiskLevel;
}
