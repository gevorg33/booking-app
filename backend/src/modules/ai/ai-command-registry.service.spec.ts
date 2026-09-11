import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { COMMAND_REGISTRY } from './ai-command-registry.js';
import { AiCommandRegistryService } from './ai-command-registry.service.js';

describe('AiCommandRegistryService', () => {
  it('does not warn when registry validation is clean', async () => {
    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const module = await Test.createTestingModule({
      providers: [AiCommandRegistryService],
    }).compile();
    const registry = module.get(AiCommandRegistryService);

    registry.onModuleInit();

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
