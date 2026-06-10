export function isAppleSignInAvailable(): boolean {
  return false;
}

export async function getAppleIdToken(): Promise<string> {
  throw new Error('Apple sign-in is not configured in this build');
}
