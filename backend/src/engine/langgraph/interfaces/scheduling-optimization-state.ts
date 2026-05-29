import { Annotation } from '@langchain/langgraph';

export interface OptimizationStepIds {
  analyze: string;
  gaps: string;
  recommend: string;
}

export const SchedulingOptimizationState = Annotation.Root({
  businessId: Annotation<string>,
  intent: Annotation<string>,
  dateRange: Annotation<{ start: Date; end: Date } | undefined>,
  stepIds: Annotation<OptimizationStepIds>,
  toolContext: Annotation<Record<string, unknown>>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
  employeeCount: Annotation<number>({ reducer: (_p, n) => n, default: () => 0 }),
  gapCount: Annotation<number>({ reducer: (_p, n) => n, default: () => 0 }),
  recommendationCount: Annotation<number>({ reducer: (_p, n) => n, default: () => 0 }),
  reasoning: Annotation<string>({ reducer: (_p, n) => n, default: () => '' }),
});

export type SchedulingOptimizationGraphState = typeof SchedulingOptimizationState.State;
