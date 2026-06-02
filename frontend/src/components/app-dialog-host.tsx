'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  subscribeAppDialog,
  type ConfirmDialogOptions,
  type PromptDialogOptions,
} from '@/lib/app-dialog';
import { useI18n } from '@/i18n';

type DialogRequest =
  | {
      kind: 'confirm';
      options: ConfirmDialogOptions;
      resolve: (value: boolean) => void;
    }
  | {
      kind: 'prompt';
      options: PromptDialogOptions;
      resolve: (value: string | null) => void;
    };

export function AppDialogHost() {
  const { t } = useI18n();
  const [request, setRequest] = useState<DialogRequest | null>(null);
  const [promptValue, setPromptValue] = useState('');

  useEffect(() => {
    return subscribeAppDialog((next) => {
      setRequest(next);
      if (next?.kind === 'prompt') {
        setPromptValue(next.options.defaultValue ?? '');
      }
    });
  }, []);

  const close = useCallback(() => setRequest(null), []);

  if (!request) return null;

  const title =
    request.options.title ??
    (request.kind === 'confirm' ? t('dialog.confirmTitle') : t('dialog.promptTitle'));
  const confirmLabel = request.options.confirmLabel ?? t('common.yes');
  const cancelLabel = request.options.cancelLabel ?? t('common.cancel');

  return (
    <div
      className="fixed inset-0 z-[202] flex items-center justify-center p-4 bg-black/40"
      role="presentation"
      onClick={() => {
        if (request.kind === 'confirm') request.resolve(false);
        else request.resolve(null);
        close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="app-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
          {request.options.message}
        </p>

        {request.kind === 'prompt' && (
          <label className="block text-sm">
            {request.options.label && (
              <span className="text-gray-700 dark:text-gray-300 mb-1 block">
                {request.options.label}
              </span>
            )}
            <input
              autoFocus
              className="input w-full"
              value={promptValue}
              placeholder={request.options.placeholder}
              onChange={(e) => setPromptValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  request.resolve(promptValue.trim() || null);
                  close();
                }
              }}
            />
          </label>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => {
              if (request.kind === 'confirm') request.resolve(false);
              else request.resolve(null);
              close();
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`text-sm px-4 py-2 rounded-lg font-medium text-white ${
              request.kind === 'confirm' && request.options.destructive
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
            onClick={() => {
              if (request.kind === 'confirm') request.resolve(true);
              else request.resolve(promptValue.trim() || null);
              close();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
