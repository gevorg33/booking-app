import { Injectable } from '@nestjs/common';
import {
  PolicyRule,
  PolicyRuleResult,
  PolicyContext,
  RiskLevel,
} from '../policy.interfaces.js';

@Injectable()
export class MaxBookingsPerDayRule implements PolicyRule {
  name = 'max_bookings_per_day';
  description = 'Limits the number of bookings an employee can have per day';

  async evaluate(context: PolicyContext): Promise<PolicyRuleResult> {
    if (context.action !== 'create_booking') {
      return {
        passed: true,
        message: 'Not applicable',
        riskContribution: RiskLevel.LOW,
      };
    }

    const currentCount = context.params.currentBookingsCount || 0;
    const maxAllowed = context.params.maxBookingsPerDay || 20;

    if (currentCount >= maxAllowed) {
      return {
        passed: false,
        message: `Employee has reached maximum bookings per day (${maxAllowed})`,
        riskContribution: RiskLevel.HIGH,
      };
    }

    return {
      passed: true,
      message: `Booking count within limits (${currentCount}/${maxAllowed})`,
      riskContribution: RiskLevel.LOW,
    };
  }
}

@Injectable()
export class MinBufferBetweenBookingsRule implements PolicyRule {
  name = 'min_buffer_between_bookings';
  description = 'Ensures minimum buffer time between consecutive bookings';

  async evaluate(context: PolicyContext): Promise<PolicyRuleResult> {
    if (context.action !== 'create_booking') {
      return {
        passed: true,
        message: 'Not applicable',
        riskContribution: RiskLevel.LOW,
      };
    }

    const hasAdjacentConflict = context.params.hasAdjacentConflict || false;

    if (hasAdjacentConflict) {
      return {
        passed: false,
        message: 'Insufficient buffer time between bookings',
        riskContribution: RiskLevel.MEDIUM,
      };
    }

    return {
      passed: true,
      message: 'Buffer time is sufficient',
      riskContribution: RiskLevel.LOW,
    };
  }
}

@Injectable()
export class BusinessHoursRule implements PolicyRule {
  name = 'business_hours';
  description = 'Ensures bookings are within business operating hours';

  async evaluate(context: PolicyContext): Promise<PolicyRuleResult> {
    if (context.action !== 'create_booking') {
      return {
        passed: true,
        message: 'Not applicable',
        riskContribution: RiskLevel.LOW,
      };
    }

    const withinHours = context.params.withinBusinessHours !== false;

    if (!withinHours) {
      return {
        passed: false,
        message: 'Booking is outside business operating hours',
        riskContribution: RiskLevel.HIGH,
      };
    }

    return {
      passed: true,
      message: 'Booking is within business hours',
      riskContribution: RiskLevel.LOW,
    };
  }
}

@Injectable()
export class BulkOperationSafetyRule implements PolicyRule {
  name = 'bulk_operation_safety';
  description =
    'Adds risk assessment for operations affecting multiple bookings';

  async evaluate(context: PolicyContext): Promise<PolicyRuleResult> {
    const affectedCount = context.params.affectedBookingsCount || 0;

    if (affectedCount > 50) {
      return {
        passed: false,
        message: `Bulk operation affects ${affectedCount} bookings — requires manual review`,
        riskContribution: RiskLevel.CRITICAL,
      };
    }

    if (affectedCount > 10) {
      return {
        passed: true,
        message: `Operation affects ${affectedCount} bookings — elevated risk`,
        riskContribution: RiskLevel.HIGH,
      };
    }

    if (affectedCount > 5) {
      return {
        passed: true,
        message: `Operation affects ${affectedCount} bookings — moderate risk`,
        riskContribution: RiskLevel.MEDIUM,
      };
    }

    return {
      passed: true,
      message: `Operation affects ${affectedCount} bookings — low risk`,
      riskContribution: RiskLevel.LOW,
    };
  }
}
