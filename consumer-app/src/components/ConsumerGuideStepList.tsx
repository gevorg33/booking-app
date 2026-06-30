import type { ResolvedGuideFlowStep } from '@mobile-guide/mobile-guide.types.ts';

/** Numbered step list — mirrors dashboard guide StepList (ai-guide-1.9.2). */
export function ConsumerGuideStepList({
  steps,
  primaryColor,
}: {
  steps: readonly ResolvedGuideFlowStep[];
  primaryColor?: string;
}) {
  const accent = primaryColor?.trim() || 'var(--ion-color-primary, #3880ff)';

  return (
    <ol className="consumer-guide-steps">
      {steps.map((step, index) => (
        <li key={`${index}-${step.title}`} className="consumer-guide-steps__item">
          <span
            className="consumer-guide-steps__badge"
            style={{ color: accent, backgroundColor: `${accent}22` }}
          >
            {index + 1}
          </span>
          <div className="consumer-guide-steps__content">
            {step.title ? (
              <p className="consumer-guide-steps__title">{step.title}</p>
            ) : null}
            <p className="consumer-guide-steps__body">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
