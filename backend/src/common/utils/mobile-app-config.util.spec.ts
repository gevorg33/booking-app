import { resolveMobileAppConfig } from './mobile-app-config.util.js';

describe('mobile-app-config.util (n99-3.8)', () => {
  it('exposes promoted activation path variants from env', () => {
    const config = resolveMobileAppConfig({
      surface: 'consumer_app',
      platform: 'ios',
      version: '1.0.0',
    });
    expect(config.activationPathAb).toBeUndefined();

    const promoted = resolveMobileAppConfig(
      { surface: 'consumer_app', platform: 'ios' },
      {
        N99_ACTIVATION_PATH_AB_SIGN_IN_PLACEMENT: 'pre_confirm',
        N99_ACTIVATION_PATH_AB_PAYMENT_TIMING: 'online_first',
      },
    );
    expect(promoted.activationPathAb).toEqual({
      signInPlacement: 'pre_confirm',
      paymentTiming: 'online_first',
    });
  });
});
