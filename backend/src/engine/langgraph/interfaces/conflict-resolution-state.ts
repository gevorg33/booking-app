import { Annotation } from '@langchain/langgraph';

export interface ConflictStepIds {
  detect: string;
  analyze: string;
  propose: string;
}

export const ConflictResolutionState = Annotation.Root({
  businessId: Annotation<string>,
  intent: Annotation<string>,
  dateRange: Annotation<{ start: Date; end: Date } | undefined>,
  stepIds: Annotation<ConflictStepIds>,
  toolContext: Annotation<Record<string, unknown>>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
  conflictCount: Annotation<number>({
    reducer: (_p, n) => n,
    default: () => 0,
  }),
  optionCount: Annotation<number>({ reducer: (_p, n) => n, default: () => 0 }),
  proposalCount: Annotation<number>({
    reducer: (_p, n) => n,
    default: () => 0,
  }),
  reasoning: Annotation<string>({ reducer: (_p, n) => n, default: () => '' }),
  noConflicts: Annotation<boolean>({
    reducer: (_p, n) => n,
    default: () => false,
  }),
});

export type ConflictResolutionGraphState = typeof ConflictResolutionState.State;
