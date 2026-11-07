import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getCustomers } from '@/features/admin/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/states';

export const metadata: Metadata = { title: 'Customers · Admin' };

export default async function AdminCustomersPage() {
  const t = await getTranslations('admin');
  const customers = await getCustomers();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">{t('customers')}</h1>
      {customers.length === 0 ? (
        <EmptyState description="No registered customers yet." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-start text-xs text-muted-foreground">
                  <th className="p-4 text-start font-medium">Name</th>
                  <th className="p-4 text-start font-medium">Role</th>
                  <th className="p-4 text-start font-medium">Locale</th>
                  <th className="p-4 text-start font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="p-4 font-medium">{c.full_name || '—'}</td>
                    <td className="p-4">
                      <Badge variant={c.platform_role === 'admin' || c.platform_role === 'super_admin' ? 'gold' : 'secondary'}>
                        {c.platform_role}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">{c.locale}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}