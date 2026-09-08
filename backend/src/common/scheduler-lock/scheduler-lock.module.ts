import { Global, Module } from '@nestjs/common';
import { SchedulerLockService } from './scheduler-lock.service.js';

/** e2e-bug.497 — global so each scheduler injects it without new wiring. */
@Global()
@Module({
  providers: [SchedulerLockService],
  exports: [SchedulerLockService],
})
export class SchedulerLockModule {}
