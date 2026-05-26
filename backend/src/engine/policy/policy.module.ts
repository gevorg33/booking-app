import { Module, OnModuleInit } from '@nestjs/common';
import { PolicyEngineService } from './policy-engine.service.js';
import {
  MaxBookingsPerDayRule,
  MinBufferBetweenBookingsRule,
  BusinessHoursRule,
  BulkOperationSafetyRule,
} from './rules/scheduling-policy.rules.js';

@Module({
  providers: [
    PolicyEngineService,
    MaxBookingsPerDayRule,
    MinBufferBetweenBookingsRule,
    BusinessHoursRule,
    BulkOperationSafetyRule,
  ],
  exports: [PolicyEngineService],
})
export class PolicyModule implements OnModuleInit {
  constructor(
    private policyEngine: PolicyEngineService,
    private maxBookingsRule: MaxBookingsPerDayRule,
    private minBufferRule: MinBufferBetweenBookingsRule,
    private businessHoursRule: BusinessHoursRule,
    private bulkOperationRule: BulkOperationSafetyRule,
  ) {}

  onModuleInit() {
    this.policyEngine.registerRule(this.maxBookingsRule);
    this.policyEngine.registerRule(this.minBufferRule);
    this.policyEngine.registerRule(this.businessHoursRule);
    this.policyEngine.registerRule(this.bulkOperationRule);
  }
}
