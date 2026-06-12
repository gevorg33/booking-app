import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MISROUTE_TELEMETRY_PIPE_MARKER } from './ai-misroute-telemetry.fixtures.js';

const AI_COMMAND_SERVICE_SOURCE = readFileSync(
  join(__dirname, 'ai-command.service.ts'),
  'utf8',
);

describe('AiCommandService misroute telemetry wiring (pipe-1.10.2)', () => {
  it('enriches dashboard misroute telemetry from understand pipeline', () => {
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      'enrichMisrouteTelemetryFromUnderstand(',
    );
    expect(AI_COMMAND_SERVICE_SOURCE).toContain('understandTrace');
    expect(MISROUTE_TELEMETRY_PIPE_MARKER).toBe('pipe-1.10.2');
  });
});
