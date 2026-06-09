import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

/** Escape IonPage transforms — `position: fixed` only works vs the viewport from body. */
export function ConsumerBodyPortal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
