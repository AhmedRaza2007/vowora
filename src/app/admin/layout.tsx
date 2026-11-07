import { requireAdmin } from '@/lib/auth';
import { getBranding } from '@/lib/branding-server';
import { AdminShell } from '@/components/admin/shell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side role guard — non-admins are redirected away. Never trust the client.
  await requireAdmin();
  const branding = await getBranding();

  return (
    <AdminShell name={branding.name} logoUrl={branding.logoUrl}>
      {children}
    </AdminShell>
  );
}