'use client';

import type { ReactNode } from 'react';
import { ContextualHelpButton } from '@/components/help/contextual-help';
import type { HelpTopicId } from '@/lib/help-center-topics';

type DashboardPageShellProps = {
  children?: ReactNode;
  /** AI opportunity + Orchestrix bars (use AiSuggestionsStack). */
  ai?: ReactNode;
  className?: string;
};

/** AI bars on top, then page header/content — same spacing as Bookings & Calendar. */
export function DashboardPageShell({ ai, children, className = '' }: DashboardPageShellProps) {
  return (
    <div className={`flex flex-col gap-3 ${className}`.trim()}>
      {ai}
      {children ?? null}
    </div>
  );
}

type DashboardPageToolbarProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Extra lines under the title row (e.g. selected date). */
  meta?: ReactNode;
  actions?: ReactNode;
  helpTopicId?: HelpTopicId;
};

/** Title + subtitle left, controls right (bookings-style). */
export function DashboardPageToolbar({
  title,
  subtitle,
  meta,
  actions,
  helpTopicId,
}: DashboardPageToolbarProps) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="flex items-center gap-2 text-2xl font-bold">{title}</h1>
            {helpTopicId ? <ContextualHelpButton topicId={helpTopicId} /> : null}
          </div>
          {subtitle != null && subtitle !== '' ? (
            <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {meta}
    </div>
  );
}
