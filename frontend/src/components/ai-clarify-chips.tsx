'use client';

import { useState } from 'react';
import type { ClarifyIssue } from '@/components/ai-clarify-form';
import {
  composeEntityDisambiguationFollowUp,
  composeIntentDisambiguationFollowUp,
} from '@/lib/ai-clarify.util';

export interface ClarifyCandidateChip {
  action: string;
  label: string;
  score?: number;
}

export interface EntityOptionChip {
  id: string;
  field: string;
  label: string;
  value: string;
}

export interface SuggestedCommandChip {
  id: string;
  label: string;
  prompt: string;
}

interface AiClarifyChipsProps {
  clarifyCandidates?: ClarifyCandidateChip[];
  entityOptions?: EntityOptionChip[];
  /** When true, entity catalog is rendered by AiClarifyWizard (n99-1.2). */
  hideEntityOptions?: boolean;
  suggestedCommands?: SuggestedCommandChip[];
  showSomethingElseEscape?: boolean;
  somethingElseLabel?: string;
  somethingElseAlternatives?: SuggestedCommandChip[];
  humanHandoff?: boolean;
  escalationRoute?: string;
  originalPrompt?: string;
  onSelect: (
    prompt: string,
    answers?: Record<string, string>,
    selectedIntentAction?: string,
  ) => void;
  onGetHelp?: () => void;
}

export function AiClarifyChips({
  clarifyCandidates,
  entityOptions,
  hideEntityOptions = false,
  suggestedCommands,
  showSomethingElseEscape = false,
  somethingElseLabel = 'Something else',
  somethingElseAlternatives,
  humanHandoff,
  escalationRoute,
  originalPrompt,
  onSelect,
  onGetHelp,
}: AiClarifyChipsProps) {
  const [showSomethingElseAlternatives, setShowSomethingElseAlternatives] = useState(false);
  const hasIntent = Array.isArray(clarifyCandidates) && clarifyCandidates.length > 0;
  const hasEntity =
    !hideEntityOptions && Array.isArray(entityOptions) && entityOptions.length > 0;
  const hasSuggestions =
    Array.isArray(suggestedCommands) && suggestedCommands.length > 0;
  const escapeAlternatives =
    showSomethingElseAlternatives && Array.isArray(somethingElseAlternatives)
      ? somethingElseAlternatives
      : [];
  const canOfferSomethingElse =
    showSomethingElseEscape &&
    (hasIntent || hasEntity) &&
    (somethingElseAlternatives?.length ?? 0) >= 2;

  if (
    !hasIntent &&
    !hasEntity &&
    !hasSuggestions &&
    !canOfferSomethingElse &&
    !(humanHandoff && onGetHelp)
  ) {
    return null;
  }

  const renderSuggestedCommands = (
    commands: SuggestedCommandChip[],
    title: string,
  ) => (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] text-violet-200/80">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {commands.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            onClick={() => onSelect(suggestion.prompt)}
            className="rounded-full border border-violet-600/40 bg-violet-950/30 px-2.5 py-1 text-[11px] text-violet-100 hover:bg-violet-900/40"
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mt-2 flex flex-col gap-2">
      {hasIntent && !showSomethingElseAlternatives && (
        <div className="flex flex-col gap-1.5">
          {clarifyCandidates!.length >= 2 && (
            <p className="text-[11px] text-amber-200/80">
              Did you mean{' '}
              {clarifyCandidates!
                .slice(0, 2)
                .map((candidate, index) => (
                  <span key={candidate.action}>
                    {index > 0 ? ' or ' : ''}
                    <span className="font-medium">{candidate.label.toLowerCase()}</span>
                  </span>
                ))}
              ?
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
          {clarifyCandidates!.map((candidate) => (
            <button
              key={`${candidate.action}-${candidate.label}`}
              type="button"
              onClick={() =>
                onSelect(
                  composeIntentDisambiguationFollowUp({
                    selectedAction: candidate.action,
                    label: candidate.label,
                    originalPrompt,
                  }),
                  undefined,
                  candidate.action,
                )
              }
              className="rounded-full border border-amber-600/50 bg-amber-950/40 px-2.5 py-1 text-[11px] text-amber-100 hover:bg-amber-900/50"
            >
              {candidate.label}
            </button>
          ))}
          {canOfferSomethingElse && (
            <button
              type="button"
              onClick={() => setShowSomethingElseAlternatives(true)}
              className="rounded-full border border-gray-600/50 bg-gray-950/40 px-2.5 py-1 text-[11px] text-gray-200 hover:bg-gray-900/50"
            >
              {somethingElseLabel}
            </button>
          )}
          </div>
        </div>
      )}

      {hasEntity && !showSomethingElseAlternatives && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] text-amber-200/80">
            {entityOptions![0]?.field === 'serviceName'
              ? 'Which service did you mean?'
              : entityOptions![0]?.field === 'customerName'
                ? 'Which customer did you mean?'
                : 'Which provider did you mean?'}
          </p>
          <div className="flex flex-wrap gap-1.5">
          {entityOptions!.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                onSelect(
                  composeEntityDisambiguationFollowUp({
                    field: option.field,
                    label: option.label,
                    originalPrompt,
                  }),
                  { [option.field]: option.value },
                )
              }
              className="rounded-full border border-amber-600/50 bg-amber-950/40 px-2.5 py-1 text-[11px] text-amber-100 hover:bg-amber-900/50"
            >
              {option.label}
            </button>
          ))}
          {canOfferSomethingElse && (
            <button
              type="button"
              onClick={() => setShowSomethingElseAlternatives(true)}
              className="rounded-full border border-gray-600/50 bg-gray-950/40 px-2.5 py-1 text-[11px] text-gray-200 hover:bg-gray-900/50"
            >
              {somethingElseLabel}
            </button>
          )}
          </div>
        </div>
      )}

      {escapeAlternatives.length > 0 &&
        renderSuggestedCommands(escapeAlternatives, 'Try one of these instead:')}

      {hasSuggestions &&
        renderSuggestedCommands(suggestedCommands!, 'Try one of these:')}

      {humanHandoff && onGetHelp && (
        <button
          type="button"
          onClick={onGetHelp}
          className="self-start rounded-full border border-sky-500/40 bg-sky-950/30 px-3 py-1 text-[11px] text-sky-100 hover:bg-sky-900/40"
        >
          {escalationRoute === 'support_ticket' ? 'Get help — contact support' : 'Get help'}
        </button>
      )}
    </div>
  );
}

export type { ClarifyIssue };
