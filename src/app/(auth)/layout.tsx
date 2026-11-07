import Link from 'next/link';
import { getBranding } from '@/lib/branding-server';
import { Logo } from '@/components/shared/logo';
import { LocaleSwitcher } from '@/components/shared/locale-switcher';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const branding = await getBranding();

  return (
    <div className="flex min-h-screen flex-col bg-grain">
      <div className="container flex h-16 items-center justify-between">
        <Logo name={branding.name} logoUrl={branding.logoUrl} />
        <LocaleSwitcher />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border bg-card p-8 shadow-sm">{children}</div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}