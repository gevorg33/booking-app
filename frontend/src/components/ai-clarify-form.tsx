'use client';

import { DatePicker } from '@/components/ui/date-picker';

import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import {
  activeClarifyEmployees,
  activeClarifyServices,
  clarifyFieldKind,
  composeClarifyPrompt,
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
  /** When set, employee select only lists these names (from prior AI response). */
  availableProviderNames?: string[];
}

interface AiClarifyFormProps {
  issues: ClarifyIssue[];
  options?: ClarifyFormOptions;
  onSubmit: (composedPrompt: string) => void;
}

/** Structured clarify fields (ai-d4) — builds NL follow-up for LLM classifier. */
export function AiClarifyForm({ issues, options, onSubmit }: AiClarifyFormProps) {
  const { t } = useI18n();
  const [values, setValues] = useState<Record<string, string>>({});

  const employeeChoices = useMemo(
    () => activeClarifyEmployees(options?.employees ?? [], options?.availableProviderNames),
    [options?.employees, options?.availableProviderNames],
  );
  const serviceChoices = useMemo(
    () => activeClarifyServices(options?.services ?? []),
    [options?.services],
  );

  const set = (field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const composed = composeClarifyPrompt(issues, values);
    if (composed) onSubmit(composed);
  };

  const renderField = (issue: ClarifyIssue) => {
    const kind = clarifyFieldKind(issue.field, employeeChoices.length, serviceChoices.length);
    if (kind === 'employeeSelect') {
      return (
        <select
          className="mt-1 w-full rounded bg-amber-950/40 border border-amber-700/50 px-2 py-1 text-xs text-amber-50"
          value={values[issue.field] ?? ''}
          onChange={(e) => set(issue.field, e.target.value)}
        >
          <option value="">{issue.label}</option>
          {employeeChoices.map((emp) => (
            <option key={emp.id} value={emp.name}>
              {emp.name}
            </option>
          ))}
        </select>
      );
    }
    if (kind === 'serviceSelect') {
      return (
        <select
          className="mt-1 w-full rounded bg-amber-950/40 border border-amber-700/50 px-2 py-1 text-xs text-amber-50"
          value={values[issue.field] ?? ''}
          onChange={(e) => set(issue.field, e.target.value)}
        >
          <option value="">{issue.label}</option>
          {serviceChoices.map((svc) => (
            <option key={svc.id} value={svc.name}>
              {svc.name}
            </option>
          ))}
        </select>
      );
    }
    if (kind === 'date') {
      return (
        <DatePicker
          variant="amber"
          className="mt-1 w-full text-xs py-1.5"
          value={values[issue.field] ?? ''}
          onChange={(next) => set(issue.field, next)}
        />
      );
    }
    if (kind === 'time') {
      return (
        <input
          type="time"
          className="mt-1 w-full rounded bg-amber-950/40 border border-amber-700/50 px-2 py-1 text-xs text-amber-50"
          value={values[issue.field] ?? ''}
          onChange={(e) => set(issue.field, e.target.value)}
        />
      );
    }
    return (
      <input
        type="text"
        placeholder={issue.example ?? issue.label}
        className="mt-1 w-full rounded bg-amber-950/40 border border-amber-700/50 px-2 py-1 text-xs text-amber-50 placeholder-amber-500/50"
        value={values[issue.field] ?? ''}
        onChange={(e) => set(issue.field, e.target.value)}
      />
    );
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2 border-t border-amber-800/40 pt-2">
      {issues.map((issue) => (
        <label key={issue.field} className="block text-[11px] text-amber-100/90">
          <span className="font-medium">{issue.label}</span>
          <span className="text-amber-400/70 ml-1">— {issue.message}</span>
          {renderField(issue)}
          {issue.example && (
            <span className="block text-[10px] text-amber-400/70 mt-0.5">
              {t('ai.assistantClarifyTry')} &ldquo;{issue.example}&rdquo;
            </span>
          )}
        </label>
      ))}
      <button
        type="submit"
        className="text-xs px-2.5 py-1 rounded-md bg-amber-700 hover:bg-amber-600 text-white"
      >
        {t('ai.clarifySubmit')}
      </button>
    </form>
  );
}
