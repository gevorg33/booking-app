/**
 * F3 / e2e-bug.415 — §137's trace stamping, now asserted rather than assumed.
 *
 * §137 could not be tested when it landed: the property is *"every one of ~40
 * exits is stamped"*, and with no way to construct `CustomerAiCommandService`
 * the only evidence was the shape of the code. The design answer was to give
 * `runCommand` all the exits and `executeCommand` exactly **one**, so stamping
 * happens at a single point that every path must pass through.
 *
 * **What these tests do and do not prove.** They do not walk 40 exits. They
 * assert the guarantee that structure actually provides: *whatever* `runCommand`
 * returns is stamped on the way out, the sink's fields land on the result, and
 * the un-traced passthrough is deliberate rather than accidental. Combined with
 * `executeCommand` having one exit — which is readable at a glance and is
 * itself asserted below — that is the property §137 wanted.
 *
 * This is the backfill F3 lists as blocked; the harness is what unblocked it.
 */
import { createCustomerAiCommandServiceForTest } from './customer-ai-command.service.test-harness.js';
import { CustomerAiCommandService } from './customer-ai-command.service.js';
import { COMMAND_TRACE_RECORDER_PIPE_MARKER } from './ai-command-trace-recorder.util.js';

type Sink = Record<string, unknown>;

/**
 * Replace `runCommand` on the instance. It is called as `this.runCommand(...)`,
 * so an own property shadows the prototype method — which is exactly how the
 * ~40 exits are stood in for without enumerating them.
 */
function withRunCommand(
  impl: (sink: Sink) => unknown,
): CustomerAiCommandService {
  const svc = createCustomerAiCommandServiceForTest() as any;
  svc.runCommand = jest.fn(
    async (
      _businessId: string,
      _prompt: string,
      _history: unknown,
      _context: unknown,
      sink: Sink,
    ) => impl(sink),
  );
  return svc as CustomerAiCommandService;
}

const run = (svc: CustomerAiCommandService) =>
  svc.executeCommand('biz-1', 'show my bookings');

describe('§137 — customer surface stamps its trace at a single exit', () => {
  it('stamps whatever runCommand returned', async () => {
    const svc = withRunCommand((sink) => {
      sink.pipelineTrace = [{ stage: 'classify' }];
      return { success: true, action: 'list_my_appointments', summary: 'ok' };
    });

    const r = await run(svc);

    expect(r.details?.pipelineTrace).toEqual([{ stage: 'classify' }]);
    expect(r.details?.traceRecorder).toBe(COMMAND_TRACE_RECORDER_PIPE_MARKER);
    // The result's own fields survive the stamp.
    expect(r.action).toBe('list_my_appointments');
    expect(r.success).toBe(true);
  });

  it('carries confidence, candidateSource and params from the sink', async () => {
    // e2e-bug.419: `params` is the field whose absence made the customer
    // surface record `params = {}` for 99.4% of traces. Pinned here.
    const svc = withRunCommand((sink) => {
      sink.pipelineTrace = [{ stage: 'classify' }];
      sink.confidence = 0.91;
      sink.candidateSource = 'semantic';
      sink.params = { serviceName: 'Haircut' };
      return { success: true, action: 'x', summary: 'ok' };
    });

    const r = await run(svc);

    expect(r.details?.confidence).toBe(0.91);
    expect(r.details?.candidateSource).toBe('semantic');
    expect(r.details?.params).toEqual({ serviceName: 'Haircut' });
  });

  it('stamps a failing exit too — not only the happy path', async () => {
    const svc = withRunCommand((sink) => {
      sink.pipelineTrace = [{ stage: 'rescue' }];
      return { success: false, action: 'none', summary: 'could not help' };
    });

    const r = await run(svc);

    expect(r.success).toBe(false);
    expect(r.details?.traceRecorder).toBe(COMMAND_TRACE_RECORDER_PIPE_MARKER);
  });

  it('returns the result untouched when no trace was collected', async () => {
    // The `if (!sink.pipelineTrace) return result` branch. Asserted so the
    // passthrough stays a deliberate choice rather than becoming a silent hole
    // if someone later populates the sink partially.
    const svc = withRunCommand(() => ({
      success: true,
      action: 'x',
      summary: 'ok',
      details: { existing: true },
    }));

    const r = await run(svc);

    expect(r.details).toEqual({ existing: true });
    expect(r.details?.traceRecorder).toBeUndefined();
  });

  it('does not overwrite trace fields the result already carried', async () => {
    // `stampCommandTraceDetails` uses `metadata.x ?? result.details?.x`, so a
    // handler that set its own confidence keeps it.
    const svc = withRunCommand((sink) => {
      sink.pipelineTrace = [{ stage: 'classify' }];
      return {
        success: true,
        action: 'x',
        summary: 'ok',
        details: { confidence: 0.42 },
      };
    });

    const r = await run(svc);

    expect(r.details?.confidence).toBe(0.42);
  });

  it('executeCommand has a single stamping point, which is what makes the above general', () => {
    // The guarantee is structural: one exit in the wrapper, ~40 in `runCommand`
    // behind it. If someone adds a second `return` to `executeCommand` that
    // bypasses the stamp, this fails and the tests above stop being general.
    const source = CustomerAiCommandService.prototype.executeCommand.toString();
    const returns = source.match(/\breturn\b/g) ?? [];
    // Exactly two: the untraced passthrough, and the stamped exit.
    expect(returns).toHaveLength(2);
    expect(source).toContain('stampCommandTraceDetails');
  });
});
