import { useEffect, type ReactNode } from 'react';
import { CONSUMER_FIXED_ACTION_ACTIVE_CLASS } from '../lib/consumer-tab-bar-layout.util.js';

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
  useEffect(() => {
    document.body.classList.add(CONSUMER_FIXED_ACTION_ACTIVE_CLASS);
    return () => {
      document.body.classList.remove(CONSUMER_FIXED_ACTION_ACTIVE_CLASS);
    };
  }, []);

  return (
    <div className="consumer-fixed-action-bar">
      {children}
      <button
        type="button"
        disabled={disabled}
        className="consumer-fixed-action-bar__button"
        style={{ ['--consumer-action-button-color' as string]: primaryColor }}
        onClick={onClick}
      >
        {label}
      </button>
    </div>
  );
}
