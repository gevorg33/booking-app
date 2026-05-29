'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n';

export interface ClarifyIssue {
  field: string;
  label: string;
  message: string;
  example?: string;
}

interface AiClarifyFormProps {
  issues: ClarifyIssue[];
  onSubmit: (composedPrompt: string) => void;
}

/** Structured clarify fields (ai-d4) — builds NL follow-up for LLM classifier. */
export function AiClarifyForm({ issues, onSubmit }: AiClarifyFormProps) {
  const { t } = useI18n();
  const [values, setValues] = useState<Record<string, string>>({});

  const set = (field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = issues
      .map((issue) => {
        const v = values[issue.field]?.trim();
        if (!v) return null;
        return `${issue.label}: ${v}`;
      })
      .filter(Boolean);
    if (parts.length === 0) {
      const first = issues.find((i) => i.example);
      if (first?.example) onSubmit(first.example);
      return;
    }
    onSubmit(parts.join('. '));
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2 border-t border-amber-800/40 pt-2">
      {issues.map((issue) => (
        <label key={issue.field} className="block text-[11px] text-amber-100/90">
          <span className="font-medium">{issue.label}</span>
          <span className="text-amber-400/70 ml-1">— {issue.message}</span>
          {issue.field === 'date' || issue.field === 'dateFrom' || issue.field === 'dateTo' ? (
            <input
              type="date"
              className="mt-1 w-full rounded bg-amber-950/40 border border-amber-700/50 px-2 py-1 text-xs text-amber-50"
              value={values[issue.field] ?? ''}
              onChange={(e) => set(issue.field, e.target.value)}
            />
          ) : issue.field === 'timeSlot' || issue.field === 'timeFrom' || issue.field === 'timeTo' ? (
            <input
              type="time"
              className="mt-1 w-full rounded bg-amber-950/40 border border-amber-700/50 px-2 py-1 text-xs text-amber-50"
              value={values[issue.field] ?? ''}
              onChange={(e) => set(issue.field, e.target.value)}
            />
          ) : (
            <input
              type="text"
              placeholder={issue.example ?? issue.label}
              className="mt-1 w-full rounded bg-amber-950/40 border border-amber-700/50 px-2 py-1 text-xs text-amber-50 placeholder-amber-500/50"
              value={values[issue.field] ?? ''}
              onChange={(e) => set(issue.field, e.target.value)}
            />
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
