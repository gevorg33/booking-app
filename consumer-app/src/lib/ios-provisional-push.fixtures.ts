export const IOS_PROVISIONAL_FIRST_OPEN_SCENARIOS = [
  {
    id: 'ios-native-fcm-first-open',
    platform: 'ios' as const,
    isNative: true,
    isFcmBuild: true,
    alreadyRegistered: false,
    permissionReceive: 'granted' as const,
    expectReachability: true,
  },
  {
    id: 'skip-when-already-registered',
    platform: 'ios' as const,
    isNative: true,
    isFcmBuild: true,
    alreadyRegistered: true,
    permissionReceive: 'granted' as const,
    expectReachability: false,
  },
  {
    id: 'skip-android',
    platform: 'android' as const,
    isNative: true,
    isFcmBuild: true,
    alreadyRegistered: false,
    permissionReceive: 'granted' as const,
    expectReachability: false,
  },
  {
    id: 'skip-denied',
    platform: 'ios' as const,
    isNative: true,
    isFcmBuild: true,
    alreadyRegistered: false,
    permissionReceive: 'denied' as const,
    expectReachability: false,
  },
  {
    id: 'skip-non-fcm-build',
    platform: 'ios' as const,
    isNative: true,
    isFcmBuild: false,
    alreadyRegistered: false,
    permissionReceive: 'granted' as const,
    expectReachability: false,
  },
] as const;

export const IOS_PROVISIONAL_REGISTER_SCENARIOS = [
  {
    id: 'registers-without-request-permissions',
    platform: 'ios' as const,
    hasCustomerToken: true,
    expectRegister: true,
    expectRequestPermissions: false,
  },
  {
    id: 'skips-without-customer-token',
    platform: 'ios' as const,
    hasCustomerToken: false,
    expectRegister: false,
    expectRequestPermissions: false,
  },
] as const;
