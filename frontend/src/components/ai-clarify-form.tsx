'use client';

import { DatePicker } from '@/components/ui/date-picker';

import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import {
  ClarifyChipGroup,
  ClarifyTimeSlotList,
} from '@/components/ai-clarify-field-controls';
import {
  activeClarifyEmployees,
  activeClarifyServices,
  buildClarifyRequiredFields,
  buildClarifyTimeSlotOptions,
  clarifyFieldKind,
  composeEntityDisambiguationFollowUp,
  composeMultiFieldClarifyPrompt,
  entityCatalogOptionsForField,
  filterClarifyIssuesForDisplay,
  hasPreResolvedEntityCatalog,
  isClarifyFormComplete,
  isEntityCatalogField,
  primaryEntityCatalogField,
  resolveClarifyChipOptions,
  type ClarifyTimeSlotOption,
  type EntityCatalogOption,
} from '@/lib/ai-clarify.util';

export interface ClarifyIssue {
  field: string;
  label: string;
  message: string;
  example?: string;
}

export interface ClarifyFormOptions {
  employees: Array<{ id: string; name: string; isActive?: boolean }>;
  services: Array<{ id: string; name: string; isActive?: boolean }>;
  /** When set, employee chips only list these names (from prior AI response). */
  availableProviderNames?: string[];
  /** Open times from availability payload — drives time-slot chips (n99-1.1). */
  availabilityProviders?: Array<{
    name: string;
    previewTimes?: string[];
    openSlots?: Array<{ start: string; end: string }>;
    earliestStartTime?: string;
  }>;
}

interface AiClarifyFormProps {
  issues: ClarifyIssue[];
  options?: ClarifyFormOptions;
  /** acc-4.3 / n99-1.2 — pre-resolved catalog candidates for entity ambiguity. */
  entityOptions?: EntityCatalogOption[];
  originalPrompt?: string;
  knownFields?: Record<string, unknown>;
  onSubmit: (composedPrompt: string, answers?: Record<string, string>) => void;
}

function entityDisambiguationMessage(
  field: string | undefined,
  t: (key: string) => string,
): string {
  if (field === 'serviceName') return t('ai.clarifyWhichService');
  if (field === 'customerName') return t('ai.clarifyWhichCustomer');
  return t('ai.clarifyWhichProvider');
}

/** Structured clarify fields (ai-d4 / n99-1.1) — tap chips or pickers, not free text. */
export function AiClarifyForm({
  issues,
  options,
  entityOptions,
  originalPrompt,
  knownFields,
  onSubmit,
}: AiClarifyFormProps) {
  const { t } = useI18n();
  const [values, setValues] = useState<Record<string, string>>({});
  const visibleIssues = useMemo(
    () => filterClarifyIssuesForDisplay(issues, knownFields),
    [issues, knownFields],
  );

  const employeeChoices = useMemo(
    () => activeClarifyEmployees(options?.employees ?? [], options?.availableProviderNames),
    [options?.employees, options?.availableProviderNames],
  );
  const serviceChoices = useMemo(
    () => activeClarifyServices(options?.services ?? []),
    [options?.services],
  );
  const timeSlotOptions = useMemo(
    () => buildClarifyTimeSlotOptions(options?.availabilityProviders ?? []),
    [options?.availabilityProviders],
  );
  const entityCatalogField = primaryEntityCatalogField(entityOptions);
  const entityCatalog = useMemo(
    () =>
      entityCatalogField
        ? entityCatalogOptionsForField(entityOptions, entityCatalogField)
        : [],
    [entityCatalogField, entityOptions],
  );
  const requiredFields = useMemo(
    () => buildClarifyRequiredFields(visibleIssues, entityCatalogField, entityCatalog.length),
    [visibleIssues, entityCatalogField, entityCatalog.length],
  );
  const isMultiFieldClarify = requiredFields.length > 1;

  const submitAnswers = (nextValues: Record<string, string>) => {
    if (isMultiFieldClarify || entityCatalog.length >= 2) {
      const composed = composeMultiFieldClarifyPrompt({
        issues: visibleIssues,
        values: nextValues,
        entityField: entityCatalogField,
        entityOptionCount: entityCatalog.length,
        originalPrompt,
      });
      if (composed) onSubmit(composed, nextValues);
      return;
    }

    const composed = composeMultiFieldClarifyPrompt({
      issues: visibleIssues,
      values: nextValues,
      originalPrompt,
    });
    if (composed) onSubmit(composed, nextValues);
  };

  const completeAndSubmit = (nextValues: Record<string, string>, autoSubmit = false) => {
    if (autoSubmit || isClarifyFormComplete(visibleIssues, nextValues, requiredFields)) {
      submitAnswers(nextValues);
    }
  };

  const submitEntityCatalogTap = (option: EntityCatalogOption) => {
    if (isMultiFieldClarify) {
      setValues((prev) => {
        const nextValues = { ...prev, [option.field]: option.value };
        if (isClarifyFormComplete(visibleIssues, nextValues, requiredFields)) {
          submitAnswers(nextValues);
        }
        return nextValues;
      });
      return;
    }
    onSubmit(
      composeEntityDisambiguationFollowUp({
        field: option.field,
        label: option.label,
        originalPrompt,
      }),
      { [option.field]: option.value },
    );
  };

  const setFieldValue = (field: string, value: string, autoSubmit = false) => {
    if (isMultiFieldClarify) {
      setValues((prev) => {
        const nextValues = { ...prev, [field]: value };
        if (autoSubmit || isClarifyFormComplete(visibleIssues, nextValues, requiredFields)) {
          submitAnswers(nextValues);
        }
        return nextValues;
      });
      return;
    }
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    completeAndSubmit(nextValues, autoSubmit);
  };

  const handleFieldTap = (field: string, value: string) => {
    const autoSubmit = !isMultiFieldClarify && requiredFields.length === 1;
    setFieldValue(field, value, autoSubmit);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isClarifyFormComplete(visibleIssues, values, requiredFields)) {
      submitAnswers(values);
    }
  };

  const renderEntityCatalog = () => {
    if (!hasPreResolvedEntityCatalog(entityOptions) || entityCatalog.length < 2) return null;
    return (
      <div className="block text-[11px] text-amber-100/90">
        <span className="font-medium">{entityDisambiguationMessage(entityCatalogField, t)}</span>
        <ClarifyChipGroup
          options={entityCatalog.map((option) => ({
            id: option.id,
            label: option.label,
            value: option.value,
          }))}
          selected={values[entityCatalogField ?? '']}
          onSelect={(value) => {
            const option = entityCatalog.find((row) => row.value === value);
            if (option) submitEntityCatalogTap(option);
          }}
        />
      </div>
    );
  };

  if (visibleIssues.length === 0) {
    const entitySection = renderEntityCatalog();
    return entitySection ? (
      <div className="mt-2 space-y-2 border-t border-amber-800/40 pt-2">{entitySection}</div>
    ) : null;
  }

  const renderField = (issue: ClarifyIssue) => {
    const catalogForField = entityCatalogOptionsForField(entityOptions, issue.field);
    const chipOptions = resolveClarifyChipOptions({
      field: issue.field,
      entityOptions,
      employees: employeeChoices,
      services: serviceChoices,
    });
    const kind = clarifyFieldKind(
      issue.field,
      chipOptions.length,
      timeSlotOptions.length,
      catalogForField.length,
    );

    if (kind === 'entityCatalogChips') {
      return (
        <ClarifyChipGroup
          selected={values[issue.field]}
          options={chipOptions}
          onSelect={(value) => {
            const option = catalogForField.find((row) => row.value === value);
            if (option) submitEntityCatalogTap(option);
          }}
        />
      );
    }

    if (kind === 'employeeChips' || kind === 'serviceChips' || kind === 'customerChips') {
      return (
        <ClarifyChipGroup
          selected={values[issue.field]}
          options={chipOptions}
          onSelect={(value) => handleFieldTap(issue.field, value)}
        />
      );
    }

    if (kind === 'timeSlotList') {
      const slotsForField = timeSlotOptions.filter(
        (slot) => issue.field === 'timeSlot' || slot.providerName,
      );
      return (
        <ClarifyTimeSlotList
          selected={values[issue.field]}
          options={(slotsForField.length > 0 ? slotsForField : timeSlotOptions).map(
            (slot: ClarifyTimeSlotOption) => ({
              id: slot.id,
              label: slot.label,
              value: slot.value,
            }),
          )}
          onSelect={(value) => handleFieldTap(issue.field, value)}
        />
      );
    }

    if (kind === 'date') {
      return (
        <DatePicker
          variant="amber"
          className="mt-1 w-full text-xs py-1.5"
          value={values[issue.field] ?? ''}
          onChange={(next) => {
            if (!isMultiFieldClarify && requiredFields.length === 1) {
              handleFieldTap(issue.field, next);
            } else {
              setFieldValue(issue.field, next);
            }
          }}
        />
      );
    }

    if (kind === 'time') {
      return (
        <input
          type="time"
          className="mt-1 w-full rounded bg-amber-950/40 border border-amber-700/50 px-2 py-1 text-xs text-amber-50"
          value={values[issue.field] ?? ''}
          onChange={(e) => setFieldValue(issue.field, e.target.value)}
        />
      );
    }

    if (isEntityCatalogField(issue.field)) {
      return (
        <p className="mt-1 text-[10px] text-amber-400/80">{t('ai.clarifyPickFromOptions')}</p>
      );
    }

    return (
      <input
        type="text"
        placeholder={issue.example ?? issue.label}
        className="mt-1 w-full rounded bg-amber-950/40 border border-amber-700/50 px-2 py-1 text-xs text-amber-50 placeholder-amber-500/50"
        value={values[issue.field] ?? ''}
        onChange={(e) => setFieldValue(issue.field, e.target.value)}
      />
    );
  };

  const showSubmit =
    isMultiFieldClarify &&
    !isClarifyFormComplete(visibleIssues, values, requiredFields);
  const entitySection = renderEntityCatalog();

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2 border-t border-amber-800/40 pt-2">
      {entitySection}
      {visibleIssues.map((issue) => (
        <div key={issue.field} className="block text-[11px] text-amber-100/90">
          <span className="font-medium">{issue.label}</span>
          <span className="text-amber-400/70 ml-1">— {issue.message}</span>
          {renderField(issue)}
        </div>
      ))}
      {showSubmit ? (
        <button
          type="submit"
          disabled={!isClarifyFormComplete(visibleIssues, values, requiredFields)}
          className="text-xs px-2.5 py-1 rounded-md bg-amber-700 hover:bg-amber-600 text-white disabled:opacity-40"
        >
          {t('ai.clarifySubmit')}
        </button>
      ) : null}
    </form>
  );
}
