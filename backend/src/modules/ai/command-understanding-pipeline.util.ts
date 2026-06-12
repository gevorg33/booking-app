import type { PipelineStage, PipelineTrace } from './command-completion.types.js';
import { PIPELINE_UNDERSTAND_STAGE_ORDER } from './command-understanding.types.js';

export function appendPipelineTrace(
  trace: PipelineTrace[],
  stage: PipelineStage,
  action: string,
  detail?: string,
): PipelineTrace {
  const entry: PipelineTrace = {
    stage,
    action,
    at: new Date().toISOString(),
    detail,
  };
  trace.push(entry);
  return entry;
}

/** Returns true when every understand stage appears exactly once, in order. */
export function isUnderstandTraceOrdered(trace: PipelineTrace[]): boolean {
  const understandStages = trace
    .map((entry) => entry.stage)
    .filter((stage) =>
      (PIPELINE_UNDERSTAND_STAGE_ORDER as readonly string[]).includes(stage),
    );
  if (understandStages.length !== PIPELINE_UNDERSTAND_STAGE_ORDER.length) {
    return false;
  }
  return understandStages.every(
    (stage, index) => stage === PIPELINE_UNDERSTAND_STAGE_ORDER[index],
  );
}
