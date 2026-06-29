import { IonContent } from '@ionic/react';
import type { ComponentProps } from 'react';

type ProviderTabScrollContentProps = ComponentProps<typeof IonContent>;

/** Tab page scroll area — bottom spacer keeps last cards above tab bar + FAB on all pages. */
export function ProviderTabScrollContent({
  className = '',
  children,
  ...rest
}: ProviderTabScrollContentProps) {
  const classes = ['provider-tab-scroll-content', className].filter(Boolean).join(' ');

  return (
    <IonContent className={classes} {...rest}>
      {children}
      <div className="provider-tab-scroll-spacer" aria-hidden />
    </IonContent>
  );
}
