import type { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import { shouldValidateAction } from './command-completion.validator.js';
import type {
  BusinessCatalog,
  ClassifiedCommand,
  CommandResult,
  PipelineTrace,
  ResolvedCommand,
} from './command-completion.types.js';
import { COMPLETION_VALIDATE_HANDOFF_PIPE_MARKER } from './command-completion-handoff.fixtures.js';

export { COMPLETION_VALIDATE_HANDOFF_PIPE_MARKER };

export type CompletionValidateHandoffInput = {
  businessId: string;
  prompt: string;
  classified: ClassifiedCommand;
  catalog: BusinessCatalog;
  timeZone: string;
  priorTrace?: PipelineTrace[];
  /** Merged into clarify CommandResult.details (e.g. compoundStep). */
  clarifyExtras?: Record<string, unknown>;
};

export type CompletionValidateHandoffReady = {
  status: 'ready';
  resolved: ResolvedCommand;
  trace: PipelineTrace[];
};

export type CompletionValidateHandoffClarify = {
  status: 'clarify';
  result: CommandResult;
  trace: PipelineTrace[];
};

export type CompletionValidateHandoffOutcome =
  | CompletionValidateHandoffReady
  | CompletionValidateHandoffClarify;

export type CompletionValidateHandoffPipeline = Pick<
  CommandCompletionPipelineService,
  'resolve' | 'validate' | 'toClarifyResult' | 'trace'
>;

/** Whether completion validator runs for this action (pipe-1.8.2). */
export function shouldRunCompletionValidate(action: string): boolean {
  return shouldValidateAction(action);
}

/**
 * Resolve entities then validate via command-completion.validator.ts (pipe-1.8.2).
 * Single handoff point for AiCommandService and compound graph paths.
 */
export function runCompletionValidateHandoff(
  input: CompletionValidateHandoffInput,
  pipeline: CompletionValidateHandoffPipeline,
): CompletionValidateHandoffOutcome {
  const resolved = pipeline.resolve(
    input.businessId,
    input.prompt,
    input.classified,
    input.catalog,
    input.timeZone,
  );

  const trace: PipelineTrace[] = [
    ...(input.priorTrace ?? []),
    pipeline.trace('resolve', input.classified.action),
  ];

  if (!shouldRunCompletionValidate(input.classified.action)) {
    return { status: 'ready', resolved, trace };
  }

  const validation = pipeline.validate(resolved);
  trace.push(
    pipeline.trace(
      'validate',
      input.classified.action,
      validation.ok ? 'passed' : `${validation.issues.length} issue(s)`,
    ),
  );

  if (validation.ok) {
    return { status: 'ready', resolved, trace };
  }

  const clarify = pipeline.toClarifyResult(resolved, validation);
  clarify.details = {
    ...clarify.details,
    pipelineTrace: trace,
    pipeMarker: COMPLETION_VALIDATE_HANDOFF_PIPE_MARKER,
    ...input.clarifyExtras,
  };

  return { status: 'clarify', result: clarify, trace };
}
