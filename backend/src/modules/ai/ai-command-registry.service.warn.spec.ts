import { Logger } from '@nestjs/common';

jest.mock('./ai-command-registry.js', () => ({
  ...jest.requireActual('./ai-command-registry.js'),
  REGISTRY_VALIDATION_ERRORS: [
    'Missing dashboard intent in registry: drift_intent',
  ],
}));

import { AiCommandRegistryService } from './ai-command-registry.service.js';

describe('AiCommandRegistryService validation warning', () => {
  it('warns on module init when registry validation errors exist', () => {
    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const registry = new AiCommandRegistryService();

    registry.onModuleInit();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Command registry drift (1)'),
    );
    warnSpy.mockRestore();
  });
});
