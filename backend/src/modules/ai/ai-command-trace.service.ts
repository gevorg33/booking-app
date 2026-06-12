import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { AiCommandTrace } from './entities/ai-command-trace.entity.js';
import {
  buildAiCommandTraceRow,
  type RecordAiCommandTraceInput,
} from './ai-command-trace.util.js';

@Injectable()
export class AiCommandTraceService {
  private readonly logger = new Logger(AiCommandTraceService.name);

  constructor(
    @InjectRepository(AiCommandTrace)
    private readonly traceRepo: Repository<AiCommandTrace>,
  ) {}

  async record(input: RecordAiCommandTraceInput): Promise<AiCommandTrace> {
    const row = buildAiCommandTraceRow(input);
    return this.traceRepo.save(this.traceRepo.create(row));
  }

  /** Non-blocking persist for gateway hot path (acc-1.2). */
  recordFireAndForget(input: RecordAiCommandTraceInput): void {
    void this.record(input).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to persist ai_command_trace: ${message}`);
    });
  }

  async findRecentByBusiness(
    businessId: string,
    periodDays = 30,
    limit = 500,
  ): Promise<AiCommandTrace[]> {
    const clampedDays = Math.min(90, Math.max(1, periodDays));
    const cutoff = new Date(Date.now() - clampedDays * 24 * 60 * 60 * 1000);
    return this.traceRepo.find({
      where: { businessId, createdAt: MoreThanOrEqual(cutoff) },
      order: { createdAt: 'DESC' },
      take: Math.min(5000, Math.max(1, limit)),
    });
  }
}
