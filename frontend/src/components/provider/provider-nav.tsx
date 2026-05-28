'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Clock, User } from 'lucide-react';
import { useI18n } from '@/i18n';

const tabs = [
  { href: '/provider/today', icon: CalendarDays, labelKey: 'provider.navToday' },
  { href: '/provider/schedule', icon: Clock, labelKey: 'provider.navSchedule' },
  { href: '/provider/profile', icon: User, labelKey: 'provider.navProfile' },
] as const;

export function ProviderNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-800 bg-gray-950/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around max-w-lg mx-auto">
        {tabs.map(({ href, icon: Icon, labelKey }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-3 px-4 text-xs font-medium transition-colors ${
                active ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              {t(labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
