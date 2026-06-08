'use client';

import { useEffect } from 'react';
import { setAiPageContext, clearAiPageContext, type AiPageContext } from '@/lib/ai-orchestration';

/** Push on-screen entity context into the dashboard AI command bar (n99-2.2). */
export function useAiPageContextSync(context: AiPageContext | null | undefined) {
  useEffect(() => {
    if (!context || Object.keys(context).length === 0) return;
    setAiPageContext(context);
    const keys = Object.keys(context) as (keyof AiPageContext)[];
    return () => clearAiPageContext(keys);
  }, [context]);
}
