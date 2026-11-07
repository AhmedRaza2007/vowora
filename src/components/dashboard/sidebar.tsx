'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Heart,
  LayoutTemplate,
  Mail,
  CalendarDays,
  Users,
  Send,
  ClipboardCheck,
  Images,
  Wallet,
  Store,
  MapPin,
  Armchair,
  ListChecks,
  Sparkles,
  Settings,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { dashboardNav } from '@/lib/branding';
import { cn } from '@/lib/utils';

const icons: Record<string, LucideIcon> = {
  LayoutDashboard,
  Heart,
  LayoutTemplate,
  Mail,
  CalendarDays,
  Users,
  Send,
  ClipboardCheck,
  Images,
  Wallet,
  Store,
  MapPin,
  Armchair,
  ListChecks,
  Sparkles,
  Settings,
  CreditCard,
};

export function DashboardSidebar({
  name,
  logoUrl,
  onNavigate,
}: {
  name: string;
  logoUrl?: string | null;
  onNavigate?: () => void;
}) {
  const t = useTranslations('dashboard');
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Logo name={name} logoUrl={logoUrl} href="/dashboard" />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {dashboardNav.map((item) => {
          const Icon = icons[item.icon] ?? LayoutDashboard;
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}