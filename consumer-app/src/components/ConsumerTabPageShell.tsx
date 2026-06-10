import { IonPage } from '@ionic/react';
import type { ReactNode } from 'react';

/** Avoid nested IonPage on salon tab routes (Android IonRouterOutlet requires one page shell). */
export function ConsumerTabPageShell({
  embedded,
  children,
}: {
  embedded?: boolean;
  children: ReactNode;
}) {
  if (embedded) return <>{children}</>;
  return <IonPage>{children}</IonPage>;
}
