import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

export type ConsumerActionButtonFill = 'solid' | 'outline' | 'clear';

/**
 * Native `<button>` for primary CTAs (e2e-bug.4).
 * IonButton hosts often appear as `generic` in a11y trees that don't pierce shadow DOM;
 * suggestion chips already use native buttons and expose `button` correctly.
 */
export function ConsumerActionButton({
  children,
  fill = 'solid',
  expand,
  size = 'default',
  color,
  className = '',
  style,
  type = 'button',
  disabled,
  onClick,
  ...rest
}: {
  children: ReactNode;
  fill?: ConsumerActionButtonFill;
  expand?: 'block';
  /** Compact row CTAs (e2e-bug.253 booking-card / cancel / reschedule). */
  size?: 'default' | 'small';
  /** CSS color for solid background / outline border+text. */
  color?: string;
  className?: string;
  style?: CSSProperties;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'className' | 'color'>) {
  const classes = [
    'consumer-action-button',
    `consumer-action-button--${fill}`,
    expand === 'block' ? 'consumer-action-button--block' : '',
    size === 'small' ? 'consumer-action-button--small' : '',
    color === 'danger' || color === 'medium' ? `consumer-action-button--${color}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const cssVars: CSSProperties =
    color && color !== 'danger' && color !== 'medium'
      ? ({
          ['--consumer-action-button-color' as string]: color,
        } as CSSProperties)
      : {};

  return (
    <button
      type={type}
      className={classes}
      style={{ ...cssVars, ...style }}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
