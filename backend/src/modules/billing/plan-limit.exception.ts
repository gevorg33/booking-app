import { ForbiddenException } from '@nestjs/common';
import type { PlanLimitKind } from './plan-limits.js';
import { PLAN_LIMIT_MESSAGES, UPGRADE_PLAN_ID } from './plan-limits.js';

export const PLAN_LIMIT_ERROR_CODE = 'PLAN_LIMIT_EXCEEDED';

export class PlanLimitExceededException extends ForbiddenException {
  constructor(
    public readonly limit: PlanLimitKind,
    public readonly current?: number,
    public readonly max?: number,
  ) {
    const message =
      PLAN_LIMIT_MESSAGES[limit] ?? 'Plan limit reached. Upgrade to continue.';
    super({
      statusCode: 403,
      message,
      code: PLAN_LIMIT_ERROR_CODE,
      limit,
      current,
      max,
      upgradePlanId: UPGRADE_PLAN_ID,
    });
  }
}
