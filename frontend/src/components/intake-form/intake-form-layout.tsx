'use client';

import type { ReactNode } from 'react';

export interface IntakeFormLayoutProps {
  title: string;
  subtitle?: string | null;
  introTitle?: string | null;
  introBody?: string | null;
  children: ReactNode;
}

export function IntakeFormLayout({
  title,
  subtitle,
  introTitle,
  introBody,
  children,
}: IntakeFormLayoutProps) {
  return (
    <div className="card space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {subtitle ? <p className="text-sm text-gray-400">{subtitle}</p> : null}
      </div>
      {(introTitle || introBody) && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          {introTitle ? <p className="font-medium text-blue-100">{introTitle}</p> : null}
          {introBody ? <p className="mt-1 text-sm text-blue-100/80">{introBody}</p> : null}
        </div>
      )}
      {children}
    </div>
  );
}
