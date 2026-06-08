import { Test } from '@nestjs/testing';
import { MobileAppConfigController } from './mobile-app-config.controller.js';

describe('MobileAppConfigController (adopt-5.5)', () => {
  it('returns remote config for surface/platform', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MobileAppConfigController],
    }).compile();
    const controller = moduleRef.get(MobileAppConfigController);

    expect(
      controller.getConfig('consumer_app', 'ios', '1.0.0'),
    ).toMatchObject({
      minSupportedVersion: expect.any(String),
      killSwitch: expect.any(Boolean),
      updateRequired: expect.any(Boolean),
    });
  });
});
