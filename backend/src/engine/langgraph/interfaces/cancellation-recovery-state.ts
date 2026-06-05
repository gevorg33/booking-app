import { Annotation } from '@langchain/langgraph';

export interface RecoveryStepIds {
  findSlots: string;
  findCandidates: string;
  propose: string;
}

export const CancellationRecoveryState = Annotation.Root({
  businessId: Annotation<string>,
  intent: Annotation<string>,
  dateRange: Annotation<{ start: Date; end: Date } | undefined>,
  stepIds: Annotation<RecoveryStepIds>,
  toolContext: Annotation<Record<string, unknown>>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
  freedSlots: Annotation<unknown[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  candidateCount: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 0,
  }),
  proposalCount: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 0,
  }),
  reasoning: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  skipRecovery: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
});

export type CancellationRecoveryGraphState =
  typeof CancellationRecoveryState.State;
