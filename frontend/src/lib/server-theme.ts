import { cookies } from 'next/headers';
import { THEME_STORAGE_KEY, type Theme } from '@/lib/theme';

export async function getServerTheme(): Promise<Theme> {
  const cookieStore = await cookies();
  const value = cookieStore.get(THEME_STORAGE_KEY)?.value;
  return value === 'light' ? 'light' : 'dark';
}
