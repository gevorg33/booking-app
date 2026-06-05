import { Injectable, Logger } from '@nestjs/common';
import type { CommandResult } from './command-completion.types.js';
import type { AiSurface } from './ai-capability.matrix.js';
import {
  resolveAccessTier,
  isRevenueRelatedRequest,
  isStaffDirectoryRequest,
  STAFF_SCOPED_INTENTS,
  type AccessTier,
} from './access-control.matrix.js';
import {
  AI_SECURITY_SYSTEM_RULES,
  assessPromptSecurity,
  canPerformBulkCustomerRead,
  isAvailabilityBypassAttempt,
  securityDenialMessage,
  stripDangerousParams,
  wrapUntrustedUserPrompt,
} from './ai-prompt-security.util.js';

@Injectable()
export class AiPromptSecurityService {
  private readonly logger = new Logger(AiPromptSecurityService.name);

  getClassifierSecurityRules(): string {
    return AI_SECURITY_SYSTEM_RULES;
  }

  prepareUserPromptForClassifier(prompt: string): string {
    return wrapUntrustedUserPrompt(prompt);
  }

  stripParams(params: Record<string, unknown>): Record<string, unknown> {
    return stripDangerousParams(params);
  }

  /** Pre-flight gate — returns a denial result when the prompt must be blocked outright. */
  preflightBlock(
    businessId: string,
    prompt: string,
    surface: AiSurface,
  ): CommandResult | null {
    const assessment = assessPromptSecurity(prompt);
    if (assessment.level !== 'block') {
      if (assessment.signals.length > 0) {
        this.logger.warn(
          `AI prompt signals [${surface}] business=${businessId}: ${assessment.signals.join(', ')}`,
        );
      }
      return null;
    }

    this.logger.warn(
      `AI prompt blocked [${surface}] business=${businessId} reason=${assessment.blockReason} signals=${assessment.signals.join(', ')}`,
    );

    return {
      success: false,
      action: 'security_blocked',
      summary: securityDenialMessage(assessment.blockReason),
      details: {
        securityBlocked: true,
        reason: assessment.blockReason,
        signals: assessment.signals,
      },
    };
  }

  /** Post-classification enforcement for action-specific abuse patterns. */
  enforceAction(
    businessId: string,
    surface: AiSurface,
    tier: AccessTier,
    action: string,
    prompt: string,
    params: Record<string, unknown>,
  ): CommandResult | null {
    const cleaned = stripDangerousParams(params);

    if (
      action === 'create_booking' &&
      isAvailabilityBypassAttempt(prompt, cleaned)
    ) {
      this.logger.warn(
        `AI availability bypass blocked business=${businessId} action=${action}`,
      );
      return {
        success: false,
        action,
        summary: securityDenialMessage('availability_bypass'),
        details: { securityBlocked: true, reason: 'availability_bypass' },
      };
    }

    if (tier === 'staff' || tier === 'client') {
      if (isRevenueRelatedRequest(action, cleaned, prompt)) {
        this.logger.warn(
          `AI revenue access denied business=${businessId} tier=${tier} action=${action}`,
        );
        return {
          success: false,
          action,
          summary:
            'Revenue and financial analytics are available to managers and owners only.',
          details: { securityBlocked: true, reason: 'revenue_access', tier },
        };
      }
      if (isStaffDirectoryRequest(action)) {
        return {
          success: false,
          action,
          summary: 'Staff directory access is limited to managers and owners.',
          details: { securityBlocked: true, reason: 'staff_directory', tier },
        };
      }
    }

    if (!canPerformBulkCustomerRead(surface, tier, prompt, action)) {
      this.logger.warn(
        `AI bulk customer read denied business=${businessId} tier=${tier} action=${action}`,
      );
      return {
        success: false,
        action,
        summary: securityDenialMessage('data_export'),
        details: { securityBlocked: true, reason: 'data_export', tier },
      };
    }

    return null;
  }

  applyStaffScope(
    tier: AccessTier,
    action: string,
    params: Record<string, unknown>,
    scopedEmployeeId?: string | null,
  ): Record<string, unknown> {
    if (
      tier !== 'staff' ||
      !scopedEmployeeId ||
      !STAFF_SCOPED_INTENTS.has(action)
    ) {
      return params;
    }
    return {
      ...params,
      employeeId: scopedEmployeeId,
      allProviders: false,
    };
  }
}
