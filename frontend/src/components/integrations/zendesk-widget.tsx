'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    zE?: (...args: unknown[]) => void;
  }
}

const SCRIPT_ID = 'ze-snippet';
let loadedWidgetKey: string | null = null;
let loadingWidgetKey: string | null = null;

function isLikelyZendeskWidgetKey(key: string): boolean {
  const trimmed = key.trim();
  // Classic Web Widget snippet keys are UUID-like; Messaging keys are longer alphanumerics.
  return /^[0-9a-f-]{8,}$/i.test(trimmed) || /^[0-9a-zA-Z_-]{20,}$/.test(trimmed);
}

function loadZendeskSnippet(widgetKey: string): void {
  const key = widgetKey.trim();
  if (!key) return;
  if (loadedWidgetKey === key || loadingWidgetKey === key) return;

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    if (loadedWidgetKey === key) return;
    // Key changed after a previous embed — reload once with the new key.
    existing.remove();
    loadedWidgetKey = null;
    loadingWidgetKey = null;
    delete window.zE;
  }

  loadingWidgetKey = key;
  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.src = `https://static.zdassets.com/ekr/snippet.js?key=${encodeURIComponent(key)}`;
  script.async = true;
  script.onload = () => {
    if (loadingWidgetKey === key) {
      loadedWidgetKey = key;
      loadingWidgetKey = null;
    }
  };
  script.onerror = () => {
    if (loadingWidgetKey === key) {
      loadingWidgetKey = null;
    }
    script.remove();
    console.warn('[Zendesk] Failed to load Web Widget snippet. Check the widget key in Integrations → Growth.');
  };
  document.body.appendChild(script);
}

export function ZendeskWidget({ widgetKey }: { widgetKey: string | null | undefined }) {
  useEffect(() => {
    const key = widgetKey?.trim();
    if (!key) return;
    if (!isLikelyZendeskWidgetKey(key)) {
      console.warn('[Zendesk] Widget key format looks invalid. Use the Web Widget key from Zendesk Admin.');
      return;
    }
    loadZendeskSnippet(key);
    // Do not remove the snippet on unmount — React Strict Mode double-mounting
    // otherwise tears down a half-loaded script and breaks Zendesk's bundled Sentry init.
  }, [widgetKey]);

  return null;
}
