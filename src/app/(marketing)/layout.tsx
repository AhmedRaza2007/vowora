import { getBranding } from '@/lib/branding-server';
import { getCurrentUser } from '@/lib/auth';
import { MarketingHeader } from '@/components/shared/marketing-header';
import { MarketingFooter } from '@/components/shared/marketing-footer';

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const branding = await getBranding();
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader
        name={branding.name}
        logoUrl={branding.logoUrl}
        isLoggedIn={Boolean(user)}
      />
      <main className="flex-1">{children}</main>
      <MarketingFooter
        name={branding.name}
        logoUrl={branding.logoUrl}
        supportEmail={branding.supportEmail}
      />
    </div>
  );
}