import type { ResolvedGuideFlowStep } from '@mobile-guide/mobile-guide.types.ts';

/** Numbered step list — mirrors dashboard / consumer guide (ai-guide-1.9.7). */
export function ProviderGuideStepList({
  steps,
  primaryColor,
}: {
  steps: readonly ResolvedGuideFlowStep[];
  primaryColor?: string;
}) {
  const accent = primaryColor?.trim() || 'var(--ion-color-primary, #3880ff)';

  return (
    <ol className="provider-guide-steps">
      {steps.map((step, index) => (
        <li key={`${index}-${step.title}`} className="provider-guide-steps__item">
          <span
            className="provider-guide-steps__badge"
            style={{ color: accent, backgroundColor: `${accent}22` }}
          >
            {index + 1}
          </span>
          <div className="provider-guide-steps__content">
            {step.title ? (
              <p className="provider-guide-steps__title">{step.title}</p>
            ) : null}
            <p className="provider-guide-steps__body">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
