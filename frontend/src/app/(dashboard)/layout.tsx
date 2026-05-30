'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Zap,
  LayoutDashboard,
  Calendar,
  Users,
  Briefcase,
  Clock,
  Brain,
  CreditCard,
  LogOut,
  ClipboardList,
  Store,
  UserCircle,
  Settings,
  BarChart3,
  Wallet,
  Warehouse,
  Star,
  BookOpen,
  Plug,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { AiCommandBar } from '@/components/ai-command-bar';
import { LanguageSwitcher } from '@/components/language-switcher';
import { BusinessSwitcher } from '@/components/business-switcher';
import { DashboardZendeskWidget } from '@/components/integrations/dashboard-zendesk-widget';
import { SupportTicketButton } from '@/components/integrations/support-ticket-button';
import { useI18n } from '@/i18n';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { business, logout, token, user } = useAuthStore();
  const { t, setLocale } = useI18n();
  const [mounted, setMounted] = useState(false);
  const isOnboardingRoute = pathname === '/dashboard/onboarding';

  const { data: onboardingStatus } = useQuery({
    queryKey: ['onboarding-status', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/onboarding/status`);
      return ((data as { data?: { completed: boolean } })?.data ?? data) as { completed: boolean };
    },
    enabled: !!business?.id && !!token && mounted,
  });

  const navItems = useMemo(
    () => [
      { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: '/dashboard/bookings', label: t('nav.bookings'), icon: Calendar },
      { href: '/dashboard/schedule', label: t('nav.schedule'), icon: Clock },
      { href: '/dashboard/employees', label: t('nav.employees'), icon: Users },
      { href: '/dashboard/customers', label: t('nav.customers'), icon: UserCircle },
      { href: '/dashboard/appointments', label: t('nav.appointments'), icon: ClipboardList },
      { href: '/dashboard/services', label: t('nav.services'), icon: Briefcase },
      { href: '/dashboard/reports', label: t('nav.reports'), icon: BarChart3 },
      { href: '/dashboard/monetization', label: t('nav.monetization'), icon: Wallet },
      { href: '/dashboard/operations', label: t('nav.operations'), icon: Warehouse },
      { href: '/dashboard/reviews', label: t('nav.reviews'), icon: Star },
      { href: '/dashboard/business', label: t('nav.businessProfile'), icon: Store },
      { href: '/dashboard/integrations', label: t('nav.integrations'), icon: Plug },
      { href: '/dashboard/billing', label: t('nav.billing'), icon: CreditCard },
      { href: '/dashboard/ai-ops', label: t('nav.aiOps'), icon: Brain },
      { href: '/dashboard/settings', label: t('nav.settings'), icon: Settings },
      { href: '/dashboard/guide', label: t('nav.guide'), icon: BookOpen },
    ],
    [t],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !token) router.push('/login');
  }, [mounted, token, router]);

  useEffect(() => {
    if (user?.locale) setLocale(user.locale);
  }, [user?.locale, setLocale]);

  useEffect(() => {
    if (!onboardingStatus || isOnboardingRoute) return;
    if (!onboardingStatus.completed) router.push('/dashboard/onboarding');
  }, [onboardingStatus, isOnboardingRoute, router]);

  if (!mounted || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isOnboardingRoute) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-gray-100">OptiSchedule</span>
          </div>
          {business && <BusinessSwitcher />}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-3">
          <SupportTicketButton />
          <LanguageSwitcher />
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 w-full"
          >
            <LogOut className="w-4 h-4" />
            {t('nav.signOut')}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </main>

      <AiCommandBar />
      <DashboardZendeskWidget />
    </div>
  );
}
