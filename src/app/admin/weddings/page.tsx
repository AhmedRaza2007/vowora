import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getAdminWeddings } from '@/features/admin/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/states';

export const metadata: Metadata = { title: 'Weddings · Admin' };

export default async function AdminWeddingsPage() {
  const t = await getTranslations('admin');
  const weddings = await getAdminWeddings();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">{t('weddings')}</h1>
      {weddings.length === 0 ? (
        <EmptyState description="No wedding projects yet." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="p-4 text-start font-medium">Title</th>
                  <th className="p-4 text-start font-medium">Couple</th>
                  <th className="p-4 text-start font-medium">Status</th>
                  <th className="p-4 text-start font-medium">Slug</th>
                </tr>
              </thead>
              <tbody>
                {weddings.map((w) => (
                  <tr key={w.id} className="border-b last:border-0">
                    <td className="p-4 font-medium">{w.title}</td>
                    <td className="p-4 text-muted-foreground">
                      {w.partner_one_name} & {w.partner_two_name}
                    </td>
                    <td className="p-4">
                      <Badge variant={w.status === 'published' ? 'success' : 'secondary'}>
                        {w.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">/w/{w.slug}</td>
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