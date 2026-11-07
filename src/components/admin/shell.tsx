'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Users,
  Heart,
  LayoutTemplate,
  CreditCard,
  Receipt,
  Paintbrush,
  Store,
  MapPin,
  LifeBuoy,
  BarChart3,
  Settings,
  ScrollText,
  Menu,
  X,
  LogOut,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { adminNav } from '@/lib/branding';
import { signOutAction } from '@/features/auth/actions';
import { cn } from '@/lib/utils';

const icons: Record<string, LucideIcon> = {
  Users,
  Heart,
  LayoutTemplate,
  CreditCard,
  Receipt,
  Paintbrush,
  Store,
  MapPin,
  LifeBuoy,
  BarChart3,
  Settings,
  ScrollText,
};

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations('admin');
  const pathname = usePathname();
  return (
    <nav className="space-y-1 p-4">
      {adminNav.map((item) => {
        const Icon = icons[item.icon] ?? Users;
        const active =
          item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:bg-white/5 hover:text-white',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  name,
  logoUrl,
  children,
}: {
  name: string;
  logoUrl?: string | null;
  children: React.ReactNode;
}) {
  const t = useTranslations('admin');
  const tn = useTranslations('nav');
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 bg-[hsl(240_12%_10%)] lg:block">
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="flex h-16 items-center border-b border-white/10 px-6 text-white">
            <Logo name={name} logoUrl={logoUrl} href="/admin" className="[&_span:last-child]:text-white" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <AdminNav />
          </div>
          <div className="border-t border-white/10 p-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/60 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {tn('dashboard')}
            </Link>
          </div>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-72 bg-[hsl(240_12%_10%)]">
            <div className="flex justify-end p-2">
              <Button variant="ghost" size="icon" className="text-white" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <AdminNav onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-display text-lg font-semibold">{t('title')}</span>
          </div>
          <form action={signOutAction}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="h-4 w-4" />
              {tn('logout')}
            </Button>
          </form>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}