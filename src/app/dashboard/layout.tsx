import { requireUser, getCurrentProfile, isAdmin } from '@/lib/auth';
import { getBranding } from '@/lib/branding-server';
import { DashboardShell } from '@/components/dashboard/shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('/dashboard');
  const profile = await getCurrentProfile();
  const branding = await getBranding();

  return (
    <DashboardShell
      name={branding.name}
      logoUrl={branding.logoUrl}
      userName={profile?.full_name || user.email || 'Account'}
      userEmail={user.email ?? ''}
      isAdmin={isAdmin(profile)}
    >
      {children}
    </DashboardShell>
  );
}