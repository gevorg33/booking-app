'use client';

import { useMemo } from 'react';
import { useI18n } from '@/i18n';
import type { PreVisitIntakeQuestionView } from '@/lib/clinic-pre-visit-intake';

export interface IntakeFormQuestionFieldProps {
  question: PreVisitIntakeQuestionView;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

export function IntakeFormQuestionField({
  question,
  values,
  onChange,
  disabled = false,
}: IntakeFormQuestionFieldProps) {
  const { t } = useI18n();
  const isChoice = question.type === 'choice' || question.type === 'dropdown';
  const isMultiple = question.type === 'multiple_choice';
  const isLongText = question.type === 'text';
  const isDate = question.type === 'date';
  const isDisplay = question.type === 'display';

  const inputClassName = 'input mt-2 w-full';

  const selectedSet = useMemo(() => new Set(values), [values]);

  if (isDisplay) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-4 text-sm text-gray-200">
        {question.text}
        {question.subText ? <p className="mt-2 text-gray-400">{question.subText}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-white">
        {question.text || t('clinic.intakeForm.untitledQuestion')}
        {question.required ? <span className="text-red-400"> *</span> : null}
      </label>
      {question.subText ? <p className="mt-1 text-sm text-gray-400">{question.subText}</p> : null}

      {isChoice ? (
        <div className="mt-3 space-y-2">
          {question.answerOptions.map((option) => (
            <label key={option.id} className="flex items-center gap-2 text-sm text-gray-200">
              <input
                type="radio"
                name={question.id}
                checked={selectedSet.has(option.value) || selectedSet.has(option.id)}
                disabled={disabled}
                onChange={() => onChange([option.value])}
              />
              {option.display}
            </label>
          ))}
        </div>
      ) : null}

      {isMultiple ? (
        <div className="mt-3 space-y-2">
          {question.answerOptions.map((option) => {
            const checked = selectedSet.has(option.value) || selectedSet.has(option.id);
            return (
              <label key={option.id} className="flex items-center gap-2 text-sm text-gray-200">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={(event) => {
                    const next = new Set(values);
                    if (event.target.checked) {
                      next.add(option.value);
                    } else {
                      next.delete(option.value);
                    }
                    onChange(Array.from(next));
                  }}
                />
                {option.display}
              </label>
            );
          })}
        </div>
      ) : null}

      {!isChoice && !isMultiple ? (
        isLongText ? (
          <textarea
            className={`${inputClassName} min-h-28`}
            value={values[0] ?? ''}
            placeholder={question.placeholder ?? undefined}
            maxLength={question.validation.maxLength ?? undefined}
            disabled={disabled}
            onChange={(event) => onChange([event.target.value])}
          />
        ) : (
          <input
            className={inputClassName}
            type={isDate ? 'date' : 'text'}
            value={values[0] ?? ''}
            placeholder={question.placeholder ?? undefined}
            maxLength={question.validation.maxLength ?? undefined}
            disabled={disabled}
            onChange={(event) => onChange([event.target.value])}
          />
        )
      ) : null}
    </div>
  );
}
