import { Injectable, Logger } from '@nestjs/common';
import {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_LLM_CASES,
} from './eval/ai-command-eval.cases.js';
import {
  applyAccuracyFloorRatchet,
  buildEvalAccuracyReport,
  loadEvalBaseline,
  type AiEvalBaseline,
} from './eval/ai-command-eval.report.js';
import {
  buildAccuracyRatchetStatus,
  type AccuracyRatchetStatus,
} from './ai-accuracy-ratchet.util.js';

@Injectable()
export class AiAccuracyRatchetService {
  private readonly logger = new Logger(AiAccuracyRatchetService.name);

  getStatus(input?: {
    liveNoClarifyRate?: number;
    liveAccurateRate?: number;
  }): AccuracyRatchetStatus {
    const baseline = loadEvalBaseline();
    return buildAccuracyRatchetStatus({
      baseline,
      liveNoClarifyRate: input?.liveNoClarifyRate,
      liveAccurateRate: input?.liveAccurateRate,
    });
  }

  /** acc-6.4 — run eval gate and bump CI floor when eligible. */
  applyRatchetIfEligible(): {
    applied: boolean;
    baseline: AiEvalBaseline;
    status: AccuracyRatchetStatus;
  } {
    const baseline = loadEvalBaseline();
    const report = buildEvalAccuracyReport(
      [...AI_COMMAND_EVAL_DETERMINISTIC_CASES, ...AI_COMMAND_EVAL_LLM_CASES],
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      baseline,
    );
    const result = applyAccuracyFloorRatchet(report);
    const status = buildAccuracyRatchetStatus({
      baseline: result.baseline,
      measuredAccuracy: report.accuracy,
    });
    if (result.applied) {
      this.logger.log(
        `Raised CI accuracy floor ${(result.ratchet.currentFloor * 100).toFixed(1)}% → ${(result.ratchet.proposedFloor * 100).toFixed(1)}%`,
      );
    }
    return { applied: result.applied, baseline: result.baseline, status };
  }
}
