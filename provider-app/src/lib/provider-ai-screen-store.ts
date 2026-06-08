import type { ProviderAiScreenContext } from './provider-ai-context';

type OverlayListener = () => void;

let overlay: Partial<ProviderAiScreenContext> = {};
const listeners = new Set<OverlayListener>();

export function getProviderAiScreenOverlay(): Partial<ProviderAiScreenContext> {
  return overlay;
}

export function setProviderAiScreenOverlay(partial: Partial<ProviderAiScreenContext>): void {
  overlay = { ...overlay, ...partial };
  for (const listener of listeners) listener();
}

export function clearProviderAiScreenOverlay(keys?: (keyof ProviderAiScreenContext)[]): void {
  if (!keys?.length) {
    overlay = {};
  } else {
    const next = { ...overlay };
    for (const key of keys) delete next[key];
    overlay = next;
  }
  for (const listener of listeners) listener();
}

export function subscribeProviderAiScreenOverlay(listener: OverlayListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const PROVIDER_AI_SCREEN_OVERLAY_KEYS: (keyof ProviderAiScreenContext)[] = [
  'bookingId',
  'customerId',
  'customerName',
  'serviceId',
  'serviceName',
  'employeeId',
  'employeeName',
  'date',
  'timeSlot',
];
