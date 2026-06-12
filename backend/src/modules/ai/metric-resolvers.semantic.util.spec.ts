import {
  METRIC_RESOLVER_NEGATIVE_SCENARIOS,
  METRIC_RESOLVER_POSITIVE_SCENARIOS,
  METRIC_RESOLVERS_SEMANTIC_PIPE_MARKER,
} from './metric-resolvers.semantic.fixtures.js';
import {
  resolveAppointmentMetricFromSemantic,
  resolveBookingMetricFromSemantic,
  resolveCustomerMetricFromSemantic,
  resolveServiceMetricFromSemantic,
  resolveStaffMetricFromSemantic,
} from './metric-resolvers.semantic.util.js';

function resolveMetricForKind(
  kind: string,
  prompt: string,
  surface: 'dashboard' | 'customer' | 'public' = 'dashboard',
): string | null {
  switch (kind) {
    case 'booking':
      return resolveBookingMetricFromSemantic(prompt, surface);
    case 'staff':
      return resolveStaffMetricFromSemantic(prompt, surface);
    case 'service':
      return resolveServiceMetricFromSemantic(prompt, surface);
    case 'customer':
      return resolveCustomerMetricFromSemantic(prompt, surface);
    case 'appointment':
      return resolveAppointmentMetricFromSemantic(prompt, surface);
    default:
      return null;
  }
}

describe('metric-resolvers semantic util (acc-3.14)', () => {
  it('exports pipe marker', () => {
    expect(METRIC_RESOLVERS_SEMANTIC_PIPE_MARKER).toBe('acc-3.14');
  });

  it.each(METRIC_RESOLVER_POSITIVE_SCENARIOS)(
    '$id resolves $kind metric $expectedMetric',
    ({ prompt, kind, expectedMetric, surface }) => {
      expect(
        resolveMetricForKind(kind, prompt, surface ?? 'dashboard'),
      ).toBe(expectedMetric);
    },
  );

  it.each(METRIC_RESOLVER_NEGATIVE_SCENARIOS)(
    '$id does not resolve $kind metric $expectedMetric',
    ({ prompt, kind, expectedMetric, surface }) => {
      expect(
        resolveMetricForKind(kind, prompt, surface ?? 'dashboard'),
      ).not.toBe(expectedMetric);
    },
  );
});
