import { IonButton } from '@ionic/react';
import type { ReactNode } from 'react';

/** Compact fixed bottom CTA — same height as the salon tab bar. */
export function ConsumerFixedActionBar({
  label,
  disabled = false,
  primaryColor = '#7c3aed',
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  primaryColor?: string;
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="consumer-fixed-action-bar">
      {children}
      <IonButton
        expand="block"
        disabled={disabled}
        className="consumer-fixed-action-bar__button"
        style={{ '--background': primaryColor }}
        onClick={onClick}
      >
        {label}
      </IonButton>
    </div>
  );
}
