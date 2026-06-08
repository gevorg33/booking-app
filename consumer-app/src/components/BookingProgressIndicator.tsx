import {
  guidedBookingProgress,
  guidedBookingStepLabel,
  resolveGuidedBookingStep,
  type GuidedBookingStep,
} from '../lib/guided-booking-flow.util.js';

export function BookingProgressIndicator({
  pathname,
  slotSelected = false,
}: {
  pathname: string;
  slotSelected?: boolean;
}) {
  const step = resolveGuidedBookingStep(pathname, { slotSelected });
  const progress = guidedBookingProgress(step);

  return (
    <div style={{ marginBottom: 16 }} aria-label={`Booking progress ${progress}%`}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#6b7280',
          marginBottom: 6,
        }}
      >
        <span>{guidedBookingStepLabel(step)}</span>
        <span>{progress}%</span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: '#e5e7eb',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'var(--ion-color-primary, #7c3aed)',
            transition: 'width 180ms ease',
          }}
        />
      </div>
      <StepDots activeStep={step} />
    </div>
  );
}

function StepDots({ activeStep }: { activeStep: GuidedBookingStep }) {
  const steps: GuidedBookingStep[] = ['welcome', 'salon', 'service', 'slot', 'confirm'];
  const activeIndex = steps.indexOf(activeStep);

  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
      {steps.map((step, index) => (
        <span
          key={step}
          aria-hidden
          style={{
            flex: 1,
            height: 4,
            borderRadius: 999,
            background: index <= activeIndex ? 'var(--ion-color-primary, #7c3aed)' : '#e5e7eb',
          }}
        />
      ))}
    </div>
  );
}
