import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getActivityLogs } from '@/features/admin/queries';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/states';

export const metadata: Metadata = { title: 'Activity Logs · Admin' };

export default async function AdminActivityPage() {
  const t = await getTranslations('admin');
  const logs = await getActivityLogs();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">{t('activityLogs')}</h1>
      {logs.length === 0 ? (
        <EmptyState description="No admin activity recorded yet." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="p-4 text-start font-medium">Action</th>
                  <th className="p-4 text-start font-medium">Entity</th>
                  <th className="p-4 text-start font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="p-4 font-medium">{log.action}</td>
                    <td className="p-4 text-muted-foreground">
                      {log.entity_type ?? '—'}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
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