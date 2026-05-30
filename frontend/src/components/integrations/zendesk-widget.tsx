'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    zE?: (...args: unknown[]) => void;
  }
}

export function ZendeskWidget({ widgetKey }: { widgetKey: string | null | undefined }) {
  useEffect(() => {
    if (!widgetKey?.trim()) return;

    const scriptId = 'ze-snippet';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://static.zdassets.com/ekr/snippet.js?key=${encodeURIComponent(widgetKey.trim())}`;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [widgetKey]);

  return null;
}
